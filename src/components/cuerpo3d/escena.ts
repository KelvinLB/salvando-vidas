// La escena 3D de «Explorar por dentro»: three.js «a mano» (sin react-three-fiber, que pesa ~47 KB
// más). Este archivo es el único que importa three; la pantalla lo carga con import() para que
// three quede en su propio chunk y nunca en el principal.
//
// Cuidados para teléfonos sencillos (ver cuerpo/tech.md): sin antialias, pixelRatio con tope,
// render solo cuando algo cambia, un movimiento leve en reposo a baja frecuencia que se duerme
// solo, pausa fuera de pantalla o con la app en segundo plano, y liberar todo al salir.
import {
  AmbientLight,
  Box3,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import type { Capa, ParteId } from './organos'

export type Escena = {
  setCapa(capa: Capa, on: boolean): void
  /** Viaja suave a una parte (o regresa a ver todo el cuerpo con null). */
  enfocar(id: ParteId | null): void
  /** Gira el cuerpo, para quien no puede arrastrar (teclado, lector de pantalla). */
  girar(grados: number): void
  /** Deja espacio abajo para la tarjeta: el cuerpo se ve un poco más arriba. */
  setHueco(fraccion: number): void
  dispose(): void
}

type Opciones = {
  url: string
  still: boolean
  onPick(id: ParteId): void
  /** El teléfono se quedó sin memoria de video, o algo falló: volver a 2D. */
  onLost(): void
}

// Nodo del modelo → parte que se explica. Las suprarrenales se explican junto con los riñones.
const PARTE: Record<string, ParteId> = {
  piel: 'piel',
  esqueleto: 'esqueleto',
  cerebro: 'cerebro',
  amigdala: 'amigdala',
  pulmones: 'pulmones',
  corazon: 'corazon',
  estomago: 'estomago',
  intestinos: 'intestinos',
  rinones: 'rinones',
  suprarrenales: 'rinones',
  vago: 'vago',
}

// Colores: las variables de la app (claro u oscuro). Sin texturas de carne, sin rojo de sangre.
function colores() {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  // Los órganos usan los tonos claros de la app (--organ-*, --skin-*) en los dos temas: los del
  // tema oscuro son tan apagados que con luz se ven grises. En oscuro solo bajan un poco.
  const o = (hex: string) => (dark ? new Color(hex).multiplyScalar(0.82) : new Color(hex))
  const tonos: Record<string, Color> = {
    piel: dark ? new Color(v('--skin-light', '#4a443e')) : new Color(v('--skin-shade', '#dccbb8')),
    esqueleto: dark ? new Color('#cfc6ba') : new Color(v('--stone', '#d9d0c3')).lerp(new Color('#ffffff'), 0.45),
    cerebro: o('#efcdd2'),
    amigdala: new Color(v('--tone-alarma', '#df6f5a')),
    pulmones: o('#f1d3c8'),
    corazon: o('#d4675a').lerp(o('#f1d3c8'), 0.25),
    estomago: o('#ecd3a6'),
    intestinos: o('#ecd3a6').lerp(o('#d99536'), 0.12),
    rinones: o('#f7d8c2').lerp(o('#d99536'), 0.25),
    suprarrenales: new Color(v('--tone-estres', '#d99536')),
    vago: new Color(v('--tone-animo', '#6d8cc7')),
  }
  return tonos
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export async function crearEscena(canvas: HTMLCanvasElement, opts: Opciones): Promise<Escena> {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
  const scene = new Scene()
  const camera = new PerspectiveCamera(32, 1, 0.05, 20)

  scene.add(new HemisphereLight(0xffffff, 0xb8a99a, 1.4))
  scene.add(new AmbientLight(0xffffff, 0.35))
  const sol = new DirectionalLight(0xffffff, 1.6)
  sol.position.set(-1.2, 2.5, 2)
  scene.add(sol)
  const contra = new DirectionalLight(0xffffff, 0.5)
  contra.position.set(1.5, 1, -2)
  scene.add(contra)

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(opts.url)
  const cuerpo = gltf.scene
  scene.add(cuerpo)
  cuerpo.updateMatrixWorld(true)

  // Cada nodo con su material propio (para colorear, iluminar al tocar y prender o apagar capas).
  const mallas = new Map<string, Mesh>()
  cuerpo.traverse((o) => {
    if ((o as Mesh).isMesh && PARTE[o.name]) {
      const m = o as Mesh
      // El archivo no trae normales (pesa menos): se calculan aquí, suaves.
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals()
      m.material = new MeshStandardMaterial({ roughness: 0.72, metalness: 0 })
      mallas.set(o.name, m)
    }
  })
  const caja = (name: string) => {
    const m = mallas.get(name)
    return m ? new Box3().setFromObject(m) : null
  }

  // La piel deja ver adentro: translúcida y sin escribir profundidad (evita que tape lo de atrás).
  const piel = mallas.get('piel')
  if (piel) {
    const mat = piel.material as MeshStandardMaterial
    mat.transparent = true
    mat.opacity = 0.2
    mat.depthWrite = false
    piel.renderOrder = 2
  }
  // El cerebro también es un poco translúcido para que se vea la amígdala adentro.
  const cerebro = mallas.get('cerebro')
  if (cerebro) {
    const mat = cerebro.material as MeshStandardMaterial
    mat.transparent = true
    mat.opacity = 0.55
    mat.depthWrite = false
    cerebro.renderOrder = 1
  }

  // Nervio vago: un tubo dibujado por nosotros que sigue su recorrido real (tronco del cerebro →
  // cuello junto a la tráquea → detrás del corazón → por el diafragma hasta la panza). Se arma con
  // las cajas de los órganos del modelo, así queda en su lugar aunque el modelo cambie.
  const bCer = caja('cerebro')
  const bPul = caja('pulmones')
  const bCor = caja('corazon')
  const bEst = caja('estomago')
  const bInt = caja('intestinos')
  let pulso: Mesh | null = null
  let curvas: CatmullRomCurve3[] = []
  if (bCer && bPul && bCor && bEst) {
    const cC = bCer.getCenter(new Vector3())
    const cH = bCor.getCenter(new Vector3())
    const cE = bEst.getCenter(new Vector3())
    const zSpine = cH.z - (bCor.max.z - bCor.min.z) * 0.55
    const matVago = new MeshStandardMaterial({ roughness: 0.5, emissiveIntensity: 0.35 })
    for (const lado of [-1, 1]) {
      const x = (k: number) => cC.x + lado * k
      const pts = [
        new Vector3(x(0.008), bCer.min.y + 0.03, cC.z - 0.01),
        new Vector3(x(0.022), bCer.min.y - 0.02, cC.z - 0.005),
        new Vector3(x(0.028), (bCer.min.y + bPul.max.y) / 2, (cC.z + zSpine) / 2 + 0.01),
        new Vector3(x(0.03), bPul.max.y - 0.01, zSpine + 0.015),
        new Vector3(cH.x + lado * 0.03, cH.y + 0.02, zSpine),
        new Vector3(cH.x + lado * 0.015, bCor.min.y - 0.01, zSpine + 0.005),
        new Vector3(cE.x - 0.01 + lado * 0.012, bEst.max.y - 0.015, cE.z - 0.01),
        new Vector3(cE.x + lado * 0.01, cE.y, cE.z),
      ]
      if (bInt) pts.push(new Vector3(bInt.getCenter(new Vector3()).x + lado * 0.03, bInt.getCenter(new Vector3()).y, bInt.max.z - 0.03))
      const curva = new CatmullRomCurve3(pts)
      curvas.push(curva)
      const tubo = new Mesh(new TubeGeometry(curva, 90, 0.0028, 6), matVago)
      tubo.name = 'vago'
      cuerpo.add(tubo)
      if (lado === -1) mallas.set('vago', tubo)
      else mallas.set('vago-2', tubo)
    }
    // Un pulso de luz que baja por el vago al soltar el aire: el freno trabajando.
    pulso = new Mesh(new SphereGeometry(0.008, 12, 8), new MeshStandardMaterial({ emissiveIntensity: 1, transparent: true, opacity: 0.85 }))
    pulso.visible = false
    cuerpo.add(pulso)
  }
  const nombreDe = (o: Object3D) => (o.name === 'vago-2' ? 'vago' : o.name)

  const pintar = () => {
    const col = colores()
    for (const [name, m] of mallas) {
      const mat = m.material as MeshStandardMaterial
      const c = col[nombreDe(m)] ?? col.piel
      mat.color.copy(c)
      mat.emissive.copy(c)
      mat.emissiveIntensity = name === 'amigdala' || name.startsWith('vago') || name === 'suprarrenales' ? 0.35 : 0.04
    }
    if (pulso) {
      const mat = pulso.material as MeshStandardMaterial
      mat.color.copy(col.vago)
      mat.emissive.copy(col.vago).lerp(new Color('#ffffff'), 0.4)
    }
  }
  pintar()

  // Cámara y giro: sin desplazarse de lado, con topes arriba y abajo y de distancia.
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.enableDamping = !opts.still
  controls.dampingFactor = 0.12
  controls.rotateSpeed = 0.7
  controls.minPolarAngle = Math.PI * 0.22
  controls.maxPolarAngle = Math.PI * 0.78
  controls.minDistance = 0.28
  controls.maxDistance = 2.6

  const bPiel = caja('piel') ?? new Box3().setFromObject(cuerpo)
  const alto = bPiel.max.y - bPiel.min.y
  // Vista de inicio: de la cabeza a la cadera, de frente.
  const casa = {
    target: new Vector3(0, bPiel.min.y + alto * 0.73, (bPiel.min.z + bPiel.max.z) / 2),
    dist: alto * 1.12,
  }
  controls.target.copy(casa.target)
  camera.position.set(casa.target.x, casa.target.y + 0.05, casa.target.z + casa.dist)
  controls.update()

  // ---------- Bucle: render bajo demanda, reposo a baja frecuencia ----------
  let raf = 0
  let timer = 0
  let corriendo = false
  let visible = true
  let ultimoToque = performance.now()
  let viaje: null | { t0: number; dur: number; fromT: Vector3; toT: Vector3; fromP: Vector3; toP: Vector3 } = null
  let hueco = 0
  let huecoMeta = 0
  const pulmones = mallas.get('pulmones')
  const corazon = mallas.get('corazon')
  const centroPul = pulmones ? new Box3().setFromObject(pulmones).getCenter(new Vector3()) : null
  const centroCor = corazon ? new Box3().setFromObject(corazon).getCenter(new Vector3()) : null
  // Escalar «desde su centro»: se guarda la posición original y se compensa.
  const base = new Map<Mesh, { pos: Vector3; scale: Vector3 }>()
  for (const m of [pulmones, corazon]) if (m) base.set(m, { pos: m.position.clone(), scale: m.scale.clone() })
  const latir = (m: Mesh | undefined, centro: Vector3 | null, k: number) => {
    if (!m || !centro) return
    const b = base.get(m)!
    m.scale.copy(b.scale).multiplyScalar(k)
    // p' = c + (p − c)·k  ⇒  posición = c·(1 − k) + p·k (en el espacio del padre, que no rota).
    m.position.copy(b.pos).multiplyScalar(k).addScaledVector(centro, 1 - k)
  }
  const t0 = performance.now()

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    aplicarHueco()
    pedir()
  }
  const aplicarHueco = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (hueco > 0.001 && w && h) camera.setViewOffset(w, h, 0, h * hueco, w, h)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }

  /** Un cuadro: anima lo que toque y dibuja. Devuelve si hace falta seguir a 60 fps. */
  const cuadro = (now: number) => {
    let activo = false
    if (viaje) {
      const k = Math.min(1, (now - viaje.t0) / viaje.dur)
      const e = easeInOut(k)
      controls.target.lerpVectors(viaje.fromT, viaje.toT, e)
      camera.position.lerpVectors(viaje.fromP, viaje.toP, e)
      if (k >= 1) viaje = null
      activo = true
    }
    if (Math.abs(huecoMeta - hueco) > 0.001) {
      hueco += (huecoMeta - hueco) * (opts.still ? 1 : 0.18)
      if (Math.abs(huecoMeta - hueco) <= 0.001) hueco = huecoMeta
      aplicarHueco()
      activo = true
    }
    if (controls.update()) activo = true
    if (!opts.still) {
      // Respiración lenta (4 s tomar, 6 s soltar), igual que Calma; el corazón casi no se nota.
      const t = (now - t0) / 1000
      const fase = t % 10
      const aire = fase < 4 ? 0.5 - 0.5 * Math.cos((fase / 4) * Math.PI) : 0.5 + 0.5 * Math.cos(((fase - 4) / 6) * Math.PI)
      latir(pulmones, centroPul, 1 + 0.025 * aire)
      const lat = (t * 1) % 1
      latir(corazon, centroCor, 1 + 0.012 * Math.exp(-((lat - 0.15) ** 2) / 0.004))
      if (pulso && curvas.length && mallas.get('vago')?.visible) {
        // Al soltar el aire, un pulso baja por el vago; al tomarlo, descansa.
        pulso.visible = fase >= 4
        if (pulso.visible) pulso.position.copy(curvas[0].getPointAt(Math.min(1, (fase - 4) / 5.5)))
      } else if (pulso) pulso.visible = false
    }
    renderer.render(scene, camera)
    return activo
  }

  const pedir = () => {
    if (!corriendo) {
      corriendo = true
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
  }
  const tick = (now: number) => {
    corriendo = false
    if (!visible || document.hidden) return
    const activo = cuadro(now)
    if (activo) return pedir()
    // En reposo: unos 15 cuadros por segundo para respirar, y se duerme a los 90 s sin tocar.
    if (!opts.still && now - ultimoToque < 90_000) {
      clearTimeout(timer)
      timer = window.setTimeout(pedir, 66)
    }
  }
  const despertar = () => {
    ultimoToque = performance.now()
    pedir()
  }

  controls.addEventListener('change', pedir)
  controls.addEventListener('start', despertar)

  // ---------- Tocar una parte ----------
  const ray = new Raycaster()
  const ndc = new Vector2()
  let abajo = { x: 0, y: 0 }
  const visibleDe = (o: Object3D) => {
    for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return false
    return true
  }
  const onDown = (e: PointerEvent) => {
    abajo = { x: e.clientX, y: e.clientY }
    despertar()
  }
  const onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) > 8) return
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    // Primero lo de adentro: la piel y las costillas no le quitan el toque a un órgano.
    const todas = [...mallas.values()].filter(visibleDe)
    const grupos = [
      todas.filter((m) => m.name !== 'piel' && m.name !== 'esqueleto'),
      todas.filter((m) => m.name === 'esqueleto'),
      todas.filter((m) => m.name === 'piel'),
    ]
    for (const g of grupos) {
      const hit = ray.intersectObjects(g, false)[0]
      if (hit) return opts.onPick(PARTE[nombreDe(hit.object)])
    }
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)

  // ---------- Cuidar la batería y la memoria ----------
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) pedir()
  })
  io.observe(canvas)
  const onVis = () => !document.hidden && pedir()
  document.addEventListener('visibilitychange', onVis)
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const tema = matchMedia('(prefers-color-scheme: dark)')
  const onTema = () => {
    pintar()
    pedir()
  }
  tema.addEventListener('change', onTema)
  const onLost = (e: Event) => {
    e.preventDefault()
    opts.onLost()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  resize()
  pedir()

  const capas: Record<Capa, string[]> = {
    piel: ['piel'],
    esqueleto: ['esqueleto'],
    organos: ['cerebro', 'pulmones', 'corazon', 'estomago', 'intestinos', 'rinones', 'suprarrenales'],
    nervios: ['amigdala', 'vago', 'vago-2'],
  }

  return {
    setCapa(capa, on) {
      for (const n of capas[capa]) {
        const m = mallas.get(n)
        if (m) m.visible = on
      }
      despertar()
    },
    enfocar(id) {
      // Ilumina la parte elegida y apaga el brillo de las demás.
      const col = colores()
      for (const [name, m] of mallas) {
        const mat = m.material as MeshStandardMaterial
        const base = name === 'amigdala' || name.startsWith('vago') || name === 'suprarrenales' ? 0.35 : 0.04
        const mia = id !== null && PARTE[nombreDe(m)] === id
        mat.emissive.copy(col[nombreDe(m)] ?? col.piel)
        mat.emissiveIntensity = mia ? Math.max(0.3, base + 0.25) : base
      }
      // Al ver un órgano, los huesos se vuelven casi transparentes para no taparlo.
      const huesos = mallas.get('esqueleto')
      if (huesos) {
        const mat = huesos.material as MeshStandardMaterial
        const apartar = id !== null && id !== 'esqueleto' && id !== 'piel'
        mat.transparent = apartar
        mat.opacity = apartar ? 0.18 : 1
        mat.depthWrite = !apartar
        huesos.renderOrder = apartar ? 1 : 0
        mat.needsUpdate = true
      }
      let toT = casa.target.clone()
      let dist = casa.dist
      let dir = camera.position.clone().sub(controls.target).normalize()
      if (id !== null) {
        const nombres = [...mallas.keys()].filter((n) => PARTE[n.replace('-2', '')] === id)
        const b = new Box3()
        for (const n of nombres) b.expandByObject(mallas.get(n)!)
        if (b.isEmpty()) return
        toT = b.getCenter(new Vector3())
        const s = b.getSize(new Vector3())
        dist = Math.min(controls.maxDistance, Math.max(0.6, Math.max(s.x, s.y, s.z) * 6))
        // Los riñones se ven mejor desde la espalda; lo demás, desde donde ya se estaba mirando.
        if (id === 'rinones') dir = new Vector3(0, 0.15, -1).normalize()
        else if (id === 'piel' || id === 'esqueleto') dist = Math.max(dist * 0.55, 1)
      } else dir = new Vector3(0, 0.05, 1).normalize()
      const toP = toT.clone().addScaledVector(dir, dist)
      if (opts.still) {
        controls.target.copy(toT)
        camera.position.copy(toP)
        controls.update()
        pedir()
        return
      }
      viaje = { t0: performance.now(), dur: 900, fromT: controls.target.clone(), toT, fromP: camera.position.clone(), toP }
      despertar()
    },
    girar(grados) {
      const a = (grados * Math.PI) / 180
      const off = camera.position.clone().sub(controls.target)
      off.applyAxisAngle(new Vector3(0, 1, 0), a)
      const toP = controls.target.clone().add(off)
      if (opts.still) {
        camera.position.copy(toP)
        controls.update()
        pedir()
        return
      }
      viaje = { t0: performance.now(), dur: 500, fromT: controls.target.clone(), toT: controls.target.clone(), fromP: camera.position.clone(), toP }
      despertar()
    },
    setHueco(f) {
      huecoMeta = f
      despertar()
    },
    dispose() {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      io.disconnect()
      ro.disconnect()
      tema.removeEventListener('change', onTema)
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('webglcontextlost', onLost)
      controls.dispose()
      scene.traverse((o) => {
        const m = o as Mesh
        if (m.isMesh) {
          m.geometry.dispose()
          ;(Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose())
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
