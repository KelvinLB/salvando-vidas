import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { type JSAnimation, type Scope, animate, createScope, stagger } from 'animejs'
import type { Heat } from '../data/bodyCheck'
import { REGION_LABELS, type Region, type Tone } from '../data/bodyStories'
import { SKINS, type Yo } from '../data/desdeAfuera'
import { type BodyFx, FX, breathPhase } from '../lib/bodyfx'
import { Organs, Skin, heartOf } from './cuerpo-siento/FigureArt'
import { ANCHORS, BOXES, HEAT, type View } from './cuerpo-siento/figura'
import './cuerpo-siento/cuerpo-siento.css'

// Un cuerpo visto «por dentro»: cerebro, pulmones, corazón, estómago e intestinos, los
// riñones con las glándulas del estrés y, de espalda, la columna. Cada efecto es una capa
// que se enciende con la clase `on`; anime.js solo pone el movimiento, así que sin
// animaciones (o con movimiento reducido) se sigue entendiendo qué pasa.
//
// Del estilo de las figuras de «anatomy» (github.com/wheresryan22/anatomy) toma: tonos
// en vez de contornos (la piel con luz desde arriba a la izquierda y una sombra al
// piso), una sola zona encendida a la vez, nada de texto dentro del dibujo, un recorrido
// suave cuando nadie lo toca y quedarse quieto fuera de la pantalla.
//
// Se ve de frente, de espalda o de lado (cuerpo-siento/figura.ts); al cambiar de vista la
// figura da media vuelta suave, sin girar libre. En reposo respira despacio.

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

/** Los colores de las playeras de Desde afuera (src/pages/juegos/desde-afuera.css, --da-c1…6). */
const SHIRT_COLORS = ['#e46a8f', '#4c6fb5', '#e0a93a', '#5f9e82', '#d9733b', '#8f6bb8']

const REGION_ORDER: Region[] = ['cabeza', 'cuello', 'pecho', 'estomago', 'brazos', 'piernas']

/** Efectos que la respiración guiada lleva a su ritmo (ver breathPhase). */
const PHASED: BodyFx[] = ['vagus', 'breath-slow', 'breath-fast', 'heart-calm', 'heart-fast', 'heart-very-fast']

export type CanvasPoint = { x: number; y: number }

type Props = {
  fx: BodyFx[]
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
  /** De frente (lo de siempre), de espalda o de lado. */
  view?: View
  /** La respiración guiada va en esta fase: con `vagus`, el cuerpo sigue el contador. */
  phase?: 'in' | 'out' | null
  /** El muñequito de Desde afuera: la figura se pinta con su piel, su pelo y su ropa. */
  yo?: Yo | null
  /** Lo que se dibuja encima de la figura (marcas, notas), en las medidas del dibujo. */
  layer?: ReactNode
  /** Para marcar con el dedo: recibe dónde se toca y se arrastra. Mientras, las zonas no se tocan. */
  onCanvas?: (type: 'down' | 'move' | 'up', p: CanvasPoint) => void
}

export default function BodyModel({
  fx,
  tone,
  focus,
  heat = {},
  calm = 0,
  tour,
  still,
  onRegion,
  relief,
  view = 'frente',
  phase = null,
  yo,
  layer,
  onCanvas,
}: Props) {
  const root = useRef<HTMLDivElement>(null)
  const phaseScope = useRef<Scope | null>(null)
  const gradient = useId()
  const [visible, setVisible] = useState(true)
  // La media vuelta solo se ve al cambiar de vista, no al llegar a la pantalla.
  const firstView = useRef(view)
  const [turned, setTurned] = useState(false)
  const turn = turned || view !== firstView.current
  useEffect(() => {
    if (view !== firstView.current) setTurned(true)
  }, [view])
  const phased = !!phase && fx.includes('vagus')
  const key = fx.join(' ')
  const heatShapes = HEAT[view]
  const A = ANCHORS[view]
  const heart = heartOf(view)
  // «Todo el cuerpo» no se pinta por zonas: aviva el aura.
  const heatKey = Object.entries(heat)
    .filter(([r]) => r in heatShapes)
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
      for (const f of key.split(' ').filter(Boolean) as BodyFx[]) {
        if (phased && PHASED.includes(f)) continue
        FX[f]()
      }
      if (heatKey) {
        animate('.b-heat', { opacity: [0.6, 1], duration: 2200, delay: stagger(260), loop: true, alternate: true, ease: 'inOutSine' })
      }
    })
    return () => scope.revert()
  }, [key, heatKey, still, visible, view, phased])

  // La respiración guiada: un alcance propio, para que al cambiar de fase nada brinque.
  useEffect(() => {
    if (!phased || still || !visible) return
    const scope = createScope({ root })
    phaseScope.current = scope
    return () => {
      scope.revert()
      phaseScope.current = null
    }
  }, [phased, still, visible, view])

  useEffect(() => {
    const scope = phaseScope.current
    if (!scope || !phase) return
    let list: JSAnimation[] = []
    scope.add(() => {
      list = breathPhase(phase, calm)
    })
    return () => list.forEach((a) => a.pause())
    // La calma se lee al empezar cada fase: así el corazón baja de una respiración a la otra.
  }, [phase, phased, still, visible, view])

  const show = (...names: BodyFx[]) => (names.some((n) => fx.includes(n)) ? 'fx on' : 'fx')

  const press = (region: Region) => (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onRegion?.(region)
  }

  // Marcar con el dedo: del punto de la pantalla al punto del dibujo.
  const toCanvas = (e: PointerEvent<SVGSVGElement>): CanvasPoint => {
    const m = e.currentTarget.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }
  const canvas = onCanvas && {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      onCanvas('down', toCanvas(e))
    },
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) onCanvas('move', toCanvas(e))
    },
    onPointerUp: (e: PointerEvent<SVGSVGElement>) => onCanvas('up', toCanvas(e)),
    onPointerCancel: (e: PointerEvent<SVGSVGElement>) => onCanvas('up', toCanvas(e)),
  }
  const touchable = onRegion && !onCanvas

  const yoSkin = yo ? SKINS[yo.skin][0] : undefined

  return (
    <div
      ref={root}
      className={`body-stage${still ? ' still' : ''}${visible ? '' : ' away'}${touchable ? ' interactive' : ''}${onCanvas ? ' marking' : ''}${tour && !still && touchable ? ' tour' : ''}${heat.todo ? ' whole' : ''}${yo ? ' mine' : ''}`}
      data-fx={key}
      data-tone={calm >= 1 ? 'calma' : (tone ?? 'calma')}
      data-view={view}
      data-phase={phased ? phase : undefined}
      style={{ '--calm': calm, '--skin': `url(#${gradient}-skin)`, '--vol': `url(#${gradient}-vol)`, '--yo-skin': yoSkin, '--b-shirt': yo ? SHIRT_COLORS[yo.shirt] : undefined } as CSSProperties}
    >
      <svg
        viewBox="0 0 200 392"
        className="body-svg"
        role="img"
        aria-label={`Figura de un cuerpo humano visto por dentro, ${view === 'frente' ? 'de frente' : view === 'espalda' ? 'de espalda' : 'de lado'}`}
        {...canvas}
      >
        <defs>
          <radialGradient id={`${gradient}-aura`}>
            <stop offset="0%" className="b-aura-stop" stopOpacity="0.42" />
            <stop offset="100%" className="b-aura-stop" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${gradient}-skin`} x1="40" y1="50" x2="170" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="b-skin-light" />
            <stop offset="100%" className="b-skin-shade" />
          </linearGradient>
          {/* Volumen: cada parte se oscurece hacia sus orillas, más del lado contrario a la luz. */}
          <linearGradient id={`${gradient}-vol`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" className="b-vol-stop" stopOpacity="0.22" />
            <stop offset="22%" className="b-vol-stop" stopOpacity="0" />
            <stop offset="62%" className="b-vol-stop" stopOpacity="0" />
            <stop offset="100%" className="b-vol-stop" stopOpacity="0.38" />
          </linearGradient>
          {(['brain', 'lung', 'heart', 'gut', 'kidney', 'liver'] as const).map((o) => (
            <radialGradient key={o} id={`${gradient}-o-${o}`} cx="0.36" cy="0.3" r="0.8">
              <stop offset="0%" className={`b-o-light b-o-${o}`} />
              <stop offset="100%" className={`b-o-dark b-o-${o}`} />
            </radialGradient>
          ))}
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

        <g key={view} className={`b-view${turn ? ' turn' : ''}`}>
          <g className="b-figure">
            <g className="b-breathe">
              <Skin view={view} g={gradient} yo={yo} />

              {/* Dónde se siente: calor o frío sobre la piel */}
              <g className="b-heat-layer">
                {(Object.keys(heatShapes) as Region[]).map((r) =>
                  heat[r]
                    ? heatShapes[r].map(([cx, cy, rx, ry]) => (
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
                  {heatShapes[relief.region].map(([cx, cy, rx, ry]) => (
                    <g key={cx}>
                      <ellipse className="b-relief-glow" cx={cx} cy={cy} rx={rx} ry={ry} />
                      <ellipse className="b-relief-ring" cx={cx} cy={cy} rx={rx} ry={ry} />
                      <ellipse className="b-relief-ring late" cx={cx} cy={cy} rx={rx} ry={ry} />
                    </g>
                  ))}
                </g>
              )}

              <Organs view={view} g={gradient} />
            </g>

            {/* Ánimo apagado */}
            <g className={show('dim')}>
              <ellipse className="b-dim" cx="100" cy="76" rx="21" ry="25" />
            </g>

            {/* Alarma: la amígdala avisa */}
            <g className={show('alarm-brain')}>
              {[0, 1].map((i) => (
                <circle key={i} className="b-alarm-ring" cx={view === 'lado' ? 103 : 100} cy={view === 'lado' ? 81 : 82} r="5" />
              ))}
            </g>

            {/* Presión del estrés sobre la cabeza */}
            <g className={show('stress-brain')}>
              <path className="b-press b-stroke" d="M78 44 Q100 34 122 44" />
              <path className="b-press b-stroke" d="M86 33 Q100 26 114 33" />
            </g>

            {/* Nervios: la señal baja por la espalda */}
            <g className={show('nerves')}>
              {A.nerves.map((d) => (
                <path key={d} className="b-nerve" d={d} />
              ))}
            </g>

            {/* El freno: el nervio vago baja del cerebro al corazón, los pulmones y la panza */}
            <g className={`${show('vagus')} keep`}>
              {A.vagus.map((d) => (
                <path key={d} className="b-vagus" d={d} />
              ))}
              {A.vagus.map((d) => (
                <path key={d} className="b-vagus-glow" d={d} />
              ))}
              {A.vagus.slice(0, 2).map((d) => (
                <path key={d} className="b-vagus-pulse" d={d} />
              ))}
            </g>

            {/* Nudo en la garganta */}
            <g className={show('throat')}>
              <circle className="b-throat b-stroke" cx={A.throat[0]} cy={A.throat[1]} r="7" />
            </g>

            {/* Hormigueo en los dedos y alrededor de la boca */}
            <g className={show('tingle')}>
              {A.tingle.map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} className="b-tingle" cx={cx} cy={cy} r="1.8" />
              ))}
            </g>

            <g className={show('heart-very-fast')}>
              <g transform={heart.transform}>
                <path className="b-heart-ring" d={heart.d} />
              </g>
            </g>

            {/* Nudo en el estómago */}
            <g className={show('stomach-knot')}>
              <g transform={`translate(${A.knot[0] - 100} ${A.knot[1] - 203})`}>
                <path className="b-knot" d="M103 203 C103 199 97 199 97 203 C97 209 108 209 108 202 C108 194 93 194 93 203" />
              </g>
            </g>

            {/* Acidez: burbujas que suben */}
            <g className={show('gut')}>
              {A.bubbles.map(([cx, cy], i) => (
                <circle key={cx} className="b-bubble" cx={cx} cy={cy} r={i === 1 ? 2.2 : 2.6} />
              ))}
            </g>

            {/* Cortisol: sale de las glándulas y viaja por la sangre */}
            <g className={show('cortisol')}>
              <path className="b-route b-route-up" d={A.cortisolUp} />
              <path className="b-route b-route-arm" d={A.cortisolArm} />
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
              {A.tense.map(([x, y]) => (
                <path key={x} className="b-tense" d={`M${x} ${y} l4 -5 l4 5 l4 -5 l4 5`} />
              ))}
            </g>

            {/* Manos que tiemblan y sudan */}
            <g className={show('tremble')}>
              {A.sweat.map(([x, y]) => (
                <g key={x} transform={`translate(${x} ${y})`}>
                  <path className="b-sweat" d={DROP} />
                </g>
              ))}
            </g>

            {/* Peso en el pecho */}
            <g className={show('chest-weight')}>
              <g transform={`translate(${A.stone[0]} ${A.stone[1]})`}>
                <path className="b-stone" d="M-16 4 C-18 -6 -8 -12 2 -11 C12 -10 18 -4 16 5 C14 12 -14 13 -16 4 Z" />
              </g>
            </g>

            {/* Todo pesa */}
            <g className={show('heavy')}>
              {A.heavy.map((x) => (
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

          {layer}

          {/* Zonas que se pueden tocar */}
          {REGION_ORDER.map((id, i) => (
            <g
              key={id}
              className={`b-region${focus === id ? ' focus' : ''}`}
              style={{ '--i': i } as CSSProperties}
              {...(touchable && {
                role: 'button',
                tabIndex: 0,
                'aria-label': `Ver qué pasa en ${REGION_LABELS[id]}`,
                onClick: () => onRegion(id),
                onKeyDown: press(id),
              })}
            >
              {BOXES[view][id].map((b, j) =>
                'cx' in b ? (
                  <circle key={j} className="b-hl" cx={b.cx} cy={b.cy} r={b.r} />
                ) : (
                  <rect key={j} className="b-hl" x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} />
                ),
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
