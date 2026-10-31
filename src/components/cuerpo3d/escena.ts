// La escena 3D de «Explorar por dentro»: three.js «a mano» (sin react-three-fiber, que pesa ~47 KB
// más). Este archivo (con comun.ts y respiracion.ts, que solo se importan desde aquí) es el único
// que trae three; las pantallas lo cargan con import() para que three quede en su propio chunk y
// nunca en el principal.
//
// El cuerpo es de vidrio sobre un escenario oscuro: piel y huesos brillan solo en los bordes, los
// órganos se encienden en naranja (la alarma) o en verde (el freno), y las señales son puntos que
// corren por su camino. Sin parpadeos: nada late en el brillo, todo se enciende y se apaga despacio
// y el cuerpo solo gira cuando tú lo giras.
//
// Cuidados para teléfonos sencillos (ver cuerpo/tech.md): pixelRatio con tope, a lo mucho 30
// cuadros por segundo, se duerme a los 90 s sin tocar, pausa fuera de pantalla o con la app en
// segundo plano, y liberar todo al salir. Con «reducir movimiento», todo se queda quieto.
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Box3,
  CatmullRomCurve3,
  Color,
  type Curve,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  type ShaderMaterial,
  Raycaster,
  Scene,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { moverDiafragma, puntos, puntosVago, soloPiezasGrandes, vidrio, viaYDiafragma } from './comun'
import type { Capa, Flujo, Organo3D, ParteId, Senal } from './organos'

// «Respirar por dentro» (Calma) vive en su propio archivo, pero se carga desde aquí para que three
// siga en un solo chunk que nadie baja hasta abrir algo en 3D.
export { crearRespiracion, type Respiracion, type Aire } from './respiracion'

export type Escena = {
  setCapa(capa: Capa, on: boolean): void
  /** Viaja suave a una parte y la ilumina (o regresa a ver todo el cuerpo con null). */
  enfocar(id: ParteId | null): void
  /** Lo que muestra un paso de «Lo que siento»; null vuelve al cuerpo en reposo. */
  senal(s: Senal | null): void
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

// Malla → parte que se explica. Las suprarrenales se explican junto con los riñones.
const PARTE: Record<string, ParteId> = {
  piel: 'piel',
  esqueleto: 'esqueleto',
  cerebro: 'cerebro',
  amigdala: 'amigdala',
  pulmones: 'pulmones',
  'via-0': 'via',
  'via-1': 'via',
  diafragma: 'diafragma',
  corazon: 'corazon',
  estomago: 'estomago',
  intestinos: 'intestinos',
  rinones: 'rinones',
  suprarrenales: 'rinones',
  vago: 'vago',
  'vago-2': 'vago',
}
// Lo que se enciende o se enfoca → sus mallas.
const MALLAS_DE: Partial<Record<Organo3D | ParteId, string[]>> = {
  via: ['via-0', 'via-1'],
  vago: ['vago', 'vago-2'],
  rinones: ['rinones', 'suprarrenales'],
}
const mallasDe = (n: Organo3D | ParteId) => MALLAS_DE[n] ?? [n]

const C = {
  alarma: new Color('#ff7a45'),
  freno: new Color('#4fe39a'),
  aire: new Color('#47e6e2'),
  co2: new Color('#ffb066'),
  sel: new Color('#fff1d6'),
  hueso: new Color('#efe6d6'),
}
const TONO: Record<string, string> = {
  cerebro: '#e7b3c0',
  amigdala: '#ff9a6a',
  corazon: '#d65d55',
  pulmones: '#e6b0a6',
  estomago: '#e3c28c',
  intestinos: '#d8ad78',
  rinones: '#d39b78',
  suprarrenales: '#e2a248',
}
const ORGANOS = Object.keys(TONO)
// Los órganos grandes brillan menos para que el brillo no tape lo demás.
const MENOS: Record<string, number> = { corazon: 0.6, cerebro: 0.45, pulmones: 0.6, intestinos: 0.5 }

const RITMOS = {
  lenta: { i: 4, e: 6, amp: 1, arriba: false },
  normal: { i: 2.2, e: 3, amp: 0.75, arriba: false },
  rapida: { i: 0.9, e: 0.9, amp: 0.42, arriba: true },
}
const REPOSO: Senal = { respira: 'lenta', bpm: 66 }

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const entre = (x: number) => Math.min(1, Math.max(0, x))
const suave = (x: number) => x * x * (3 - 2 * x)

export async function crearEscena(canvas: HTMLCanvasElement, opts: Opciones): Promise<Escena> {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true, // el vidrio sin borde suave «tiembla» al girar
    alpha: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
  const scene = new Scene()
  const camera = new PerspectiveCamera(32, 1, 0.02, 20)

  scene.add(new HemisphereLight(0xd8fff4, 0x0b1412, 1.2))
  scene.add(new AmbientLight(0xffffff, 0.25))
  const sol = new DirectionalLight(0xffffff, 1.5)
  sol.position.set(-1, 2.2, 2.4)
  scene.add(sol)
  const contra = new DirectionalLight(0x8fe3ff, 0.7)
  contra.position.set(1.4, 0.8, -2)
  scene.add(contra)

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(opts.url)
  const cuerpo = gltf.scene
  scene.add(cuerpo)
  cuerpo.updateMatrixWorld(true)

  const mallas = new Map<string, Mesh>()
  cuerpo.traverse((o) => {
    if ((o as Mesh).isMesh && PARTE[o.name]) {
      const m = o as Mesh
      // El archivo no trae normales (pesa menos): se calculan aquí, suaves.
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals()
      mallas.set(o.name, m)
    }
  })
  const caja = (...names: string[]) => {
    const b = new Box3()
    for (const n of names) {
      const m = mallas.get(n)
      if (m) b.expandByObject(m)
    }
    return b.isEmpty() ? null : b
  }

  // ---------- Materiales ----------
  const piel = mallas.get('piel')
  const huesos = mallas.get('esqueleto')
  if (piel) {
    piel.material = vidrio('#8fd6cb', { base: 0.008, fuerza: 0.42, borde: 2.8 })
    piel.renderOrder = 5
  }
  if (huesos) {
    huesos.material = vidrio('#efe6d6', { base: 0.01, fuerza: 0.28, borde: 2.4 })
    huesos.renderOrder = 4
  }
  const tono = new Map<string, Color>()
  for (const n of ORGANOS) {
    const m = mallas.get(n)
    if (!m) continue
    const col = new Color(TONO[n])
    tono.set(n, col)
    m.material = new MeshStandardMaterial({
      color: col.clone(),
      emissive: col.clone(),
      emissiveIntensity: 0.06,
      roughness: 0.45,
      metalness: 0,
      transparent: true,
      opacity: n === 'cerebro' ? 0.45 : n === 'pulmones' ? 0.62 : 0.94,
      depthWrite: n !== 'cerebro' && n !== 'pulmones',
    })
    if (n === 'cerebro' || n === 'pulmones') m.renderOrder = 3
  }
  // Los pulmones del modelo traen un pedacito suelto abajo del diafragma: no se dibuja ni se puede tocar.
  const pulmones = mallas.get('pulmones')
  const corazon = mallas.get('corazon')
  if (pulmones) soloPiezasGrandes(pulmones.geometry)

  // ---------- Lo que se dibuja con las medidas del modelo ----------
  const bPiel = caja('piel') ?? new Box3().setFromObject(cuerpo)
  const bCer = caja('cerebro')
  const bPul = caja('pulmones')
  const bCor = caja('corazon')
  const bEst = caja('estomago')
  const bInt = caja('intestinos')
  const bSup = caja('suprarrenales')
  const bAmi = caja('amigdala')
  if (!bCer || !bPul || !bCor || !bEst || !bSup || !bAmi || !pulmones || !corazon) throw new Error('modelo incompleto')
  const centro = (b: Box3) => b.getCenter(new Vector3())
  const cA = centro(bAmi)
  const cH = centro(bCor)
  const cE = centro(bEst)
  const cS = centro(bSup)
  const cP = centro(bPul)
  const anchoPul = bPul.max.x - bPul.min.x
  const altoPul = bPul.max.y - bPul.min.y
  const zSpine = cH.z - (bCor.max.z - bCor.min.z) * 0.55

  // Nervio vago: su recorrido real, de los dos lados.
  const matVago = new MeshStandardMaterial({ color: '#6fd6a8', emissive: C.freno.clone(), emissiveIntensity: 0.25, roughness: 0.5 })
  const curvasVago = ([-1, 1] as const).map((lado) => {
    const curva = new CatmullRomCurve3(puntosVago({ cer: bCer, pul: bPul, cor: bCor, est: bEst, int: bInt }, lado))
    const tubo = new Mesh(new TubeGeometry(curva, 120, 0.0026, 6), matVago)
    tubo.name = lado < 0 ? 'vago' : 'vago-2'
    cuerpo.add(tubo)
    mallas.set(tubo.name, tubo)
    return curva
  })

  // Tráquea, bronquios y diafragma.
  const { vias, domo, domoY } = viaYDiafragma(bPul)
  const matVia = vidrio('#47e6e2', { base: 0.03, fuerza: 0.55, borde: 1.8 })
  vias.forEach((c, i) => {
    const tubo = new Mesh(new TubeGeometry(c, 60, 0.0074, 10), matVia)
    tubo.name = `via-${i}`
    tubo.renderOrder = 6
    cuerpo.add(tubo)
    mallas.set(tubo.name, tubo)
  })
  domo.name = 'diafragma'
  cuerpo.add(domo)
  mallas.set('diafragma', domo)
  const matDomo = domo.material as ShaderMaterial
  const finVia = vias.map((c) => c.getPointAt(1))

  // Señales: puntos que corren por un camino (naranja la alarma, verde el freno).
  const bajaCuello = (dx: number, z: number) => new Vector3(cA.x + dx, bCer.min.y - 0.035, z)
  const caminos: Record<Exclude<Flujo, 'vago'> | 'vago' | 'vago-2', Curve<Vector3>> = {
    'alarma-supra': new CatmullRomCurve3([
      cA,
      bajaCuello(-0.004, zSpine + 0.02),
      new Vector3(cA.x - 0.006, cH.y + 0.06, zSpine - 0.012),
      new Vector3(cS.x, cS.y + 0.05, cS.z - 0.01),
      cS,
    ]),
    'supra-corazon': new CatmullRomCurve3([
      cS,
      new Vector3((cS.x + cH.x) / 2 + 0.02, (cS.y + cH.y) / 2, (cS.z + cH.z) / 2 + 0.02),
      cH,
    ]),
    'corazon-alarma': new CatmullRomCurve3([cH, new Vector3(cH.x, bPul.max.y, zSpine + 0.03), bajaCuello(0.006, cA.z - 0.005), cA]),
    'alarma-panza': new CatmullRomCurve3([
      cA,
      bajaCuello(0.008, zSpine + 0.025),
      new Vector3(cA.x + 0.02, cH.y - 0.01, zSpine + 0.005),
      cE,
    ]),
    'pulmon-alarma': new CatmullRomCurve3([
      new Vector3(cP.x - anchoPul * 0.2, bPul.max.y - 0.04, cP.z),
      bajaCuello(-0.006, cA.z),
      cA,
    ]),
    vago: curvasVago[0],
    'vago-2': curvasVago[1],
  }
  const NF = 42
  const flujos = Object.entries(caminos).map(([nombre, curva]) => {
    const geo = new BufferGeometry()
    const pos = new Float32Array(NF * 3)
    const a = new Float32Array(NF)
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aA', new BufferAttribute(a, 1))
    const freno = nombre.startsWith('vago')
    const mat = puntos(freno ? C.freno : C.alarma, 0.015, { atraves: true })
    const pts = new Points(geo, mat)
    pts.renderOrder = 9
    pts.frustumCulled = false
    pts.visible = false
    cuerpo.add(pts)
    return { nombre: (freno ? 'vago' : nombre) as Flujo, curva, geo, pos, a, mat, pts, vel: freno ? 0.28 : 0.5 }
  })

  // Aire: cada partícula tiene su lugar dentro de un pulmón y un pequeño retraso.
  const NA = 260
  const aireGeo = new BufferGeometry()
  const airePos = new Float32Array(NA * 3)
  const aireA = new Float32Array(NA)
  aireGeo.setAttribute('position', new BufferAttribute(airePos, 3))
  aireGeo.setAttribute('aA', new BufferAttribute(aireA, 1))
  const aireMat = puntos(C.aire, 0.012)
  const airePts = new Points(aireGeo, aireMat)
  airePts.frustumCulled = false
  airePts.renderOrder = 7
  airePts.visible = false
  cuerpo.add(airePts)
  let semilla = 7
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647
  const particulas = Array.from({ length: NA }, (_, i) => {
    const lado = i % 2
    const p = new Vector3()
    do p.set(azar() * 2 - 1, azar() * 2 - 1, azar() * 2 - 1)
    while (p.lengthSq() > 1)
    const destino = new Vector3(
      cP.x + (lado ? 1 : -1) * anchoPul * 0.25 + p.x * anchoPul * 0.2,
      cP.y + p.y * altoPul * 0.4,
      cP.z + p.z * (bPul.max.z - bPul.min.z) * 0.33,
    )
    // Al respirar rápido y por arriba, el aire solo llega a la parte de arriba de los pulmones.
    const destinoArriba = new Vector3(destino.x, cP.y + altoPul * (0.12 + 0.22 * azar()), destino.z)
    return { lado, destino, destinoArriba, retraso: azar() * 0.3 }
  })

  // ---------- Cámara ----------
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.enableDamping = !opts.still
  controls.dampingFactor = 0.12
  controls.rotateSpeed = 0.7
  controls.minPolarAngle = Math.PI * 0.22
  controls.maxPolarAngle = Math.PI * 0.78
  controls.minDistance = 0.25
  controls.maxDistance = 2.6
  const alto = bPiel.max.y - bPiel.min.y
  // Vista de inicio: de la cabeza a la cadera, de frente.
  const casa = {
    target: new Vector3(0, bPiel.min.y + alto * 0.73, (bPiel.min.z + bPiel.max.z) / 2),
    dist: alto * 1.12,
  }
  controls.target.copy(casa.target)
  camera.position.set(casa.target.x, casa.target.y + 0.05, casa.target.z + casa.dist)
  controls.update()

  // ---------- Estado ----------
  let orden: Senal = REPOSO
  let sel: ParteId | null = null
  let raf = 0
  let ultimo = 0
  let visible = true
  let ultimoToque = performance.now()
  let viaje: null | { t0: number; dur: number; fromT: Vector3; toT: Vector3; fromP: Vector3; toP: Vector3 } = null
  let hueco = 0
  let huecoMeta = 0
  let t = 0
  let fraccion = 0
  let latido = 0
  let bpm = 66
  const pt = new Vector3()
  const base = new Map<Mesh, { pos: Vector3; scale: Vector3 }>()
  for (const m of [pulmones, corazon]) base.set(m, { pos: m.position.clone(), scale: m.scale.clone() })
  const escalar = (m: Mesh, c: Vector3, k: number) => {
    const b = base.get(m)!
    m.scale.copy(b.scale).multiplyScalar(k)
    // p' = c + (p − c)·k  ⇒  posición = c·(1 − k) + p·k (en el espacio del padre, que no rota).
    m.position.copy(b.pos).multiplyScalar(k).addScaledVector(c, 1 - k)
  }

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    aplicarHueco()
    const escala = (h * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360))
    aireMat.uniforms.uScale.value = escala
    for (const f of flujos) f.mat.uniforms.uScale.value = escala
    despertar()
  }
  const aplicarHueco = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (hueco > 0.001 && w && h) camera.setViewOffset(w, h, 0, h * hueco, w, h)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }

  /** Un cuadro: anima lo que toque y dibuja. */
  const cuadro = (now: number, dt: number) => {
    if (!opts.still) t += dt
    // Con «reducir movimiento», los cambios de color llegan de una vez.
    const k = opts.still ? 1 : 1 - Math.exp(-dt * 4)

    if (viaje) {
      const p = Math.min(1, (now - viaje.t0) / viaje.dur)
      const e = easeInOut(p)
      controls.target.lerpVectors(viaje.fromT, viaje.toT, e)
      camera.position.lerpVectors(viaje.fromP, viaje.toP, e)
      if (p >= 1) viaje = null
    }
    if (Math.abs(huecoMeta - hueco) > 0.001) {
      hueco += (huecoMeta - hueco) * (opts.still ? 1 : 0.18)
      if (Math.abs(huecoMeta - hueco) <= 0.001) hueco = huecoMeta
      aplicarHueco()
    }
    controls.update()

    // Respiración: el mismo ritmo que en Calma cuando es lenta.
    const r = RITMOS[orden.respira ?? 'lenta']
    if (!opts.still) fraccion = (fraccion + dt / (r.i + r.e)) % 1
    const seg = opts.still ? r.i * 0.8 : fraccion * (r.i + r.e)
    const toma = seg < r.i
    const p = toma ? seg / r.i : 0
    const q = toma ? 0 : (seg - r.i) / r.e
    const llenado = (toma ? 0.5 - 0.5 * Math.cos(p * Math.PI) : 0.5 + 0.5 * Math.cos(q * Math.PI)) * r.amp
    escalar(pulmones, cP, 1 + 0.04 * llenado)
    moverDiafragma(domo, domoY, llenado)

    // Aire: entra turquesa y sale tibio.
    const verAire = orden.aire && pulmones.visible ? 1 : 0
    aireMat.uniforms.uOp.value += (verAire - aireMat.uniforms.uOp.value) * k
    airePts.visible = aireMat.uniforms.uOp.value > 0.01
    if (airePts.visible) {
      aireMat.uniforms.uColor.value.copy(C.aire).lerp(C.co2, toma ? 0 : suave(entre(q * 1.6)))
      particulas.forEach((s, i) => {
        const l = toma ? entre((p - s.retraso) / 0.7) : 1 - entre((q - s.retraso) / 0.7)
        if (l <= 0.5) vias[s.lado].getPointAt(l / 0.5, pt)
        else pt.copy(finVia[s.lado]).lerp(r.arriba ? s.destinoArriba : s.destino, (l - 0.5) / 0.5)
        airePos.set([pt.x, pt.y, pt.z], i * 3)
        aireA[i] = entre(l / 0.05) * (l < 0.5 ? 0.7 : 1)
      })
      aireGeo.attributes.position.needsUpdate = true
      aireGeo.attributes.aA.needsUpdate = true
    }

    // Corazón: el ritmo cambia poco a poco; al tomar aire sube un poquito y al soltarlo baja.
    const meta = (orden.bpm ?? 66) + (orden.aire && orden.respira !== 'rapida' ? (toma ? 3 : -3) : 0)
    bpm += (meta - bpm) * (opts.still ? 1 : 1 - Math.exp(-dt * 1.2))
    if (!opts.still) {
      latido = (latido + (dt * bpm) / 60) % 1
      const golpe = Math.exp(-((latido - 0.1) ** 2) / 0.002) + 0.55 * Math.exp(-((latido - 0.27) ** 2) / 0.0016)
      escalar(corazon, cH, 1 + 0.02 * golpe)
    }

    // Órganos: naranja la alarma, verde el freno, claro lo que tocaste.
    const alarma = new Set(orden.alarma ?? [])
    const calma = new Set(orden.calma ?? [])
    const brillo = new Set(orden.brillo ?? [])
    for (const n of ORGANOS) {
      const m = mallas.get(n)
      if (!m) continue
      const mat = m.material as MeshStandardMaterial
      const propio = tono.get(n)!
      const mia = sel !== null && PARTE[n] === sel
      let col = propio
      let int = n === 'pulmones' ? 0.18 : 0.06
      if (mia) [col, int] = [C.sel, 0.55]
      else if (alarma.has(n as Organo3D)) [col, int] = [C.alarma, 0.9]
      else if (calma.has(n as Organo3D)) [col, int] = [C.freno, 0.75]
      if (int > 0.5) int *= MENOS[n] ?? 1
      else if (brillo.has(n as Organo3D)) [col, int] = [C.aire, 0.2 + 0.5 * llenado]
      mat.emissive.lerp(col, k)
      mat.color.lerp(mia ? propio : col, k)
      mat.emissiveIntensity += (int - mat.emissiveIntensity) * k
    }
    const vagoOn = (orden.flujos ?? []).includes('vago') || calma.has('vago') || sel === 'vago'
    matVago.emissiveIntensity += ((vagoOn ? 1.1 : 0.25) - matVago.emissiveIntensity) * k
    if (huesos) {
      const u = (huesos.material as ShaderMaterial).uniforms
      u.uColor.value.lerp(alarma.has('esqueleto') ? C.alarma : sel === 'esqueleto' ? C.sel : C.hueso, k)
      u.uFuerza.value += ((sel === 'esqueleto' ? 0.55 : 0.28) - u.uFuerza.value) * k
    }
    if (piel) {
      const u = (piel.material as ShaderMaterial).uniforms
      u.uFuerza.value += ((sel === 'piel' ? 0.8 : 0.42) - u.uFuerza.value) * k
    }
    const domoMeta = sel === 'diafragma' || calma.has('diafragma') ? 1.3 : 0.7
    matDomo.uniforms.uFuerza.value += (domoMeta - matDomo.uniforms.uFuerza.value) * k
    matVia.uniforms.uFuerza.value += ((sel === 'via' ? 1.3 : 0.55) - matVia.uniforms.uFuerza.value) * k

    // Señales que corren.
    const activos = new Set(orden.flujos ?? [])
    for (const f of flujos) {
      const u = f.mat.uniforms
      u.uOp.value += ((activos.has(f.nombre) ? 1 : 0) - u.uOp.value) * k
      f.pts.visible = u.uOp.value > 0.01
      if (!f.pts.visible) continue
      for (let i = 0; i < NF; i++) {
        const s = (i / NF + t * f.vel) % 1
        f.curva.getPointAt(s, pt)
        f.pos.set([pt.x, pt.y, pt.z], i * 3)
        f.a[i] = Math.sin(s * Math.PI) * (0.55 + 0.45 * ((i % 3) / 2))
      }
      f.geo.attributes.position.needsUpdate = true
      f.geo.attributes.aA.needsUpdate = true
    }

    // La ola que baja por la piel y los huesos (el apagado del sueño, o la tensión).
    for (const m of [piel, huesos]) {
      if (!m) continue
      const u = (m.material as ShaderMaterial).uniforms
      u.uScan.value += ((orden.ola ? 1 : 0) - u.uScan.value) * k
      if (orden.ola) u.uScanColor.value.copy(orden.ola === 'alarma' ? C.alarma : C.freno)
      u.uScanY.value = bPiel.max.y + 0.03 - ((t * 0.3) % 1) * alto * 0.75
    }

    renderer.render(scene, camera)
  }

  // ---------- Bucle ----------
  const despierto = (now: number) => viaje !== null || (!opts.still && now - ultimoToque < 90_000)
  const tick = (now: number) => {
    raf = 0
    if (!visible || document.hidden) return
    // A lo mucho unos 30 cuadros por segundo: alcanza para algo que se mueve despacio.
    if (now - ultimo >= 32) {
      cuadro(now, Math.min(0.05, (now - (ultimo || now)) / 1000))
      ultimo = now
    }
    if (despierto(now)) pedir()
  }
  function pedir() {
    if (!raf) raf = requestAnimationFrame(tick)
  }
  function despertar() {
    ultimoToque = performance.now()
    // Al despertar, el primer paso de tiempo no cuenta lo que estuvo dormido.
    if (!raf) ultimo = 0
    pedir()
  }
  controls.addEventListener('change', pedir)
  controls.addEventListener('start', () => {
    viaje = null
    despertar()
  })

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
      if (hit) return opts.onPick(PARTE[hit.object.name])
    }
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)

  // ---------- Cuidar la batería y la memoria ----------
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) despertar()
  })
  io.observe(canvas)
  const onVis = () => !document.hidden && despertar()
  document.addEventListener('visibilitychange', onVis)
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const onLost = (e: Event) => {
    e.preventDefault()
    opts.onLost()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  resize()

  const capas: Record<Capa, string[]> = {
    piel: ['piel'],
    esqueleto: ['esqueleto'],
    organos: [...ORGANOS.filter((n) => n !== 'amigdala'), 'via-0', 'via-1', 'diafragma'],
    nervios: ['amigdala', 'vago', 'vago-2'],
  }

  /** Viaja a lo que se nombra; sin nada, regresa a ver todo el cuerpo de frente. */
  const viajar = (nombres: (Organo3D | ParteId)[] | null) => {
    let toT = casa.target.clone()
    let dist = casa.dist
    let dir = camera.position.clone().sub(controls.target).normalize()
    const b = new Box3()
    for (const n of nombres ?? []) for (const m of mallasDe(n)) if (mallas.get(m)) b.expandByObject(mallas.get(m)!)
    if (!b.isEmpty()) {
      toT = b.getCenter(new Vector3())
      const s = b.getSize(new Vector3())
      dist = Math.min(controls.maxDistance, Math.max(0.6, Math.max(s.x, s.y, s.z) * 6))
      // Los riñones se ven mejor desde la espalda; lo demás, casi de frente.
      if (nombres?.length === 1 && nombres[0] === 'rinones') dir = new Vector3(0, 0.15, -1).normalize()
      else if (nombres?.length === 1 && (nombres[0] === 'piel' || nombres[0] === 'esqueleto')) dist = Math.max(dist * 0.55, 1)
      else dir.lerp(new Vector3(0, 0.08, 1), 0.6).normalize()
    } else dir = new Vector3(0, 0.05, 1).normalize()
    const toP = toT.clone().addScaledVector(dir, dist)
    if (opts.still) {
      controls.target.copy(toT)
      camera.position.copy(toP)
      controls.update()
      return despertar()
    }
    viaje = { t0: performance.now(), dur: 900, fromT: controls.target.clone(), toT, fromP: camera.position.clone(), toP }
    despertar()
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
      sel = id
      viajar(id ? [id] : null)
    },
    senal(s) {
      const antes = JSON.stringify(orden.foco ?? null)
      orden = s ?? REPOSO
      sel = null
      if (JSON.stringify(orden.foco ?? null) !== antes) viajar(orden.foco ?? null)
      else despertar()
    },
    girar(grados) {
      const a = (grados * Math.PI) / 180
      const off = camera.position.clone().sub(controls.target)
      off.applyAxisAngle(new Vector3(0, 1, 0), a)
      const toP = controls.target.clone().add(off)
      if (opts.still) {
        camera.position.copy(toP)
        controls.update()
        return despertar()
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
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('webglcontextlost', onLost)
      controls.dispose()
      scene.traverse((o) => {
        const m = o as Mesh
        if (m.isMesh || (o as Points).isPoints) {
          m.geometry.dispose()
          ;(Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose())
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
