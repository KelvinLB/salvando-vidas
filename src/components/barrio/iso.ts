// La cuadrícula isométrica del barrio: cada cuadrito mide 64×32 y se dibuja de atrás hacia
// adelante (fila + columna). La mascota camina en ocho direcciones; en diagonal puede pasar
// salvo que las dos orillas de al lado estén ocupadas, para que no atraviese esquinas.
// Sin imports a propósito: así se puede revisar con node que todo cuadrito libre se alcanza.

export type Tile = [number, number]
export type Grid = { n: number; ox: number; oy: number }

export const TILE_W = 64
export const TILE_H = 32

const DIRS: Tile[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

/** El centro del cuadrito en el lienzo: ahí van los pies. */
export const tileXY = (g: Grid, r: number, c: number): [number, number] => [
  g.ox + (c - r) * (TILE_W / 2),
  g.oy + (c + r) * (TILE_H / 2) + TILE_H / 2,
]

/** Los cuatro picos del rombo de un cuadrito. */
export function tilePoints(g: Grid, r: number, c: number) {
  const [x, y] = tileXY(g, r, c)
  const top = y - TILE_H / 2
  return `${x},${top} ${x + TILE_W / 2},${top + TILE_H / 2} ${x},${top + TILE_H} ${x - TILE_W / 2},${top + TILE_H / 2}`
}

export const tileKey = (n: number, r: number, c: number) => r * n + c

/** Algo que ocupa un cuadrito (o, con `span`, ese y los ocho de alrededor, como el kiosco). */
export type Spot = { r: number; c: number; span?: boolean; walkable?: boolean }

export function blockedBy(n: number, spots: Spot[]) {
  const blocked = new Set<number>()
  for (const s of spots) {
    if (s.walkable) continue
    const reach = s.span ? 1 : 0
    for (let dr = -reach; dr <= reach; dr++)
      for (let dc = -reach; dc <= reach; dc++) blocked.add(tileKey(n, s.r + dr, s.c + dc))
  }
  return blocked
}

export const isFree = (n: number, blocked: Set<number>, r: number, c: number) =>
  r >= 0 && c >= 0 && r < n && c < n && !blocked.has(tileKey(n, r, c))

/** El camino más corto desde `from` hasta el primer cuadrito que cumpla `goal`, o nada. */
export function findPath(n: number, blocked: Set<number>, from: Tile, goal: (r: number, c: number) => boolean): Tile[] | null {
  const start = tileKey(n, from[0], from[1])
  const prev = new Map<number, number>([[start, -1]])
  const queue: Tile[] = [from]
  while (queue.length) {
    const [r, c] = queue.shift()!
    if (goal(r, c)) {
      const path: Tile[] = []
      let k = tileKey(n, r, c)
      while (k !== -1) {
        path.unshift([Math.floor(k / n), k % n])
        k = prev.get(k)!
      }
      return path
    }
    for (const [dr, dc] of DIRS) {
      const nr = r + dr
      const nc = c + dc
      if (!isFree(n, blocked, nr, nc) || prev.has(tileKey(n, nr, nc))) continue
      if (dr && dc && !isFree(n, blocked, r + dr, c) && !isFree(n, blocked, r, c + dc)) continue
      prev.set(tileKey(n, nr, nc), tileKey(n, r, c))
      queue.push([nr, nc])
    }
  }
  return null
}

/** Para acercarse a algo: un cuadrito pegado (o a dos, si ocupa nueve). */
export const besides = (spot: Spot) => (r: number, c: number) =>
  Math.max(Math.abs(r - spot.r), Math.abs(c - spot.c)) === (spot.span ? 2 : 1)

/** Los cuadritos libres a los que no se llega desde `from` (debe salir vacío). */
export function unreachable(n: number, blocked: Set<number>, from: Tile): Tile[] {
  const lost: Tile[] = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (isFree(n, blocked, r, c) && !findPath(n, blocked, from, (rr, cc) => rr === r && cc === c)) lost.push([r, c])
  return lost
}
