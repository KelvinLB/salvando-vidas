import { type PointerEvent, type ReactNode, useRef, useState } from 'react'
import { readBarrio } from '../../lib/barrio'
import type { FlowProps } from '../types'
import { Flow, NotNow, Says, Thanks } from './parts'
import { COSTRA, type Costra, Formando, Horno, ING_ART, type IngId, Masa, Pieza, type Shape, Tazon } from './recetaArt'

// Don Fermín, el panadero, perdió la receta de su pan dulce: se le mojó la libreta. La persona
// le ayuda a recordarla paso a paso: junta los ingredientes en el tazón (tocándolos o
// arrastrándolos), amasa pasando el dedo por la masa, forma una concha, un cuernito o una oreja y
// la ve salir del horno; mientras se hornea, cada vez que se asoma, él le cuenta cómo le encontró
// sentido a su oficio. Es la «derreflexión» de Viktor Frankl en juego: la atención se va hacia
// afuera, a algo y a alguien más, en vez de darle vueltas a uno mismo. Sin reloj, sin puntos, sin
// perder y sin sonidos: lo que no va en el pan nomás le da risa y regresa a la alacena. En un día
// pesado él ya juntó los ingredientes y basta con amasar poquito. No se ofrece con señales de
// riesgo (src/lib/barrioBoard.ts).
// Pendiente de revisión con psicóloga. Fuente: Frankl, «Teoría y terapia de las neurosis» y
// «El hombre en busca de sentido» (Herder).

type Stage = 'intro' | 'mesa' | 'amasar' | 'formar' | 'horno' | 'listo'

/** Lo que sí lleva el pan y lo que se acuerda al ponerlo en el tazón. */
const NEEDED: { id: IngId; label: string; memory: string }[] = [
  { id: 'harina', label: 'Harina', memory: '¡Harina! De esa sí me acuerdo: de trigo y cernida, para que quede esponjadita.' },
  { id: 'azucar', label: 'Azúcar', memory: 'Azúcar… Mi maestro decía: «ni tanta que empalague, ni tan poquita que se extrañe».' },
  { id: 'mantequilla', label: 'Mantequilla', memory: 'La mantequilla, suavecita. Es la que hace que el pan se deshaga en la boca.' },
  { id: 'huevo', label: 'Huevos', memory: 'Huevos, sí. Dos, o tres si están chiquitos.' },
  { id: 'levadura', label: 'Levadura', memory: '¡La levadura! Sin ella el pan no se levanta. Hace su magia despacito, sin que nadie la apure.' },
  { id: 'leche', label: 'Leche', memory: 'Un chorrito de leche tibia, para despertar a la levadura.' },
]

/** Lo que no va en el pan dulce: no pasa nada, nomás le da risa. */
const EXTRA: { id: IngId; label: string; laugh: string }[] = [
  { id: 'chile', label: 'Chile', laugh: '¿Chile? ¡Ja! Ese es para los chilaquiles de Tere. Ya me hiciste reír.' },
  { id: 'jitomate', label: 'Jitomate', laugh: '¿Jitomate en las conchas? Uy, quedarían bien raras. Ese mejor para la salsa.' },
  { id: 'frijol', label: 'Frijoles', laugh: 'Frijolitos… ¡esos van en la torta, no en el pan dulce! Pero qué buena puntería.' },
]

/** La alacena, revuelta como la dejó. */
const SHELF: IngId[] = ['harina', 'chile', 'azucar', 'mantequilla', 'jitomate', 'huevo', 'levadura', 'frijol', 'leche']
const labelOf = (id: IngId) => [...NEEDED, ...EXTRA].find((i) => i.id === id)!.label

const SHAPES: { id: Shape; label: string; steps: string[]; lines: string[] }[] = [
  {
    id: 'concha',
    label: 'Concha',
    steps: ['Hacer la bolita', 'Ponerle la costra', 'Marcarle las rayitas'],
    lines: [
      'Primero, una bolita. Pasa el dedo por la masa, o toca el botón, y la vamos formando.',
      'Así, redondita. Ahora la costra, que es azúcar con mantequilla y harina. Escoge el color que quieras.',
      'Y lo más bonito: las rayitas de concha. Mi maestro las marcaba con un molde, pero con el dedo también se puede.',
      '¡Mira nomás, una concha de verdad! Ya está lista para el horno.',
    ],
  },
  {
    id: 'cuernito',
    label: 'Cuernito',
    steps: ['Estirar el triángulo', 'Enrollarlo', 'Doblarle las puntas'],
    lines: [
      'El cuernito empieza como un triangulito. Hay que estirarlo tantito.',
      'Ahora se enrolla desde la base hacia la punta, sin apretar.',
      'Y al final se le doblan las puntas, como lunita.',
      '¡Quedó un cuernito bien formado! Ya está listo para el horno.',
    ],
  },
  {
    id: 'oreja',
    label: 'Oreja',
    steps: ['Estirar y ponerle azúcar', 'Doblar hacia el centro', 'Cortar y abrir'],
    lines: [
      'La oreja lleva hojaldre: se estira la masa y se le espolvorea azúcar.',
      'Ahora se dobla de los dos lados hacia el centro, como un libro.',
      'Se corta en rebanadas y se abre tantito. Así sale la forma de corazón.',
      '¡Una oreja como las de antes! Ya está lista para el horno.',
    ],
  },
]

/** Lo que cuenta mientras se hornea: cómo le encontró sentido al oficio (sin hablar de muerte). */
const STORY = [
  'Todavía le falta tantito. Mientras, te cuento: yo entré a esta panadería de chamaco, a barrer. Me quedaba viendo al maestro Anselmo amasar, como si platicara con la masa.',
  'Un día me dejó hacer una charola entera. Me salieron chuecas, pero un señor que iba a su trabajo se compró dos y me dijo: «Con esto aguanto hasta la comida». Me fui a mi casa bien contento.',
  '¡Ya huele! Desde aquel señor, cada charola es para alguien: para quien sale temprano, para los niños de la escuela, para quien pasa con frío. El pan no es para mí, y por eso le encuentro sentido a levantarme temprano.',
]

/** ¿Para quién es la primera? Lo que contesta Don Fermín. No se guarda. */
const FOR_WHOM: { label: string; reply: string }[] = [
  { label: 'Para Tere, que madruga', reply: 'Le va a encantar. Tere dice que con un pancito la mañana se acomoda.' },
  { label: 'Para Nico, para la escuela', reply: '¡Nico va a brincar de gusto! Seguro se la come contando palomas.' },
  { label: 'Para alguien de mi casa', reply: 'Qué bonito. Llévasela calientita: el pan compartido sabe más rico.' },
  { label: 'Para mí, también se vale', reply: 'Claro que se vale. Quien echa la mano también merece su pancito.' },
]

/** Cuánto hay que recorrer con el dedo para que cuente una amasada o un paso (en px). */
const STROKE = 46

/**
 * Pasar el dedo (o el mouse) sobre algo: cada tramo de STROKE px cuenta una vez (`once`: solo una
 * vez por pasada, para formar la pieza paso a paso). Un toque sin arrastrar también cuenta, para
 * quien no puede arrastrar.
 */
function useRub(onRub: () => void, once = false) {
  const last = useRef<{ x: number; y: number; travel: number; moved: boolean } | null>(null)
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      last.current = { x: e.clientX, y: e.clientY, travel: 0, moved: false }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const l = last.current
      if (!l || (once && l.moved)) return
      l.travel += Math.hypot(e.clientX - l.x, e.clientY - l.y)
      l.x = e.clientX
      l.y = e.clientY
      if (l.travel >= STROKE) {
        l.travel = 0
        l.moved = true
        onRub()
      }
    },
    onPointerUp: () => {
      if (last.current && !last.current.moved && last.current.travel < 10) onRub()
      last.current = null
    },
    onPointerCancel: () => {
      last.current = null
    },
  }
}

/**
 * Llevar algo a un lugar: se toca (o Enter) y llega; o se arrastra y se suelta encima. Lo que se
 * suelta afuera regresa a su lugar, sin más.
 */
function useDropOn(target: { current: HTMLElement | null }, onDrop: (id: IngId) => void, onHot: (hot: boolean) => void) {
  const drag = useRef<{ id: IngId; el: HTMLElement; x: number; y: number; moved: boolean } | null>(null)
  /** El clic que llega justo después de arrastrar algo no cuenta como toque (solo el de esa cosa). */
  const skip = useRef<{ id: IngId; until: number } | null>(null)
  const over = (x: number, y: number) => {
    const r = target.current?.getBoundingClientRect()
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }
  const reset = () => {
    const d = drag.current
    drag.current = null
    if (d) {
      d.el.style.transform = ''
      d.el.classList.remove('dragging')
    }
    onHot(false)
    return d
  }
  return (id: IngId) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      drag.current = { id, el: e.currentTarget, x: e.clientX, y: e.clientY, moved: false }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) < 8) return
      d.moved = true
      d.el.classList.add('dragging')
      d.el.style.transform = `translate(${dx}px, ${dy}px)`
      onHot(over(e.clientX, e.clientY))
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      const d = reset()
      if (!d?.moved) return
      skip.current = { id, until: performance.now() + 400 }
      if (over(e.clientX, e.clientY)) onDrop(id)
    },
    onPointerCancel: () => void reset(),
    onClick: () => {
      const s = skip.current
      skip.current = null
      if (s && s.id === id && performance.now() < s.until) return
      onDrop(id)
    },
  })
}

export default function Receta({ petName, heavy, onDone, onLater, onClose }: FlowProps) {
  const [again] = useState(() => !!readBarrio().done.receta)
  const [stage, setStage] = useState<Stage>('intro')
  const [line, setLine] = useState<ReactNode>(null)
  // En un día pesado, Don Fermín ya juntó todo en el tazón.
  const [placed, setPlaced] = useState<IngId[]>(() => (heavy ? NEEDED.map((i) => i.id) : []))
  const [shake, setShake] = useState<{ id: IngId; n: number } | null>(null)
  const [hot, setHot] = useState(false)
  const [kneads, setKneads] = useState(0)
  const [shape, setShape] = useState<Shape | null>(null)
  const [step, setStep] = useState(0)
  const [costra, setCostra] = useState<Costra>('vainilla')
  const [inside, setInside] = useState(false)
  const [peeks, setPeeks] = useState(0)
  const [whom, setWhom] = useState<number | null>(null)
  const bowl = useRef<HTMLDivElement>(null)

  const KNEADS = heavy ? 4 : 8
  const PEEKS = heavy ? 2 : 3
  const story = heavy ? [STORY[0], STORY[2]] : STORY
  const smooth = Math.min(1, kneads / KNEADS)
  const allIn = NEEDED.every((i) => placed.includes(i.id))
  const piece = SHAPES.find((s) => s.id === shape)

  const put = (id: IngId) => {
    if (placed.includes(id)) return
    const need = NEEDED.find((i) => i.id === id)
    if (!need) {
      setShake((s) => ({ id, n: (s?.n ?? 0) + 1 }))
      return setLine(EXTRA.find((i) => i.id === id)!.laugh)
    }
    const next = [...placed, id]
    setPlaced(next)
    setLine(NEEDED.every((i) => next.includes(i.id)) ? `${need.memory} ¡Y con eso ya está todo! Ahora sí me acordé de lo que sigue: a amasar.` : need.memory)
  }
  const drop = useDropOn(bowl, put, setHot)

  const knead = () => {
    if (kneads >= KNEADS) return
    const n = kneads + 1
    setKneads(n)
    if (n === KNEADS) setLine('¡Ya está lisita! Mira cómo brilla. Ahora sí, mis manos se acordaron de las formas.')
    else if (n === Math.ceil(KNEADS / 2)) setLine('Así mero. Mi maestro decía que la masa se da cuenta cuando uno la trata con paciencia.')
  }
  const rubDough = useRub(knead)

  const shapeStep = () => {
    if (!piece || step >= 3) return
    const n = step + 1
    setStep(n)
    setLine(piece.lines[n])
  }
  const rubPiece = useRub(shapeStep, true)

  const peek = () => {
    if (peeks >= PEEKS) return
    const n = peeks + 1
    setPeeks(n)
    setLine(story[n - 1])
  }

  const go = (next: Stage, say: ReactNode) => {
    setStage(next)
    setLine(say)
  }

  const later = (
    <button type="button" className="btn ghost" onClick={onLater}>
      Hoy no
    </button>
  )

  return (
    <Flow label="La receta de Don Fermín">
      <Says who="fermin">
        {stage === 'intro' ? (
          <p>
            {again
              ? `¡Qué gusto verte! Ya me acuerdo de la receta, pero con alguien al lado sale más rico. ¿Hacemos otra tanda? ${petName} ya se puso el mandil.`
              : `¡Ay, qué bueno que pasas! Se me mojó la libreta y se me borró la receta del pan dulce. Me acuerdo a pedacitos… ¿Me ayudas a recordarla? ${petName} ya se puso el mandil.`}
            {heavy && ' Hoy, si quieres, yo junto los ingredientes y tú nomás me ayudas con la masa.'}
          </p>
        ) : (
          <p>{line}</p>
        )}
      </Says>

      {stage === 'intro' && (
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() =>
              heavy
                ? go('amasar', 'Ya junté todo en el tazón. Ahora a amasar: pasa el dedo por la masa, de un lado a otro. Sin prisa: la masa no tiene reloj.')
                : go('mesa', 'Primero, los ingredientes. Pásalos de la alacena al tazón: tócalos o arrástralos. Yo te digo si me acuerdo.')
            }
          >
            Va, le ayudo
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'mesa' && (
        <>
          <div className="bm-rc-table">
            <div className="bm-rc-recipe" aria-label="La receta">
              <span className="bm-rc-recipe-title">Pan dulce de Don Fermín</span>
              <ol>
                {NEEDED.map((i) => {
                  const got = placed.includes(i.id)
                  return (
                    <li key={i.id} className={got ? 'got' : undefined}>
                      {got ? i.label : <span aria-label="Falta un ingrediente">· · ·</span>}
                    </li>
                  )
                })}
              </ol>
            </div>
            <div ref={bowl} className={`bm-rc-bowl${hot ? ' hot' : ''}`} aria-label={`El tazón: ${placed.length ? placed.map(labelOf).join(', ') : 'vacío'}`}>
              <Tazon inside={placed} />
            </div>
          </div>
          <ul className="bm-rc-shelf" aria-label="La alacena">
            {SHELF.map((id) =>
              placed.includes(id) ? (
                <li key={id} className="bm-rc-empty" aria-hidden="true" />
              ) : (
                <li key={id}>
                  <button
                    type="button"
                    className={`bm-rc-ing${shake?.id === id ? ' no' : ''}`}
                    key={shake?.id === id ? shake.n : 0}
                    aria-label={`${labelOf(id)}: ponerlo en el tazón`}
                    {...drop(id)}
                  >
                    <svg viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">
                      {ING_ART[id]}
                    </svg>
                    <span>{labelOf(id)}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
          <div className="row">
            {allIn && (
              <button type="button" className="btn" onClick={() => go('amasar', 'Ahora a amasar: pasa el dedo por la masa, de un lado a otro. Sin prisa: la masa no tiene reloj.')}>
                A amasar
              </button>
            )}
            {later}
          </div>
        </>
      )}

      {stage === 'amasar' && (
        <>
          <div className="bm-rc-stage bm-rc-rub" aria-hidden="true" {...rubDough}>
            <Masa smooth={smooth} kneads={kneads} />
          </div>
          <div className="row">
            {kneads < KNEADS ? (
              <button type="button" className="btn ghost" onClick={knead}>
                Amasar
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => go('formar', '¿Qué hacemos? Mis manos ya se acordaron de las tres.')}>
                Darle forma
              </button>
            )}
            {later}
          </div>
        </>
      )}

      {stage === 'formar' && !piece && (
        <>
          <div className="bm-options bm-rc-shapes" role="group" aria-label="Qué pieza hacer">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="bm-option bm-rc-shape"
                onClick={() => {
                  setShape(s.id)
                  setStep(0)
                  setLine(s.lines[0])
                }}
              >
                <svg viewBox="-50 -32 100 58" aria-hidden="true" focusable="false">
                  <Pieza shape={s.id} step={3} costra="vainilla" baked />
                </svg>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="row">{later}</div>
        </>
      )}

      {stage === 'formar' && piece && (
        <>
          <div className="bm-rc-stage bm-rc-rub" aria-hidden="true" {...rubPiece}>
            <Formando shape={piece.id} step={step} costra={costra} />
          </div>
          {piece.id === 'concha' && step >= 1 && (
            <div className="chips" role="group" aria-label="El color de la costra">
              {(Object.keys(COSTRA) as Costra[]).map((c) => (
                <button key={c} type="button" className={`chip${costra === c ? ' selected' : ''}`} aria-pressed={costra === c} onClick={() => setCostra(c)}>
                  <i className="bm-rc-dot" style={{ background: COSTRA[c].fill }} aria-hidden="true" />
                  {COSTRA[c].label}
                </button>
              ))}
            </div>
          )}
          <div className="row">
            {step < 3 ? (
              <button type="button" className="btn ghost" onClick={shapeStep}>
                {piece.steps[step]}
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => go('horno', `Ahora, al horno. Toca la charola para meterla. ${petName} ya me está deteniendo la puerta.`)}>
                Llevarla al horno
              </button>
            )}
            {later}
          </div>
        </>
      )}

      {(stage === 'horno' || stage === 'listo') && piece && (
        <>
          <div className="bm-rc-stage">
            <Horno shape={piece.id} costra={costra} inside={inside && stage === 'horno'} peek={Math.min(1, peeks / PEEKS)} out={stage === 'listo'} />
            {stage === 'horno' && !inside && (
              // La charola también se toca en el dibujo; para el teclado y el lector está el botón de abajo.
              <button
                type="button"
                className="bm-rc-tray-btn"
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => {
                  setInside(true)
                  setLine('Ya está adentro. Aquí no hay reloj: el pan sale cuando sale. Si quieres, asómate por la ventanita.')
                }}
              />
            )}
          </div>
          {stage === 'horno' && (
            <div className="row">
              {!inside ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setInside(true)
                    setLine('Ya está adentro. Aquí no hay reloj: el pan sale cuando sale. Si quieres, asómate por la ventanita.')
                  }}
                >
                  Meterla al horno
                </button>
              ) : peeks < PEEKS ? (
                <button type="button" className="btn ghost" onClick={peek}>
                  Asomarse al horno
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    go(
                      'listo',
                      `¡Mira nomás qué bonita salió! La receta volvió completita, y fue gracias a ti: yo solo no me acordaba, y con alguien al lado la memoria se acomoda. Hoy por ti, mañana por mí. ¿Para quién es esta primera?`,
                    )
                  }
                >
                  Sacarla del horno
                </button>
              )}
            </div>
          )}
          {stage === 'listo' && (
            <>
              <div className="bm-options" role="group" aria-label="Para quién es">
                {FOR_WHOM.map((w, i) => (
                  <button
                    key={w.label}
                    type="button"
                    className={`bm-option${whom === i ? ' selected' : ''}`}
                    aria-pressed={whom === i}
                    onClick={() => {
                      setWhom(i)
                      setLine(w.reply)
                    }}
                  >
                    <span>{w.label}</span>
                  </button>
                ))}
              </div>
              <Thanks to="Don Fermín" onDone={onDone} />
            </>
          )}
        </>
      )}

      {stage === 'mesa' && <p className="muted small">No hay reloj ni puntos: lo que no va en el pan nomás regresa a la alacena.</p>}
    </Flow>
  )
}
