import { type CSSProperties, useId } from 'react'
import { Person, ScenePet, Tag } from './sceneBits'
import type { CompanionLook, CompanionMood } from '../data/companion'
import type { Place, Step } from '../data/hueco'

// Los faroles, para los días de soledad, en un lienzo de 320×420: una calle de pueblo de noche,
// con papel picado. Cada paso prende un farol (con lo que lo prendió escrito en su letrero), la
// oscuridad se abre alrededor de cada luz y con cada una llega alguien más, hasta que se arma la
// verbena. Los cuatro faroles están desde el principio: el camino ya está ahí.

const W = 320
const H = 420
const CURB = 338
const STREET = 346
const WALK = 406
/** Los faroles, a lo largo de la banqueta. */
const POSTS = [70, 136, 202, 268]
const LAMP_Y = 246
/** Dónde va la mascota: de la orilla oscura a cada farol prendido; en la verbena, en medio. */
const PATH = [40, 100, 166, 232, 282]
const PARTY = { x: 160, y: WALK }

type House = { x: number; w: number; top: number; door: number; tone: number }
const HOUSES: House[] = [
  { x: 0, w: 86, top: 176, door: 28, tone: 1 },
  { x: 86, w: 76, top: 198, door: 128, tone: 2 },
  { x: 162, w: 78, top: 168, door: 192, tone: 3 },
  { x: 240, w: 80, top: 188, door: 252, tone: 4 },
]
/** Las ventanas se prenden en este orden, una por cada farol (y todas en la verbena). */
const WINDOWS: [number, number][] = [
  [176, 194],
  [52, 206],
  [288, 212],
  [100, 222],
  [214, 194],
]

/** Un punto de una curva cuadrática, para colgar el papel picado de su hilo. */
function onCurve(t: number, [x0, y0, cx, cy, x1, y1]: number[]) {
  const u = 1 - t
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]
}
const STRINGS = [
  [-4, 90, 160, 122, 324, 78],
  [-4, 134, 160, 164, 324, 126],
]
const FLAGS = STRINGS.flatMap((curve, row) =>
  Array.from({ length: 11 - row }, (_, i) => {
    const [x, y] = onCurve((i + 0.5 + row * 0.5) / 11, curve)
    return { x, y, tone: (i + row * 3) % 6 }
  }),
)
const flag = (x: number, y: number) =>
  `M${x - 10} ${y} H${x + 10} V${y + 13} ${'l-2.5 4 l-2.5 -4 '.repeat(4)}Z`

type Props = {
  look: CompanionLook
  name: string
  place: Place
  built: Step[]
  /** Lo que se escribe en el letrero del farol de «acordarte de alguien». */
  remembered?: string
  out: boolean
  /** Con señales de riesgo, alguien ya viene con su farol. */
  rope: boolean
  breath: 'in' | 'out' | null
  face: CompanionMood
  /** El farol que se acaba de prender, para que su letrero aparezca con un brinquito. */
  fresh: number | null
}

const tagText = (step: Step, remembered?: string) =>
  step === 'respirar' ? 'respiraste' : step === 'nombrar' ? (remembered ?? 'te acordaste') : step === 'razon' ? 'tu razón' : 'compañía'

export default function FarolesScene({ look, name, place, built, remembered, out, rope, breath, face, fresh }: Props) {
  const id = useId()
  const n = built.length
  const at = out ? PARTY : { x: PATH[n], y: WALK }
  const helped = built.includes('mano') || rope
  const lit = out ? WINDOWS.length : n

  // La oscuridad baja con cada farol, pero sigue siendo de noche: la verbena es de noche.
  const w = place.weather
  const weather = {
    '--dark': out ? 0.2 : w.dark * (1 - n * 0.12),
    '--echo': out || n >= 3 ? 0 : w.echo * (n >= 1 ? 0.5 : 1),
    '--papel': out ? 1 : 0.3 + n * 0.12,
  }

  const seen = out
    ? `Se armó la verbena: los cuatro faroles están prendidos, y hay papel picado y gente alrededor de ${name}.`
    : n === 0
      ? `${name} está a solas en una calle de pueblo. ${place.seen}`
      : `${name} lleva ${n} de 4 faroles prendidos, y ya empieza a llegar gente.`

  return (
    <svg
      className={`hole-scene faroles-scene${breath ? ` breath-${breath}` : ''}${out ? ' out' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      data-sky={place.sky}
      style={Object.fromEntries(Object.entries(weather).map(([k, v]) => [k, v.toFixed(2)])) as CSSProperties}
      role="img"
      aria-label={seen}
    >
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" className="hole-glow-stop" stopOpacity="0.85" />
          <stop offset="1" className="hole-glow-stop" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-spot`}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.85" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* La noche se abre alrededor de la mascota y de cada farol prendido. */}
        <mask id={`${id}-veil`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="#fff" />
          <g className="hole-mover" style={{ transform: `translate(${at.x}px, ${at.y - 36}px)` }}>
            <circle r="70" fill={`url(#${id}-spot)`} />
          </g>
          {POSTS.map((x, i) => (
            <circle key={x} className={`farol-spot${i < n || out ? ' on' : ''}`} cx={x} cy={LAMP_Y + 30} r="78" fill={`url(#${id}-spot)`} />
          ))}
          <circle className={`farol-spot${helped && !out ? ' on' : ''}`} cx="292" cy="372" r="56" fill={`url(#${id}-spot)`} />
        </mask>
      </defs>

      {/* La noche, con su luna */}
      <rect className="hole-sky" width={W} height="230" />
      <g className="hole-night">
        <circle className="hole-moon" cx="262" cy="40" r="12" />
        {[
          [24, 22],
          [66, 50],
          [112, 18],
          [150, 56],
          [196, 28],
          [300, 70],
          [228, 62],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.3" />
        ))}
      </g>

      {/* Las casas de colores, con sus puertas */}
      {HOUSES.map((h) => (
        <g key={h.x} className={`farol-house t${h.tone}`}>
          <rect x={h.x} y={h.top} width={h.w} height={CURB - h.top} />
          <rect className="farol-cornice" x={h.x} y={h.top} width={h.w} height="7" />
          <path className="farol-door" d={`M${h.door} ${CURB} V${CURB - 22} a10 10 0 0 1 20 0 V${CURB} Z`} />
        </g>
      ))}

      {/* La banqueta y la calle empedrada */}
      <rect className="farol-sidewalk" y={CURB} width={W} height={STREET - CURB} />
      <rect className="farol-street" y={STREET} width={W} height={H - STREET} />
      <g className="farol-cobbles">
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 9 }, (_, i) => (
            <ellipse key={`${row}-${i}`} cx={14 + i * 36 + (row % 2) * 18} cy={STREET + 14 + row * 24} rx="11" ry="5" />
          )),
        )}
      </g>

      {/* El papel picado, que se llena de color con cada farol */}
      <g className="farol-papel">
        {STRINGS.map(([x0, y0, cx, cy, x1, y1]) => (
          <path key={y0} className="farol-string" d={`M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`} />
        ))}
        {FLAGS.map((f, i) => (
          <g key={i} className={`farol-flag p${f.tone}`}>
            <path d={flag(f.x, f.y)} />
            <path className="farol-cut" d={`M${f.x} ${f.y + 3} l3 3.5 l-3 3.5 l-3 -3.5 Z`} />
          </g>
        ))}
      </g>

      {/* Quienes van llegando con cada luz */}
      <g className="farol-people">
        <Person x={38} y={CURB + 2} small className={n >= 1 || out ? 'on' : ''} />
        <Person x={238} y={CURB + 2} className={n >= 2 || out ? 'on' : ''} />
        <Person x={112} y={CURB + 2} small warm className={n >= 3 || out ? 'on' : ''} />
        <Person x={304} y={CURB + 2} small className={out ? 'on' : ''} />
        <Person x={24} y={H - 6} className={out ? 'on' : ''} />
        <Person x={302} y={H - 6} warm className={out ? 'on' : ''} />
      </g>

      <rect className="hole-veil" width={W} height={H} mask={`url(#${id}-veil)`} />

      {/* Las ventanas van encima de la noche: una ventana prendida se ve aunque esté lejos */}
      {WINDOWS.map(([x, y], i) => (
        <rect key={x} className={`farol-window${i < lit ? ' on' : ''}`} x={x} y={y} width="18" height="22" rx="2" />
      ))}

      {/* Los faroles: cada paso prende uno, con su letrero */}
      {POSTS.map((x, i) => {
        const on = i < n || out
        return (
          <g key={x} className={`farol${on ? ' on' : ''}`}>
            <circle className="farol-glow" cx={x} cy={LAMP_Y} r="42" fill={`url(#${id}-glow)`} />
            <rect className="farol-post" x={x - 2} y={LAMP_Y + 14} width="4" height={CURB - LAMP_Y - 12} />
            <rect className="farol-post" x={x - 6} y={CURB - 4} width="12" height="6" rx="1.5" />
            <path className="farol-glass" d={`M${x - 8} ${LAMP_Y - 8} H${x + 8} L${x + 6} ${LAMP_Y + 10} H${x - 6} Z`} />
            <path className="farol-frame" d={`M${x} ${LAMP_Y - 8} V${LAMP_Y + 10} M${x - 10} ${LAMP_Y - 8} H${x + 10}`} />
            <path className="farol-cap" d={`M${x - 11} ${LAMP_Y - 8} L${x} ${LAMP_Y - 17} L${x + 11} ${LAMP_Y - 8} Z`} />
            <rect className="farol-post" x={x - 7} y={LAMP_Y + 10} width="14" height="4" rx="1" />
          </g>
        )
      })}
      {built.map((step, i) => (
        <Tag
          key={i}
          x={POSTS[i] - 30}
          y={i % 2 ? 288 : 266}
          w={60}
          max={124}
          anchor="center"
          bounds={[6, W - 6]}
          text={tagText(step, remembered)}
          fresh={fresh === i}
        />
      ))}

      {/* La verbena: foquitos, música y todos juntos */}
      <g className={`hole-outside${out ? ' on' : ''}`}>
        {Array.from({ length: 12 }, (_, i) => {
          const [x, y] = onCurve((i + 0.5) / 12, STRINGS[0])
          return <circle key={i} className="farol-bulb" cx={x} cy={y + 1} r="2.4" />
        })}
        {/* La música sale en la calle, lejos de los letreros */}
        {[
          [88, 382, '♪'],
          [252, 362, '♫'],
          [56, 352, '♪'],
        ].map(([x, y, note], i) => (
          <text key={i} className={`farol-note n${i}`} x={x} y={y}>
            {note}
          </text>
        ))}
        <path className="hole-heart" transform="translate(150 286)" d="M39 46 c-3 -4 -9 -2 -8 3 c1 4 8 8 8 8 s7 -4 8 -8 c1 -5 -5 -7 -8 -3 Z" />
      </g>

      {/* Quien viene con su farol a acompañar */}
      <g className={`hole-rope${helped ? ' on' : ''}`}>
        <g className="hole-mover" style={{ transform: `translate(${out ? 216 : 292}px, ${WALK}px)` }}>
          <circle className="farol-hand-glow" cx="-12" cy="-26" r="16" fill={`url(#${id}-glow)`} />
          <path className="farol-hand-line" d="M-6 -22 L-12 -20" />
          <rect className="farol-hand" x="-16" y="-22" width="8" height="10" rx="2" />
          <Person x={0} y={0} warm />
        </g>
      </g>

      <ScenePet at={at} look={look} mood={face} name={name} echo className={out ? 'farol-dance' : ''} />
    </svg>
  )
}
