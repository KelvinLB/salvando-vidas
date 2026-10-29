import type { CSSProperties } from 'react'
import { APOTHEM, type Patch, SIDE_ANGLE, THREAD_COLORS, boardBox, hexXY } from '../../lib/hilos'
import './threads.css'

// Los hilos de una pieza, dibujados desde su centro. Dos lados se unen con una curva; uno solo
// termina en una cuenta; tres o más se amarran con un nudo al centro.

export function Threads({ mask, width = 7 }: { mask: number; width?: number }) {
  const sides = [0, 1, 2, 3, 4, 5].filter((d) => (mask >> d) & 1)
  const mid = (d: number) => [Math.cos(SIDE_ANGLE[d]) * APOTHEM, Math.sin(SIDE_ANGLE[d]) * APOTHEM].map((n) => n.toFixed(1))
  if (sides.length === 2) {
    const [a, b] = sides.map(mid)
    return <path className="h-th" strokeWidth={width} d={`M${a[0]} ${a[1]} Q0 0 ${b[0]} ${b[1]}`} />
  }
  return (
    <>
      {sides.map((d) => {
        const [x, y] = mid(d)
        return <path key={d} className="h-th" strokeWidth={width} d={`M${x} ${y} L0 0`} />
      })}
      {sides.length > 0 && <circle className="h-knot" r={sides.length === 1 ? 6.5 : 5} />}
    </>
  )
}

/** Un tejido terminado, en chiquito: para el rebozo y para el puesto de Doña Chayo. */
export function PatchArt({ patch, className }: { patch: Patch; className?: string }) {
  return (
    <svg className={className} viewBox={boardBox(patch.radius).viewBox} aria-hidden="true">
      {patch.tiles.map(([q, r, mask, color]) => {
        const [x, y] = hexXY(q, r)
        return (
          <g
            key={`${q},${r}`}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
            style={{ '--h-tc': `var(${THREAD_COLORS[color % THREAD_COLORS.length]})` } as CSSProperties}
            className="h-colored"
          >
            <Threads mask={mask} width={5} />
          </g>
        )
      })}
    </svg>
  )
}
