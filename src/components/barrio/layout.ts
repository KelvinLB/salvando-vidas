// Dónde va cada cosa en el barrio (32×32) y en el cuarto (6×6). El barrio es un mundo abierto
// con siete rumbos unidos por calles empedradas: todo se alcanza desde la plaza, nada se
// desbloquea. Atrás (fila + columna chica) va lo alto: árboles, cerros, el maíz; adelante, el
// río, que es bajito y no tapa a nadie. Sin imports, igual que iso.ts, para revisarlo con node.

type Tile = [number, number]

export const WORLD = { n: 32, ox: 1024, oy: 160 }
/** El lienzo entero del barrio (la cámara enseña solo un pedazo). */
export const WORLD_W = 2048
export const WORLD_H = 1200
export const ROOM = { n: 6, ox: 300, oy: 124 }

/** Donde aparece la mascota: en la plaza, frente al kiosco. */
export const WORLD_START: Tile = [18, 15]
/** Frente a la puerta de su casa, en Mi calle. */
export const WORLD_FROM_HOUSE: Tile = [16, 4]
export const ROOM_START: Tile = [4, 1]

export type ZoneId = 'plaza' | 'mercado' | 'oficios' | 'alameda' | 'micalle' | 'orilla' | 'milpa'

/** Los rumbos del barrio. `door` es un cuadrito libre para llegar a cada uno. */
export const ZONES: { id: ZoneId; name: string; hint: string; r0: number; c0: number; r1: number; c1: number; door: Tile }[] = [
  { id: 'plaza', name: 'La plaza', hint: 'El corazón del barrio: el kiosco, el tablero y Nico contando palomas.', r0: 11, c0: 11, r1: 19, c1: 19, door: [18, 15] },
  { id: 'mercado', name: 'El mercado', hint: 'Toldos de colores, fruta fresca y las aguas de Doña Lupe.', r0: 11, c0: 21, r1: 19, c1: 29, door: [16, 21] },
  { id: 'oficios', name: 'La calle de los oficios', hint: 'Aquí las cosas se hacen con las manos, poco a poco.', r0: 1, c0: 11, r1: 9, c1: 19, door: [7, 15] },
  { id: 'alameda', name: 'La alameda', hint: 'Árboles, bancas y sombrita para andar despacio.', r0: 21, c0: 11, r1: 29, c1: 29, door: [22, 20] },
  { id: 'micalle', name: 'Mi calle', hint: 'Tu casa, tus vecinos y la casita de los juegos.', r0: 11, c0: 1, r1: 29, c1: 9, door: [16, 5] },
  { id: 'orilla', name: 'La orilla', hint: 'El agua, el muelle y, allá lejos, el faro.', r0: 0, c0: 21, r1: 9, c1: 31, door: [8, 24] },
  { id: 'milpa', name: 'La milpa', hint: 'El maíz crece sin prisa, como casi todo lo bueno.', r0: 1, c0: 1, r1: 9, c1: 9, door: [5, 5] },
]

export function zoneAt(r: number, c: number): ZoneId | null {
  return ZONES.find((z) => r >= z.r0 && r <= z.r1 && c >= z.c0 && c <= z.c1)?.id ?? null
}

// ---------- El piso ----------

export type Terrain = 'pasto' | 'camino' | 'plaza' | 'mercado' | 'agua' | 'arena' | 'milpa' | 'jardin'

/** La laguna de atrás: en cada fila, desde qué columna hay agua. El río corre por el frente. */
const LAGOON: Record<number, number> = { 0: 23, 1: 23, 2: 23, 3: 24, 4: 24, 5: 25, 6: 25, 7: 28 }
/** El muelle entra a la laguna; en la roca de allá lejos está el faro. */
export const DOCK: Tile[] = [
  [4, 26],
  [5, 26],
  [6, 26],
]
export const FARO_ROCK: Tile = [0, 28]

const same = (a: Tile, r: number, c: number) => a[0] === r && a[1] === c
export const isDock = (r: number, c: number) => DOCK.some((t) => same(t, r, c))

/** El agua no se pisa: es lo que se le pasa a la escena como `isBlocked`. */
export function isWater(r: number, c: number) {
  const n = WORLD.n
  if (r < 0 || c < 0 || r >= n || c >= n) return false
  if (isDock(r, c) || same(FARO_ROCK, r, c)) return false
  if (r >= 30 || c >= 30) return true
  const from = LAGOON[r]
  return from !== undefined && c >= from
}

const nearWater = (r: number, c: number) => {
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (isWater(r + dr, c + dc)) return true
  return false
}

/** Las filas de Mi calle donde hay casa (la de la persona es la de la fila 15). */
const HOUSE_ROWS = [12, 15, 18, 21, 24]

/** Las calles empedradas: dos que cruzan a lo largo, dos a lo ancho y las de cada rumbo. */
export function isStreet(r: number, c: number) {
  const inside = r >= 1 && c >= 1 && r <= 29 && c <= 29
  if (!inside) return false
  if (r === 10 || r === 20 || c === 10 || c === 20) return true
  if (c === 5 && r >= 11) return true // Mi calle
  if ((r === 6 || r === 7) && c >= 11 && c <= 19) return true // La calle de los oficios
  if (r >= 21 && (r === 25 || c === 15 || c === 25)) return true // Los caminitos de la alameda
  if (c === 4 && HOUSE_ROWS.includes(r)) return true // La banqueta frente a cada casa
  return false
}

export function terrainAt(r: number, c: number): Terrain {
  if (isWater(r, c)) return 'agua'
  if (isDock(r, c)) return 'camino'
  const fountain = Math.max(Math.abs(r - 25), Math.abs(c - 20)) <= 2
  if (fountain) return 'plaza'
  if (isStreet(r, c)) return 'camino'
  if (nearWater(r, c)) return 'arena'
  if (r >= 11 && r <= 19 && c >= 11 && c <= 19) {
    const corner = (r <= 12 || r >= 18) && (c <= 12 || c >= 18)
    return corner ? 'jardin' : 'plaza'
  }
  if (r >= 11 && r <= 19 && c >= 21 && c <= 28) return 'mercado'
  if (r >= 2 && r <= 8 && c >= 2 && c <= 8) return 'milpa'
  if (r <= 9 && c >= 21) return 'arena'
  if (r >= 21 && c >= 11) return 'jardin'
  if (r >= 11 && c >= 6 && c <= 9) return 'jardin'
  if (r >= 8 && r <= 9 && c >= 11 && c <= 19) return 'jardin'
  return 'pasto'
}

// ---------- Los lugares ----------

/** Los lugares del barrio que se pueden tocar. Los vecinos van junto a su lugar. */
export const WORLD_SPOTS = {
  // La plaza
  kiosco: { r: 15, c: 15, span: true },
  tablero: { r: 11, c: 15 },
  paloma: { r: 13, c: 18 },
  globo: { r: 17, c: 12 },
  globero: { r: 18, c: 13 },
  farolA: { r: 11, c: 11 },
  farolB: { r: 19, c: 19 },
  florA: { r: 19, c: 15 },
  // Mi calle
  casa: { r: 15, c: 3 },
  florB: { r: 16, c: 3 },
  gato: { r: 13, c: 4 },
  rumbos: { r: 11, c: 9 },
  juegos: { r: 26, c: 7 },
  perrito: { r: 22, c: 7 },
  // La calle de los oficios
  taller: { r: 5, c: 12 },
  tiendita: { r: 5, c: 14 },
  panaderia: { r: 5, c: 16 },
  papeleria: { r: 5, c: 18 },
  // El mercado
  mercado: { r: 14, c: 22 },
  puesto: { r: 14, c: 25 },
  // La alameda
  fuente: { r: 25, c: 20, span: true },
  buzon: { r: 23, c: 27 },
  // La orilla
  hueco: { r: 8, c: 22 },
  lancha: { r: 4, c: 27 },
  // La milpa
  maiz: { r: 4, c: 4 },
  // Los vecinos
  chema: { r: 13, c: 16 },
  nico: { r: 17, c: 18 },
  tere: { r: 6, c: 15 },
  ramiro: { r: 6, c: 13 },
  beto: { r: 13, c: 22 },
  lupe: { r: 13, c: 25 },
  rosa: { r: 23, c: 14 },
  memo: { r: 23, c: 26 },
} satisfies Record<string, { r: number; c: number; span?: boolean }>

export type PlazaSpot = keyof typeof WORLD_SPOTS

/** Lo que dice la mascota al tocar los lugares nuevos del barrio. */
export const WORLD_LINES: Partial<Record<PlazaSpot, string>> = {
  globero: 'Un señor vende globos de colores. Nomás de verlos dan ganas de sonreír.',
  perrito: 'Un perrito del barrio. Mueve la cola nomás de vernos pasar.',
  panaderia: 'Huele a pan recién hecho. Las conchas salen calientitas en la tarde.',
  papeleria: 'La papelería: cuadernos, colores y papel de china para lo que se ofrezca.',
  fuente: 'El agüita de la fuente suena bonito. Podemos escucharla un ratito.',
  lancha: 'Una lanchita amarrada al muelle. Desde aquí se ve el faro, allá lejos.',
  maiz: 'El maíz crece despacito. Nadie lo apura y aun así llega.',
}

// ---------- Lo que adorna (no se toca) ----------

export type DecorKind =
  | 'arbol'
  | 'fresno'
  | 'arbusto'
  | 'maiz'
  | 'maguey'
  | 'nopal'
  | 'casa'
  | 'toldo'
  | 'gente'
  | 'farol'
  | 'farolito'
  | 'flores'
  | 'paloma'
  | 'tule'
  | 'roca'
  | 'faro'
  | 'correo'
  | 'banca'

/** `v` elige la variante: el color de la casa, lo que vende el puesto, el tono de la gente. */
export type Decor = { kind: DecorKind; r: number; c: number; v?: number }

const decor: Decor[] = []
const add = (kind: DecorKind, tiles: Tile[], v = 0) => tiles.forEach(([r, c], i) => decor.push({ kind, r, c, v: v + i }))

// La orilla de atrás: una fila de árboles hasta la laguna.
for (let c = 0; c <= 22; c++) decor.push({ kind: c % 3 === 1 ? 'fresno' : 'arbol', r: 0, c, v: c })
for (let r = 1; r <= 29; r++) decor.push({ kind: r % 3 === 1 ? 'fresno' : 'arbol', r, c: 0, v: r })

// La milpa: surcos de maíz con su caminito al centro, magueyes y nopales en la orilla.
for (const r of [2, 4, 6, 8])
  for (const c of [2, 3, 4, 6, 7, 8]) if (!(r === WORLD_SPOTS.maiz.r && c === WORLD_SPOTS.maiz.c)) decor.push({ kind: 'maiz', r, c, v: r + c })
add('maguey', [
  [1, 1],
  [7, 1],
  [1, 9],
])
add('nopal', [
  [9, 2],
  [9, 8],
  [5, 9],
])
add('gente', [[9, 4]], 0)

// La calle de los oficios: árboles en los patios de atrás y una jardinera al frente.
add('arbol', [
  [2, 13],
  [3, 17],
  [2, 19],
])
add('flores', [
  [9, 12],
  [9, 18],
])
add('gente', [[2, 15]], 1)

// La orilla: tules junto al agua, farolitos a la entrada del muelle y el faro a lo lejos.
add('tule', [
  [3, 23],
  [5, 24],
  [7, 23],
])
add('farolito', [
  [7, 25],
  [7, 27],
])
add('roca', [
  [1, 22],
  [9, 27],
  [4, 23],
])
add('tule', [[2, 22]], 3)
add('banca', [[8, 25]])
add('arbol', [[3, 21]])
add('gente', [[8, 28]], 2)
decor.push({ kind: 'faro', r: FARO_ROCK[0], c: FARO_ROCK[1] })

// La plaza: faroles y jardineras en las esquinas, más palomas.
add('farol', [
  [11, 19],
  [19, 11],
])
add('flores', [
  [12, 12],
  [18, 18],
  [12, 19],
])
add('paloma', [
  [12, 17],
  [14, 18],
])

// El mercado: los puestos de adorno (flores, ollas de barro, tortillería, dulces) con su gente.
add('toldo', [
  [14, 28],
  [18, 22],
  [18, 25],
  [18, 28],
])
add('gente', [
  [13, 28],
  [17, 22],
  [17, 25],
  [17, 28],
], 3)

// Mi calle: las casas de los vecinos, árboles en los patios y arbustos al frente.
add('casa', [
  [12, 3],
  [18, 3],
  [21, 3],
  [24, 3],
])
add('arbol', [
  [14, 1],
  [20, 1],
  [26, 1],
  [28, 3],
])
add('arbusto', [
  [14, 8],
  [18, 8],
  [24, 8],
  [28, 8],
])
add('flores', [[20, 9]])
add('gente', [[27, 9]], 4)

// La alameda: árboles con sombrita, flores y la oficina de correos de Memo.
add('arbol', [
  [22, 12],
  [27, 13],
  [28, 17],
  [27, 26],
])
add('fresno', [
  [22, 18],
  [23, 22],
  [26, 28],
])
add('flores', [
  [24, 12],
  [27, 18],
  [22, 23],
  [28, 21],
])
decor.push({ kind: 'correo', r: 22, c: 27 })
add('banca', [
  [26, 17],
  [24, 26],
  [28, 20],
])
add('gente', [[28, 14]], 5)

export const DECOR: Decor[] = decor

/** El papel picado cuelga sobre las calles: no estorba el paso. `across` dice hacia dónde cruza. */
export const GARLANDS: { r: number; c: number; across: 'r' | 'c' }[] = [
  { r: 10, c: 17, across: 'r' },
  { r: 20, c: 13, across: 'r' },
  { r: 17, c: 10, across: 'c' },
  { r: 13, c: 20, across: 'c' },
  { r: 7, c: 17, across: 'r' },
]

// Los nombres de antes, para lo que todavía los use.
export const PLAZA = WORLD
export const PLAZA_SPOTS = WORLD_SPOTS
export const PLAZA_START = WORLD_START
export const PLAZA_FROM_HOUSE = WORLD_FROM_HOUSE
