import { type ReactNode, useId } from 'react'
import { type Got, type MomentId, MOMENTS, plantStage } from '../lib/moments'
import type { Period } from '../lib/petfx'

// El rincón de la mascota: un cuartito dentro de la tarjeta que se va llenando con lo que
// la persona y su mascota viven juntas. Por la ventana se ve si es de día, de tarde o de
// noche. Nada se quita nunca; lo nuevo brilla un momento la primera vez que se ve.

const W = 360
const H = 240

/** Dónde brilla cada cosa nueva. */
const SPARK_AT: Partial<Record<MomentId, [number, number]>> = {
  respirar: [154, 26],
  cuerpo: [116, 124],
  plan: [344, 112],
  razon: [300, 40],
  carta: [292, 82],
  diario: [258, 74],
  personas: [342, 84],
  'mi-dia': [212, 24],
  platica: [292, 176],
  especialista: [110, 74],
  hueco: [300, 126],
  faro: [58, 62],
  faroles: [272, 122],
}

const STAR_COLORS = ['#f2c46d', '#f5b7c5', '#a9c8f0', '#b9dd8f', '#c7b5ee']

function star(x: number, y: number, r: number) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const d = i % 2 ? r * 0.45 : r
    return `${(x + d * Math.cos(a)).toFixed(1)},${(y + d * Math.sin(a)).toFixed(1)}`
  })
  return points.join(' ')
}

/** Un punto de la curva del hilo de las estrellitas (una curva cuadrática). */
function onString(t: number) {
  const [x0, y0, cx, cy, x1, y1] = [222, 12, 287, 44, 352, 12]
  const u = 1 - t
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="room-cloud">
      <circle cx="-6" cy="2" r="5.5" />
      <circle cx="1" cy="-2" r="7" />
      <circle cx="8" cy="2" r="5" />
      <rect x="-11" y="1" width="23" height="6.5" rx="3.2" />
    </g>
  )
}

function Plant({ stage }: { stage: number }) {
  // La maceta se queda; el tallo crece con cada momento vivido.
  const top = [198, 184, 168, 152, 138][stage]
  const leaves = [
    [-9, 196, -35],
    [9, 194, 35],
    [-10, 180, -40],
    [10, 176, 40],
    [-11, 164, -35],
    [11, 160, 35],
    [-9, 148, -30],
  ].slice(0, [2, 4, 6, 7, 7][stage])
  return (
    <g className="room-plant">
      <path d={`M50 204 C49 ${(204 + top) / 2} 51 ${(204 + top) / 2} 50 ${top}`} className="room-stem" />
      {leaves.map(([dx, y, a], i) => (
        <ellipse
          key={i}
          cx={50 + dx}
          cy={y}
          rx="8.5"
          ry="4.2"
          transform={`rotate(${a} ${50 + dx} ${y})`}
          className={i % 2 ? 'room-leaf' : 'room-leaf dark'}
        />
      ))}
      {stage === 3 && <ellipse cx="50" cy={top - 2} rx="4" ry="6" className="room-bud" />}
      {stage === 4 && (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={50 + 6 * Math.cos((a * Math.PI) / 180)}
              cy={top - 4 + 6 * Math.sin((a * Math.PI) / 180)}
              r="4.6"
              className="room-petal"
            />
          ))}
          <circle cx="50" cy={top - 4} r="3.4" className="room-flower-heart" />
        </g>
      )}
      <path d="M32 204 L68 204 L64 230 L36 230 Z" className="room-pot" />
      <rect x="30" y="200" width="40" height="7" rx="2.5" className="room-pot-rim" />
    </g>
  )
}

type Props = {
  name: string
  got: Got
  /** Cuántas razones tiene guardadas: una estrellita por cada una. */
  reasons: number
  period: Period
  fresh: MomentId[]
  /** Hay un regalo esperando: se ve una cajita junto a la mascota. */
  gift?: () => void
  /** La mascota, que se pone encima de su camita. */
  children: ReactNode
}

export default function PetRoom({ name, got, reasons, period, fresh, gift, children }: Props) {
  const id = useId()
  const has = (m: MomentId) => !!got[m]
  const lived = MOMENTS.filter((m) => got[m.id])
  const stars = has('razon') ? Math.min(9, Math.max(1, reasons)) : 0
  const lit = period !== 'dia' && has('plan')
  const when = period === 'dia' ? 'de día' : period === 'tarde' ? 'al atardecer' : 'de noche'
  const things = lived.map((m) => (m.id === 'razon' ? `${stars} ${stars === 1 ? 'estrellita' : 'estrellitas'} de papel` : m.item))

  // El faro chiquito (por llegar al faro) y el farol de papel (por la verbena) también se prenden
  // de tarde y de noche.
  const glowing = period !== 'dia'
  const faro = (
    <g>
      <path d="M37 94 L40 72 L48 72 L51 94 Z" className="room-faro" />
      <path d="M38.9 78 L49.1 78 L49.5 81.5 L38.5 81.5 Z M37.9 86 L50.1 86 L50.5 89.5 L37.5 89.5 Z" className="room-faro-stripe" />
      <rect x="39" y="66" width="10" height="6" rx="1" className={`room-faro-lamp${glowing ? ' on' : ''}`} />
      <path d="M38 66 Q44 59 50 66 Z" className="room-faro-dome" />
      <rect x="35" y="92" width="18" height="3" rx="1" className="room-faro-base" />
    </g>
  )
  const lantern = (
    <g>
      <circle cx="258" cy="114" r="2.4" className="room-hook" />
      <path d="M258 116 L258 121" className="room-thread" />
      <ellipse cx="258" cy="133" rx="10" ry="11" className={`room-farol${glowing ? ' on' : ''}`} />
      <path d="M249 128 Q258 131 267 128 M248.5 133 Q258 136 267.5 133 M249 138 Q258 141 267 138" className="room-farol-ribs" />
      <rect x="252" y="120" width="12" height="3" rx="1" className="room-farol-cap" />
      <rect x="252" y="143" width="12" height="3" rx="1" className="room-farol-cap" />
      <path d="M258 146 L258 154" className="room-farol-tassel" />
    </g>
  )

  // La lamparita (por el plan): de tarde y de noche se prende.
  const lamp = (
    <g>
      <ellipse cx="330" cy="229" rx="13" ry="3.5" className="room-lamp-base" />
      <path d="M330 228 L330 136" className="room-lamp-pole" />
      <path d="M318 118 L342 118 L348 138 L312 138 Z" className={`room-shade ${lit ? 'on' : ''}`} />
    </g>
  )

  return (
    <div className={`pet-room ${period}`} data-period={period}>
      <svg viewBox={`0 0 ${W} ${H}`} className="room-svg" role="img" aria-label={`El rincón de ${name}, ${when}. Tiene ${things.join(', ')}.`}>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="room-sky-top" />
            <stop offset="1" className="room-sky-bottom" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-window`}>
            <rect x="26" y="28" width="80" height="62" rx="4" />
          </clipPath>
        </defs>

        {/* Pared, piso y zoclo */}
        <rect width={W} height="170" className="room-wall" />
        <rect y="170" width={W} height="70" className="room-floor" />
        <path d="M0 196 L360 196 M0 220 L360 220" className="room-floor-line" />
        <rect y="166" width={W} height="6" className="room-trim" />

        {/* Ventana: el cielo dice qué hora es */}
        <rect x="20" y="22" width="92" height="74" rx="8" className="room-trim" />
        <g clipPath={`url(#${id}-window)`}>
          <rect x="26" y="28" width="80" height="62" fill={`url(#${id}-sky)`} />
          {period === 'dia' && (
            <>
              <circle cx="88" cy="44" r="9" className="room-sun" />
              <Cloud x={48} y={62} />
            </>
          )}
          {period === 'tarde' && <circle cx="62" cy="88" r="13" className="room-sun low" />}
          {period === 'noche' && (
            <>
              <circle cx="84" cy="46" r="9" className="room-moon" />
              <circle cx="88" cy="42" r="8" fill={`url(#${id}-sky)`} />
              {[
                [38, 40],
                [52, 70],
                [66, 38],
                [96, 74],
                [44, 82],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1.4" className="room-twinkle" style={{ animationDelay: `${i * 0.7}s` }} />
              ))}
            </>
          )}
        </g>
        <rect x="64" y="28" width="4" height="62" className="room-trim" />
        <rect x="26" y="57" width="80" height="4" className="room-trim" />
        <rect x="14" y="94" width="104" height="7" rx="3" className="room-trim" />

        {/* Una brújula para el camino (al especialista), en el pretil */}
        {has('especialista') && (
          <g>
            <circle cx="102" cy="87" r="7" className="room-compass" />
            <circle cx="102" cy="87" r="4.6" className="room-compass-face" />
            <path d="M102 83 L103.6 87 L102 91 L100.4 87 Z" className="room-needle" />
          </g>
        )}

        {/* Unas nubecitas que se mecen como la respiración */}
        {has('respirar') && (
          <g className="room-mobile">
            <path d="M134 0 L134 14 M116 14 L152 14 M120 14 L120 24 M134 14 L134 32 M148 14 L148 24" className="room-thread" />
            <Cloud x={120} y={28} s={0.7} />
            <Cloud x={134} y={36} s={0.8} />
            <Cloud x={148} y={28} s={0.7} />
          </g>
        )}

        {/* Un cuadro con un sol (el primer día cumplido) */}
        {has('mi-dia') && (
          <g>
            <rect x="162" y="16" width="48" height="40" rx="4" className="room-frame" />
            <rect x="167" y="21" width="38" height="30" rx="2" className="room-frame-paper" />
            <circle cx="186" cy="36" r="6" className="room-sun" />
            <path
              d="M186 25 L186 28 M186 44 L186 47 M175 36 L178 36 M194 36 L197 36 M178 28 L180 30 M192 42 L194 44 M178 44 L180 42 M192 30 L194 28"
              className="room-rays"
            />
          </g>
        )}

        {/* Estrellitas de papel: una por cada razón para seguir */}
        {stars > 0 && (
          <g className="room-garland">
            <path d="M222 12 Q287 44 352 12" className="room-thread" />
            {Array.from({ length: stars }, (_, i) => {
              const [x, y] = onString((i + 1) / (stars + 1))
              return (
                <g key={i}>
                  <path d={`M${x} ${y} L${x} ${y + 5}`} className="room-thread" />
                  <polygon points={star(x, y + 11, 6.5)} fill={STAR_COLORS[i % STAR_COLORS.length]} />
                </g>
              )
            })}
          </g>
        )}

        {/* La repisa, con lo que se va guardando en ella */}
        {(has('diario') || has('carta') || has('personas')) && (
          <g>
            <rect x="228" y="104" width="120" height="6" rx="2" className="room-trim" />
            <path d="M240 110 L240 118 L248 110 M336 110 L336 118 L328 110" className="room-bracket" />
          </g>
        )}
        {has('diario') && (
          <g>
            <rect x="238" y="78" width="16" height="26" rx="2" className="room-book" />
            <rect x="238" y="84" width="16" height="4" className="room-book-band" />
          </g>
        )}
        {has('carta') && (
          <g transform="rotate(-6 275 96)">
            <rect x="262" y="88" width="27" height="16" rx="2" className="room-envelope" />
            <path d="M262 89 L275.5 98 L289 89" className="room-envelope-flap" />
            <circle cx="275.5" cy="97" r="2.6" className="room-seal" />
          </g>
        )}
        {has('personas') && (
          <g>
            <path d="M304 92 C312 104 324 104 332 92" className="room-string" />
            <rect x="297" y="90" width="12" height="14" rx="2" className="room-can" />
            <rect x="327" y="90" width="12" height="14" rx="2" className="room-can" />
            <rect x="297" y="95" width="12" height="3" className="room-can-band" />
            <rect x="327" y="95" width="12" height="3" className="room-can-band" />
          </g>
        )}

        {/* La bufanda tejida, colgada de un gancho bajo la ventana */}
        {has('cuerpo') && (
          <g transform="translate(-28 0)">
            <circle cx="132" cy="110" r="2.4" className="room-hook" />
            <path d="M124 113 Q132 106 140 113 L141 154 L134 152 L132 118 L130 152 L123 154 Z" className="room-scarf" />
            <path d="M123.5 124 L130.5 124 M123.5 134 L130.5 134 M123.5 144 L130.5 144 M133.5 124 L140.5 124 M133.5 134 L140.5 134 M133.5 144 L140.5 144" className="room-scarf-stripes" />
            <path d="M124 154 L124 159 M127 153 L127 158 M130 153 L130 158 M134 153 L134 158 M137 153 L137 158 M140 154 L140 159" className="room-fringe" />
          </g>
        )}

        {/* La cuerda tejida de la primera vez que salieron del hueco, en un gancho bajo la repisa */}
        {has('hueco') && (
          <g>
            <circle cx="288" cy="118" r="2.4" className="room-hook" />
            <path d="M288 120 L288 124" className="room-rope" />
            <ellipse cx="288" cy="138" rx="10" ry="14" className="room-rope" />
            <ellipse cx="288" cy="139" rx="6.5" ry="10.5" className="room-rope" />
            <ellipse cx="288" cy="138" rx="10" ry="14" className="room-rope-twist" />
            <ellipse cx="288" cy="139" rx="6.5" ry="10.5" className="room-rope-twist" />
            <rect x="282" y="123" width="12" height="5" rx="2" className="room-rope-tie" />
            <path d="M285 151 Q283 157 284 162 M291 151 Q293 157 292 162" className="room-rope" />
          </g>
        )}

        {has('plan') && !lit && lamp}
        {has('faro') && !glowing && faro}
        {has('faroles') && !glowing && lantern}

        {/* Dos tazas para platicar, en una mesita */}
        {has('platica') && (
          <g>
            <path d="M258 206 L256 228 M282 206 L284 228" className="room-table-leg" />
            <ellipse cx="270" cy="204" rx="22" ry="5" className="room-table" />
            <path d="M260 190 L260 200 Q264 203 268 200 L268 190 Z" className="room-cup pink" />
            <path d="M268 192 Q272 194 268 197" className="room-cup-handle" />
            <path d="M274 190 L274 200 Q278 203 282 200 L282 190 Z" className="room-cup blue" />
            <path d="M282 192 Q286 194 282 197" className="room-cup-handle" />
            <path d="M264 186 Q262 182 265 178 M278 186 Q276 182 279 178" className="room-steam" />
          </g>
        )}

        <Plant stage={plantStage(lived.length)} />

        {/* Su camita */}
        <ellipse cx="180" cy="226" rx="86" ry="10" className="room-rug" />
        <ellipse cx="180" cy="221" rx="66" ry="12" className="room-bed" />
        <ellipse cx="180" cy="217" rx="56" ry="8" className="room-bed-top" />

        {/* Lo nuevo brilla la primera vez */}
        {fresh.map((m) => {
          const at = SPARK_AT[m]
          return at ? <polygon key={m} points={star(at[0], at[1], 6)} className="room-spark" /> : null
        })}

        {/* De noche, la luz baja; de tarde, se pone tibia. La lamparita prendida alumbra encima. */}
        {period !== 'dia' && <rect width={W} height={H} className="room-shade-light" />}
        {lit && (
          <>
            <circle cx="330" cy="140" r="62" fill={`url(#${id}-glow)`} className="room-glow" />
            {lamp}
          </>
        )}
        {glowing && has('faro') && (
          <>
            <circle cx="44" cy="69" r="16" fill={`url(#${id}-glow)`} className="room-glow" />
            {faro}
          </>
        )}
        {glowing && has('faroles') && (
          <>
            <circle cx="258" cy="133" r="30" fill={`url(#${id}-glow)`} className="room-glow" />
            {lantern}
          </>
        )}
      </svg>

      <div className="room-pet">{children}</div>

      {gift && (
        <button type="button" className="room-gift" onClick={gift} aria-label={`Abrir lo que te trajo ${name}`}>
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <rect x="6" y="16" width="28" height="20" rx="3" className="gift-box" />
            <rect x="4" y="11" width="32" height="8" rx="2.5" className="gift-lid" />
            <rect x="18" y="11" width="4" height="25" className="gift-ribbon" />
            <path d="M20 11 C14 2 8 8 14 11 Z M20 11 C26 2 32 8 26 11 Z" className="gift-ribbon" />
          </svg>
        </button>
      )}
    </div>
  )
}
