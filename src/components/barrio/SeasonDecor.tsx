import type { Season } from '../../lib/barrioSeason'
import { type Grid, tileXY } from './iso'

// Los adornos de temporada en el barrio: ligeros y sin estorbar. Van en cuatro capas: el cielo
// (detrás de todo), el piso (sobre los cuadritos), los hilos de papel picado que cruzan las
// calles (como cosas del barrio, para acomodarse con lo demás) y la lluvia (encima de la
// pantalla, sin atrapar toques). Sin temporada, el papel picado es el de todos los días.

type Point = [number, number]

/** Un hilo que cuelga entre dos puntos, con `count` adornos repartidos. */
function hang(a: Point, b: Point, sag: number, count: number) {
  const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2]
  const at = (t: number): Point => {
    const u = 1 - t
    return [u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0], u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1]]
  }
  return {
    d: `M${a[0]} ${a[1]} Q${mid[0]} ${mid[1]} ${b[0]} ${b[1]}`,
    spots: Array.from({ length: count }, (_, i) => at((i + 1) / (count + 1))),
  }
}

type Flag = 'picado' | 'bandera' | 'farolito' | 'flor'

function Garland({ a, b, colors, kind, count = 9, sag = 14 }: { a: Point; b: Point; colors: string[]; kind: Flag; count?: number; sag?: number }) {
  const { d, spots } = hang(a, b, sag, count)
  return (
    <g>
      <path d={d} stroke="var(--b-iron)" strokeWidth="1" fill="none" opacity=".7" />
      {spots.map(([x, y], i) => {
        const fill = colors[i % colors.length]
        if (kind === 'bandera') return <path key={i} d={`M${x - 6} ${y} h12 l-6 13z`} fill={fill} />
        if (kind === 'farolito')
          return (
            <g key={i}>
              <path d={`M${x} ${y} v3`} stroke="var(--b-iron)" />
              <ellipse cx={x} cy={y + 10} rx="6" ry="7" fill={fill} />
              <path d={`M${x - 6} ${y + 10} h12`} stroke="#00000022" />
            </g>
          )
        if (kind === 'flor')
          return (
            <g key={i} fill={fill}>
              <circle cx={x - 3} cy={y + 4} r="3.4" />
              <circle cx={x + 3} cy={y + 4} r="3.4" />
              <circle cx={x} cy={y + 8} r="3.4" />
              <circle cx={x} cy={y + 5.2} r="1.6" fill="#f2c14e" />
            </g>
          )
        // Papel picado: rectángulo con la orilla de picos y un calado.
        return (
          <g key={i}>
            <path d={`M${x - 7} ${y} h14 v12 l-2.3 3 -2.3 -3 -2.4 3 -2.3 -3 -2.4 3 -2.3 -3z`} fill={fill} />
            <circle cx={x} cy={y + 6} r="2" fill="var(--b-sky)" />
          </g>
        )
      })}
    </g>
  )
}

const COLORS: Record<Season, { kind: Flag; colors: string[] }> = {
  posadas: { kind: 'farolito', colors: ['#e2574c', '#f2c14e', '#6fae7d', '#4c6fb5', '#e46a8f'] },
  candelaria: { kind: 'picado', colors: ['#fdfcfa', '#9fc7e0', '#f6d9d0'] },
  primavera: { kind: 'flor', colors: ['#9b7fd1', '#c7b5ee', '#e46aa8'] },
  patrias: { kind: 'bandera', colors: ['#2f8a57', '#fdfcfa', '#c0392b'] },
  muertos: { kind: 'picado', colors: ['#f29d1f', '#7a5aa6', '#e46a8f', '#f2c14e'] },
  lluvias: { kind: 'picado', colors: ['#9fc7e0', '#6fae7d', '#fdfcfa'] },
}

/** El papel picado de todos los días, cuando no hay temporada. */
const EVERYDAY = { kind: 'picado' as Flag, colors: ['#e46a8f', '#f2c14e', '#6fae7d', '#4c6fb5', '#f29d1f'] }

const POLE_H = 74

/**
 * Un hilo de adornos que cruza una calle, colgado de dos postes. Va como cosa del barrio (en su
 * cuadrito, sin estorbar el paso) para que se acomode delante o detrás de lo que tenga cerca.
 * `across` dice hacia dónde cruza: 'r' de arriba a la derecha hacia abajo a la izquierda.
 */
export function StreetGarland({ season, across, i = 0 }: { season: Season | null; across: 'r' | 'c'; i?: number }) {
  const { kind, colors } = season ? COLORS[season] : EVERYDAY
  const dx = across === 'r' ? 30 : -30
  const a: Point = [dx, -15 - POLE_H]
  const b: Point = [-dx, 15 - POLE_H]
  const turn = i % 2 ? [...colors].reverse() : colors
  return (
    <g className="b-decor">
      <path d={`M${dx} -15 V${-15 - POLE_H} M${-dx} 15 V${15 - POLE_H}`} stroke="var(--b-wood-2)" strokeWidth="2.4" />
      <Garland a={a} b={b} colors={turn} kind={kind} count={5} sag={7} />
      {season === 'posadas' && i === 0 && (
        <g transform={`translate(0 ${-POLE_H + 10})`}>
          <path d="M0 -12 V-2" stroke="var(--b-iron)" />
          <path d="M0 -2 L4 9 L16 8 L6 16 L10 28 L0 20 L-10 28 L-6 16 L-16 8 L-4 9Z" fill="#e46a8f" />
          <circle cy="13" r="6" fill="#f2c14e" />
        </g>
      )}
    </g>
  )
}

/** Lo que va en el cielo, detrás de todo: nubes en lluvias, papalotes en primavera. */
export function SeasonSky({ season, grid }: { season: Season; grid: Grid }) {
  const { ox, oy } = grid
  if (season === 'lluvias')
    return (
      <g className="b-decor b-cloud" aria-hidden="true">
        {[
          [ox - 640, oy - 40],
          [ox - 260, oy - 90],
          [ox + 180, oy - 70],
          [ox + 620, oy - 20],
        ].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <circle cx="-14" cy="2" r="12" />
            <circle cx="2" cy="-5" r="15" />
            <circle cx="18" cy="2" r="11" />
            <rect x="-26" y="2" width="56" height="12" rx="6" />
          </g>
        ))}
      </g>
    )
  if (season === 'primavera' || season === 'patrias') {
    const kites: [number, number, string][] =
      season === 'patrias'
        ? [
            [ox - 300, oy - 80, '#2f8a57'],
            [ox + 260, oy - 96, '#c0392b'],
          ]
        : [
            [ox - 420, oy - 60, '#9b7fd1'],
            [ox + 320, oy - 90, '#e46aa8'],
          ]
    return (
      <g className="b-decor" aria-hidden="true">
        {kites.map(([x, y, f]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path d="M0 -14 L10 0 L0 16 L-10 0Z" fill={f} />
            <path d="M0 16 q6 10 -2 18 q-6 8 2 16" stroke="var(--muted)" fill="none" />
          </g>
        ))}
      </g>
    )
  }
  return null
}

/** Pétalos y flores sobre el piso: una mano de cuadritos, cada uno con sus manchitas. */
function Petals({ grid, tiles, fill, accent }: { grid: Grid; tiles: Point[]; fill: string; accent?: string }) {
  return (
    <g className="b-decor" aria-hidden="true" fill={fill} opacity=".85">
      {tiles.map(([r, c]) => {
        const [x, y] = tileXY(grid, r, c)
        return (
          <g key={`${r}-${c}`}>
            <circle cx={x - 10} cy={y - 2} r="2.2" />
            <circle cx={x + 6} cy={y - 4} r="2" />
            <circle cx={x + 1} cy={y + 4} r="2.4" />
            {accent && <circle cx={x + 13} cy={y + 2} r="1.8" fill={accent} />}
            {accent && <circle cx={x - 4} cy={y - 7} r="1.6" fill={accent} />}
          </g>
        )
      })}
    </g>
  )
}

/** De un cuadrito a otro en línea recta (misma fila o misma columna). */
function line(a: Point, b: Point): Point[] {
  const out: Point[] = []
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
  for (let i = 0; i <= n; i++) out.push([a[0] + Math.sign(b[0] - a[0]) * i, a[1] + Math.sign(b[1] - a[1]) * i])
  return out
}

/** El caminito de cempasúchil: de la puerta de su casa, por Mi calle, hasta el kiosco. */
const MUERTOS_PATH: Point[] = [
  ...line([15, 4], [15, 5]),
  ...line([14, 5], [10, 5]),
  ...line([10, 6], [10, 10]),
  ...line([11, 10], [13, 10]),
  ...line([13, 11], [13, 13]),
  ...line([13, 14], [13, 15]),
  // Y otro que llega desde la orilla, por la calle de atrás.
  ...line([10, 21], [10, 15]),
  ...line([11, 14], [12, 14]),
]

/** Pétalos de cempasúchil hacia el kiosco, charquitos de lluvia o florecitas en el piso. */
export function SeasonGround({ season, grid }: { season: Season; grid: Grid }) {
  if (season === 'muertos') return <Petals grid={grid} tiles={MUERTOS_PATH} fill="#f29d1f" accent="#d9731b" />
  if (season === 'lluvias') {
    return (
      <g className="b-decor" aria-hidden="true">
        {[
          [10, 7],
          [10, 16],
          [10, 24],
          [14, 5],
          [22, 5],
          [20, 12],
          [20, 26],
          [16, 13],
          [17, 17],
          [7, 13],
          [16, 23],
          [25, 16],
          [21, 20],
        ].map(([r, c]) => {
          const [x, y] = tileXY(grid, r, c)
          return <ellipse key={`${r}-${c}`} cx={x} cy={y} rx="18" ry="6" className="b-puddle" />
        })}
      </g>
    )
  }
  if (season === 'primavera' || season === 'candelaria') {
    const tiles: Point[] = [
      [12, 14],
      [13, 17],
      [17, 14],
      [18, 16],
      [16, 18],
      [22, 13],
      [23, 18],
      [26, 12],
      [27, 16],
      [24, 23],
      [28, 24],
      [22, 21],
      [8, 13],
      [9, 16],
      [16, 7],
      [21, 8],
    ]
    return <Petals grid={grid} tiles={tiles} fill={season === 'primavera' ? '#9b7fd1' : '#fdfcfa'} />
  }
  return null
}

/** La lluvia, encima de todo pero dentro del lienzo. */
export function SeasonRain({ season, width, height }: { season: Season; width: number; height: number }) {
  if (season !== 'lluvias') return null
  const drops = Array.from({ length: 34 }, (_, i) => {
    const x = (i * 97) % width
    const y = (i * 53) % (height - 40)
    return `M${x} ${y} l-3 10`
  }).join(' ')
  return (
    <g className="b-rain" aria-hidden="true">
      <path d={drops} />
    </g>
  )
}
