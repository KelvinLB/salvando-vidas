import { useEffect, useRef, useState } from 'react'
import { ChevronDown, HandHelping, Star, Tag, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'
import HoleScene from '../../components/HoleScene'
import PageHeader from '../../components/PageHeader'
import PetSays from '../../components/PetSays'
import { type CompanionMood, DEFAULT_COMPANION, companionName } from '../../data/companion'
import {
  BREATHS,
  HEAVY_HINT,
  type HoleState,
  NAME_ASK,
  OUT_SAYS,
  PLACE,
  PLACES,
  RISK_HELLO,
  STEPS,
  type Step,
  afterBreath,
  handSays,
  namedSays,
  reasonSays,
  stillHere,
} from '../../data/hueco'
import { useCompanion } from '../../lib/companion'
import { type Climb, EXITS_KEY, type HoleExit, type HoleReading, readHole, useClimb } from '../../lib/hueco'
import { markMoment, useMoments } from '../../lib/moments'
import { firstName, usePeople } from '../../lib/people'
import { type JournalEntry, pick, read, store, today, useStored } from '../../lib/storage'

// Salir del hueco: su mascota está en un hueco que se parece a lo que trae hoy, y salen un
// escalón a la vez. No hay vidas, reloj, puntos ni rachas: nada se pierde ni se cae, y lo que
// construye se queda aunque salga de la pantalla. Con señales de riesgo, la ayuda va primero.

const ICONS = { respirar: Wind, nombrar: Tag, razon: Star, mano: HandHelping }

type Breath = { phase: 'in' | 'out'; count: number; round: number }

export default function Hueco() {
  const { companion, mood } = useCompanion()
  const look = companion ?? DEFAULT_COMPANION
  const name = companionName(look)
  const [climb, update] = useClimb()
  const [reading, setReading] = useState<HoleReading | null>(null)
  const [reasons] = useStored<JournalEntry[]>('razones', [])
  const { people } = usePeople()
  const { got } = useMoments()
  const [picking, setPicking] = useState(false)
  const [naming, setNaming] = useState(false)
  const [last, setLast] = useState<Step | null>(null)
  const [breath, setBreath] = useState<Breath | null>(null)
  const [fresh, setFresh] = useState<number | null>(null)
  const [firstOut, setFirstOut] = useState(false)
  // Si vuelve a media subida, la mascota le recuerda que lo que hizo sigue ahí.
  const resumed = useRef(climb.built.length > 0 && !climb.out)

  useEffect(() => {
    let live = true
    void readHole(name, mood).then((r) => live && setReading(r))
    return () => {
      live = false
    }
  }, [name, mood])

  const auto = reading?.state ?? null
  const state: HoleState = climb.state ?? auto ?? 'animo'
  const place = PLACE[state]
  const n = climb.built.length
  const out = !!climb.out
  const risk = !!reading?.risk
  const heavy = !!reading?.heavy
  const breaths = heavy ? BREATHS.heavy : BREATHS.light
  const face: CompanionMood = out ? 'feliz' : breath || n >= 2 ? 'calma' : place.mood
  const helper = people.find((p) => p.name.trim())
  const reason = reasons.find((r) => r.id === climb.reason)

  const build = (step: Step, patch: Partial<Climb> = {}) => {
    update({ ...patch, built: [...climb.built, step] })
    setLast(step)
    setNaming(false)
    setFresh(climb.built.length)
    resumed.current = false
  }

  // Con los cuatro escalones, sale. Si la persona se va justo antes, sale al volver.
  useEffect(() => {
    if (n < 4 || out) return
    const timer = setTimeout(() => {
      setFirstOut(!got.hueco)
      store(EXITS_KEY, [...read<HoleExit[]>(EXITS_KEY, []), { date: today(), state }].slice(-60))
      markMoment('hueco')
      update({ out: true })
      setLast(null)
    }, 1400)
    return () => clearTimeout(timer)
  }, [n, out])

  // Respirar: 4 segundos para tomar aire y 6 para soltarlo, una vez o tres según el día.
  useEffect(() => {
    if (!breath) return
    const timer = setTimeout(() => {
      if (breath.count > 1) return setBreath({ ...breath, count: breath.count - 1 })
      if (breath.phase === 'in') return setBreath({ ...breath, phase: 'out', count: 6 })
      if (breath.round < breaths) return setBreath({ phase: 'in', count: 4, round: breath.round + 1 })
      setBreath(null)
      build('respirar')
    }, 1000)
    return () => clearTimeout(timer)
  }, [breath])

  const act = (step: Step) => {
    if (out || breath || climb.built.includes(step)) return
    setLast(null)
    if (step === 'respirar') {
      setNaming(false)
      setBreath({ phase: 'in', count: 4, round: 1 })
    } else if (step === 'nombrar') {
      setNaming(true)
    } else if (step === 'razon') {
      build('razon', { reason: reasons.length ? pick(reasons).id : undefined })
    } else {
      build('mano')
    }
  }

  // Respirar una vez ya cuenta: puede terminar cuando quiera.
  const enough = () => {
    setBreath(null)
    build('respirar')
  }

  const choose = (next: HoleState) => {
    update({ state: next === auto ? undefined : next })
    setPicking(false)
    setNaming(false)
    setLast(null)
    resumed.current = n > 0
  }

  const again = () => {
    update({ built: [], named: undefined, reason: undefined, out: false })
    setLast(null)
    setFresh(null)
    setFirstOut(false)
    resumed.current = false
  }

  const says = breath
    ? breath.phase === 'in'
      ? `Toma aire… ${breath.count}`
      : `Suéltalo despacio… ${breath.count}`
    : out
      ? OUT_SAYS
      : naming
        ? NAME_ASK
        : last === 'respirar'
          ? afterBreath(place.weather)
          : last === 'nombrar'
            ? namedSays(climb.named ?? '')
            : last === 'razon'
              ? reasonSays(!!reason)
              : last === 'mano'
                ? handSays(helper ? firstName(helper) : 'Alguien de confianza')
                : risk
                  ? RISK_HELLO
                  : resumed.current
                    ? stillHere(n)
                    : place.hello
  const idle = !breath && !out && !naming && !last && !resumed.current

  return (
    <div className="stack">
      <PageHeader title="Salir del hueco" subtitle={`${name} y tú, un escalón a la vez. Aquí nada se pierde ni se cae.`} />

      {!reading ? (
        <div className="card hole-card" aria-busy="true">
          <div className="hole-wait" />
        </div>
      ) : (
        <section className="card hole-card" aria-label={`Salir del hueco con ${name}`}>
          {/* Con señales de riesgo, la ayuda va antes que el juego. */}
          {risk && !out && (
            <div className="callout warm hole-help">
              <p>Si ahorita sientes que no puedes con esto, hay alguien que puede escucharte en este momento.</p>
              <Link to="/ayuda" className="btn danger">
                Hablar con alguien ahora
              </Link>
            </div>
          )}

          <div className="hole-today">
            <span id="hole-q">¿Así te sientes hoy?</span>
            <button
              type="button"
              className="chip hole-place"
              aria-expanded={picking}
              aria-controls="hole-places"
              onClick={() => setPicking(!picking)}
            >
              <span className={`hole-dot ${state}`} aria-hidden="true" />
              {place.label}
              <span className="visually-hidden">. Cambiar</span>
              <ChevronDown className="hole-chevron" size={16} aria-hidden="true" />
            </button>
          </div>
          {picking && (
            <div className="chips hole-places" id="hole-places" role="radiogroup" aria-labelledby="hole-q">
              {PLACES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === state}
                  className={`chip${p.id === state ? ' selected' : ''}`}
                  onClick={() => choose(p.id)}
                >
                  <span className={`hole-dot ${p.id}`} aria-hidden="true" />
                  {p.label}
                  {p.id === auto && <small className="hole-auto">según tus registros</small>}
                </button>
              ))}
            </div>
          )}

          <HoleScene
            look={look}
            name={name}
            place={place}
            built={climb.built}
            named={climb.named}
            out={out}
            rope={risk}
            breath={breath?.phase ?? null}
            face={face}
            fresh={fresh}
          />

          <PetSays mood={face} compact>
            <p aria-live="polite">{says}</p>
            {breath && (
              <div className="row hole-breath">
                {breaths > 1 && (
                  <span className="muted small">
                    Respiración {breath.round} de {breaths}
                  </span>
                )}
                <button type="button" className="btn small ghost" onClick={enough}>
                  Ya, con esto
                </button>
              </div>
            )}
            {naming && (
              <div className="chips hole-feelings">
                {place.feelings.map((f) => (
                  <button key={f} type="button" className="chip" onClick={() => build('nombrar', { named: f })}>
                    {f}
                  </button>
                ))}
              </div>
            )}
            {last === 'razon' &&
              (reason ? (
                <>
                  <p className="hole-reason">{reason.text}</p>
                  <p className="muted small">La guardaste en tu caja de esperanza.</p>
                </>
              ) : (
                <Link to="/mi-espacio/caja" className="btn small ghost">
                  Guardar una razón para seguir
                </Link>
              ))}
            {last === 'mano' && !helper && (
              <Link to="/mi-espacio/personas" className="btn small ghost">
                Anotar a alguien de confianza
              </Link>
            )}
            {idle && risk && <p className="muted small">La cuerda ya está aquí. Cuando quieras, también respiro contigo.</p>}
            {idle && heavy && !risk && <p className="muted small">{HEAVY_HINT}</p>}
            {out && (
              <>
                {firstOut && companion && (
                  <p className="muted small">
                    Este día se guardó en «Nuestros momentos», y en el rincón de {name} ya hay una cuerda tejida.
                  </p>
                )}
                {!companion && <p className="muted small">Si creas tu mascota, será quien salga contigo del hueco.</p>}
                <div className="row">
                  <button type="button" className="btn small" onClick={again}>
                    Volver a jugar
                  </button>
                  <Link to="/mascota" className="btn small ghost">
                    {companion ? `Ver el rincón de ${name}` : 'Crear mi mascota'}
                  </Link>
                </div>
              </>
            )}
          </PetSays>

          {!out && (
            <div className="hole-actions">
              {STEPS.map(({ id, label }) => {
                const Icon = ICONS[id]
                const done = climb.built.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`hole-act${done ? ' done' : ''}${naming && id === 'nombrar' ? ' active' : ''}`}
                    disabled={done || !!breath}
                    onClick={() => act(id)}
                  >
                    <span className="hole-ico" aria-hidden="true">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span>{label}</span>
                    {done && <span className="visually-hidden">, hecho</span>}
                  </button>
                )
              })}
            </div>
          )}

          <div className="hole-foot">
            <span className="hole-steps" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={i < n ? 'on' : ''} />
              ))}
            </span>
            <span className="muted small">{out ? 'Afuera' : n === 0 ? 'En el fondo' : `${n} de 4 escalones`}</span>
          </div>
        </section>
      )}

      {reading && (
        <details className="card hole-why">
          <summary>¿Por qué se ve así?</summary>
          <ul>
            {climb.state && <li>Hoy lo cambiaste a «{place.label}».</li>}
            {reading.why.length ? (
              reading.why.map((w) => <li key={w}>{w}</li>)
            ) : (
              <li>
                Todavía no hay registros de estos días{climb.state ? '' : ', así que empezamos con «Ánimo bajo»'}. Si hoy es otra
                cosa, cámbialo arriba.
              </li>
            )}
            {heavy && <li>Como hoy pesa, los pasos son más chiquitos: con una respiración basta.</li>}
            {reading.locked && <li>Tu diario tiene clave: lo que marcas ahí se queda ahí.</li>}
          </ul>
          <p className="muted small">Todo se lee aquí, en tu teléfono. Nada sale de él.</p>
        </details>
      )}
    </div>
  )
}
