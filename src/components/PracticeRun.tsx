import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PetSays from './PetSays'
import type { CompanionMood } from '../data/companion'
import { ALIKE, type Alike, type Exercise, type ExerciseId, HEALTH_QUESTIONS, type HealthId, SAFETY } from '../data/practica'
import { type PracticeRecord, fearTrend, fearWord, recordsOf, useHealthOk, usePractice } from '../lib/practica'
import { localDate } from '../lib/storage'
import './practica.css'

// Un ejercicio de Practicar con el cuerpo, de principio a fin: cuánto miedo da antes, el
// ejercicio con su anillo (dura lo que dura el ejercicio; no es un reloj de juego), un botón
// para parar siempre a la mano y, al final, si se pareció y cuánto miedo hubo. Se usa en
// /nervios/practicar y puede usarse en otras partes (por ejemplo, en el barrio) envuelto en
// <HealthGate>, que se encarga del filtro de salud.

type Speak = (text: string, mood?: CompanionMood) => ReactNode
const petSpeak: Speak = (text, mood = 'calma') => (
  <PetSays mood={mood} compact>
    {text}
  </PetSays>
)

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Miedo de 0 (nada) a 10 (muchísimo). Es cómo se siente, no una calificación. */
function FearScale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const id = useId()
  return (
    <div className="pr-fear">
      <label htmlFor={id} className="pr-fear-label">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        aria-valuetext={`${value}, ${fearWord(value)}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="pr-fear-scale" aria-hidden="true">
        <span>nada</span>
        <b>
          {value} · {fearWord(value)}
        </b>
        <span>muchísimo</span>
      </div>
    </div>
  )
}

/** El dibujo de cada ejercicio. Se mueve suave mientras dura, si no se pidió menos movimiento. */
export function ExerciseArt({ id, moving = false }: { id: ExerciseId; moving?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={`pr-art pr-art-${id}${moving ? ' pr-moving' : ''}`} aria-hidden="true">
      {id === 'cabeza' && (
        <>
          <path className="pr-arrow" d="M18 46 q-8 14 0 28 M14 70 l4 5 l5 -4" />
          <path className="pr-arrow" d="M102 46 q8 14 0 28 M106 70 l-4 5 l-5 -4" />
          <g className="pr-sway">
            <rect className="pr-skin" x="48" y="78" width="24" height="22" rx="8" />
            <circle className="pr-skin" cx="60" cy="56" r="26" />
            <circle className="pr-eye" cx="51" cy="54" r="3" />
            <circle className="pr-eye" cx="69" cy="54" r="3" />
            <path className="pr-line" d="M53 66 q7 4 14 0" />
          </g>
        </>
      )}
      {id === 'aguantar' && (
        <>
          <circle className="pr-skin" cx="60" cy="60" r="32" />
          <circle className="pr-cheek pr-puff" cx="40" cy="68" r="9" />
          <circle className="pr-cheek pr-puff" cx="80" cy="68" r="9" />
          <path className="pr-line" d="M46 52 h10 M64 52 h10" />
          <circle className="pr-mouth" cx="60" cy="74" r="4" />
          <rect className="pr-accent" x="94" y="22" width="6" height="18" rx="3" />
          <rect className="pr-accent" x="104" y="22" width="6" height="18" rx="3" />
        </>
      )}
      {id === 'correr' && (
        <>
          <circle className="pr-skin" cx="60" cy="24" r="12" />
          <rect className="pr-body" x="50" y="38" width="20" height="34" rx="9" />
          <g className="pr-legs">
            <rect className="pr-body pr-leg-a" x="50" y="68" width="9" height="34" rx="4.5" />
            <rect className="pr-body pr-leg-b" x="61" y="68" width="9" height="34" rx="4.5" />
          </g>
          <path className="pr-arrow" d="M28 50 h12 M24 62 h14 M28 74 h12" />
          <path className="pr-heart" d="M88 40 c-6 -8 -18 -2 -12 8 l12 11 l12 -11 c6 -10 -6 -16 -12 -8z" />
        </>
      )}
      {id === 'popote' && (
        <>
          <circle className="pr-skin" cx="52" cy="60" r="32" />
          <path className="pr-line" d="M38 52 h10 M58 52 h10" />
          <rect className="pr-straw" x="58" y="70" width="52" height="7" rx="3.5" transform="rotate(-18 58 74)" />
          <circle className="pr-mouth" cx="56" cy="76" r="4" />
          <g className="pr-breath">
            <circle className="pr-air" cx="108" cy="50" r="3" />
            <circle className="pr-air" cx="100" cy="44" r="2" />
          </g>
        </>
      )}
      {id === 'girar' && (
        <>
          <rect className="pr-wall" x="100" y="10" width="12" height="100" rx="4" />
          <ellipse className="pr-orbit" cx="52" cy="60" rx="36" ry="12" />
          <g className="pr-turn">
            <circle className="pr-skin" cx="52" cy="28" r="12" />
            <rect className="pr-body" x="42" y="42" width="20" height="56" rx="9" />
          </g>
          <path className="pr-arrow" d="M80 66 l8 -2 l-2 8" />
        </>
      )}
    </svg>
  )
}

/** Cómo ha ido el miedo de antes, cada vez, para un ejercicio. Sin metas ni números grandes. */
export function FearHistory({ records, id }: { records: PracticeRecord[]; id: ExerciseId }) {
  const mine = recordsOf(records, id).slice(-8)
  if (mine.length < 2) return null
  const values = mine.map((r) => r.before)
  return (
    <figure className="pr-history">
      <div
        className="pr-bars"
        role="img"
        aria-label={`El miedo antes de empezar, de la vez más antigua a la más reciente: ${values.join(', ')}`}
      >
        {values.map((v, i) => (
          <span key={i} style={{ height: `${8 + v * 9}%` }} />
        ))}
      </div>
      <figcaption className="muted small">El miedo antes de empezar, cada vez que lo practicaste</figcaption>
    </figure>
  )
}

/** El anillo: cuánto falta del ejercicio, sin números. */
function Ring({ progress, children }: { progress: number; children: ReactNode }) {
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div className="pr-ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="pr-ring-track" cx="80" cy="80" r={r} />
        <circle
          className="pr-ring-fill"
          cx="80"
          cy="80"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      <div className="pr-ring-in">{children}</div>
    </div>
  )
}

type Phase = 'before' | 'run' | 'after' | 'done'

type Props = {
  exercise: Exercise
  /** Al terminar: con lo que se guardó, o con null si dijo «hoy no». */
  onDone?: (record: PracticeRecord | null) => void
  /** Quién acompaña. Por omisión, la mascota de la persona. */
  speak?: Speak
}

export default function PracticeRun({ exercise, onDone, speak = petSpeak }: Props) {
  const { records, add } = usePractice()
  const [phase, setPhase] = useState<Phase>('before')
  const [before, setBefore] = useState(5)
  const [during, setDuring] = useState(5)
  const [alike, setAlike] = useState<Alike | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [saved, setSaved] = useState<PracticeRecord | null>(null)
  const [still] = useState(reduced)
  const total = exercise.seconds * 1000
  const box = useRef<HTMLElement>(null)
  const shown = useRef(phase)

  // Al cambiar de paso, el foco va al título nuevo (no al aparecer: ahí manda la página).
  useEffect(() => {
    if (shown.current === phase) return
    shown.current = phase
    box.current?.querySelector<HTMLElement>('[data-focus]')?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== 'run') return
    const start = performance.now()
    const timer = setInterval(() => {
      const t = performance.now() - start
      setElapsed(Math.min(t, total))
      if (t >= total) {
        clearInterval(timer)
        setPhase('after')
      }
    }, 250)
    return () => clearInterval(timer)
  }, [phase, total])

  const begin = () => {
    setElapsed(0)
    setStopped(false)
    setAlike(null)
    setDuring(before)
    setPhase('run')
  }

  const stop = () => {
    setStopped(true)
    setPhase('after')
  }

  const save = () => {
    if (!alike) return
    const record: PracticeRecord = { id: exercise.id, date: localDate(), before, during, alike, ...(stopped ? { stopped } : {}) }
    add(record)
    setSaved(record)
    setPhase('done')
  }

  if (phase === 'before') {
    return (
      <section ref={box} className="card pr-card" aria-labelledby={`pr-${exercise.id}`}>
        <div className="pr-head">
          <ExerciseArt id={exercise.id} />
          <div>
            <h2 id={`pr-${exercise.id}`} tabIndex={-1} data-focus>{exercise.name}</h2>
            <p className="muted small">
              {exercise.seconds} segundos · suele traer {exercise.feels}
            </p>
          </div>
        </div>
        <ol className="pr-how">
          {exercise.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
        {exercise.care && <p className="muted small">{exercise.care}</p>}
        <FearScale label="¿Cuánto miedo te da hacerlo?" value={before} onChange={setBefore} />
        <button className="btn big" onClick={begin}>
          Empezar
        </button>
        {onDone && (
          <button className="btn ghost" onClick={() => onDone(null)}>
            Hoy no
          </button>
        )}
      </section>
    )
  }

  if (phase === 'run') {
    return (
      <section ref={box} className="card pr-card center" aria-label={exercise.name}>
        <h2 tabIndex={-1} data-focus>
          {exercise.name}
        </h2>
        <Ring progress={elapsed / total}>
          <ExerciseArt id={exercise.id} moving={!still} />
        </Ring>
        <div aria-live="polite">{speak(exercise.during)}</div>
        <button className="btn big ghost" onClick={stop}>
          Parar
        </button>
        <p className="muted small">Puedes parar cuando quieras.</p>
      </section>
    )
  }

  if (phase === 'after') {
    return (
      <section ref={box} className="card pr-card" aria-labelledby={`pr-after-${exercise.id}`}>
        <h2 id={`pr-after-${exercise.id}`} tabIndex={-1} data-focus>
          {stopped ? 'Paraste, y está bien.' : 'Listo, ya pasó.'}
        </h2>
        <p className="muted">Respira normal un momento. Luego, si quieres, cuéntame cómo fue.</p>
        <fieldset className="pr-q">
          <legend>¿Se pareció a tu pánico?</legend>
          <div className="chips" role="radiogroup" aria-label="¿Se pareció a tu pánico?">
            {ALIKE.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={alike === a.id}
                className={`chip ${alike === a.id ? 'selected' : ''}`}
                onClick={() => setAlike(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </fieldset>
        <FearScale label="¿Cuánto miedo hubo?" value={during} onChange={setDuring} />
        <button className="btn big" onClick={save} disabled={!alike}>
          Guardar cómo fue
        </button>
        <p className="muted small">Se guarda solo en este teléfono.</p>
      </section>
    )
  }

  const message = stopped
    ? 'Paraste cuando lo necesitaste, y eso también es practicar. La próxima vez, si quieres, unos segundos más.'
    : during < before
      ? 'Le tenías más miedo antes que durante. Así pasa muchas veces: el miedo exagera lo que viene.'
      : alike === 'mucho'
        ? 'Se pareció a tu pánico, y aquí sigues. Lo sentiste y pasó solo.'
        : 'Lo hiciste. Tu cuerpo sintió eso y regresó a su ritmo.'
  const trend = fearTrend(records, exercise.id)

  return (
    <section ref={box} className="card pr-card" aria-label="Cómo te fue">
      <h2 tabIndex={-1} data-focus>
        Lo practicaste
      </h2>
      {speak(message, 'feliz')}
      {trend && <p>{trend}</p>}
      <FearHistory records={records} id={exercise.id} />
      <button className="btn" onClick={() => setPhase('before')}>
        Hacerlo otra vez
      </button>
      {onDone && (
        <button className="btn ghost" onClick={() => onDone(saved)}>
          Terminar
        </button>
      )}
    </section>
  )
}

/** El filtro de salud: se contesta una vez, antes del primer ejercicio. */
export function HealthFilter() {
  const { save } = useHealthOk()
  const [yes, setYes] = useState<HealthId[]>([])
  const toggle = (id: HealthId) => setYes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <section className="card pr-card" aria-labelledby="pr-salud">
      <h2 id="pr-salud">Antes de empezar, tu salud</h2>
      <p className="muted">
        Estos ejercicios agitan un poco al cuerpo. Marca si tienes o has tenido alguna de estas cosas:
      </p>
      <div className="pr-health">
        {HEALTH_QUESTIONS.map((q) => (
          <label key={q.id} className="toggle pr-health-item">
            <input type="checkbox" checked={yes.includes(q.id)} onChange={() => toggle(q.id)} />
            {q.label}
          </label>
        ))}
      </div>
      <button className="btn big" onClick={() => save(yes)}>
        {yes.length ? 'Listo' : 'No tengo ninguna'}
      </button>
      <p className="muted small">Se guarda solo en este teléfono, y puedes cambiarlo cuando quieras.</p>
    </section>
  )
}

/** Muestra lo de adentro solo si ya pasó el filtro de salud; si no, el filtro o el aviso amable. */
export function HealthGate({ children }: { children: ReactNode }) {
  const { health, checked, ok, reset } = useHealthOk()
  if (!checked) return <HealthFilter />
  if (!ok) {
    return (
      <section className="card pr-card" aria-labelledby="pr-no">
        <h2 id="pr-no">Por ahora, mejor no</h2>
        <p>
          Con lo que marcaste, estos ejercicios podrían no ser buena idea sin que lo sepa tu médico.
          Primero platícalo con tu médico: muchas veces se pueden adaptar.
        </p>
        <p className="muted">Mientras, hay mucho que sí te puede ayudar:</p>
        <div className="stack tight">
          <Link to="/nervios" className="btn ghost">
            Entender mis nervios
          </Link>
          <Link to="/panico" className="btn ghost">
            La guía de pánico
          </Link>
          <Link to="/calma" className="btn ghost">
            Respirar en Calma
          </Link>
          <Link to="/especialista" className="btn ghost">
            Preparar mi consulta
          </Link>
        </div>
        <button className="btn small ghost" onClick={reset}>
          Cambiar mis respuestas
        </button>
        {health && <p className="muted small">Lo contestaste el {health.date.split('-').reverse().join('/')}.</p>}
      </section>
    )
  }
  return <>{children}</>
}

/** Lo que vale para todos los ejercicios: dónde hacerlos y cuándo parar. */
export function PracticeSafety() {
  return (
    <section className="callout info pr-safety" aria-label="Para cuidarte">
      <ul>
        {SAFETY.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  )
}
