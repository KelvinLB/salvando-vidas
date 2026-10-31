// «Respirar por dentro»: el pecho del modelo de «Explorar» visto como vidrio, siguiendo
// la respiración de Calma. Al tomar aire, el diafragma baja, los pulmones se llenan y
// el aire (turquesa) baja por la tráquea, se reparte y los va llenando de abajo hacia arriba; al
// soltarlo el nivel baja, el aire sale tibio y el nervio vago lleva el freno hacia abajo.
//
// Sin parpadeos: el cuerpo no se mece, los colores no laten y nada brilla de golpe. Cuidados para
// teléfonos sencillos como en escena.ts: pixelRatio con tope, a lo mucho 30 cuadros por segundo,
// pausa fuera de pantalla o con la app en segundo plano, y un solo cuadro cuando no hay respiración.
// Con «reducir movimiento» nada se mueve: solo sube y baja el nivel del aire, que es la guía.
//
// Para que respirar con ella cueste lo menos posible (ver «Animación que invita a respirar»): el
// nivel del aire es lo único que marca el tiempo; arranca y llega suave, y nunca se llena hasta el
// tope, porque el esfuerzo se contagia antes que la calma. Dos marcas tenues y fijas enseñan hasta
// dónde sube y hasta dónde baja. Al sostener, todo se queda quieto. El corazón no late mientras se
// respira (sería un segundo ritmo que pelea por la mirada), la luz no sube con el aire, y el aire
// de salida es durazno apagado, no naranja fuerte.
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
const TIBIO = new Color('#d1966d')
const FRENO = new Color('#97ccae')
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
  // Cómo se van llenando: un nivel de aire turquesa que sube desde abajo al tomar aire y baja al
  // soltarlo, con la superficie un poco más clara para que se lea bien dónde va. Las alturas van en
  // el mundo.
  const nivel = {
    uNivel: { value: bPul.min.y },
    uBordeNivel: { value: 0.03 * (bPul.max.y - bPul.min.y) },
    uLleno: { value: AIRE },
    // Marcas fijas de lleno y de vacío.
    uMarcaArriba: { value: bPul.max.y },
    uMarcaAbajo: { value: bPul.min.y },
  }
  pulmones.material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, nivel)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vAltura;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvAltura = (modelMatrix * vec4(transformed, 1.0)).y;')
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vAltura;\nuniform float uNivel;\nuniform float uBordeNivel;\nuniform vec3 uLleno;\nuniform float uMarcaArriba;\nuniform float uMarcaAbajo;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float lleno = 1.0 - smoothstep(uNivel - uBordeNivel, uNivel + uBordeNivel, vAltura);
        diffuseColor.rgb = mix(diffuseColor.rgb, uLleno, 0.55 * lleno);
        diffuseColor.a = mix(diffuseColor.a, 0.8, lleno);
        totalEmissiveRadiance += uLleno * 0.12 * lleno;
        float raya = 1.0 - smoothstep(0.0015, 0.0045, abs(vAltura - uNivel));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 1.0, 0.98), 0.6 * raya);
        diffuseColor.a = max(diffuseColor.a, 0.85 * raya);
        float marca = max(
          1.0 - smoothstep(0.001, 0.0035, abs(vAltura - uMarcaArriba)),
          1.0 - smoothstep(0.001, 0.0035, abs(vAltura - uMarcaAbajo))
        );
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.97, 0.95), 0.45 * marca);
        diffuseColor.a = max(diffuseColor.a, 0.6 * marca);`,
      )
  }
  corazon.material = new MeshStandardMaterial({ color: '#d4675a', roughness: 0.5 })

  const cP = bPul.getCenter(new Vector3())
  // Los pulmones crecen desde arriba: hacia abajo, siguiendo al diafragma, y un poco a los lados.
  const arribaPul = new Vector3(cP.x, bPul.max.y, cP.z)
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
      cP.y + p.y * altoPul * (p.y > 0 ? 0.4 : 0.22), // abajo, al centro, el pulmón se recorta: que no se salga
      cP.z + p.z * (bPul.max.z - bPul.min.z) * 0.33,
    )
    return { lado, destino, retraso: azar() * 0.3 }
  })

  // Cámara fija de frente al pecho, del cuello al diafragma, con lugar abajo para la fase: el
  // diafragma es lo primero que se mueve y no debe quedar tapado.
  const arribaVista = bPul.max.y + 0.08
  const abajoVista = domoY - 0.11
  const mira = new Vector3(cP.x, (arribaVista + abajoVista) / 2, cP.z)
  const altoVista = arribaVista - abajoVista

  // ---------- Bucle ----------
  let aire: Aire = { tipo: 'quieto', segundos: 1 }
  let desde = performance.now()
  let llenadoInicio = 0.35
  let llenado = 0.35
  let raf = 0
  let ultimo = 0
  let visible = true
  const pt = new Vector3()
  const base = { pos: pulmones.position.clone(), scale: pulmones.scale.clone() }
  const k3 = new Vector3()
  /** Altura del nivel: de casi vacío (siempre queda un poco de aire) a lleno sin llegar al tope. */
  const alturaNivel = (llenado: number, crece: number) => {
    const abajo = arribaPul.y - altoPul * (1 + 0.045 * crece)
    return abajo + (arribaPul.y - abajo) * (0.12 + 0.66 * llenado)
  }
  nivel.uMarcaArriba.value = alturaNivel(1, opts.still ? 0 : 1)
  nivel.uMarcaAbajo.value = alturaNivel(0, 0)
  const escalar = (m: Mesh, b: typeof base, c: Vector3, k: Vector3) => {
    m.scale.copy(b.scale).multiply(k)
    m.position.set(
      b.pos.x * k.x + c.x * (1 - k.x),
      b.pos.y * k.y + c.y * (1 - k.y),
      b.pos.z * k.z + c.z * (1 - k.z),
    )
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
    // Un poco desde arriba, como cuando te miras el pecho; la cámara nunca se mueve con la respiración.
    camera.position.set(mira.x, mira.y + dist * 0.17, mira.z + dist)
    camera.lookAt(mira)
    camera.updateProjectionMatrix()
    const escala = (h * renderer.getPixelRatio()) / (2 * mitad)
    aireMat.uniforms.uScale.value = escala
    vagoMat.uniforms.uScale.value = escala
    pedir()
  }

  const cuadro = (now: number) => {
    const p = entre((now - desde) / 1000 / aire.segundos)
    // Al soltar, el aire sale más rápido al principio y llega despacio al fondo, como pasa de verdad.
    const e = suave(aire.tipo === 'suelta' ? 1 - (1 - p) ** 1.6 : p)
    if (aire.tipo === 'toma') llenado = llenadoInicio + (1 - llenadoInicio) * e
    else if (aire.tipo === 'suelta') llenado = llenadoInicio * (1 - e)

    // Crecen hacia abajo con el diafragma, que es lo que se mueve primero al respirar bien.
    const crece = opts.still ? 0 : llenado
    escalar(pulmones, base, arribaPul, k3.set(1 + 0.03 * crece, 1 + 0.045 * crece, 1 + 0.03 * crece))
    moverDiafragma(domo, domoY, crece)
    nivel.uNivel.value = alturaNivel(llenado, crece)

    // El aire entra en turquesa y sale tibio; mientras se sostiene, se queda donde está. Con «reducir
    // movimiento» no hay partículas: basta el nivel.
    const hayAire = aire.tipo !== 'quieto' && !opts.still
    aireMat.uniforms.uOp.value = hayAire ? 1 : 0
    if (hayAire) {
      if (aire.tipo === 'suelta') aireMat.uniforms.uColor.value.copy(AIRE).lerp(TIBIO, suave(entre(p * 3)))
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
    vagoMat.uniforms.uOp.value = freno ? 0.7 * Math.sin(p * Math.PI) : 0
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
