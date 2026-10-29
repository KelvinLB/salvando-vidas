import { type CSSProperties, useId } from 'react'
import { Cloud, Person, ScenePet } from './sceneBits'
import type { CompanionLook, CompanionMood } from '../data/companion'
import type { Place, Sky, Step } from '../data/hueco'
import type { Sorted } from '../lib/hueco'

// La niebla y el faro, para los días de nervios, en un lienzo de 320×420: la mascota cruza en
// lancha hasta el muelle del faro. Respirar baja la niebla, los «¿y si…?» se acomodan en dos
// frascos (lo que sí depende de la persona y lo que no), su razón prende el faro y alguien le
// lanza una cuerda desde el muelle. Las boyas marcan el camino desde el principio, y cada tramo
// deja una prendida: lo avanzado se queda.

const W = 320
const H = 420
const SEA = 250
/** Por dónde va la lancha: de la orilla de acá (grande) al muelle (más lejos, más chica). */
const ROUTE = [
  { x: 76, y: 382, s: 1 },
  { x: 106, y: 352, s: 0.92 },
  { x: 132, y: 328, s: 0.85 },
  { x: 154, y: 308, s: 0.79 },
  { x: 170, y: 292, s: 0.74 },
]
/** Al llegar, la mascota se baja al muelle. */
const DOCK = { x: 210, y: 277, s: 0.72 }
/** Las boyas van a los lados del camino, de un lado y del otro, sin tocar la lancha en ningún tramo. */
const BUOYS: [number, number][] = [
  [142, 398],
  [28, 334],
  [190, 344],
  [92, 272],
]
const LAMP = { x: 268, y: 81 }
const JAR = { mine: 230, notMine: 284, floor: 400 }
/** Dónde flota cada «¿y si…?» y qué tan ancha es su nube. */
const WORRY_AT: [number, number, number][] = [
  [92, 172, 64],
  [176, 206, 112],
  [104, 238, 104],
]
const WORRY_TEXT = ['¿y si…?', '¿y si me sale mal?', '¿y si no puedo?']
const TOWER = 'M252 214 L257 98 L279 98 L284 214 Z'

const howMany = (n: number) => (n === 1 ? 'un «¿y si…?»' : `${n} «¿y si…?»`)

type Props = {
  look: CompanionLook
  name: string
  place: Place
  built: Step[]
  /** Los «¿y si…?» que ya acomodó, cada uno en su frasco. */
  sorted: Sorted[]
  out: boolean
  /** Con señales de riesgo, la cuerda del muelle ya está aquí. */
  rope: boolean
  breath: 'in' | 'out' | null
  face: CompanionMood
  /** El tramo que se acaba de avanzar, para que su boya se prenda con un brinquito. */
  fresh: number | null
}

function Jar({ x, label, notes, kind }: { x: number; label: string; notes: number; kind: 'mine' | 'not-mine' }) {
  const top = JAR.floor - 44
  return (
    <g className={`faro-jar ${kind}`}>
      <rect className="faro-jar-glass" x={x - 15} y={top} width="30" height="44" rx="7" />
      {Array.from({ length: Math.min(3, notes) }, (_, i) => (
        <rect
          key={i}
          className="faro-note"
          x={x - 8}
          y={JAR.floor - 10 - i * 7}
          width="16"
          height="5.5"
          rx="1.5"
          transform={`rotate(${i % 2 ? 7 : -6} ${x} ${JAR.floor - 7 - i * 7})`}
        />
      ))}
      <rect className="faro-jar-lid" x={x - 13} y={top - 6} width="26" height="7" rx="2.5" />
      <rect className="faro-jar-label" x={x - 11} y={top + 4} width="22" height="14" rx="2" />
      <text className="faro-jar-text" x={x} y={top + 15}>
        {label}
      </text>
    </g>
  )
}

export default function FaroScene({ look, name, place, built, sorted, out, rope, breath, face, fresh }: Props) {
  const id = useId()
  const n = built.length
  const boat = ROUTE[Math.min(n, 4)]
  const at = out ? DOCK : boat

  // Respirar baja la niebla y el viento; cada tramo la aligera más. Su razón prende el faro.
  const w = place.weather
  const ease = out ? 0 : 1 - n * 0.22
  const breathed = built.includes('respirar')
  const lit = out || built.includes('razon')
  const helped = built.includes('mano') || rope
  const weather = {
    '--fog': w.fog * ease * (breathed ? 0.4 : 1),
    '--wind': w.wind * ease * (breathed ? 0.3 : 1),
    '--thoughts': out ? 0 : w.thoughts * (breathed ? 0.75 : 1),
    '--dark': w.dark * ease,
  }
  const sky: Sky = out ? 'dia' : n >= 3 ? 'alba' : place.sky

  const kept = sorted.length
    ? ` En los frascos ya hay ${howMany(sorted.length)}: ${sorted.filter((s) => s.mine).length} en el de lo que sí depende de ti.`
    : ''
  const seen = out
    ? `${name} llegó al faro, y en el muelle hay alguien esperando.${kept}`
    : n === 0
      ? `${name} va en una lancha, en medio de la niebla. ${place.seen}${kept}`
      : `${name} lleva ${n} de 4 tramos hacia el faro.${kept}`

  // La cuerda va de las manos de quien ayuda a la punta de la lancha.
  const bow = { x: boat.x + 40 * boat.s, y: boat.y - 14 * boat.s }
  const ropePath = `M230 264 Q${Math.round((230 + bow.x) / 2)} ${Math.round(Math.max(264, bow.y) + 16)} ${Math.round(bow.x)} ${Math.round(bow.y)}`

  return (
    <svg
      className={`hole-scene faro-scene${breath ? ` breath-${breath}` : ''}${out ? ' out' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      data-sky={sky}
      style={Object.fromEntries(Object.entries(weather).map(([k, v]) => [k, v.toFixed(2)])) as CSSProperties}
      role="img"
      aria-label={seen}
    >
      <defs>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="faro-sea-top" />
          <stop offset="1" className="faro-sea-bottom" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" className="hole-glow-stop" stopOpacity="0.55" />
          <stop offset="1" className="hole-glow-stop" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" className="hole-glow-stop" stopOpacity="0.9" />
          <stop offset="1" className="hole-glow-stop" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-tower`}>
          <path d={TOWER} />
        </clipPath>
        <filter id={`${id}-fog`} x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* El cielo, que se aclara cuando ya casi llegan */}
      <rect className="hole-sky" width={W} height={SEA + 2} />
      <circle className="hole-sun" cx="64" cy="62" r="13" />
      <Cloud x={52} y={104} s={0.9} />
      <Cloud x={176} y={48} s={0.8} />

      {/* La luz del faro barre la niebla */}
      <g className={`faro-beam${lit ? ' on' : ''}`}>
        <path d={`M${LAMP.x} ${LAMP.y} L14 26 L14 142 Z`} fill={`url(#${id}-beam)`} />
      </g>

      {/* La isla y el faro */}
      <path className="faro-rock" d="M176 298 Q180 262 206 246 Q228 222 256 214 Q290 206 320 216 V302 Q296 292 272 298 Q240 304 212 298 Z" />
      <path className="faro-rock-2" d="M232 264 Q254 244 288 244 Q308 246 320 252 V300 Q300 290 280 294 Q256 298 238 288 Z" />
      <path className="faro-tower" d={TOWER} />
      <g clipPath={`url(#${id}-tower)`}>
        <rect className="faro-stripe" x="244" y="124" width="48" height="16" />
        <rect className="faro-stripe" x="244" y="164" width="48" height="16" />
      </g>
      <rect className="faro-door" x="263" y="196" width="10" height="18" rx="5" />
      <rect className="faro-gallery" x="250" y="92" width="36" height="6" rx="1.5" />
      <rect className="faro-room" x="258" y="70" width="20" height="22" rx="2" />
      <circle className={`faro-glow${lit ? ' on' : ''}`} cx={LAMP.x} cy={LAMP.y} r="30" fill={`url(#${id}-glow)`} />
      <circle className={`faro-lamp${lit ? ' on' : ''}`} cx={LAMP.x} cy={LAMP.y} r="6" />
      <path className="faro-mullions" d="M264 70 V92 M272 70 V92" />
      <path className="faro-dome" d="M255 71 Q268 54 281 71 Z" />

      {/* El mar, con sus olas */}
      <rect y={SEA} width={W} height={H - SEA} fill={`url(#${id}-sea)`} />
      <g className="faro-waves">
        {[272, 302, 336, 372, 408].map((y, i) => (
          <path key={y} className={`w${i % 3}`} d={`M-40 ${y} ${'q10 -4 20 0 t20 0 '.repeat(10)}`} />
        ))}
      </g>

      {/* El muelle, al pie del faro */}
      <g className="faro-dock">
        <rect className="faro-post" x="194" y="279" width="4" height="20" />
        <rect className="faro-post" x="214" y="279" width="4" height="20" />
        <rect className="faro-post" x="234" y="279" width="4" height="18" />
        <rect className="faro-plank" x="184" y="275" width="64" height="6" rx="1.5" />
      </g>

      {/* Los dos frascos, en una piedra de la orilla de acá */}
      <path className="faro-rock" d="M194 420 Q202 402 226 400 Q262 396 298 400 Q318 404 320 420 Z" />
      <Jar x={JAR.mine} label="sí" notes={sorted.filter((s) => s.mine).length} kind="mine" />
      <Jar x={JAR.notMine} label="no" notes={sorted.filter((s) => !s.mine).length} kind="not-mine" />

      {/* La niebla y el viento, que bajan al respirar */}
      <g className="hole-fog" filter={`url(#${id}-fog)`}>
        <ellipse cx="150" cy="330" rx="150" ry="34" />
        <ellipse cx="190" cy="286" rx="140" ry="30" />
        <ellipse cx="130" cy="246" rx="150" ry="32" />
        <ellipse cx="200" cy="206" rx="140" ry="30" />
        <ellipse cx="140" cy="166" rx="140" ry="28" />
        <ellipse cx="240" cy="126" rx="110" ry="28" />
      </g>
      <g className="hole-wind">
        <path d="M30 196 q30 -12 60 0 t60 0" />
        <path d="M120 150 q34 -10 64 0 t56 0" />
        <path d="M60 262 q30 -10 58 0 t60 0" />
      </g>
      <rect className="hole-veil" width={W} height={H} />

      {/* Las boyas: el camino ya está marcado, y cada tramo prende una */}
      {BUOYS.map(([x, y], i) => (
        <g key={i} className={`faro-buoy${i < n ? ' on' : ''}${fresh === i ? ' new' : ''}`} transform={`translate(${x} ${y})`}>
          <circle className="faro-buoy-glow" cy="-15" r="13" fill={`url(#${id}-glow)`} />
          <path className="faro-buoy-pole" d="M0 -5 V-12" />
          <circle className="faro-buoy-light" cy="-14" r="2.8" />
          <path className="faro-buoy-body" d="M-7 0 Q-7 -7 0 -7 Q7 -7 7 0 Z" />
          <path className="faro-buoy-band" d="M-6.6 -2.6 H6.6" />
        </g>
      ))}

      {/* Los «¿y si…?»: al acomodarlos, cada uno se va a su frasco */}
      <g className="hole-thoughts">
        {WORRY_TEXT.map((t, i) => {
          const [x, y, width] = WORRY_AT[i]
          const done = sorted[i]
          const to = done ? (done.mine ? JAR.mine : JAR.notMine) : x
          return (
            <g
              key={t}
              className={`faro-worry${done ? ' gone' : ''}`}
              style={{ transform: done ? `translate(${to}px, ${JAR.floor - 28}px) scale(0.15)` : `translate(${x}px, ${y}px)` }}
            >
              <g className={`hole-drift d${i}`}>
                <rect x={-width / 2} y="-12" width={width} height="23" rx="11.5" />
                <text y="3.5">{t}</text>
              </g>
            </g>
          )
        })}
      </g>

      {/* Quien ayuda le lanza una cuerda desde el muelle */}
      <g className={`hole-rope${helped && !out ? ' on' : ''}`}>
        <path className="hole-rope-line" d={ropePath} />
        <Person x={238} y={275} warm />
      </g>

      {/* Al llegar: quien ayudó, quien cuida el faro y un corazón */}
      <g className={`hole-outside${out ? ' on' : ''}`}>
        <Person x={238} y={275} warm />
        <Person x={290} y={214} small />
        <path className="hole-heart" transform="translate(186 196)" d="M39 46 c-3 -4 -9 -2 -8 3 c1 4 8 8 8 8 s7 -4 8 -8 c1 -5 -5 -7 -8 -3 Z" />
      </g>

      {/* La mascota en su lancha; al llegar se baja al muelle y la lancha se queda amarrada */}
      <ScenePet at={at} scale={at.s} look={look} mood={face} name={name} className={out ? '' : 'faro-bob'} />
      <g className="hole-mover" style={{ transform: `translate(${boat.x}px, ${boat.y}px) scale(${boat.s})` }}>
        <g className={out ? '' : 'faro-bob'}>
          <path className="faro-boat" d="M-46 -18 Q0 -13 46 -18 Q41 6 0 8 Q-41 6 -46 -18 Z" />
          <path className="faro-boat-stripe" d="M-43 -10 Q0 -5 43 -10" />
        </g>
      </g>
    </svg>
  )
}

