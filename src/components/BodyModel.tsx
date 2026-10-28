import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { animate, createScope, stagger } from 'animejs'
import type { Heat } from '../data/bodyCheck'
import { REGION_LABELS, type Fx, type Region, type Tone } from '../data/bodyStories'
import { FX } from '../lib/bodyfx'

// Un cuerpo visto «por dentro»: cerebro, pulmones, corazón, estómago y las glándulas
// del estrés. Cada efecto es una capa que se enciende con la clase `on`; anime.js
// solo pone el movimiento, así que sin animaciones (o con movimiento reducido) se
// sigue entendiendo qué pasa.
//
// Del estilo de las figuras de «anatomy» (github.com/wheresryan22/anatomy) toma: tonos
// en vez de contornos (la piel con luz desde arriba a la izquierda y una sombra al
// piso), una sola zona encendida a la vez, nada de texto dentro del dibujo, un recorrido
// suave cuando nadie lo toca y quedarse quieto fuera de la pantalla.

// La silueta: hombros que caen, brazos que se adelgazan hacia la muñeca, cintura, rodillas
// y pies. Brazos, manos y piernas se dibujan del lado izquierdo y se reflejan.
const TORSO =
  'M91 98 C91 108 89 113 84 116 C77 120 67 121 61 124 C53 128 51 138 54 150 C56 162 60 178 62 194 ' +
  'C63 206 64 214 64 224 C64 236 60 246 61 256 C62 264 76 268 100 268 C124 268 138 264 139 256 ' +
  'C140 246 136 236 136 224 C136 214 137 206 138 194 C140 178 144 162 146 150 C149 138 147 128 139 124 ' +
  'C133 121 123 120 116 116 C111 113 109 108 109 98 Z'
const ARM = 'M62 124 C52 125 46 134 45 148 C44 164 43 180 41 196 C40 206 38 214 37 223 L47 224 C48 214 50 205 52 196 C54 184 57 172 60 160 C61 152 63 146 64 140 Z'
const HAND = 'M37 221 C33 227 33 238 36 243 C39 248 45 248 47 244 C50 238 50 228 47 222 Z'
const LEG = 'M61 250 C59 272 63 298 68 320 C70 332 69 346 71 358 C72 364 73 368 74 372 L87 372 C87 362 89 348 90 336 C91 328 92 322 93 316 C95 298 98 280 99 262 Z'
const FOOT = 'M74 370 C70 374 64 376 63 380 C62 384 69 385 77 384 C85 383 89 382 89 378 C89 374 88 372 87 370 Z'
const COLLARBONE = 'M74 127 C82 129 91 128 97 125'

/** Refleja un trazo de la mitad izquierda a la derecha (x → 200 − x). */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`)
const both = (d: string) => [d, mirror(d)]

const HEART = 'M106 180 C96 172 92 166 96 161 C99 157 104 158 106 162 C108 158 113 157 116 161 C120 166 116 172 106 180 Z'
const SPARK = 'M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z'
const DROP = 'M0 -5 C2 -2 3.5 0 3.5 1.5 A3.5 3.5 0 0 1 -3.5 1.5 C-3.5 0 -2 -2 0 -5 Z'

// Rayos alrededor de la cabeza (centro 100,78) para la manía.
const RAYS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2
  const p = (r: number) => `${(100 + Math.cos(a) * r).toFixed(1)} ${(78 + Math.sin(a) * r).toFixed(1)}`
  return `M${p(33)} L${p(39)}`
})
const IDEAS = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2
  return { cx: 100 + Math.cos(a) * 44, cy: 78 + Math.sin(a) * 44 }
})

const REGIONS: { id: Region; shapes: ReactNode }[] = [
  { id: 'cabeza', shapes: <circle className="b-hl" cx="100" cy="76" r="32" /> },
  { id: 'cuello', shapes: <rect className="b-hl" x="60" y="104" width="80" height="22" rx="11" /> },
  { id: 'pecho', shapes: <rect className="b-hl" x="56" y="128" width="88" height="62" rx="24" /> },
  { id: 'estomago', shapes: <rect className="b-hl" x="56" y="192" width="88" height="62" rx="26" /> },
  {
    id: 'brazos',
    shapes: (
      <>
        <rect className="b-hl" x="26" y="124" width="32" height="124" rx="16" />
        <rect className="b-hl" x="142" y="124" width="32" height="124" rx="16" />
      </>
    ),
  },
  { id: 'piernas', shapes: <rect className="b-hl" x="64" y="256" width="72" height="132" rx="26" /> },
]

// Dónde se pinta el calor (o el frío) de cada zona.
const HEAT_SHAPES: Record<Region, [number, number, number, number][]> = {
  cabeza: [[100, 76, 44, 44]],
  cuello: [[100, 114, 50, 18]],
  pecho: [[100, 158, 50, 42]],
  estomago: [[100, 220, 46, 38]],
  brazos: [
    [44, 180, 22, 66],
    [156, 180, 22, 66],
  ],
  piernas: [
    [84, 312, 22, 72],
    [116, 312, 22, 72],
  ],
}

type Props = {
  fx: Fx[]
  tone: Tone | null
  focus?: Region
  /** Zonas marcadas: cálidas si aceleran el cuerpo, frías si lo apagan. */
  heat?: Heat
  /** De 0 a 1: cuánto se ha calmado el cuerpo mientras se respira. */
  calm?: number
  /** Ilumina una zona tras otra para invitar a tocar. */
  tour?: boolean
  /** Sin animaciones: solo se encienden y apagan las capas. */
  still?: boolean
  onRegion?: (region: Region) => void
  /** Se calmó después de respirar: una onda de alivio sale de esa zona (n la repite). */
  relief?: { region: Region; n: number }
}

export default function BodyModel({ fx, tone, focus, heat = {}, calm = 0, tour, still, onRegion, relief }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const gradient = useId()
  const [visible, setVisible] = useState(true)
  const key = fx.join(' ')
  // «Todo el cuerpo» no se pinta por zonas: aviva el aura.
  const heatKey = Object.entries(heat)
    .filter(([r]) => r in HEAT_SHAPES)
    .map(([r, f]) => `${r}:${f}`)
    .join(' ')

  // Fuera de la pantalla no se anima nada.
  useEffect(() => {
    const el = root.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '120px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (still || !visible || (!key && !heatKey)) return
    const scope = createScope({ root }).add(() => {
      for (const f of key.split(' ').filter(Boolean) as Fx[]) FX[f]()
      if (heatKey) {
        animate('.b-heat', { opacity: [0.6, 1], duration: 2200, delay: stagger(260), loop: true, alternate: true, ease: 'inOutSine' })
      }
    })
    return () => scope.revert()
  }, [key, heatKey, still, visible])

  const show = (...names: Fx[]) => (names.some((n) => fx.includes(n)) ? 'fx on' : 'fx')

  const press = (region: Region) => (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onRegion?.(region)
  }

  return (
    <div
      ref={root}
      className={`body-stage${still ? ' still' : ''}${onRegion ? ' interactive' : ''}${tour && !still ? ' tour' : ''}${heat.todo ? ' whole' : ''}`}
      data-fx={key}
      data-tone={calm >= 1 ? 'calma' : (tone ?? 'calma')}
      style={{ '--calm': calm, '--skin': `url(#${gradient}-skin)` } as CSSProperties}
    >
      <svg viewBox="0 0 200 392" className="body-svg" role="img" aria-label="Figura de un cuerpo humano visto por dentro">
        <defs>
          <radialGradient id={`${gradient}-aura`}>
            <stop offset="0%" className="b-aura-stop" stopOpacity="0.42" />
            <stop offset="100%" className="b-aura-stop" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${gradient}-skin`} x1="40" y1="50" x2="170" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="b-skin-light" />
            <stop offset="100%" className="b-skin-shade" />
          </linearGradient>
          <radialGradient id={`${gradient}-alerta`}>
            <stop offset="0%" style={{ stopColor: 'var(--tone-alarma)' }} stopOpacity="0.55" />
            <stop offset="100%" style={{ stopColor: 'var(--tone-alarma)' }} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${gradient}-apagado`}>
            <stop offset="0%" style={{ stopColor: 'var(--tone-animo)' }} stopOpacity="0.55" />
            <stop offset="100%" style={{ stopColor: 'var(--tone-animo)' }} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${gradient}-wave`} x1="0" y1="9" x2="0" y2="39" gradientUnits="userSpaceOnUse">
            <stop offset="0%" style={{ stopColor: 'var(--tone-mania)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--tone-animo)' }} />
          </linearGradient>
        </defs>

        <ellipse className="b-aura" cx="100" cy="214" rx="96" ry="178" fill={`url(#${gradient}-aura)`} />
        <ellipse className="b-ground" cx="100" cy="384" rx="54" ry="6" />

        {/* Temporadas que suben y bajan (bipolar) */}
        <g className={show('wave')}>
          <path className="b-wave-base" d="M12 24 L188 24" />
          <path
            className="b-wave-path"
            d="M12 24 C24 4 44 4 56 24 C68 44 88 44 100 24 C112 4 132 4 144 24 C156 44 176 44 188 24"
            stroke={`url(#${gradient}-wave)`}
          />
          <circle className="b-wave-dot b-dot" r="5" />
        </g>

        <g className="b-figure">
          <g className="b-skin">
            <g className="b-arms">
              {both(ARM).map((d) => (
                <path key={d} d={d} />
              ))}
              {both(HAND).map((d) => (
                <path key={d} className="b-hand" d={d} />
              ))}
            </g>
            <g className="b-legs">
              {[...both(LEG), ...both(FOOT)].map((d) => (
                <path key={d} className="leg" d={d} />
              ))}
            </g>
            <path d={TORSO} />
            <ellipse cx="75" cy="80" rx="3.5" ry="6.5" />
            <ellipse cx="125" cy="80" rx="3.5" ry="6.5" />
            <ellipse cx="100" cy="77" rx="25" ry="28" />
          </g>

          {/* Dónde se siente: calor o frío sobre la piel */}
          <g className="b-heat-layer">
            {(Object.keys(HEAT_SHAPES) as Region[]).map((r) =>
              heat[r]
                ? HEAT_SHAPES[r].map(([cx, cy, rx, ry]) => (
                    <ellipse
                      key={`${r}-${cx}`}
                      className="b-heat"
                      cx={cx}
                      cy={cy}
                      rx={rx}
                      ry={ry}
                      fill={`url(#${gradient}-${heat[r]})`}
                    />
                  ))
                : null,
            )}
          </g>

          {/* Alivio: la zona que se calmó suelta una onda fresca, una sola vez */}
          {relief && (
            <g key={relief.n} className="b-relief" aria-hidden="true">
              {HEAT_SHAPES[relief.region].map(([cx, cy, rx, ry]) => (
                <g key={cx}>
                  <ellipse className="b-relief-glow" cx={cx} cy={cy} rx={rx} ry={ry} />
                  <ellipse className="b-relief-ring" cx={cx} cy={cy} rx={rx} ry={ry} />
                  <ellipse className="b-relief-ring late" cx={cx} cy={cy} rx={rx} ry={ry} />
                </g>
              ))}
            </g>
          )}

          {both(COLLARBONE).map((d) => (
            <path key={d} className="b-contour" d={d} />
          ))}

          {/* Órganos */}
          <path className="b-brain" d="M80 76 C78 62 92 56 100 62 C108 56 122 62 120 76 C124 86 114 94 100 92 C86 94 76 86 80 76 Z" />
          <path className="b-line" d="M100 63 L100 90" />
          <path className="b-line" d="M100 104 L100 138 M100 138 L93 145 M100 138 L107 145" />
          <path className="b-lung" d="M90 138 C78 136 70 150 70 168 C70 184 78 190 88 186 C93 184 94 176 94 166 L94 144 C94 140 93 138 90 138 Z" />
          <path className="b-lung" d="M110 138 C122 136 130 150 130 168 C130 184 122 190 112 186 C107 184 106 176 106 166 L106 144 C106 140 107 138 110 138 Z" />
          <path className="b-heart" d={HEART} />
          <path className="b-stomach" d="M90 196 C94 188 112 188 114 198 C116 210 104 218 94 214 C88 211 87 203 90 196 Z" />
          <path className="b-gut" d="M80 232 C86 226 92 238 98 232 C104 226 110 238 116 232 C120 228 123 234 120 239" />
          <path className="b-adrenal" d="M68 222 L74 212 L80 222 Q74 224 68 222 Z" />
          <path className="b-adrenal" d="M120 222 L126 212 L132 222 Q126 224 120 222 Z" />
          <circle className="b-amygdala" cx="100" cy="84" r="4" />

          {/* Ánimo apagado */}
          <g className={show('dim')}>
            <ellipse className="b-dim" cx="100" cy="77" rx="25" ry="28" />
          </g>

          {/* Alarma: la amígdala avisa */}
          <g className={show('alarm-brain')}>
            <circle className="b-alarm-ring" cx="100" cy="84" r="5" />
            <circle className="b-alarm-ring" cx="100" cy="84" r="5" />
          </g>

          {/* Presión del estrés sobre la cabeza */}
          <g className={show('stress-brain')}>
            <path className="b-press b-stroke" d="M78 44 Q100 34 122 44" />
            <path className="b-press b-stroke" d="M86 33 Q100 26 114 33" />
          </g>

          {/* Nervios: la señal baja por la espalda */}
          <g className={show('nerves')}>
            <path className="b-nerve" d="M100 92 L100 250" />
            <path className="b-nerve" d="M100 126 C84 128 66 132 60 140 C50 158 46 190 42 224" />
            <path className="b-nerve" d="M100 126 C116 128 134 132 140 140 C150 158 154 190 158 224" />
            <path className="b-nerve" d="M100 150 C104 156 106 160 106 164" />
            <path className="b-nerve" d="M100 248 C92 256 86 262 85 280 L82 360" />
            <path className="b-nerve" d="M100 248 C108 256 114 262 115 280 L118 360" />
          </g>

          {/* Nudo en la garganta */}
          <g className={show('throat')}>
            <circle className="b-throat b-stroke" cx="100" cy="110" r="8" />
          </g>

          {/* Hormigueo en los dedos y alrededor de la boca */}
          <g className={show('tingle')}>
            {[
              [30, 228], [36, 246], [52, 244], [54, 224],
              [146, 224], [148, 244], [164, 246], [170, 228],
              [91, 99], [100, 103], [109, 99],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} className="b-tingle" cx={cx} cy={cy} r="1.8" />
            ))}
          </g>

          <g className={show('heart-very-fast')}>
            <path className="b-heart-ring" d={HEART} />
          </g>

          {/* Nudo en el estómago */}
          <g className={show('stomach-knot')}>
            <path className="b-knot" d="M103 203 C103 199 97 199 97 203 C97 209 108 209 108 202 C108 194 93 194 93 203" />
          </g>

          {/* Acidez: burbujas que suben */}
          <g className={show('gut')}>
            <circle className="b-bubble" cx="95" cy="194" r="2.6" />
            <circle className="b-bubble" cx="103" cy="190" r="2.2" />
            <circle className="b-bubble" cx="109" cy="196" r="2.6" />
          </g>

          {/* Cortisol: sale de las glándulas y viaja por la sangre */}
          <g className={show('cortisol')}>
            <path className="b-route b-route-up" d="M74 212 C64 186 74 146 92 124 C98 114 100 108 100 98" />
            <path className="b-route b-route-arm" d="M126 212 C140 184 152 168 157 222" />
            <g className="b-cortisol-up">
              <circle className="b-dot" r="3" />
              <circle className="b-dot" r="3" />
              <circle className="b-dot" r="3" />
            </g>
            <g className="b-cortisol-arm">
              <circle className="b-dot" r="3" />
              <circle className="b-dot" r="3" />
            </g>
          </g>

          {/* Tensión en los hombros */}
          <g className={show('tension')}>
            <path className="b-tense" d="M64 112 l4 -5 l4 5 l4 -5 l4 5" />
            <path className="b-tense" d="M120 112 l4 -5 l4 5 l4 -5 l4 5" />
          </g>

          {/* Manos que tiemblan y sudan */}
          <g className={show('tremble')}>
            <g transform="translate(30 250)">
              <path className="b-sweat" d={DROP} />
            </g>
            <g transform="translate(170 250)">
              <path className="b-sweat" d={DROP} />
            </g>
          </g>

          {/* Peso en el pecho */}
          <g className={show('chest-weight')}>
            <g transform="translate(100 152)">
              <path className="b-stone" d="M-16 4 C-18 -6 -8 -12 2 -11 C12 -10 18 -4 16 5 C14 12 -14 13 -16 4 Z" />
            </g>
          </g>

          {/* Todo pesa */}
          <g className={show('heavy')}>
            {[62, 138].map((x) => (
              <g key={x} transform={`translate(${x} 96)`}>
                <path className="b-down b-stroke" d="M-7 -3 L0 3 L7 -3" />
              </g>
            ))}
          </g>
        </g>

        {/* Mareo */}
        <g className={show('dizzy')}>
          <g className="b-dizzy">
            <circle className="b-orbit" cx="100" cy="78" r="38" />
            <circle className="b-dot" cx="138" cy="78" r="3" />
            <circle className="b-dot" cx="81" cy="45" r="3" />
            <circle className="b-dot" cx="81" cy="111" r="3" />
          </g>
        </g>

        {/* Las cosas que daban gusto se apagan */}
        <g className={show('sparkles-fade')}>
          {[
            [60, 52],
            [142, 50],
            [50, 96],
            [150, 98],
          ].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <path className="b-spark" d={SPARK} />
            </g>
          ))}
        </g>

        {/* Manía: ideas que corren */}
        <g className={show('mania')}>
          <g className="b-rays">
            {RAYS.map((d) => (
              <path key={d} className="b-stroke" d={d} />
            ))}
          </g>
          <g className="b-ideas">
            {IDEAS.map((p, i) => (
              <circle key={i} className="b-dot" cx={p.cx} cy={p.cy} r="2.6" />
            ))}
          </g>
        </g>

        {/* Sueño que no descansa */}
        <g className={show('sleep-bad')}>
          <path className="b-moon" d="M152 34 A13 13 0 1 0 164 54 A10 10 0 1 1 152 34 Z" />
          {[
            [168, 38, 11],
            [176, 26, 14],
            [184, 12, 17],
          ].map(([x, y, size]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <text className="b-z" fontSize={size}>
                z
              </text>
            </g>
          ))}
        </g>

        {/* Dormir poco sin cansancio */}
        <g className={show('no-sleep')}>
          <circle className="b-clock" cx="40" cy="62" r="12" />
          <path className="b-clock-hand" d="M40 62 L40 53" />
          <path className="b-stroke" d="M40 62 L46 62" />
        </g>

        {/* El ciclo que se alimenta solo */}
        <g className={show('cycle')}>
          <g className="b-cycle">
            <path className="b-stroke" d="M100 118 A72 72 0 0 1 172 190" />
            <path className="b-stroke" d="M166 182 L172 192 L178 182" />
            <path className="b-stroke" d="M100 262 A72 72 0 0 1 28 190" />
            <path className="b-stroke" d="M22 198 L28 188 L34 198" />
          </g>
        </g>

        {/* Zonas que se pueden tocar */}
        {REGIONS.map(({ id, shapes }, i) => (
          <g
            key={id}
            className={`b-region${focus === id ? ' focus' : ''}`}
            style={{ '--i': i } as CSSProperties}
            {...(onRegion && {
              role: 'button',
              tabIndex: 0,
              'aria-label': `Ver qué pasa en ${REGION_LABELS[id]}`,
              onClick: () => onRegion(id),
              onKeyDown: press(id),
            })}
          >
            {shapes}
          </g>
        ))}
      </svg>
    </div>
  )
}
