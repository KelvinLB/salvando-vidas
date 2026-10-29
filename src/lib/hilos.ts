import { read, store, today, useStored } from './storage'

// Hilos sueltos: girar piezas hexagonales hasta que ningún hilo del rebozo quede suelto. Aquí
// vive lo que comparten el juego (src/pages/juegos/Hilos.tsx) y el barrio (la misión de Doña
// Chayo): la geometría de las piezas y el rebozo con los últimos tejidos, guardado solo aquí.

/** Hexágonos con un lado plano arriba, en coordenadas axiales. Cada lado tiene su número. */
export const DIRS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
] as const
/** El ángulo de cada lado, con la y hacia abajo como en SVG. */
export const SIDE_ANGLE = [30, -30, -90, 210, 150, 90].map((a) => (a * Math.PI) / 180)
export const opposite = (d: number) => (d + 3) % 6

/** Medio ancho de una pieza; lo demás se calcula a partir de aquí. */
export const HEX = 34
/** Del centro de la pieza al centro de un lado. */
export const APOTHEM = (HEX * Math.sqrt(3)) / 2

/** Girar k veces (60° a la derecha cada una) lleva el lado d al lado d+5k. */
export function rotMask(mask: number, k: number) {
  const t = ((k % 6) + 6) % 6
  let out = 0
  for (let d = 0; d < 6; d++) if ((mask >> d) & 1) out |= 1 << ((d + 5 * t) % 6)
  return out
}

export const hexXY = (q: number, r: number): [number, number] => [HEX * 1.5 * q, HEX * Math.sqrt(3) * (r + q / 2)]
export const ring = (q: number, r: number) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))

/** El lienzo que cabe un tablero de radio R, centrado en 0,0. */
export function boardBox(R: number) {
  const w = 2 * (1.5 * HEX * R + HEX) + 10
  const h = 2 * (Math.sqrt(3) * HEX * R + APOTHEM) + 10
  return { w, h, viewBox: `${-w / 2} ${-h / 2} ${w} ${h}` }
}

/** Los tres tamaños: la persona elige cuánto quiere hoy; nunca sube solo. */
export const SIZES = [
  { radius: 1, label: 'Chiquito', pieces: 7 },
  { radius: 2, label: 'Tranquilo', pieces: 19 },
  { radius: 3, label: 'Un poco más', pieces: 37 },
] as const
export type Radius = (typeof SIZES)[number]['radius']

/** Los colores del bordado, como variables de CSS (definidas en components/hilos/threads.css, de día y de noche). */
export const THREAD_COLORS = ['--h-c1', '--h-c2', '--h-c3', '--h-c4', '--h-c5', '--h-c6'] as const

/** Una pieza ya acomodada: dónde va, sus hilos y el color de su anillo (índice de THREAD_COLORS). */
export type PatchTile = [q: number, r: number, mask: number, color: number]
/** Un tejido terminado, tal cual quedó. No guarda cuánto tardó ni cuántas vueltas dio. */
export type Patch = { date: string; radius: Radius; tiles: PatchTile[] }

export const PATCHES_KEY = 'hilos-rebozo'
/** El rebozo guarda los últimos ocho; no se cuentan ni se comparan. */
export const MAX_PATCHES = 8

export const usePatches = () => useStored<Patch[]>(PATCHES_KEY, [])

export function addPatch(patch: Omit<Patch, 'date'>) {
  const list = read<Patch[]>(PATCHES_KEY, [])
  store(PATCHES_KEY, [{ ...patch, date: today() }, ...list].slice(0, MAX_PATCHES))
}

/** Si hoy ya quedó algún tejido (la misión de Doña Chayo lo da por hecho con esto). */
export const wovenToday = () => read<Patch[]>(PATCHES_KEY, []).some((p) => p.date === today())

/** El preferido para la noche: colores bajitos. Se recuerda en el teléfono. */
export const NIGHT_KEY = 'hilos-noche'
