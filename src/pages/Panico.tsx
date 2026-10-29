import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '../components/PageHeader'
import PetSays from '../components/PetSays'
import {
  FEARS,
  HAPPENED,
  type Happened,
  type PanicPath,
  addPanicEntry,
  countPanicUse,
  fearSummary,
  suggestFacing,
  usePanicLog,
  usePanicUses,
} from '../lib/panico'
import { useStored } from '../lib/storage'
import { Breathing } from './Calma'

// Guía para atravesar un ataque de pánico. Frases cortas y letra grande:
// en plena crisis cuesta leer y pensar. Dos caminos: enfrentarlo (dejar que la ola suba y baje)
// o que la acompañen paso a paso. Se puede cambiar de camino a mitad.

type Step = { emoji: string; title: string; text: string; breathing?: boolean; wave?: boolean; feel?: boolean }

const ACOMPANAR: Step[] = [
  {
    emoji: '🫶',
    title: 'Esto es un ataque de pánico.',
    text: 'Se siente horrible, pero no es peligroso. El corazón a mil, el mareo, la falta de aire, el hormigueo o el entumecimiento son parte de la ansiedad. Va a pasar, normalmente en unos minutos.',
  },
  {
    emoji: '🌬️',
    title: 'Respira conmigo',
    text: 'Suelta el aire despacio, más largo de lo que lo tomas. No hace falta respirar hondo: lo que calma es soltar lento.',
    breathing: true,
  },
  {
    emoji: '💧',
    title: 'Algo frío',
    text: 'Mójate la cara, las muñecas y el cuello con agua fría, o sostén algo frío en las manos. El frío ayuda a bajar el ritmo del corazón.',
  },
  {
    emoji: '🦶',
    title: 'Tus pies en el suelo',
    text: 'Siente el piso bajo tus pies. Mira alrededor y nombra cinco cosas que ves, en voz alta o en tu mente.',
  },
  {
    emoji: '🗣️',
    title: 'Dite esto',
    text: '«Esto es ansiedad. Es incómodo, pero estoy a salvo. Mi cuerpo sabe calmarse y lo está haciendo.»',
  },
]

const ENFRENTAR: Step[] = [
  {
    emoji: '🌊',
    title: 'Sí, es pánico.',
    text: 'Lo reconoces. No hay que pelearlo ni huir de él: es una ola que sube, llega hasta arriba y baja sola.',
    wave: true,
  },
  { emoji: '👀', title: '¿Qué sientes?', text: 'Nómbralo como si lo describieras, sin asustarte.', feel: true },
  {
    emoji: '🤲',
    title: 'Déjalo estar.',
    text: 'Dile a tu cuerpo: «Haz lo que necesites, aquí te espero». Y suelta el aire despacio, más largo de lo que lo tomas.',
  },
  {
    emoji: '🌅',
    title: 'Ya va bajando.',
    text: 'Lo estás atravesando tú. Cada vez que lo haces, tu cuerpo aprende que puede solo.',
  },
]

const PATHS: Record<PanicPath, Step[]> = { enfrentar: ENFRENTAR, acompanar: ACOMPANAR }

const FEELS = ['El corazón rápido', 'Falta de aire', 'Mareo', 'Calor o frío', 'Hormigueo', 'Opresión en el pecho', 'Ganas de salir corriendo']

type Phase = 'inicio' | 'pasos' | 'final' | 'registro' | 'listo'

/** La ola: sube, llega hasta arriba y baja sola. Con movimiento reducido, el punto se queda quieto. */
function Wave() {
  // El punto va aparte del dibujo para que no se estire en pantallas anchas.
  const dot = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = dot.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let x = 0
    const timer = setInterval(() => {
      x = (x + 2) % 300
      el.style.left = `${(x / 300) * 100}%`
      el.style.top = `${((62 - 52 * Math.sin((Math.PI * x) / 300)) / 70) * 100}%`
    }, 60)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="panic-wave" aria-hidden="true">
      <svg viewBox="0 0 300 70" preserveAspectRatio="none">
        <path d="M0 62 C60 62 90 10 150 10 C210 10 240 62 300 62 L300 70 L0 70Z" />
      </svg>
      <span ref={dot} className="panic-wave-dot" style={{ left: '70%', top: '29%' }} />
    </div>
  )
}

function Feel() {
  const [felt, setFelt] = useState<string[]>([])
  return (
    <>
      <div className="chips panic-chips" role="group" aria-label="Lo que sientes">
        {FEELS.map((f) => (
          <button
            key={f}
            type="button"
            className={`chip ${felt.includes(f) ? 'selected' : ''}`}
            aria-pressed={felt.includes(f)}
            onClick={() => setFelt((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]))}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="panic-text" aria-live="polite">
        {felt.length > 0 && 'Eso es tu cuerpo preparándose para correr. Incómodo, no peligroso.'}
      </p>
    </>
  )
}

/** Para después, cuando ya esté en calma. */
function ForLater() {
  return (
    <div className="panic-later">
      <p className="muted small">Para otro día, en calma:</p>
      <div className="row">
        <Link to="/nervios" className="btn small ghost">
          Entender mis nervios
        </Link>
        <Link to="/juegos/desde-afuera" className="btn small ghost">
          Practicar desde afuera
        </Link>
      </div>
    </div>
  )
}

export default function Panico() {
  const [phase, setPhase] = useState<Phase>('inicio')
  const [path, setPath] = useState<PanicPath>('acompanar')
  const [step, setStep] = useState(0)
  const [fears, setFears] = useState<string[]>([])
  const [happened, setHappened] = useState<Happened | null>(null)
  const [saved, setSaved] = useState(false)
  // Una crisis se cuenta una vez, aunque pida repetir la guía.
  const counted = useRef(false)
  // Muchas personas ya fueron a urgencias y les dijeron que su corazón está bien.
  // Recordárselo en plena crisis ayuda a creerle a la guía.
  const [heartChecked, setHeartChecked] = useStored('corazon-revisado', false)
  const uses = usePanicUses()
  const log = usePanicLog()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [phase, path, step])

  const steps = PATHS[path]
  const current = steps[Math.min(step, steps.length - 1)]

  const go = (p: PanicPath) => {
    setPath(p)
    setStep(0)
    setPhase('pasos')
  }
  // Al cambiar a mitad: quien pide compañía llega directo a respirar; quien quiere enfrentarlo
  // empieza por reconocer la ola.
  const switchPath = () => {
    const next = path === 'enfrentar' ? 'acompanar' : 'enfrentar'
    setPath(next)
    setStep(next === 'acompanar' ? 1 : 0)
  }
  const finish = () => {
    if (!counted.current) countPanicUse(path)
    counted.current = true
    setPhase('final')
  }
  const repeat = () => {
    setStep(0)
    setPhase('inicio')
  }
  const save = () => {
    if (!fears.length || !happened) return
    addPanicEntry({ path, fears, happened })
    setSaved(true)
    setPhase('listo')
  }

  const heartCard = (
    <section className="card">
      <label className="toggle">
        <input type="checkbox" checked={heartChecked} onChange={(e) => setHeartChecked(e.target.checked)} />
        Ya me hicieron estudios del corazón y salieron bien
      </label>
      <p className="muted small">
        Si lo marcas, te lo recordaremos al empezar la próxima crisis. Ayuda saberlo cuando el miedo
        dice que es un infarto.
      </p>
    </section>
  )

  const disclaimer = (
    <p className="disclaimer">
      Si es la primera vez, si el dolor del pecho es fuerte o se va al brazo o la mandíbula, si te
      desmayas o tienes dudas, <Link to="/ayuda">llama a emergencias</Link>. Ir a revisarte no es
      exagerar.
    </p>
  )

  if (phase === 'inicio') {
    return (
      <div className="stack panic">
        <BackLink />
        <section className="card center" aria-live="polite">
          <h1>Estoy contigo.</h1>
          <p className="panic-text">
            Esto es un ataque de pánico. Se siente horrible, pero no es peligroso. ¿Cómo quieres atravesarlo?
          </p>
          {heartChecked && (
            <p className="callout info panic-text">💚 Tu corazón ya fue revisado y salió bien. Esto es ansiedad.</p>
          )}
        </section>
        <div className="panic-paths">
          <button type="button" className="panic-path" onClick={() => go('enfrentar')}>
            <strong>Quiero enfrentarlo</strong>
            <span>Dejo que la ola suba y baje.</span>
          </button>
          <button type="button" className="panic-path" onClick={() => go('acompanar')}>
            <strong>Necesito que me acompañen</strong>
            <span>Paso a paso, juntos.</span>
          </button>
        </div>
        {suggestFacing(uses) && (
          <p className="panic-nudge">Ya lo has atravesado varias veces. Esta vez, ¿quieres probar enfrentarlo?</p>
        )}
        <p className="muted small center">Las dos sirven. Puedes cambiar de camino cuando quieras.</p>
        {disclaimer}
      </div>
    )
  }

  if (phase === 'final') {
    return (
      <div className="stack panic">
        <BackLink />
        <section className="card center">
          <p className="big-emoji">🌿</p>
          <h1>¿Cómo vas?</h1>
          <p className="muted">Lo atravesaste. Date un momento antes de seguir con tu día.</p>
          <button className="btn big" onClick={() => setPhase('registro')}>
            Ya pasó
          </button>
          <button className="btn big ghost" onClick={repeat}>
            Necesito repetirlo
          </button>
          <Link to="/ayuda" className="btn big ghost">
            Sigo mal, quiero hablar con alguien
          </Link>
          <Link to="/cuerpo?ver=panico" className="btn ghost">
            ¿Por qué el cuerpo reacciona así?
          </Link>
        </section>
        <ForLater />
        {heartCard}
      </div>
    )
  }

  if (phase === 'registro') {
    const toggleFear = (id: string) => setFears((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
    return (
      <div className="stack panic">
        <BackLink />
        <section className="card">
          <h1>Un minuto, si quieres</h1>
          <h2 className="panic-q" id="temias">
            ¿Qué temías que pasara?
          </h2>
          <div className="chips panic-chips" role="group" aria-labelledby="temias">
            {FEARS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip ${fears.includes(f.id) ? 'selected' : ''}`}
                aria-pressed={fears.includes(f.id)}
                onClick={() => toggleFear(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <h2 className="panic-q" id="paso">
            ¿Pasó?
          </h2>
          <div className="chips panic-chips" role="group" aria-labelledby="paso">
            {HAPPENED.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`chip ${happened === h.id ? 'selected' : ''}`}
                aria-pressed={happened === h.id}
                onClick={() => setHappened(h.id)}
              >
                {h.label}
              </button>
            ))}
          </div>
          <p className="muted small">Se queda solo en tu teléfono.</p>
        </section>
        <button className="btn big" disabled={!fears.length || !happened} onClick={save}>
          Guardar
        </button>
        <button className="btn ghost" onClick={() => setPhase('listo')}>
          Hoy no
        </button>
      </div>
    )
  }

  if (phase === 'listo') {
    const lines = saved ? fearSummary(log).filter((l) => fears.includes(l.id)) : []
    const first = lines.every((l) => l.times === 1)
    return (
      <div className="stack panic">
        <BackLink />
        {saved ? (
          <section className="card">
            <h1>Lo que temías y lo que pasó</h1>
            <ul className="plain panic-fears">
              {lines.map((l) => (
                <li key={l.id}>{l.text}</li>
              ))}
            </ul>
            {happened === 'si' ? (
              <p className="callout warm">
                Gracias por decirlo. Si pasó algo en tu cuerpo, cuéntaselo a tu médico; y si te asustó, aquí seguimos.
              </p>
            ) : first ? (
              <p className="muted">Cada vez que lo anotes, aquí y en Cómo voy vas a ver lo que tu cuerpo te va demostrando.</p>
            ) : (
              <p className="muted">El miedo se siente muy real, pero tu cuerpo te ha ido demostrando otra cosa.</p>
            )}
            <Link to="/mi-espacio/como-voy" className="btn small ghost">
              Verlo en Cómo voy
            </Link>
          </section>
        ) : (
          <section className="card center">
            <p className="big-emoji">🌿</p>
            <h1>Está bien.</h1>
            <p className="muted">Date un momento antes de seguir con tu día.</p>
          </section>
        )}
        <Link to="/diario" className="btn big ghost">
          Quiero escribir cómo fue
        </Link>
        <Link to="/ayuda" className="btn ghost">
          Sigo mal, quiero hablar con alguien
        </Link>
        <ForLater />
        {heartCard}
      </div>
    )
  }

  const last = step + 1 >= steps.length
  return (
    <div className="stack panic">
      <div className="row spread">
        <BackLink />
        <p className="muted small">
          Paso {step + 1} de {steps.length}
        </p>
      </div>
      <section className="card center" aria-live="polite">
        <p className="big-emoji">{current.emoji}</p>
        <h1>{current.title}</h1>
        {path === 'acompanar' ? (
          <div className="panic-says">
            <PetSays>
              <p className="panic-text">{current.text}</p>
            </PetSays>
          </div>
        ) : (
          <p className="panic-text">{current.text}</p>
        )}
        {current.wave && <Wave />}
        {current.feel && <Feel />}
      </section>

      {current.breathing && <Breathing initial="calma" autoStart />}

      <button className="btn big" onClick={() => (last ? finish() : setStep(step + 1))}>
        {last ? 'Terminé' : 'Siguiente'}
      </button>
      <div className="row panic-moves">
        {step > 0 && (
          <button className="btn ghost" onClick={() => setStep(step - 1)}>
            Volver al paso anterior
          </button>
        )}
        <button className="btn ghost" onClick={switchPath}>
          {path === 'enfrentar' ? 'Mejor acompáñame' : 'Quiero enfrentarlo'}
        </button>
      </div>

      {disclaimer}
    </div>
  )
}
