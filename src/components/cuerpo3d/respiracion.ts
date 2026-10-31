// «Respirar por dentro»: el pecho del modelo de «Explorar por dentro» visto como vidrio, siguiendo
// el mismo ritmo que el círculo de Calma. Al tomar aire, el diafragma baja, los pulmones se llenan y
// el aire (turquesa) baja por la tráquea y se reparte; al soltarlo sale tibio y el nervio vago lleva
// el freno hacia abajo.
//
// Sin parpadeos: el cuerpo no se mece, los colores no laten y nada brilla de golpe. Cuidados para
// teléfonos sencillos como en escena.ts: pixelRatio con tope, a lo mucho 30 cuadros por segundo,
// pausa fuera de pantalla o con la app en segundo plano, y un solo cuadro cuando no hay respiración.
// Con «reducir movimiento» se mueven solo los pulmones y el aire, igual que el círculo, que es la guía.
import {
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { moverDiafragma, puntos, puntosVago, soloPiezasGrandes, vidrio, viaYDiafragma } from './comun'

/** Lo que está haciendo la respiración ahora; `segundos` es lo que dura esa fase. */
export type Aire = { tipo: 'toma' | 'suelta' | 'sostiene' | 'quieto'; segundos: number }

export type Respiracion = {
  aire(a: Aire): void
  dispose(): void
}

type Opciones = {
  url: string
  still: boolean
  /** El teléfono se quedó sin memoria de video, o algo falló: volver al círculo. */
  onLost(): void
}

const AIRE = new Color('#5fe3e0')
const TIBIO = new Color('#ffb36b')
const FRENO = new Color('#6fe0a8')
const suave = (x: number) => x * x * (3 - 2 * x)
const entre = (x: number) => Math.min(1, Math.max(0, x))

export async function crearRespiracion(canvas: HTMLCanvasElement, opts: Opciones): Promise<Respiracion> {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true, // un solo lienzo chico: el borde suave evita que el vidrio «tiemble»
    alpha: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.05, 10)
  scene.add(new HemisphereLight(0xe6fff7, 0x1a2624, 1.3))
  scene.add(new AmbientLight(0xffffff, 0.3))
  const sol = new DirectionalLight(0xffffff, 1.3)
  sol.position.set(-1, 2, 2.4)
  scene.add(sol)

  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(opts.url)
  const cuerpo = gltf.scene
  scene.add(cuerpo)
  cuerpo.updateMatrixWorld(true)

  const mallas = new Map<string, Mesh>()
  cuerpo.traverse((o) => {
    if ((o as Mesh).isMesh) mallas.set(o.name, o as Mesh)
  })
  const caja = (n: string): Box3 | null => {
    const m = mallas.get(n)
    return m ? new Box3().setFromObject(m) : null
  }
  const bPul = caja('pulmones')
  const bCor = caja('corazon')
  const bCer = caja('cerebro')
  const bEst = caja('estomago')
  const pulmones = mallas.get('pulmones')
  const corazon = mallas.get('corazon')
  if (!bPul || !bCor || !bCer || !bEst || !pulmones || !corazon) throw new Error('modelo incompleto')

  // Solo el pecho: piel y huesos de vidrio, pulmones y corazón. Lo demás no se ve desde aquí.
  for (const [nombre, m] of mallas) {
    if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals()
    if (nombre === 'piel') {
      m.material = vidrio('#8fd6cb', { base: 0.008, fuerza: 0.42, borde: 2.8 })
      m.renderOrder = 5
    } else if (nombre === 'esqueleto') {
      m.material = vidrio('#efe6d6', { base: 0.01, fuerza: 0.3, borde: 2.4 })
      m.renderOrder = 4
    } else if (nombre !== 'pulmones' && nombre !== 'corazon') m.visible = false
  }
  pulmones.material = new MeshStandardMaterial({
    color: '#f1d3c8',
    emissive: AIRE,
    emissiveIntensity: 0,
    roughness: 0.5,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  pulmones.renderOrder = 3
  soloPiezasGrandes(pulmones.geometry)
  corazon.material = new MeshStandardMaterial({ color: '#d4675a', roughness: 0.5 })

  const cP = bPul.getCenter(new Vector3())
  const cH = bCor.getCenter(new Vector3())
  const ancho = bPul.max.x - bPul.min.x
  const altoPul = bPul.max.y - bPul.min.y

  // Tráquea y bronquios, hasta el centro de cada pulmón, y el diafragma debajo.
  const { vias, domo, domoY } = viaYDiafragma(bPul)
  const matVia = vidrio('#5fe3e0', { base: 0.03, fuerza: 0.55, borde: 1.8 })
  for (const c of vias) {
    const tubo = new Mesh(new TubeGeometry(c, 60, 0.0074, 10), matVia)
    tubo.renderOrder = 6
    scene.add(tubo)
  }
  const finVia = vias.map((c) => c.getPointAt(1))
  scene.add(domo)

  // Nervio vago: una línea tenue, y al soltar el aire unos puntos verdes que bajan despacio.
  const vago = new CatmullRomCurve3(puntosVago({ cer: bCer, pul: bPul, cor: bCor, est: bEst, int: null }, -1))
  scene.add(new Mesh(new TubeGeometry(vago, 90, 0.0024, 6), new MeshStandardMaterial({ color: '#6fd6a8', roughness: 0.5 })))
  const NV = 16
  const vagoGeo = new BufferGeometry()
  const vagoPos = new Float32Array(NV * 3)
  const vagoA = new Float32Array(NV)
  vagoGeo.setAttribute('position', new BufferAttribute(vagoPos, 3))
  vagoGeo.setAttribute('aA', new BufferAttribute(vagoA, 1))
  const vagoMat = puntos(FRENO, 0.012, { atraves: true })
  const vagoPts = new Points(vagoGeo, vagoMat)
  vagoPts.frustumCulled = false
  vagoPts.renderOrder = 8
  scene.add(vagoPts)

  // Aire: cada partícula tiene su lugar dentro de un pulmón y un pequeño retraso.
  const NA = 260
  const aireGeo = new BufferGeometry()
  const airePos = new Float32Array(NA * 3)
  const aireA = new Float32Array(NA)
  aireGeo.setAttribute('position', new BufferAttribute(airePos, 3))
  aireGeo.setAttribute('aA', new BufferAttribute(aireA, 1))
  const aireMat = puntos(AIRE, 0.011)
  const airePts = new Points(aireGeo, aireMat)
  airePts.frustumCulled = false
  airePts.renderOrder = 7
  scene.add(airePts)
  let s = 7
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647
  const particulas = Array.from({ length: NA }, (_, i) => {
    const lado = i % 2
    const p = new Vector3()
    do p.set(azar() * 2 - 1, azar() * 2 - 1, azar() * 2 - 1)
    while (p.lengthSq() > 1)
    const destino = new Vector3(
      cP.x + (lado ? 1 : -1) * ancho * 0.25 + p.x * ancho * 0.2,
      cP.y + p.y * altoPul * 0.4,
      cP.z + p.z * (bPul.max.z - bPul.min.z) * 0.33,
    )
    return { lado, destino, retraso: azar() * 0.3 }
  })

  // Cámara fija de frente al pecho, del cuello al diafragma.
  const mira = new Vector3(cP.x, (bPul.max.y + 0.09 + domoY - 0.03) / 2, cP.z)
  const altoVista = bPul.max.y + 0.09 - (domoY - 0.03)

  // ---------- Bucle ----------
  let aire: Aire = { tipo: 'quieto', segundos: 1 }
  let desde = performance.now()
  let llenadoInicio = 0.35
  let llenado = 0.35
  let latido = 0
  let raf = 0
  let ultimo = 0
  let visible = true
  const pt = new Vector3()
  const base = { pos: pulmones.position.clone(), scale: pulmones.scale.clone() }
  const baseCor = { pos: corazon.position.clone(), scale: corazon.scale.clone() }
  const escalar = (m: Mesh, b: typeof base, c: Vector3, k: number) => {
    m.scale.copy(b.scale).multiplyScalar(k)
    m.position.copy(b.pos).multiplyScalar(k).addScaledVector(c, 1 - k)
  }

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Que el pecho quepa a lo alto y a lo ancho.
    const mitad = Math.tan((camera.fov * Math.PI) / 360)
    const dist = Math.max(altoVista / 2 / mitad, (ancho * 0.75) / camera.aspect / mitad) * 1.08
    camera.position.set(mira.x, mira.y + 0.02, mira.z + dist)
    camera.lookAt(mira)
    camera.updateProjectionMatrix()
    const escala = (h * renderer.getPixelRatio()) / (2 * mitad)
    aireMat.uniforms.uScale.value = escala
    vagoMat.uniforms.uScale.value = escala
    pedir()
  }

  const cuadro = (now: number) => {
    const p = entre((now - desde) / 1000 / aire.segundos)
    const e = suave(p)
    if (aire.tipo === 'toma') llenado = llenadoInicio + (1 - llenadoInicio) * e
    else if (aire.tipo === 'suelta') llenado = llenadoInicio * (1 - e)

    escalar(pulmones, base, cP, 1 + 0.05 * llenado)
    moverDiafragma(domo, domoY, llenado)
    ;(pulmones.material as MeshStandardMaterial).emissiveIntensity = 0.25 * llenado

    // El aire entra en turquesa y sale tibio; mientras se sostiene, se queda donde está.
    const hayAire = aire.tipo !== 'quieto'
    aireMat.uniforms.uOp.value = hayAire ? 1 : 0
    if (hayAire) {
      if (aire.tipo === 'suelta') aireMat.uniforms.uColor.value.copy(AIRE).lerp(TIBIO, suave(entre(p * 1.6)))
      else if (aire.tipo === 'toma') aireMat.uniforms.uColor.value.copy(AIRE)
      particulas.forEach((s, i) => {
        let l: number
        if (aire.tipo === 'toma') l = entre((p - s.retraso) / 0.7)
        else if (aire.tipo === 'suelta') l = 1 - entre((p - s.retraso) / 0.7)
        else l = llenado > 0.5 ? 1 : 0
        if (l <= 0.5) vias[s.lado].getPointAt(l / 0.5, pt)
        else pt.copy(finVia[s.lado]).lerp(s.destino, (l - 0.5) / 0.5)
        airePos.set([pt.x, pt.y, pt.z], i * 3)
        aireA[i] = entre(l / 0.05)
      })
      aireGeo.attributes.position.needsUpdate = true
      aireGeo.attributes.aA.needsUpdate = true
    }

    // El freno baja por el vago al soltar el aire (sin «reducir movimiento»).
    const freno = !opts.still && aire.tipo === 'suelta'
    vagoMat.uniforms.uOp.value = freno ? Math.sin(p * Math.PI) : 0
    if (freno) {
      for (let i = 0; i < NV; i++) {
        const u = entre(p * 1.1 - i * 0.012)
        vago.getPointAt(u, pt)
        vagoPos.set([pt.x, pt.y, pt.z], i * 3)
        vagoA[i] = 1 - i / NV
      }
      vagoGeo.attributes.position.needsUpdate = true
      vagoGeo.attributes.aA.needsUpdate = true
    }

    // Latido tranquilo: un poquito más rápido al tomar aire y más lento al soltarlo.
    if (!opts.still) {
      const bpm = aire.tipo === 'toma' ? 68 : aire.tipo === 'suelta' ? 62 : 65
      latido = (latido + ((now - (ultimo || now)) / 1000) * (bpm / 60)) % 1
      const golpe = Math.exp(-((latido - 0.1) ** 2) / 0.002) + 0.5 * Math.exp(-((latido - 0.27) ** 2) / 0.0016)
      escalar(corazon, baseCor, cH, 1 + 0.02 * golpe)
    }
    renderer.render(scene, camera)
  }

  const tick = (now: number) => {
    raf = 0
    if (!visible || document.hidden) return
    // A lo mucho unos 30 cuadros por segundo: alcanza para algo que se mueve despacio.
    if (now - ultimo >= 32) {
      cuadro(now)
      ultimo = now
    }
    // Sin respiración en curso basta el último cuadro: nada se mueve.
    if (aire.tipo !== 'quieto') pedir()
  }
  function pedir() {
    if (!raf) raf = requestAnimationFrame(tick)
  }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) pedir()
  })
  io.observe(canvas)
  const onVis = () => !document.hidden && pedir()
  document.addEventListener('visibilitychange', onVis)
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const onLost = (e: Event) => {
    e.preventDefault()
    opts.onLost()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  resize()

  return {
    aire(a) {
      llenadoInicio = llenado
      aire = a
      desde = performance.now()
      pedir()
    },
    dispose() {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('webglcontextlost', onLost)
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
