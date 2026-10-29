import { useEffect, useRef, useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import NerviosArt from '../components/NerviosArt'
import PageHeader, { BackLink } from '../components/PageHeader'
import PetSays from '../components/PetSays'
import { FEAR_CIRCLE, LESSONS, type Lesson, SENSATIONS, lessonById } from '../data/nervios'
import { useStored } from '../lib/storage'
import './nervios.css'

// «Entender mis nervios»: seis lecciones cortas sobre el pánico, gratis y sin examen. Al terminar
// una se marca con una palomita suave; no hay puntos, rachas ni orden obligatorio.

const READ_KEY = 'nervios-leidas'

/** El círculo del miedo: se toca cada paso para ver cómo se alimenta el siguiente. */
function FearCircle() {
  const [current, setCurrent] = useState<number | null>(null)
  const [seen, setSeen] = useState<number[]>([])
  const open = (i: number) => {
    setCurrent(i)
    setSeen((prev) => (prev.includes(i) ? prev : [...prev, i]))
  }
  const all = seen.length === FEAR_CIRCLE.length
  const step = current === null ? null : FEAR_CIRCLE[current]

  return (
    <div className="nv-circle-wrap">
      <div className="nv-circle" role="group" aria-label="El círculo del miedo">
        {FEAR_CIRCLE.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`nv-node nv-node-${i}${current === i ? ' on' : ''}${seen.includes(i) ? ' seen' : ''}`}
            aria-pressed={current === i}
            onClick={() => open(i)}
          >
            <span className="nv-node-n" aria-hidden="true">
              {i + 1}
            </span>
            {s.label}
          </button>
        ))}
        <span className="nv-circle-mid" aria-hidden="true">
          <RefreshCw size={26} strokeWidth={2} />
        </span>
      </div>
      <div className="nv-explain" aria-live="polite">
        {step ? (
          <p>
            <strong>{step.label}.</strong> {step.text}
          </p>
        ) : (
          <p className="muted">Empieza por el 1.</p>
        )}
        {all && <p className="nv-loop">Y vuelve a empezar. Así, una sensación pequeña se vuelve un ataque de pánico.</p>}
      </div>
    </div>
  )
}

/** Lo que es cada sensación: se tocan las que le pasan a la persona. */
function Sensations() {
  const [current, setCurrent] = useState<string | null>(null)
  const [heartChecked] = useStored('corazon-revisado', false)
  const item = SENSATIONS.find((s) => s.id === current)
  return (
    <div className="stack tight">
      <div className="chips" role="group" aria-label="Lo que sientes">
        {SENSATIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${current === s.id ? 'selected' : ''}`}
            aria-pressed={current === s.id}
            onClick={() => setCurrent(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="nv-explain" aria-live="polite">
        {item ? (
          <>
            <p>{item.text}</p>
            {item.id === 'corazon' && heartChecked && (
              <p className="muted small">Y tu corazón ya fue revisado y salió bien.</p>
            )}
          </>
        ) : (
          <p className="muted">Toca una para ver qué es.</p>
        )}
      </div>
    </div>
  )
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate()
  const [screen, setScreen] = useState(0)
  const [finished, setFinished] = useState(false)
  const [, setRead] = useStored<string[]>(READ_KEY, [])
  const title = useRef<HTMLHeadingElement>(null)
  const shown = useRef(`${screen}-${finished}`)
  const n = LESSONS.indexOf(lesson)
  const next = LESSONS[n + 1]
  const current = lesson.screens[screen]
  const last = screen === lesson.screens.length - 1

  // Cada pantalla nueva empieza arriba, con el foco en su título.
  useEffect(() => {
    const now = `${screen}-${finished}`
    if (shown.current === now) return
    shown.current = now
    window.scrollTo(0, 0)
    title.current?.focus({ preventScroll: true })
  }, [screen, finished])

  const finish = () => {
    setRead((prev) => (prev.includes(lesson.id) ? prev : [...prev, lesson.id]))
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="stack">
        <BackLink />
        <section className="card nv-end">
          <p className="eyebrow">
            <Check size={14} strokeWidth={2.5} aria-hidden="true" /> Lección leída
          </p>
          <h1 ref={title} tabIndex={-1}>
            {lesson.title}
          </h1>
          <PetSays mood={lesson.endMood ?? 'feliz'}>{lesson.end}</PetSays>
          {next && (
            <button className="btn big" onClick={() => navigate(`/nervios?leccion=${next.id}`, { replace: true })}>
              Siguiente: {next.title}
            </button>
          )}
          <Link to="/nervios" replace className={next ? 'btn ghost' : 'btn big'}>
            Ver todas las lecciones
          </Link>
          <button className="btn ghost" onClick={() => { setScreen(0); setFinished(false) }}>
            Leerla otra vez
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="row spread">
        <BackLink />
        <div className="nv-dots" aria-hidden="true">
          {lesson.screens.map((_, i) => (
            <span key={i} className={i === screen ? 'on' : i < screen ? 'past' : ''} />
          ))}
        </div>
      </div>
      <section className="card nv-screen" aria-labelledby="nv-screen-title">
        <p className="eyebrow">
          Lección {n + 1} · {lesson.title}
        </p>
        <div className="nv-art-box">
          <NerviosArt art={current.art} />
        </div>
        <h1 id="nv-screen-title" ref={title} tabIndex={-1}>
          {current.title}
        </h1>
        <p className="nv-text">{current.text}</p>
        {current.interactive === 'circulo' && <FearCircle />}
        {current.interactive === 'sensaciones' && <Sensations />}
        {current.note && <p className="callout info small">{current.note}</p>}
        {current.links && (
          <div className="row">
            {current.links.map((l) => (
              <Link key={l.to} to={l.to} className="btn small ghost">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </section>
      <button className="btn big" onClick={() => (last ? finish() : setScreen(screen + 1))}>
        {last ? 'Terminé' : 'Siguiente'}
      </button>
      {screen > 0 && (
        <button className="btn ghost" onClick={() => setScreen(screen - 1)}>
          Volver a la pantalla anterior
        </button>
      )}
    </div>
  )
}

export default function Nervios() {
  const [params] = useSearchParams()
  const lesson = lessonById(params.get('leccion'))
  const [read] = useStored<string[]>(READ_KEY, [])

  if (lesson) return <LessonView key={lesson.id} lesson={lesson} />

  return (
    <div className="stack">
      <PageHeader
        title="Entender mis nervios"
        subtitle="Seis lecciones de unos dos minutos sobre el pánico. Léelas con calma, en el orden que quieras."
      />
      <PetSays>El pánico asusta menos cuando entiendes qué es. ¿Vemos una juntos?</PetSays>
      <ol className="nv-list">
        {LESSONS.map((l, i) => {
          const done = read.includes(l.id)
          return (
            <li key={l.id}>
              <Link to={`/nervios?leccion=${l.id}`} className={`card link-card nv-lesson${done ? ' done' : ''}`}>
                <span className="nv-num" aria-hidden="true">
                  {done ? <Check size={18} strokeWidth={2.5} /> : i + 1}
                </span>
                <div className="nv-lesson-text">
                  <h2>{l.title}</h2>
                  <p className="muted small">
                    {l.short}
                    {done && <span className="visually-hidden"> Ya la leíste.</span>}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
      <Link to="/nervios/practicar" className="card link-card soft">
        <h2>Practicar con el cuerpo</h2>
        <p className="muted">Ejercicios cortos para perderle el miedo a lo que el pánico hace sentir.</p>
      </Link>
      <p className="disclaimer">
        Esto es para entender, no sustituye una consulta. Si tienes dudas sobre tu salud, consulta a tu médico.
      </p>
    </div>
  )
}
