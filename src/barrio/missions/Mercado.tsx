import { type CSSProperties, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskNotice from '../../components/RiskNotice'
import { type Ladder, amendEvent, logEvent, updateBarrio, useBarrio } from '../../lib/barrio'
import { newId, today } from '../../lib/storage'
import type { FlowProps } from '../types'
import { FearScale, Flow, NotNow, OwnText, Says, Thanks, pendingToday } from './parts'

// Don Beto y la ruta del mercado (exposición gradual para la ansiedad). La persona arma su propia
// escalera con cosas de su vida que le dan nervios, cada una con el miedo que espera (0 a 10), de
// la más fácil a la más difícil. Hace un escalón de verdad, cuenta cuánto miedo sintió y Don Beto
// lo compara con calma. Puede bajar un escalón cuando quiera, y «Hoy no» siempre vale.

const MAX_STEPS = 6

const SUGGESTED = [
  'Saludar al marchante',
  'Preguntar un precio en el mercado',
  'Pedir algo en la tienda',
  'Contestar una llamada',
  'Salir a la esquina',
  'Pedirle una indicación a alguien',
  'Hacer una pregunta en clase o en el trabajo',
  'Comer en un lugar con gente',
]

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** Para bajar un escalón: la misma cosa, más chiquita. */
const smallerOf = (text: string) => [
  `Imaginarme paso a paso: ${lower(text)}`,
  `${text}, con alguien de confianza`,
  `${text}, solo un ratito`,
]

type Step = Ladder[number]
type Stage = 'intro' | 'build' | 'ladder' | 'doing' | 'felt' | 'reflect'

export default function Mercado({ petName, heavy, onDone, onLater, onClose }: FlowProps) {
  const { barrio } = useBarrio()
  const ladder = [...barrio.ladder].sort((a, b) => a.fear - b.fear)
  const open = ladder.filter((s) => !s.done)

  // Si hizo un escalón hoy y no alcanzó a contar cuánto miedo sintió, se retoma ahí.
  const [pending] = useState(() => {
    const e = pendingToday('escalon', 'mercado')
    return e?.kind === 'escalon' ? e : null
  })
  const [stage, setStage] = useState<Stage>(pending ? 'felt' : 'intro')
  const [chosen, setChosen] = useState<string | null>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const [draftFear, setDraftFear] = useState(5)
  const [own, setOwn] = useState(false)
  const [riskSeen, setRiskSeen] = useState(false)
  // Al bajar sin escalón más fácil, se arma uno más chiquito que este.
  const [smallerThan, setSmallerThan] = useState<string | null>(null)
  const [eventId, setEventId] = useState(pending?.id ?? '')
  const [doneStep, setDoneStep] = useState<{ text: string; expected: number } | null>(
    pending?.kind === 'escalon' ? { text: pending.step, expected: pending.expected } : null,
  )
  const [felt, setFelt] = useState(pending?.kind === 'escalon' ? pending.expected : 5)

  const current: Step | undefined = ladder.find((s) => s.id === chosen) ?? open[0]

  const add = (text: string) => {
    updateBarrio((b) =>
      b.ladder.length >= MAX_STEPS ? {} : { ladder: [...b.ladder, { id: newId(), text, fear: draftFear }] },
    )
    setDraft(null)
    setDraftFear(5)
    setSmallerThan(null)
  }

  const remove = (id: string) => updateBarrio((b) => ({ ladder: b.ladder.filter((s) => s.id !== id) }))

  const toLadder = () => {
    setChosen(null)
    setDraft(null)
    setOwn(false)
    setSmallerThan(null)
    setStage('ladder')
  }

  // Bajar un escalón: el que sigue más fácil, o armar uno más chiquito.
  const down = () => {
    if (!current) return
    const below = open.filter((s) => ladder.indexOf(s) < ladder.indexOf(current)).at(-1)
    if (below) {
      setChosen(below.id)
      setStage('ladder')
    } else {
      setSmallerThan(current.text)
      setDraft(null)
      setOwn(false)
      setStage('build')
    }
  }

  const did = () => {
    if (!current) return
    updateBarrio((b) => ({ ladder: b.ladder.map((s) => (s.id === current.id ? { ...s, done: today() } : s)) }))
    setEventId(logEvent({ kind: 'escalon', step: current.text, expected: current.fear }))
    setDoneStep({ text: current.text, expected: current.fear })
    setFelt(current.fear)
    setStage('felt')
  }

  const report = () => {
    amendEvent(eventId, { felt })
    setStage('reflect')
  }

  const expected = doneStep?.expected ?? 0
  const reflection =
    felt < expected
      ? `Esperabas un ${expected} y sentiste un ${felt}. Muchas veces el miedo es menor de lo que esperabas, y eso solo se descubre haciéndolo. Lo descubriste tú.`
      : felt === expected
        ? 'Fue más o menos lo que esperabas, y aun así lo hiciste. Eso es de valientes.'
        : 'Dio más miedo de lo que pensabas, y aun así lo hiciste. Eso cuenta mucho. La próxima vez puedes repetir este escalón o bajar uno: no hay prisa.'

  const breatheLine = (
    <p className="muted small">
      Si el miedo se pone muy alto, está bien parar y respirar. Eso no es echarse para atrás.{' '}
      <Link to="/calma">Respirar en Calma</Link>
    </p>
  )

  const steps = (opts: { pick?: boolean; edit?: boolean }) => (
    <ol className="bm-ladder" aria-label="Tu escalera, de la más fácil a la más difícil">
      {ladder.map((s, i) => {
        const here = opts.pick && current?.id === s.id
        const body = (
          <>
            <span className="bm-fear-badge" aria-label={`miedo esperado ${s.fear}`}>
              {s.fear}
            </span>
            <span className="bm-step-text">{s.text}</span>
            {s.done && <Check size={18} className="bm-step-done" aria-label="hecho" />}
          </>
        )
        return (
          <li key={s.id} style={{ '--i': i } as CSSProperties} className={`${s.done ? 'done' : ''}${here ? ' here' : ''}`}>
            {opts.pick ? (
              <button type="button" className="bm-step" aria-pressed={here} onClick={() => setChosen(s.id)}>
                {body}
              </button>
            ) : (
              <div className="bm-step">{body}</div>
            )}
            {opts.edit && (
              <button type="button" className="bm-remove" aria-label={`Quitar «${s.text}»`} onClick={() => remove(s.id)}>
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )

  const suggestions = (smallerThan ? smallerOf(smallerThan) : SUGGESTED).filter(
    (t) => !barrio.ladder.some((s) => s.text === t),
  )

  return (
    <Flow label="La ruta del mercado con Don Beto">
      <Says who="beto">
        {stage === 'intro' &&
          (ladder.length ? (
            <p>¡Qué gusto, marchante! Aquí está tu escalera, como la dejaste. {petName} ya trae la bolsa del mandado.</p>
          ) : (
            <p>
              ¡Pásele! Hay cosas que dan nervios aunque parezcan chiquitas, y le pasa a mucha gente. Cuando las evitamos,
              el miedo crece; cuando las hacemos de a poquito, suele ir bajando. Aquí armas tu escalera con pasos de tu
              vida, del más fácil al más difícil. Tú decides cuáles y a qué ritmo.
            </p>
          ))}
        {stage === 'build' &&
          (smallerThan ? (
            <p>
              Bajemos un escalón. ¿Qué sería algo más chiquito que «{lower(smallerThan)}»? Por ejemplo, hacerlo con
              alguien o solo un ratito.
            </p>
          ) : ladder.length ? (
            <p>Así va tu escalera. Puedes poner hasta seis escalones, y quitar los que ya no quieras.</p>
          ) : (
            <p>Piensa en algo que te dé nervios y que te gustaría poder hacer. Empieza por lo más fácil.</p>
          ))}
        {stage === 'ladder' &&
          (current ? (
            <p>
              El que sigue: «{lower(current.text)}». Esperas un miedo de {current.fear}. Si quieres otro, tócalo en la
              escalera.
              {heavy && ' Hoy que pesa, puedes quedarte con el más fácil o dejarlo para otro día. Las dos cosas valen.'}
            </p>
          ) : (
            <p>¡Subiste toda tu escalera! Puedes repetir un escalón tocándolo, o armar otros nuevos.</p>
          ))}
        {stage === 'doing' && current && (
          <p>
            Va: «{lower(current.text)}». Ve y hazlo de verdad, a tu ritmo; aquí te espero con {petName}. Si da miedo,
            es normal: no tiene que salir perfecto.
          </p>
        )}
        {stage === 'felt' && (
          <p>
            {pending && eventId === pending.id ? '¡Volviste! ' : '¡Lo hiciste! '}
            ¿Cuánto miedo sentiste de verdad{doneStep ? ` con «${lower(doneStep.text)}»` : ''}?
          </p>
        )}
        {stage === 'reflect' && (
          <p>
            {reflection} Cada vez que lo haces, el cuerpo va aprendiendo que puede con eso.
          </p>
        )}
      </Says>

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => (ladder.length ? toLadder() : setStage('build'))}>
            {ladder.length ? 'Ver mi escalera' : 'Armar mi escalera'}
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'build' && (
        <>
          {ladder.length > 0 && steps({ edit: true })}
          {riskSeen && <RiskNotice />}

          {barrio.ladder.length >= MAX_STEPS ? (
            <p className="muted small">
              Tu escalera ya tiene seis escalones{smallerThan ? '. Si quieres poner uno más chiquito, quita otro' : ''}.
            </p>
          ) : draft ? (
            <div className="bm-draft">
              <p className="bm-draft-text">{draft}</p>
              <FearScale label="¿Cuánto miedo crees que te daría?" value={draftFear} onChange={setDraftFear} />
              <div className="row">
                <button type="button" className="btn" onClick={() => add(draft)}>
                  Ponerlo en la escalera
                </button>
                <button type="button" className="btn ghost" onClick={() => setDraft(null)}>
                  Mejor otro
                </button>
              </div>
            </div>
          ) : own ? (
            <OwnText
              label="Un paso con tus palabras"
              placeholder="Por ejemplo: ir a la tiendita sin compañía"
              submit="Este"
              maxLength={60}
              onCancel={() => setOwn(false)}
              onSubmit={(text, risk) => {
                setOwn(false)
                // Si sonó a riesgo, no se guarda en la escalera; el aviso se queda a la vista.
                if (risk) return setRiskSeen(true)
                setDraft(text)
              }}
            />
          ) : (
            <>
              <div className="chips">
                {suggestions.map((t) => (
                  <button key={t} type="button" className="chip" onClick={() => setDraft(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="row">
                <button type="button" className="btn small ghost" onClick={() => setOwn(true)}>
                  Otro, con mis palabras
                </button>
              </div>
            </>
          )}

          <div className="row">
            {ladder.length > 0 && !draft && !own && (
              <button type="button" className="btn" onClick={toLadder}>
                Lista mi escalera
              </button>
            )}
            {ladder.length === 0 && <NotNow onClose={onClose} />}
          </div>
        </>
      )}

      {stage === 'ladder' && (
        <>
          {steps({ pick: true })}
          <div className="row">
            {current && (
              <button type="button" className="btn" onClick={() => setStage('doing')}>
                Voy a hacerlo
              </button>
            )}
            {current && !current.done && (
              <button type="button" className="btn ghost" onClick={down}>
                Bajar un escalón
              </button>
            )}
          </div>
          <div className="row">
            <button type="button" className="btn small ghost" onClick={() => setStage('build')}>
              Cambiar mi escalera
            </button>
            <button type="button" className="btn small ghost" onClick={onLater}>
              Hoy no
            </button>
          </div>
        </>
      )}

      {stage === 'doing' && (
        <>
          {breatheLine}
          <div className="row">
            <button type="button" className="btn" onClick={did}>
              Ya lo hice
            </button>
            <button type="button" className="btn ghost" onClick={onLater}>
              Hoy no
            </button>
          </div>
          {current && !current.done && (
            <div className="row">
              <button type="button" className="btn small ghost" onClick={down}>
                Bajar un escalón
              </button>
            </div>
          )}
        </>
      )}

      {stage === 'felt' && (
        <>
          <FearScale label="El miedo que sentiste" value={felt} onChange={setFelt} />
          {doneStep && <p className="muted small">Antes esperabas un {doneStep.expected}.</p>}
          <div className="row">
            <button type="button" className="btn" onClick={report}>
              Esto sentí
            </button>
          </div>
        </>
      )}

      {stage === 'reflect' && (
        <>
          {felt >= 8 && breatheLine}
          <Thanks to="Don Beto" onDone={onDone} />
        </>
      )}
    </Flow>
  )
}
