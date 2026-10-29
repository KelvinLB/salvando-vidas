import { type CSSProperties, useId } from 'react'
import { Cloud, Person, ScenePet, Tag, seeded } from './sceneBits'
import type { CompanionLook, CompanionMood } from '../data/companion'
import { type Place, type Sky, type Step, THOUGHTS } from '../data/hueco'

// El hueco, en un lienzo de 320×420: arriba el pasto y el cielo, abajo el fondo. Los escalones
// se pegan a una pared y a la otra, y la mascota sube de uno en uno. El clima (lluvia, niebla,
// viento, pensamientos, oscuridad) se aligera con cada escalón; lo hondo nunca cambia.

const W = 320
const H = 420
const MOUTH = 84
const FLOOR = 396
const LEDGES = [
  { x: 94, y: 332, w: 66 },
  { x: 160, y: 268, w: 66 },
  { x: 94, y: 204, w: 66 },
  { x: 160, y: 140, w: 66 },
]
const BOTTOM = { x: 160, y: FLOOR + 2 }
const OUT = { x: 284, y: 82 }
/** Un brote en la pared junto a cada escalón; los de la derecha van al revés. */
const SPROUTS: [number, number, boolean][] = [
  [94, 370, false],
  [226, 306, true],
  [94, 242, false],
  [226, 178, true],
]
/** Dónde flota cada pensamiento y qué tan ancha es su nube. */
const THOUGHT_AT: [number, number, number][] = [
  [134, 300, 68],
  [186, 252, 92],
  [150, 204, 116],
]

// La lluvia: rayitas en dos capas que caen desfasadas. Siempre las mismas, para que no brinquen.
const random = seeded(11)
const RAIN = [0, 1].map(() =>
  Array.from({ length: 30 }, () => `M${(8 + random() * 304).toFixed(1)} ${(random() * 410).toFixed(1)} l-3 10`).join(' '),
)

type Props = {
  look: CompanionLook
  name: string
  place: Place
  built: Step[]
  named?: string
  out: boolean
  /** Con señales de riesgo, la cuerda baja sola. */
  rope: boolean
  breath: 'in' | 'out' | null
  face: CompanionMood
  /** El escalón que se acaba de hacer, para que aparezca con un brinquito. */
  fresh: number | null
}

const slabText = (step: Step, named?: string) =>
  step === 'respirar' ? 'respiraste' : step === 'nombrar' ? (named ?? 'lo nombraste').toLowerCase() : step === 'razon' ? 'tu razón' : 'una mano'

export default function HoleScene({ look, name, place, built, named, out, rope, breath, face, fresh }: Props) {
  const id = useId()
  const n = built.length
  const at = out ? OUT : n === 0 ? BOTTOM : { x: LEDGES[n - 1].x + LEDGES[n - 1].w / 2, y: LEDGES[n - 1].y }

  // Cada escalón aligera el clima. Respirar baja la niebla y el viento; ponerle nombre calla
  // los pensamientos; la razón y la mano dejan entrar más luz.
  const w = place.weather
  const ease = out ? 0 : 1 - n * 0.22
  const breathed = built.includes('respirar')
  const helped = built.includes('mano') || rope
  const weather = {
    '--rain': w.rain * ease,
    '--fog': w.fog * ease * (breathed ? 0.45 : 1),
    '--wind': w.wind * ease * (breathed ? 0.3 : 1),
    '--thoughts': out || built.includes('nombrar') ? 0 : w.thoughts * (breathed ? 0.6 : 1),
    '--dark': w.dark * ease,
    '--light': out ? 1 : Math.min(1, 0.22 + n * 0.16 + (built.includes('razon') ? 0.08 : 0) + (helped ? 0.08 : 0)),
  }
  const sky: Sky = out ? 'dia' : n >= 3 ? 'alba' : place.sky

  const seen = out
    ? `${name} salió del hueco, y afuera hay alguien esperando.`
    : n === 0
      ? `${name} está en el fondo del hueco. ${place.seen}`
      : `${name} va en el escalón ${n} de 4.`

  // La cuerda cuelga de quien ayuda, arriba a la izquierda, hasta arriba de la mascota. Al
  // salir se desvanece donde estaba, sin estirarse hasta afuera.
  const ropeAt = out ? { x: LEDGES[3].x + LEDGES[3].w / 2, y: LEDGES[3].y } : at
  const ropePath = `M98 ${MOUTH + 2} C104 ${Math.round((MOUTH + ropeAt.y) / 2)} ${ropeAt.x - 22} ${ropeAt.y - 96} ${ropeAt.x - 4} ${ropeAt.y - 60}`

  return (
    <svg
      className={`hole-scene${breath ? ` breath-${breath}` : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      data-sky={sky}
      style={Object.fromEntries(Object.entries(weather).map(([k, v]) => [k, v.toFixed(2)])) as CSSProperties}
      role="img"
      aria-label={seen}
    >
      <defs>
        <linearGradient id={`${id}-shaft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hole-shaft-top" />
          <stop offset="1" className="hole-shaft-bottom" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="0.5" cy="0" r="1">
          <stop offset="0" className="hole-glow-stop" stopOpacity="0.85" />
          <stop offset="1" className="hole-glow-stop" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-star`}>
          <stop offset="0" className="hole-glow-stop" stopOpacity="0.9" />
          <stop offset="1" className="hole-glow-stop" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-spot`}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.9" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* La oscuridad deja ver alrededor de la mascota, como una lucecita que la sigue. */}
        <mask id={`${id}-veil`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="#fff" />
          <g className="hole-mover" style={{ transform: `translate(${at.x}px, ${at.y - 36}px)` }}>
            <circle r="80" fill={`url(#${id}-spot)`} />
          </g>
        </mask>
        <clipPath id={`${id}-hole`}>
          <path d={`M0 0 H${W} V${MOUTH} H228 V${FLOOR} H92 V${MOUTH} H0 Z`} />
        </clipPath>
        <filter id={`${id}-fog`} x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* El cielo, que se aclara cuando ya casi salen */}
      <rect className="hole-sky" width={W} height={MOUTH + 2} />
      <circle className="hole-sun" cx="160" cy="34" r="13" />
      <Cloud x={74} y={38} />
      <Cloud x={214} y={30} s={0.8} />
      <g className="hole-night">
        <circle className="hole-moon" cx="262" cy="34" r="11" />
        {[
          [30, 20],
          [70, 48],
          [120, 16],
          [168, 44],
          [204, 22],
          [300, 62],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.3" />
        ))}
      </g>

      {/* La tierra, el pasto y el hueco */}
      <rect className="hole-soil" x="0" y={MOUTH} width="92" height={H - MOUTH} />
      <rect className="hole-soil" x="228" y={MOUTH} width="92" height={H - MOUTH} />
      <path
        className="hole-soil-lines"
        d="M0 140 Q30 134 60 142 T92 138 M0 220 Q40 214 92 222 M0 300 Q30 306 60 298 T92 302 M0 380 Q46 372 92 384 M228 170 Q260 162 292 172 T320 168 M228 260 Q274 254 320 262 M228 340 Q258 346 290 338 T320 342"
      />
      <g className="hole-pebbles">
        <ellipse cx="30" cy="182" rx="6" ry="4" />
        <ellipse cx="62" cy="262" rx="5" ry="3.5" />
        <ellipse cx="22" cy="352" rx="7" ry="4.5" />
        <ellipse cx="270" cy="212" rx="6" ry="4" />
        <ellipse cx="300" cy="300" rx="5" ry="3.5" />
        <ellipse cx="256" cy="382" rx="7" ry="4.5" />
      </g>
      <rect className="hole-grass" x="0" y={MOUTH - 6} width="92" height="9" rx="3" />
      <rect className="hole-grass" x="228" y={MOUTH - 6} width="92" height="9" rx="3" />
      <path className="hole-tufts" d="M10 79 l3 -7 l3 7 M40 79 l2 -6 l3 6 M70 79 l3 -8 l2 8 M240 79 l3 -7 l3 7 M276 79 l2 -6 l3 6 M306 79 l3 -8 l2 8" />
      <rect x="92" y={MOUTH} width="136" height={H - MOUTH} fill={`url(#${id}-shaft)`} />
      <path className="hole-wall-edge" d={`M92 ${MOUTH} V${FLOOR} M228 ${MOUTH} V${FLOOR}`} />
      <rect className="hole-floor" x="92" y={FLOOR} width="136" height={H - FLOOR} />
      <g className="hole-floor-pebbles">
        <ellipse cx="112" cy={FLOOR + 9} rx="6" ry="3" />
        <ellipse cx="206" cy={FLOOR + 11} rx="7" ry="3" />
      </g>

      {/* Un brote en la pared por cada escalón */}
      {SPROUTS.map(([x, y, flip], i) => (
        <g key={i} className={`hole-sprout${i < n ? ' on' : ''}`} transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
          <path className="hole-stem" d="M0 0 q8 -2 12 -11" />
          <ellipse className="hole-leaf" cx="8" cy="-8" rx="5" ry="2.6" transform="rotate(-30 8 -8)" />
          <circle className="hole-bud" cx="12" cy="-12" r="2.2" />
        </g>
      ))}

      {/* El clima de hoy, solo dentro del hueco */}
      <g clipPath={`url(#${id}-hole)`}>
        <g className="hole-rain">
          <path className="hole-rain-a" d={RAIN[0]} />
          <path className="hole-rain-b" d={RAIN[1]} />
        </g>
        <g className="hole-fog" filter={`url(#${id}-fog)`}>
          <ellipse cx="150" cy="380" rx="110" ry="34" />
          <ellipse cx="176" cy="330" rx="120" ry="32" />
          <ellipse cx="144" cy="280" rx="110" ry="30" />
          <ellipse cx="174" cy="230" rx="116" ry="30" />
          <ellipse cx="150" cy="180" rx="110" ry="28" />
          <ellipse cx="166" cy="130" rx="104" ry="26" />
        </g>
        <g className="hole-wind">
          <path d="M96 300 q30 -12 60 0 t60 0" />
          <path d="M100 356 q34 -10 64 0 t56 0" />
          <path d="M96 222 q30 -10 58 0 t60 0" />
        </g>
      </g>

      <rect className="hole-veil" width={W} height={H} mask={`url(#${id}-veil)`} />
      <rect className="hole-light" x="92" y={MOUTH} width="136" height={FLOOR - MOUTH} fill={`url(#${id}-light)`} />

      {/* Su razón, prendida como estrella en la pared */}
      <g className={`hole-star${built.includes('razon') ? ' on' : ''}`}>
        <circle cx="196" cy="182" r="18" fill={`url(#${id}-star)`} />
        <polygon
          className="hole-star-shape"
          points="196,172 198.6,178.4 205.5,178.9 200.2,183.3 201.9,190.1 196,186.4 190.1,190.1 191.8,183.3 186.5,178.9 193.4,178.4"
        />
      </g>

      {built.map((step, i) => (
        <Tag key={i} {...LEDGES[i]} anchor={LEDGES[i].x < W / 2 ? 'left' : 'right'} text={slabText(step, named)} fresh={fresh === i} />
      ))}

      {/* Quien ayuda baja una cuerda */}
      <g className={`hole-rope${helped && !out ? ' on' : ''}`}>
        <path className="hole-rope-line" d={ropePath} />
        <Person x={80} y={MOUTH} warm />
      </g>

      {/* Afuera: quien ayudó, alguien más y unas flores */}
      <g className={`hole-outside${out ? ' on' : ''}`}>
        <Person x={46} y={MOUTH} small />
        <Person x={244} y={MOUTH} warm />
        <path className="hole-heart" transform="translate(214 -12)" d="M39 46 c-3 -4 -9 -2 -8 3 c1 4 8 8 8 8 s7 -4 8 -8 c1 -5 -5 -7 -8 -3 Z" />
        {[
          [14, 75],
          [76, 76],
          [232, 76],
          [314, 75],
        ].map(([x, y]) => (
          <g key={x} className="hole-flower">
            <circle cx={x} cy={y} r="3" />
            <circle className="hole-flower-mid" cx={x} cy={y} r="1.4" />
          </g>
        ))}
      </g>

      <g className="hole-thoughts">
        {THOUGHTS.map((t, i) => {
          const [x, y, width] = THOUGHT_AT[i]
          return (
            <g key={t} transform={`translate(${x} ${y})`}>
              <g className={`hole-drift d${i}`}>
                <rect x={-width / 2} y="-12" width={width} height="23" rx="11.5" />
                <text y="3.5">{t}</text>
              </g>
            </g>
          )
        })}
      </g>

      {/* La mascota, que sube con su respiración */}
      <ScenePet at={at} look={look} mood={face} name={name} />
    </svg>
  )
}
