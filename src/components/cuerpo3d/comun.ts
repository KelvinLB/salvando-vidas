// Piezas que comparten las escenas 3D («Explorar por dentro» y «Respirar por dentro»). Solo lo
// importan archivos de esta carpeta, así que todo queda en el mismo chunk que three.
import {
  AdditiveBlending,
  Box3,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'

/**
 * Recorrido del nervio vago, de un lado: tronco del cerebro → cuello junto a la tráquea → detrás
 * del corazón → por el diafragma hasta la panza. Se arma con las cajas de los órganos del modelo,
 * así queda en su lugar aunque el modelo cambie.
 */
export function puntosVago(
  b: { cer: Box3; pul: Box3; cor: Box3; est: Box3; int: Box3 | null },
  lado: -1 | 1,
): Vector3[] {
  const cC = b.cer.getCenter(new Vector3())
  const cH = b.cor.getCenter(new Vector3())
  const cE = b.est.getCenter(new Vector3())
  const zSpine = cH.z - (b.cor.max.z - b.cor.min.z) * 0.55
  const x = (k: number) => cC.x + lado * k
  const pts = [
    new Vector3(x(0.008), b.cer.min.y + 0.03, cC.z - 0.01),
    new Vector3(x(0.022), b.cer.min.y - 0.02, cC.z - 0.005),
    new Vector3(x(0.028), (b.cer.min.y + b.pul.max.y) / 2, (cC.z + zSpine) / 2 + 0.01),
    new Vector3(x(0.03), b.pul.max.y - 0.01, zSpine + 0.015),
    new Vector3(cH.x + lado * 0.03, cH.y + 0.02, zSpine),
    new Vector3(cH.x + lado * 0.015, b.cor.min.y - 0.01, zSpine + 0.005),
    new Vector3(cE.x - 0.01 + lado * 0.012, b.est.max.y - 0.015, cE.z - 0.01),
    new Vector3(cE.x + lado * 0.01, cE.y, cE.z),
  ]
  if (b.int) {
    const cI = b.int.getCenter(new Vector3())
    pts.push(new Vector3(cI.x + lado * 0.03, cI.y, b.int.max.z - 0.03))
  }
  return pts
}

/**
 * Vidrio: casi invisible de frente y claro en los bordes, como una radiografía suave. Sin brillos
 * que laten: el color solo cambia cuando se le pide. `uScan` prende una banda de luz a la altura
 * `uScanY` (la ola que baja por el cuerpo en algunas fichas); apagada no cambia nada.
 */
export function vidrio(color: string, { base = 0.02, fuerza = 0.5, borde = 2.2 } = {}) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uBase: { value: base },
      uFuerza: { value: fuerza },
      uBorde: { value: borde },
      uScanY: { value: -10 },
      uScan: { value: 0 },
      uScanColor: { value: new Color('#4fe39a') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vP;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vP = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uScanColor;
      uniform float uBase, uFuerza, uBorde, uScanY, uScan;
      varying vec3 vN;
      varying vec3 vP;
      void main() {
        float nv = abs(dot(normalize(vN), normalize(cameraPosition - vP)));
        float rim = pow(1.0 - nv, uBorde);
        float banda = exp(-pow((vP.y - uScanY) / 0.045, 2.0)) * uScan;
        gl_FragColor = vec4(uColor * (0.25 + rim * 1.2) + uScanColor * banda * 1.6, uBase + uFuerza * rim + banda * 0.4);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  })
}

/** Puntos suaves (aire, señales). `size` va en metros del modelo; `uScale` lo ajusta la escena al medir el lienzo. */
export function puntos(color: Color | string, size: number, { atraves = false } = {}) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uSize: { value: size },
      uScale: { value: 400 },
      uOp: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aA;
      varying float vA;
      uniform float uSize, uScale;
      void main() {
        vA = aA;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOp;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * uOp * vA);
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: !atraves,
    blending: AdditiveBlending,
  })
}

/**
 * Quita los pedacitos sueltos de una malla (los que no tocan a ninguna pieza grande). El modelo de
 * los pulmones trae uno abajo del diafragma que, visto de vidrio, parece un órgano flotando.
 * Las cajas (Box3.setFromObject) no cambian: miden todos los vértices, no solo los que se dibujan.
 */
export function soloPiezasGrandes(geo: BufferGeometry, fraccion = 0.2) {
  const idx = geo.index
  if (!idx) return
  const n = geo.attributes.position.count
  const raiz = Int32Array.from({ length: n }, (_, i) => i)
  const de = (i: number): number => {
    while (raiz[i] !== i) i = raiz[i] = raiz[raiz[i]]
    return i
  }
  for (let t = 0; t < idx.count; t += 3) {
    const a = de(idx.getX(t))
    raiz[de(idx.getX(t + 1))] = a
    raiz[de(idx.getX(t + 2))] = a
  }
  const tam = new Map<number, number>()
  for (let i = 0; i < n; i++) tam.set(de(i), (tam.get(de(i)) ?? 0) + 1)
  const quedan: number[] = []
  for (let t = 0; t < idx.count; t += 3) {
    if ((tam.get(de(idx.getX(t))) ?? 0) >= n * fraccion) quedan.push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2))
  }
  if (quedan.length < idx.count) geo.setIndex(quedan)
}

/**
 * Lo que el modelo no trae y se dibuja con sus medidas: la tráquea con un bronquio a cada pulmón
 * (curvas) y el diafragma, una cúpula de vidrio bajo los pulmones. `domoY` es su altura en reposo;
 * al tomar aire baja y se aplana (lo anima cada escena).
 */
export function viaYDiafragma(bPul: Box3) {
  const cP = bPul.getCenter(new Vector3())
  const ancho = bPul.max.x - bPul.min.x
  const z = cP.z + 0.012
  const arriba = new Vector3(cP.x, bPul.max.y + 0.085, z)
  const carina = new Vector3(cP.x, bPul.max.y - 0.04, z)
  const vias = ([-1, 1] as const).map(
    (lado) =>
      new CatmullRomCurve3([
        arriba,
        new Vector3(cP.x, bPul.max.y + 0.02, z),
        carina,
        new Vector3(cP.x + lado * ancho * 0.12, bPul.max.y - 0.07, z - 0.004),
        new Vector3(cP.x + lado * ancho * 0.24, cP.y + 0.02, cP.z),
      ]),
  )
  const domo = new Mesh(
    new SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI * 0.36),
    vidrio('#ff9f8a', { base: 0.05, fuerza: 0.7, borde: 1.6 }),
  )
  const domoY = bPul.min.y - 0.006 - 0.05 * 0.55
  domo.scale.set(ancho * 0.56, 0.05, (bPul.max.z - bPul.min.z) * 0.62)
  domo.position.set(cP.x, domoY, cP.z)
  domo.renderOrder = 6
  return { vias, domo, domoY }
}

/** Mueve el diafragma según cuánto aire hay (0 vacío, 1 lleno). */
export function moverDiafragma(domo: Mesh, domoY: number, llenado: number) {
  domo.position.y = domoY - 0.03 * llenado
  domo.scale.y = 0.05 * (1 - 0.45 * llenado)
}
