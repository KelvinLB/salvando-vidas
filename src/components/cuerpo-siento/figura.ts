import type { BodyView } from '../../data/bodyCheck'
import type { Region } from '../../data/bodyStories'

// Los trazos de la figura de «Tu cuerpo por dentro», en sus tres vistas: de frente, de
// espalda y de lado. Todo vive en un lienzo de 200 × 392 con la cabeza en (100, 76) y los
// pies en el piso (y = 384), para que los efectos de alrededor de la cabeza sirvan igual en
// las tres vistas.
//
// Proporciones de una persona adulta (unas siete cabezas de alto): la barbilla en una
// cabeza, el pecho en dos, el ombligo en tres, la entrepierna cerca de cuatro, las rodillas
// en cinco y media. Los órganos tienen su forma real (dos pulmones con lóbulos, un corazón
// que apunta abajo a la izquierda de la persona, el estómago en J, los riñones con sus
// glándulas encima), pero con los colores suaves de la app: nada de textura de carne, ni
// músculo, ni sangre.
//
// Lo que es de un lado se dibuja a la izquierda y se refleja (x → 200 − x).

export type View = BodyView

export const VIEWS: { id: View; label: string; short: string }[] = [
  { id: 'frente', label: 'De frente', short: 'Frente' },
  { id: 'espalda', label: 'De espalda', short: 'Espalda' },
  { id: 'lado', label: 'De lado', short: 'Lado' },
]

/** Refleja un trazo de la mitad izquierda a la derecha (x → 200 − x). */
export const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(200 - Number(x)).toFixed(2)} ${y}`)
export const both = (d: string) => [d, mirror(d)]

type Seg = [number, number, number, number, number, number]

/** Trazo cerrado simétrico: empieza en el eje, recorre la mitad izquierda y regresa reflejado. */
function sym(start: [number, number], segs: Seg[]) {
  const mx = (x: number) => +(200 - x).toFixed(2)
  let d = `M${start[0]} ${start[1]}`
  const pts: [number, number][] = [start]
  for (const s of segs) {
    d += ` C${s[0]} ${s[1]} ${s[2]} ${s[3]} ${s[4]} ${s[5]}`
    pts.push([s[4], s[5]])
  }
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i]
    const p = pts[i]
    d += ` C${mx(s[2])} ${s[3]} ${mx(s[0])} ${s[1]} ${mx(p[0])} ${p[1]}`
  }
  return d + ' Z'
}

// ---------- De frente (y de espalda: la silueta es la misma) ----------

export const HEAD = 'M100 52 C112 52 120 61 120 74 C120 83 117.5 90 113.5 95 C109.5 99.5 105 101 100 101 C95 101 90.5 99.5 86.5 95 C82.5 90 80 83 80 74 C80 61 88 52 100 52 Z'
export const EAR = 'M81.5 71 C77.5 70 76 79 78.5 84 C79.5 86 81.5 85.5 82 83 Z'
export const NECK = 'M91.5 93 C91.8 101 91.2 107 89.5 113 L110.5 113 C108.8 107 108.2 101 108.5 93 Z'
export const TORSO = sym(
  [100, 108],
  [
    [96, 108, 93, 108.5, 91, 109.5],
    [88.5, 115, 80, 117, 70, 119],
    [62, 120.5, 57, 124, 56, 131],
    [55.5, 137, 58.5, 142, 63, 146],
    [64, 160, 64, 178, 66.5, 194],
    [68.5, 206, 63, 218, 62.5, 232],
    [62, 242, 70, 250, 84, 252.5],
    [92, 253.5, 97, 254, 100, 254],
  ],
)
export const ARM =
  'M60 120.5 C51.5 121 46.5 128.5 46 139.5 C45.5 156 45.5 176 45.5 194 C45 208 43 224 41.5 240 L50 241 C51.5 226 54 210 55.5 196 C57 180 59.5 162 62.5 147 C63.5 136 65 125 60 121 Z'
export const HAND =
  'M41.5 238.5 C39 244 38 252 39 259 C40 264.5 43.5 267 46.5 266 C49.5 265 51 260 51 254.5 C51 250.5 52.5 247.5 54 246 C54.5 244.5 52.5 243.5 50.5 244.5 L50 240.5 Z'
export const LEG =
  'M62.5 226 C60 250 61 276 65 300 C66.5 310 67.5 318 66.5 328 C65.5 342 68 356 71.5 369 L86 369 C86.5 358 89.5 344 90.5 332 C91 322 90 316 91 308 C93.5 290 97 272 99.5 254 C90 251 72 244 62.5 226 Z'
export const FOOT = 'M71.5 367 C69 372 64 375 63.5 379 C63 383 70 384.5 77 384 C84 383.5 88.5 383 88.5 379 C88.5 375 86.5 371 86 367 Z'

/** Líneas suaves sobre la piel: clavículas, ombligo y rodillas (de frente). */
export const FRONT_LINES = [
  ...both('M73 124 C80 126.5 88 126 95 121.5'),
  'M100 199 C99 200.5 99 202 100 203',
  ...both('M72 310 C75 313 81 313 85 310'),
]
/** De espalda: la columna, los omóplatos, la cintura y los pliegues de las corvas. */
export const BACK_LINES = [
  'M100 116 L100 238',
  ...both('M70.5 132 C77 128.5 86 129.5 90 133.5 C88.5 146 85 158 80.5 167 C76 158 72 146 70.5 132 Z'),
  ...both('M66 236 C74 245 88 249 99.5 246'),
  ...both('M71 314 C75 316.5 82 316.5 86 314'),
]

export const BRAIN =
  'M100 56.5 C91 56 84 62 83.5 71 C83 78 85 84 89 87.5 C92 90 96 89.5 98.5 87.5 L100 88.5 L101.5 87.5 C104 89.5 108 90 111 87.5 C115 84 117 78 116.5 71 C116 62 109 56 100 56.5 Z'
/** Circunvoluciones: unas cuantas, nada más para que se reconozca. */
export const GYRI = both('M87.5 64 C90.5 61.5 93 65 96.5 62.5 M85 71.5 C88.5 69 91 73 96 70.5 M86 78.5 C89.5 76 92 80 96.5 77.5 M90.5 84.5 C92.5 83 94.5 85 97 83.5')
export const CEREBELLUM = 'M89 86 C88 91.5 92 94.5 96.5 93.5 C98.5 93 99.5 91 99.5 89 L100.5 89 C100.5 91 101.5 93 103.5 93.5 C108 94.5 112 91.5 111 86 C107 89 103 89.5 100 88.5 C97 89.5 93 89 89 86 Z'
export const BRAINSTEM = 'M97.6 86 C98 92 98.4 96 98.6 101 L101.4 101 C101.6 96 102 92 102.4 86 Z'

export const TRACHEA = 'M97.6 101 L102.4 101 L102.4 134 C102.4 136 101.4 137 100 137 C98.6 137 97.6 136 97.6 134 Z'
export const TRACHEA_RINGS = Array.from({ length: 8 }, (_, i) => `M97.8 ${105 + i * 3.8} L102.2 ${105 + i * 3.8}`).join(' ')
export const BRONCHI = 'M100 135 C97 138 94 141 90 146 M100 135 C103 138 106 141 110 146'
/** Pulmón derecho de la persona (a la izquierda del dibujo): tres lóbulos. */
export const LUNG_R =
  'M93 127.5 C86 125.5 78 131 74 142 C70 153 68 168 68.5 182 C69 189 73 192.5 79 190.5 C85 188.5 91 184.5 95 181 C96.5 170 96.5 152 96 138 C95.8 132 95.3 129 93 127.5 Z'
/** Pulmón izquierdo: dos lóbulos y la muesca donde se acomoda el corazón. */
export const LUNG_L =
  'M107 127.5 C114 125.5 122 131 126 142 C130 153 132 168 131.5 182 C131 189 127 192.5 121 190.5 C117 189.5 113 187.5 110 185.5 C112 179 112.5 172 109.5 166 C106.5 161 104.8 156 104.4 150 C104 142 104.3 133 107 127.5 Z'
export const LUNG_LINES = [
  'M69.5 161 C77 159.5 87 159 95.5 160.5 M70.5 175.5 C78 175.5 87 179 93 183.5',
  'M131 165 C124 168 117 175 113.5 184',
]
export const BRONCHIOLES = [
  'M90 146 C86 150 82 154 79 160 M90 146 C89 156 87 166 84 176 M84 176 C81 180 78 183 75 186 M79 160 C76 164 74 168 73 174',
  'M110 146 C114 150 118 154 121 160 M121 160 C124 164 126 168 127 174 M121 160 C121 168 122 176 124 184',
]
export const HEART =
  'M97 152 C93 156 92.5 164 95 170 C98 177 106 182 116 184.5 C119.5 179 121 172 120 165 C119 157 114 151 107 150 C103 149.5 99.5 150 97 152 Z'
export const HEART_GROOVE = 'M100.5 154 C104 163 109 173 115.5 183.5'
export const AORTA = 'M104 153 C102 144 104 137.5 109.5 137.5 C114.5 137.5 116 142.5 114 149'
export const DIAPHRAGM = 'M68 191 C78 183 92 183 100 187 C108 183 122 183 132 191'
export const LIVER = 'M67.5 191 C76 186 92 186 103 190 C108 192 110 195 106 198 C98 204 87 208.5 77 209 C70 209 66.5 201 67.5 191 Z'
export const STOMACH =
  'M108 189 C114 184.5 124 184.5 129 190.5 C134 197 134 208 130 215.5 C126 222.5 117 226 108 224.5 C101 223.5 96 219.5 95 214.5 C100 215.5 107 214.5 112 210.5 C117 206.5 118 200.5 114 197.5 C110.5 195.5 108 194.5 108 189 Z'
export const STOMACH_FOLDS = 'M118 192 C124 195 128 201 128.5 207 M110 220 C117 220.5 123 217.5 127 213'
export const KIDNEY = 'M76.5 211 C70.5 211 67.5 218 68 225.5 C68.5 232.5 72 237.5 77 236.5 C81 236 82 232 80.5 228 C79.5 225 80 222 81.5 219.5 C83 216.5 81 211 76.5 211 Z'
export const ADRENAL = 'M70 210 C71.5 204.5 77.5 202.5 81.5 206.5 C79.5 209.5 75 211 70 210 Z'
/** Intestino grueso: sube por un lado, cruza y baja por el otro. */
export const COLON = 'M77 252 C73 246 72 236 74 229 C88 225 112 225 126 229 C128 236 127.5 246 124 251 C120 255 112 256.5 106 255'
/** Intestino delgado: un solo tubo que va y viene dentro del marco del grueso. */
export const SMALL_GUT =
  'M100 233.5 C92 233.5 85.5 233.5 85.5 237.3 C85.5 241 92 240.3 100 240.3 C108 240.3 115 239.8 115 243.5 C115 247.3 108 246.6 100 246.6 C92 246.6 85.5 246.6 85.5 250 C85.5 253.2 94 252.8 101 252'

// ---------- De espalda ----------

/** La columna: vértebras pequeñas, de la nuca a la cadera. */
export const VERTEBRAE = Array.from({ length: 21 }, (_, i) => {
  const y = 100 + i * 7.1
  const w = 3 + Math.min(i, 18) * 0.12
  return { y, w }
})
export const SHOULDER_BLADE = 'M71 131 C78 127.5 87 128.5 90.5 133 C89 146 85.5 158 81 167 C76.5 158 72.5 146 71 131 Z'

// ---------- De lado (mirando a la derecha del dibujo) ----------

export const S_HEAD =
  'M97 52 C109 51 118 58 119.5 68 C120 72 120.5 75 122.5 79 C123.5 81 122.5 82.5 120.5 83 C120.5 86 120.5 88 119 89.5 C119.5 92 118.5 95 116.5 96.5 C113 99 108 100 104 99.5 C102 99.4 101 101 101 104 L92 106 C89 100 84 96 81.5 90 C78.5 83 78 73 80.5 66 C83.5 57 89.5 52 97 52 Z'
export const S_EAR = 'M95.5 73 C92 73 91 81 93 85 C94 86.5 96.5 86 97 83.5 C98 80 98 74 95.5 73 Z'
export const S_NECK = 'M92 97 C93 104 92.5 110 91 116 L110 118 C107.5 112 106.5 106 106 99 Z'
export const S_TORSO =
  'M90 110 C86 116 81 124 80 136 C79 150 80 166 82 180 C83.5 190 86 198 85.5 208 C85 216 80 222 79 233 C78.5 244 81 252 88 258 L111 255 C115 249 119 242 121 230 C122.5 218 120 206 119.5 196 C119.5 186 123 176 124 164 C125 150 122 136 116 126 C113 120 111 116 109.5 112 Z'
export const S_ARM =
  'M98 117 C89.5 118 87 127 87.5 140 C88 158 88.5 176 89.5 192 C90.5 208 93 224 95 238 L105.5 238.5 C106 224 106 208 106 194 C106 178 108.5 160 110 142 C111 129 107 117 98 117 Z'
export const S_HAND =
  'M96 236 C94 244 94 254 96.5 261 C98.5 266 103 266.5 105 262 C107 257 107 249 106 243 C107.5 241.5 108.5 239.5 107.5 238 C106.5 237 105.5 237.5 105 238 Z'
export const S_LEG =
  'M80 240 C80 262 82 286 86 304 C88 314 86 326 85.5 338 C85 350 88 362 89.5 370 L101 370 C101 360 101.5 348 102.5 338 C103.5 328 105.5 318 106.5 308 C109 292 113 272 113 252 Z'
export const S_FOOT = 'M88.5 368 C87 374 86.5 380 88 383 C90 385 104 385 114 384.5 C118 384 119 381.5 116 379.5 C111 377 105 374 100.5 368 Z'
export const S_LINES = ['M110 200 C109.5 201.5 109.5 203 110.5 204', 'M101 306 C103 309 104 313 103.5 316']

export const S_BRAIN =
  'M99 56 C90 56 83.5 62 82.5 71 C82 77 84 82 88 85 C91 87 95 86.5 98 85.5 C101 88 106 89 110 87.5 C114 86 117 82 117.5 76 C118 66 110 56 99 56 Z'
export const S_GYRI =
  'M93 78.5 C99 75.5 105 77 111.5 75.5 M99 57 C97 63 98.5 69 96 74.5 M104 58.5 C103 64 105 69 103 74 M88 66 C91 68 94 66 96 69 M86 76 C88.5 78.5 91 77 93 79 M109 64 C112 66 114 65 116 68 M98 81 C102 83.5 106 82 110 83.5'
export const S_CEREBELLUM = 'M85.5 84.5 C84.5 90 88 93.5 92.5 93 C95.5 92.5 97 90 96.5 86.5 C93 87 89 86.5 85.5 84.5 Z'
export const S_BRAINSTEM = 'M95.5 85 C96 91 97 96 97.5 101 L100.5 101 C100 96 100 91 101 86 Z'
export const S_TRACHEA = 'M102 102 L106.5 102.5 L105.5 132 L101 131.5 Z'
export const S_LUNG =
  'M97 124 C89 125 84 135 83 151 C82 167 83.5 183 87 193 C94 196 105 191 115 185 C119 178 120.5 168 120 157 C119.5 145 116 134 109 128 C105.5 125 101 123.5 97 124 Z'
export const S_LUNG_LINES = ['M112 132 C106 150 97 170 90 190']
export const S_HEART =
  'M105 157 C102 162 103 171 108 177 C112 182 118 184 120.5 180 C122 175 121 167 118 161 C115 155 108 154 105 157 Z'
export const S_HEART_GROOVE =
  'M108 159 C110 166 113 173 118.5 180.5'
export const S_AORTA =
  'M108 158 C105 148 101 141 96 139 C92 138 90 143 90.5 152'
export const S_DIAPHRAGM =
  'M86 193 C95 182 110 180 120 186'
export const S_STOMACH =
  'M105 189 C112 186 119 190 120 198 C121 206 118 214 111 217 C106 219 101 217 100 213 C103 212 107 210 109 206 C110.5 202 109 198 106 197 C104 196 103 192 105 189 Z'
export const S_KIDNEY = 'M93 206 C89 207 88 214 88.5 221 C89 228 92 232 96 231 C99 230.5 99.5 227 98.5 223 C98 220 98.5 217 99.5 215 C100.5 211 97 205.5 93 206 Z'
export const S_ADRENAL = 'M89.5 207.5 C90.5 202.5 96 200.5 99.5 204 C97.5 207 94 208.5 89.5 207.5 Z'
export const S_GUT =
  'M101 228 C106 224 110 232 115 228 M100 236 C105 232 110 240 116 236 M101 244 C106 240 110 248 115 244'
export const S_COLON =
  'M99 223 C106 220 113 220 117.5 223 C119 233 118 243 114 251 C110 254 104 254 101 252'
export const S_SPINE =
  'M92 100 C89 118 85 146 86 172 C87 194 91 210 90 226 C89 238 86 246 87 252'

// ---------- Zonas, calor y lugares de los efectos, por vista ----------

type Box = { x: number; y: number; w: number; h: number; r: number } | { cx: number; cy: number; r: number }

const FRONT_BOXES: Record<Region, Box[]> = {
  cabeza: [{ cx: 100, cy: 76, r: 30 }],
  cuello: [{ x: 60, y: 101, w: 80, h: 22, r: 11 }],
  pecho: [{ x: 56, y: 124, w: 88, h: 66, r: 24 }],
  estomago: [{ x: 56, y: 191, w: 88, h: 63, r: 24 }],
  brazos: [
    { x: 28, y: 124, w: 30, h: 146, r: 15 },
    { x: 142, y: 124, w: 30, h: 146, r: 15 },
  ],
  piernas: [{ x: 60, y: 255, w: 80, h: 133, r: 26 }],
}
const SIDE_BOXES: Record<Region, Box[]> = {
  cabeza: [{ cx: 100, cy: 76, r: 29 }],
  cuello: [{ x: 82, y: 100, w: 36, h: 22, r: 11 }],
  pecho: [{ x: 76, y: 123, w: 52, h: 67, r: 22 }],
  estomago: [{ x: 76, y: 191, w: 50, h: 62, r: 22 }],
  brazos: [{ cx: 100, cy: 250, r: 17 }],
  piernas: [{ x: 76, y: 268, w: 46, h: 120, r: 22 }],
}
export const BOXES: Record<View, Record<Region, Box[]>> = { frente: FRONT_BOXES, espalda: FRONT_BOXES, lado: SIDE_BOXES }

/** Dónde se pinta el calor (o el frío) de cada zona: [cx, cy, rx, ry]. */
type Ell = [number, number, number, number]
const FRONT_HEAT: Record<Region, Ell[]> = {
  cabeza: [[100, 76, 42, 42]],
  cuello: [[100, 113, 48, 16]],
  pecho: [[100, 158, 48, 40]],
  estomago: [[100, 222, 44, 36]],
  brazos: [
    [48, 196, 20, 76],
    [152, 196, 20, 76],
  ],
  piernas: [
    [80, 312, 22, 74],
    [120, 312, 22, 74],
  ],
}
const SIDE_HEAT: Record<Region, Ell[]> = {
  cabeza: [[100, 76, 40, 40]],
  cuello: [[99, 110, 20, 14]],
  pecho: [[102, 158, 30, 40]],
  estomago: [[101, 222, 28, 34]],
  brazos: [[99, 200, 14, 70]],
  piernas: [[96, 312, 20, 74]],
}
export const HEAT: Record<View, Record<Region, Ell[]>> = { frente: FRONT_HEAT, espalda: FRONT_HEAT, lado: SIDE_HEAT }

/** La zona que queda debajo de un punto del dibujo (para las marcas y las notas). */
export function regionAt(view: View, x: number, y: number): Region | null {
  const boxes = BOXES[view]
  // Primero las zonas chicas, que en la vista de lado quedan encima.
  const order: Region[] = ['brazos', 'cabeza', 'cuello', 'pecho', 'estomago', 'piernas']
  for (const r of order) {
    for (const b of boxes[r]) {
      const inside = 'cx' in b ? Math.hypot(x - b.cx, y - b.cy) <= b.r : x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
      if (inside) return r
    }
  }
  return null
}

/** El centro de una zona en una vista: ahí se pegan las notas y las marcas hechas con teclado. */
export function regionCenter(view: View, region: Region): [number, number] {
  // Brazos y piernas son dos: la marca va en el primero.
  const [cx, cy] = HEAT[view][region][0]
  return [cx, cy]
}

/** Dónde caen los efectos que dependen del cuerpo (manos, hombros, estómago…) en cada vista. */
export type Anchors = {
  tingle: [number, number][]
  sweat: [number, number][]
  tense: [number, number][]
  heavy: number[]
  throat: [number, number]
  stone: [number, number]
  knot: [number, number]
  bubbles: [number, number][]
  nerves: string[]
  cortisolUp: string
  cortisolArm: string
  vagus: string[]
}

const FRONT_ANCHORS: Anchors = {
  tingle: [
    [39.5, 250], [41.5, 262], [48, 266], [53, 248],
    [160.5, 250], [158.5, 262], [152, 266], [147, 248],
    [93, 92], [100, 95], [107, 92],
  ],
  sweat: [
    [44, 272],
    [156, 272],
  ],
  tense: [
    [64, 114],
    [120, 114],
  ],
  heavy: [62, 138],
  throat: [100, 108],
  stone: [100, 160],
  knot: [117, 205],
  bubbles: [
    [111, 193],
    [118, 189],
    [124, 194],
  ],
  nerves: [
    'M100 96 L100 250',
    ...both('M100 122 C86 123 66 126 58 134 C51 152 48 190 45 244'),
    'M100 150 C104 156 106 160 106 164',
    ...both('M100 248 C90 254 84 264 82 284 L79 364'),
  ],
  cortisolUp: 'M75 207 C66 182 74 146 92 124 C98 114 100 108 100 100',
  cortisolArm: 'M125 207 C140 184 152 170 155 240',
  vagus: [
    'M98.5 98 C96.5 106 95.5 116 95.5 126 C95.5 138 96.5 148 98.5 158 C100.5 170 103.5 182 106.5 194 C108.5 202 109.5 208 110 214 C107 224 101 232 96 240',
    'M101.5 98 C103.5 106 104.5 116 104.5 126 C104.5 134 104 144 103.5 152 C103.5 164 106.5 178 110.5 190 C112.5 198 114.5 206 116 214',
    'M96 140 C91 142 86 146 81 152',
    'M104 140 C109 142 114 146 119 152',
    'M98.5 156 C102 160 105 163 108 165',
  ],
}

/** De espalda, lo que está de un lado queda del otro. */
const BACK_ANCHORS: Anchors = {
  ...FRONT_ANCHORS,
  // Sin cara no hay boca: el hormigueo queda en las manos.
  tingle: FRONT_ANCHORS.tingle.slice(0, 8),
  knot: [83, 205],
  bubbles: FRONT_ANCHORS.bubbles.map(([x, y]) => [200 - x, y]),
  nerves: [
    'M100 96 L100 250',
    ...both('M100 122 C86 123 66 126 58 134 C51 152 48 190 45 244'),
    'M100 150 C96 156 94 160 94 164',
    ...both('M100 248 C90 254 84 264 82 284 L79 364'),
  ],
  cortisolArm: mirror(FRONT_ANCHORS.cortisolArm),
  vagus: FRONT_ANCHORS.vagus.map(mirror),
}

const SIDE_ANCHORS: Anchors = {
  tingle: [
    [96, 256],
    [99, 265],
    [104, 264],
    [106.5, 252],
    [120.5, 89],
    [121, 93],
  ],
  sweat: [[101, 272]],
  tense: [[90, 112]],
  heavy: [99],
  throat: [106, 108],
  stone: [110, 158],
  knot: [111, 203],
  bubbles: [
    [106, 192],
    [112, 188],
    [116, 194],
  ],
  nerves: [
    S_SPINE,
    'M96 124 C94 150 93 190 100 250',
    'M88 150 C96 156 104 162 110 166',
    'M88 240 C87 270 92 300 95 364',
  ],
  cortisolUp: 'M94 205 C100 180 104 150 104 124 C104 112 100 104 99 100',
  cortisolArm: 'M94 205 C96 222 98 236 100 250',
  vagus: [
    'M99.5 98 C100.5 110 100.5 122 99 134 C98 146 99 156 103 166 C106 176 106 186 106 196 C106 204 106 210 107 218',
    'M99 140 C95 144 91 150 88 156',
    'M102.5 160 C106 162 109 164 112 167',
  ],
}

export const ANCHORS: Record<View, Anchors> = { frente: FRONT_ANCHORS, espalda: BACK_ANCHORS, lado: SIDE_ANCHORS }

/** Hasta dónde llega la ropa del muñequito: la playera y el pantalón (y del dibujo). */
export const SHIRT_Y: [number, number] = [104, 230]
export const SLEEVE_Y = 168
export const PANTS_Y: [number, number] = [224, 366]
