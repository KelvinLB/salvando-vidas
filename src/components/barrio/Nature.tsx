import type { Grid } from './iso'
import { tileXY } from './iso'

// Lo natural del barrio: árboles, maíz, magueyes, nopales, el agua, el muelle, el faro de allá
// lejos y los cerros del horizonte. Con los pies en 0,0 del cuadrito, como los demás dibujos.
// Los verdes y el agua salen de barrio.css para que se vean bien de día y en modo oscuro.

const LEAF = 'var(--b-leaf, light-dark(#6fa86a, #4f8558))'
const LEAF_2 = 'var(--b-leaf-2, light-dark(#4f8a55, #3d6b47))'
const LEAF_3 = 'var(--b-leaf-3, light-dark(#8cbf7a, #6f9f6c))'
const TRUNK = 'var(--b-wood-2)'

const shadow = (rx = 18) => <ellipse rx={rx} ry={rx / 2.6} fill="#000" opacity=".12" />

/** Un árbol de copa redonda. `v` mueve un poco la copa para que no se vean todos iguales. */
export function Arbol({ v = 0 }: { v?: number }) {
  const s = 0.9 + (v % 3) * 0.08
  const dx = (v % 2 ? 1 : -1) * 3
  return (
    <>
      {shadow(20)}
      <g transform={`scale(${s})`}>
        <path d="M-3 0 v-30 l-6 -8 M3 0 v-30 l7 -9" stroke={TRUNK} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx={-14 + dx} cy="-48" r="17" fill={LEAF_2} />
        <circle cx={14 + dx} cy="-50" r="16" fill={LEAF_2} />
        <circle cx={dx} cy="-62" r="21" fill={LEAF} />
        <circle cx={-8 + dx} cy="-68" r="9" fill={LEAF_3} opacity=".7" />
      </g>
    </>
  )
}

/** Un fresno alto, de copa más larga. En primavera florea morado, como jacaranda. */
export function Fresno({ v = 0, bloom }: { v?: number; bloom?: boolean }) {
  const s = 0.92 + (v % 2) * 0.1
  return (
    <>
      {shadow(16)}
      <g transform={`scale(${s})`}>
        <rect x="-3" y="-34" width="6" height="34" rx="2" fill={TRUNK} />
        <ellipse cy="-62" rx="18" ry="30" fill={bloom ? '#7d63b8' : LEAF_2} />
        <ellipse cx="-4" cy="-70" rx="13" ry="22" fill={bloom ? '#9b7fd1' : LEAF} />
        <ellipse cx="-7" cy="-78" rx="5" ry="9" fill={bloom ? '#c7b5ee' : LEAF_3} opacity=".7" />
      </g>
    </>
  )
}

export function Arbusto() {
  return (
    <>
      {shadow(15)}
      <circle cx="-8" cy="-9" r="9" fill={LEAF_2} />
      <circle cx="8" cy="-9" r="9" fill={LEAF_2} />
      <circle cy="-15" r="11" fill={LEAF} />
      <circle cx="-4" cy="-18" r="2.2" fill="#e46a8f" />
      <circle cx="6" cy="-12" r="2.2" fill="#f2c14e" />
    </>
  )
}

/** Una mata de maíz con su espiga y su mazorca. */
export function Maiz({ v = 0 }: { v?: number }) {
  const h = 38 + (v % 3) * 5
  return (
    <>
      {shadow(10)}
      {[-9, 0, 9].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i === 1 ? -2 : 0})`}>
          <path d={`M0 0 V${-h}`} stroke="var(--b-corn, light-dark(#7fa85a, #6f9350))" strokeWidth="2.6" />
          <path d={`M0 ${-h * 0.45} q-9 -2 -12 -10 M0 ${-h * 0.62} q9 -2 12 -10 M0 ${-h * 0.3} q8 -1 11 -8`} stroke="var(--b-corn, light-dark(#7fa85a, #6f9350))" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d={`M0 ${-h} l-3 -6 M0 ${-h} l3 -6 M0 ${-h} v-7`} stroke="var(--b-tassel, light-dark(#d9b84a, #c0a245))" strokeWidth="1.6" strokeLinecap="round" />
          {i === 1 && <ellipse cx="3" cy={-h * 0.5} rx="2.6" ry="5.5" fill="#e9c46a" transform={`rotate(18 3 ${-h * 0.5})`} />}
        </g>
      ))}
    </>
  )
}

export function Maguey() {
  const blades = [-62, -38, -14, 0, 14, 38, 62]
  return (
    <>
      {shadow(16)}
      {blades.map((a) => (
        <path
          key={a}
          d="M-3 0 Q-4 -18 0 -32 Q4 -18 3 0Z"
          fill={Math.abs(a) > 30 ? 'var(--b-maguey-2, light-dark(#5f8f78, #527a66))' : 'var(--b-maguey, light-dark(#7fa88f, #6a917c))'}
          transform={`rotate(${a})`}
        />
      ))}
    </>
  )
}

export function Nopal() {
  const pad = 'var(--b-nopal, light-dark(#6e9e58, #5d8a4a))'
  return (
    <>
      {shadow(12)}
      <ellipse cy="-12" rx="7" ry="12" fill={pad} />
      <ellipse cx="-9" cy="-27" rx="6" ry="9" fill={pad} transform="rotate(-25 -9 -27)" />
      <ellipse cx="8" cy="-29" rx="6" ry="10" fill={pad} transform="rotate(20 8 -29)" />
      <circle cx="-12" cy="-36" r="2.4" fill="#e46a8f" />
      <circle cx="11" cy="-39" r="2.4" fill="#f29d1f" />
      <g fill="#fdfcfa" opacity=".6">
        <circle cx="-2" cy="-14" r=".8" />
        <circle cx="2" cy="-8" r=".8" />
        <circle cx="7" cy="-28" r=".8" />
      </g>
    </>
  )
}

/** Tules junto al agua. */
export function Tule() {
  return (
    <g stroke="var(--b-corn, light-dark(#7fa85a, #6f9350))" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M-6 0 q-2 -12 -4 -22 M-2 0 q0 -14 1 -26 M3 0 q2 -10 6 -19 M7 0 q3 -6 8 -10" />
      <rect x="-12" y="-29" width="3.4" height="9" rx="1.7" fill="#8a5f3d" stroke="none" />
      <rect x="-1" y="-33" width="3.4" height="9" rx="1.7" fill="#8a5f3d" stroke="none" />
    </g>
  )
}

export function Roca() {
  return (
    <>
      <path d="M-16 0 q-2 -10 6 -14 q8 -6 16 0 q8 3 6 14z" fill="var(--b-rock, light-dark(#b7b1a6, #7d776d))" />
      <path d="M-6 -12 q6 -3 12 1" stroke="#fff" strokeWidth="2" fill="none" opacity=".35" />
    </>
  )
}

/** El faro, allá lejos, sobre su roca. Se ve chiquito y un poco borroso por la distancia. */
export function Faro() {
  return (
    <g opacity=".85">
      <path d="M-26 6 q-2 -14 10 -16 q16 -6 30 2 q10 4 8 14z" fill="var(--b-rock, light-dark(#b7b1a6, #7d776d))" />
      <g transform="scale(.8)">
        <path d="M-12 -4 L-8 -86 H8 L12 -4Z" fill="#fdfcfa" />
        <path d="M-11 -30 H11 L10.4 -44 H-10.4Z M-9.5 -64 H9.5 L9 -76 H-9Z" fill="#c0504a" />
        <rect x="-10" y="-100" width="20" height="14" rx="2" fill="#ffe39a" stroke="var(--b-iron)" strokeWidth="2" />
        <path d="M-12 -100 L0 -112 L12 -100Z" fill="#c0504a" />
        <path className="b-beam" d="M10 -93 L60 -104 L60 -82Z" fill="#ffe39a" opacity=".35" />
      </g>
    </g>
  )
}

/** La lanchita amarrada al muelle. */
export function Lancha() {
  return (
    <g className="b-float">
      <path d="M-24 -8 h48 l-8 10 h-32z" fill="#c0504a" />
      <path d="M-24 -8 h48" stroke="#fdfcfa" strokeWidth="2" />
      <path d="M-14 -8 v-3 h28 v3" stroke="var(--b-wood-2)" strokeWidth="3" fill="none" />
      <path d="M-30 -6 q-6 -8 -16 -6" stroke="#e9c79b" strokeWidth="1.5" fill="none" />
      <path d="M-20 4 q6 3 12 0 M6 4 q6 3 12 0" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".45" />
    </g>
  )
}

/** La fuente de la alameda: ocupa nueve cuadritos, como el kiosco. */
export function Fuente() {
  return (
    <>
      <path d="M-70 0 v10 a70 34 0 0 0 140 0 v-10" fill="var(--b-wall-2)" />
      <ellipse rx="70" ry="34" fill="var(--b-wall)" stroke="var(--b-tile-edge)" />
      <ellipse cy="2" rx="58" ry="27" fill="var(--b-water, light-dark(#9cc9e0, #22405a))" />
      <ellipse cx="-18" cy="-4" rx="14" ry="4" fill="#fff" opacity=".35" />
      <path d="M-8 2 v-38 h16 v38z" fill="var(--b-wall-2)" />
      <ellipse cy="-36" rx="22" ry="9" fill="var(--b-wall)" stroke="var(--b-tile-edge)" />
      <ellipse cy="-36" rx="16" ry="6" fill="var(--b-water, light-dark(#9cc9e0, #22405a))" />
      <g className="b-spout" stroke="var(--b-water, light-dark(#9cc9e0, #22405a))" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M0 -40 q-10 -24 -18 4 M0 -40 q10 -24 18 4 M0 -40 v-16" />
      </g>
    </>
  )
}

/** Las tablas del muelle, sobre el piso. */
export function Muelle({ grid, tiles }: { grid: Grid; tiles: [number, number][] }) {
  return (
    <g aria-hidden="true" className="b-decor">
      {tiles.map(([r, c]) => {
        const [x, y] = tileXY(grid, r, c)
        return (
          <g key={`${r}-${c}`} transform={`translate(${x} ${y})`}>
            <path d="M0 -14 L22 -3 L0 8 L-22 -3Z" fill="var(--b-wood)" />
            <path d="M-11 -8.5 L11 2.5 M-16 -5.8 L6 5.2 M-5 -11.2 L17 -0.2" stroke="var(--b-wood-2)" strokeWidth="1.2" />
            <path d="M-22 -3 v8 M22 -3 v8 M0 8 v8" stroke="var(--b-wood-2)" strokeWidth="3" />
          </g>
        )
      })}
    </g>
  )
}

/** Brillitos en el agua, quietos: solo se mecen si la persona no pidió menos movimiento. */
export function Brillos({ grid, tiles }: { grid: Grid; tiles: [number, number][] }) {
  return (
    <g aria-hidden="true" className="b-decor b-ripple" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".4">
      {tiles.map(([r, c]) => {
        const [x, y] = tileXY(grid, r, c)
        return <path key={`${r}-${c}`} d={`M${x - 10} ${y - 2} q5 -3 10 0 q5 3 10 0`} />
      })}
    </g>
  )
}

/** Los cerros del horizonte, detrás de la orilla de atrás. `grid` da dónde empieza el barrio. */
export function Cerros({ grid, width }: { grid: Grid; width: number }) {
  const { ox, oy, n } = grid
  // La orilla izquierda de atrás va de (ox, oy) a (0, oy + n * 16); la derecha, hasta la laguna.
  const left = `M0 ${oy + n * 16 - 40}
    C60 ${oy + n * 16 - 150} 150 ${oy + n * 8 - 30} 230 ${oy + n * 8 - 60}
    C300 ${oy + n * 8 - 150} 390 ${oy + 130} 480 ${oy + 120}
    C560 ${oy + 40} 640 ${oy - 10} 720 ${oy + 40}
    C800 ${oy - 40} 900 ${oy - 60} ${ox} ${oy - 30}
    L${ox} ${oy + 10} L0 ${oy + n * 16 + 10}Z`
  const right = `M${ox} ${oy - 30}
    C${ox + 90} ${oy - 70} ${ox + 200} ${oy - 20} ${ox + 260} ${oy + 30}
    C${ox + 330} ${oy - 20} ${ox + 420} ${oy + 30} ${ox + 470} ${oy + 90}
    C${ox + 560} ${oy + 100} ${ox + 640} ${oy + 150} ${ox + 700} ${oy + 230}
    L${ox + 700} ${oy + 360} L${ox} ${oy + 10}Z`
  const far = `M0 ${oy + 120} C120 ${oy - 60} 260 ${oy - 10} 360 ${oy - 40} C470 ${oy - 120} 600 ${oy - 90} 700 ${oy - 110}
    C820 ${oy - 150} 960 ${oy - 100} ${ox + 80} ${oy - 120} C${ox + 260} ${oy - 150} ${ox + 420} ${oy - 70} ${width} ${oy - 20}
    L${width} ${oy + n * 16 + 40} L0 ${oy + n * 16 + 40}Z`
  // Solo se ve arriba de las orillas de atrás: lo de abajo lo tapa el piso o queda fuera.
  const above = `M0 0 H${width} V${oy + n * 16} L${ox} ${oy} L0 ${oy + n * 16}Z`
  return (
    <g aria-hidden="true" className="b-decor">
      <clipPath id="b-cerros">
        <path d={above} />
      </clipPath>
      <g clipPath="url(#b-cerros)">
        <path d={far} fill="var(--b-cerro-far, light-dark(#d6e2d6, #233029))" />
        <path d={left} fill="var(--b-cerro, light-dark(#b8cdb2, #2c3a31))" />
        <path d={right} fill="var(--b-cerro, light-dark(#b8cdb2, #2c3a31))" />
        <path d={`M300 ${oy + 40} q40 -30 80 -10 M820 ${oy - 30} q30 -20 60 -4`} stroke="var(--b-cerro-far, light-dark(#d6e2d6, #233029))" strokeWidth="3" fill="none" opacity=".8" />
      </g>
    </g>
  )
}
