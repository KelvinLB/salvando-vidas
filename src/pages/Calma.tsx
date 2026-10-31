import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Filas from '../components/Filas'
import PageHeader from '../components/PageHeader'
import RespirarPorDentro from '../components/RespirarPorDentro'
import type { Aire } from '../components/cuerpo3d/escena'
import { PESO_3D, revisar3d } from '../components/cuerpo3d/soporte'
import { buzz, useStored } from '../lib/storage'

type Phase = { label: string; seconds: number; scale: number }

const PATTERNS: { id: string; name: string; hint: string; phases: Phase[] }[] = [
  {
    id: 'calma',
    name: 'Calma 4-6',
    hint: 'Exhalar más largo que inhalar calma el cuerpo.',
    phases: [
      { label: 'Inhala', seconds: 4, scale: 1 },
      { label: 'Exhala', seconds: 6, scale: 0.55 },
    ],
  },
  {
    id: 'pareja',
    name: 'Pareja 5-5',
    hint: 'El mismo tiempo para tomar y soltar el aire. Si el 4-6 se te hace largo, prueba esta.',
    phases: [
      { label: 'Inhala', seconds: 5, scale: 1 },
      { label: 'Exhala', seconds: 5, scale: 0.55 },
    ],
  },
  {
    id: 'caja',
    name: 'Caja 4-4-4-4',
    hint: 'Ritmo parejo para ordenar la mente.',
    phases: [
      { label: 'Inhala', seconds: 4, scale: 1 },
      { label: 'Sostén', seconds: 4, scale: 1 },
      { label: 'Exhala', seconds: 4, scale: 0.55 },
      { label: 'Sostén', seconds: 4, scale: 0.55 },
    ],
  },
  {
    id: '478',
    name: '4-7-8',
    hint: 'Ayuda a soltar la tensión y a dormir.',
    phases: [
      { label: 'Inhala', seconds: 4, scale: 1 },
      { label: 'Sostén', seconds: 7, scale: 1 },
      { label: 'Exhala', seconds: 8, scale: 0.55 },
    ],
  },
]

const AIRE: Record<string, Aire['tipo']> = { Inhala: 'toma', Exhala: 'suelta', Sostén: 'sostiene' }
/** Lo que se lee en pantalla: una invitación, no una orden. */
const DECIR: Record<string, string> = { Inhala: 'Toma aire', Exhala: 'Suelta el aire', Sostén: 'Quédate así' }
/** Las respiraciones con sostén piden más; se ofrecen para cuando ya practicaste. */
const CON_SOSTEN = ['caja', '478']

// Las primeras vueltas van un poco más rápido y el ritmo se alarga solo hasta el patrón: seguir un
// ritmo muy lento desde el principio cuesta y deja con hambre de aire.
const RAMPA = [0.7, 0.8, 0.9]
const duracion = (ph: Phase, ciclo: number) => Math.max(2, Math.round(ph.seconds * (RAMPA[ciclo] ?? 1)))
/** Segundos que llevan las vueltas ya completas. */
const llevas = (phases: Phase[], ciclos: number) =>
  Array.from({ length: ciclos }, (_, c) => phases.reduce((t, ph) => t + duracion(ph, c), 0)).reduce((a, b) => a + b, 0)

export function Breathing({
  initial = PATTERNS[0].id,
  autoStart = false,
  porDentro = false,
}: {
  initial?: string
  /** En una crisis no hay que pedir un toque más: la respiración arranca sola. */
  autoStart?: boolean
  /** La respiración se ve en el pecho en 3D. En Pánico no: ahí basta el círculo. */
  porDentro?: boolean
}) {
  // Los números que cambian cada segundo distraen del ritmo: por omisión, solo una línea que avanza.
  const [verSegundos, setVerSegundos] = useStored('respirar-segundos', false)
  // Se revisa una vez. Si el teléfono no puede con el 3D, o algo falla, queda el círculo, que
  // siempre funciona. Con el ahorro de datos encendido, el pecho se baja solo si la persona lo pide.
  const [motivo] = useState(() => (porDentro ? revisar3d() : 'sin-webgl'))
  const [fallo, setFallo] = useState(false)
  const [bajar, setBajar] = useState(false)
  const puede3d = motivo !== 'sin-webgl' && motivo !== 'debil' && !fallo
  const dentro = puede3d && (motivo !== 'datos' || bajar)
  const [patternId, setPatternId] = useState(initial)
  const [running, setRunning] = useState(autoStart)
  const [index, setIndex] = useState(0)
  const [left, setLeft] = useState(() =>
    autoStart ? duracion(PATTERNS.find((p) => p.id === initial)!.phases[0], 0) : 0,
  )
  const [cycles, setCycles] = useState(0)

  const pattern = PATTERNS.find((p) => p.id === patternId)!
  const phase = pattern.phases[index]
  const segundos = duracion(phase, cycles)

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      const next = (index + 1) % pattern.phases.length
      const timer = setTimeout(() => {
        if (next === 0) setCycles((c) => c + 1)
        setIndex(next)
        setLeft(duracion(pattern.phases[next], next === 0 ? cycles + 1 : cycles))
        buzz(20)
      }, 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [running, left, index, pattern, cycles])

  const start = () => {
    setIndex(0)
    setLeft(duracion(pattern.phases[0], 0))
    setCycles(0)
    setRunning(true)
  }

  const paso = `${patternId}-${cycles}-${index}`
  const etiqueta = running ? (
    <>
      <strong key={paso} className="breath-fase">
        {DECIR[phase.label] ?? phase.label}
      </strong>
      {verSegundos ? (
        <span>{left}</span>
      ) : (
        <span className="breath-progreso" aria-hidden="true">
          <i key={paso} className="breath-avance" style={{ animationDuration: `${segundos}s` }} />
        </span>
      )}
    </>
  ) : (
    <strong>Listo cuando tú lo estés</strong>
  )

  return (
    <section className="card center">
      <div className="chips" role="radiogroup" aria-label="Tipo de respiración">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={p.id === patternId}
            className={`chip ${p.id === patternId ? 'selected' : ''}`}
            onClick={() => {
              setPatternId(p.id)
              setRunning(false)
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="muted">{pattern.hint}</p>
      {CON_SOSTEN.includes(patternId) && (
        <p className="muted small">
          Va mejor cuando ya practicaste. Si en un sostén te falta el aire, suéltalo; también puedes regresar a Calma 4-6
          o respirar a tu ritmo.
        </p>
      )}

      {puede3d && !dentro && (
        <>
          <p className="muted breath-3d-nota">
            Tienes el ahorro de datos encendido. Para ver los pulmones se bajan {PESO_3D}, una sola vez.
          </p>
          <button type="button" className="btn ghost small" onClick={() => setBajar(true)}>
            Ver los pulmones
          </button>
        </>
      )}

      {dentro ? (
        <RespirarPorDentro
          aire={{ tipo: running ? (AIRE[phase.label] ?? 'sostiene') : 'quieto', segundos }}
          paso={running ? paso : 'quieto'}
          onFalla={() => setFallo(true)}
        >
          <div className="breath-label" aria-live="polite">
            {etiqueta}
          </div>
        </RespirarPorDentro>
      ) : (
        <div className="breath-stage" aria-live="polite">
          <div
            className="breath-circle"
            style={{
              transform: `scale(${running ? phase.scale : 0.7})`,
              transitionDuration: `${running ? segundos : 0.6}s`,
            }}
          />
          <div className="breath-label">{etiqueta}</div>
        </div>
      )}
      {fallo && <p className="muted breath-3d-nota">Esta vez no se pudieron mostrar los pulmones. Seguimos con un círculo.</p>}

      {!running && (
        <>
          <p className="muted small">Respira suave, sin llenarte del todo. El ritmo se va haciendo lento solo.</p>
          {/* Lo que explica va a un toque: mientras respiras, solo los pulmones y el botón. */}
          <details className="breath-porque">
            <summary>¿Por qué calma?</summary>
            <p className="muted small">
              {dentro && 'Respira con los pulmones: el aire sube cuando lo tomas y baja cuando lo sueltas. '}Al soltar el
              aire despacio, el nervio vago frena un poquito al corazón: por eso exhalar largo calma. Empezamos un poco más
              rápido para que no te falte el aire, y con práctica se vuelve más fácil.
            </p>
          </details>
        </>
      )}
      {running && cycles > 0 && (
        <p className="muted">
          {cycles} {cycles === 1 ? 'ciclo' : 'ciclos'}. Lo estás haciendo bien.
          {cycles >= 3 && ' Si prefieres, sigue a tu ritmo: también sirve.'}
        </p>
      )}
      {running && llevas(pattern.phases, cycles) >= 120 && (
        <p className="muted small">Ya llevas un par de minutos. Puedes parar cuando quieras o seguir un poco más.</p>
      )}
      <button className="btn big" onClick={running ? () => setRunning(false) : start}>
        {running ? 'Pausar' : 'Empezar'}
      </button>
      <label className="toggle breath-segundos">
        <input type="checkbox" role="switch" checked={verSegundos} onChange={(e) => setVerSegundos(e.target.checked)} />
        Ver los segundos
      </label>
    </section>
  )
}

const GROUNDING = [
  { n: 5, sense: 'cosas que puedes ver', emoji: '👀' },
  { n: 4, sense: 'cosas que puedes tocar', emoji: '✋' },
  { n: 3, sense: 'sonidos que puedes oír', emoji: '👂' },
  { n: 2, sense: 'olores que puedes notar', emoji: '👃' },
  { n: 1, sense: 'cosa que puedes saborear o algo bueno de ti', emoji: '💛' },
]

function Grounding() {
  const [step, setStep] = useState(-1)

  if (step === -1) {
    return (
      <section className="card">
        <h2>5-4-3-2-1</h2>
        <p className="muted">
          Vas a nombrar cinco cosas que ves, cuatro que tocas, tres sonidos, dos olores y una cosa que
          saboreas o algo bueno de ti. Una a la vez, sin prisa.
        </p>
        <button className="btn" onClick={() => setStep(0)}>
          Empezar
        </button>
      </section>
    )
  }

  if (step >= GROUNDING.length) {
    return (
      <section className="card center">
        <p className="big-emoji">🌿</p>
        <h2>Bien hecho.</h2>
        <p className="muted">Tu cuerpo está aquí, en este momento. Eso es suficiente.</p>
        <button className="btn ghost" onClick={() => setStep(-1)}>
          Terminar
        </button>
      </section>
    )
  }

  const item = GROUNDING[step]
  return (
    <section className="card center">
      <p className="big-emoji">{item.emoji}</p>
      <h2>
        Nombra {item.n} {item.sense}
      </h2>
      <p className="muted">Tómate tu tiempo. Puedes decirlas en voz alta o en tu mente.</p>
      <button className="btn" onClick={() => setStep(step + 1)}>
        Listo
      </button>
    </section>
  )
}

// Una sola cosa al frente: respirar. Lo demás son puertas, cada una a su propia pantalla, en dos
// listas cortas: lo que sirve ahorita y lo que sirve para entender y practicar. En computadora, la
// respiración va a la izquierda y las puertas a la derecha.
export default function Calma() {
  return (
    <div className="pagina-ancha calma">
      <PageHeader title="Calma" subtitle="Respira con los pulmones. No hay prisa." />
      <div className="columna">
        <Link to="/panico" className="card link-card emergency-soft calma-panico">
          <h2>¿Es un ataque de pánico?</h2>
          <p className="muted">Te guiamos paso a paso para atravesarlo.</p>
        </Link>
        <Breathing porDentro />
      </div>
      <div className="columna">
        <section className="stack tight" aria-labelledby="calma-ahorita-title">
          <h2 id="calma-ahorita-title" className="section-title">
            Para ahorita
          </h2>
          <Filas
            label="Para ahorita"
            filas={[
              { to: '/calma/presente', emoji: '🌿', title: 'Volver al presente', text: '5-4-3-2-1: los sentidos te regresan al aquí y ahora.' },
              { to: '/cuerpo', emoji: '🫀', title: '¿Dónde lo sientes?', text: 'Toca la figura y te decimos qué puede estar pasando.' },
              { to: '/noche', emoji: '🌙', title: '¿No puedes dormir?', text: 'Sonidos, relajación y un lugar para vaciar la cabeza.' },
            ]}
          />
        </section>
        <section className="stack tight" aria-labelledby="calma-entender-title">
          <h2 id="calma-entender-title" className="section-title">
            Para entender y practicar
          </h2>
          <Filas
            label="Para entender y practicar"
            filas={[
              { to: '/nervios', emoji: '🧠', title: 'Entender mis nervios', text: 'Seis lecciones cortas: qué es el pánico y por qué no es peligroso.' },
              { to: '/nervios/practicar', emoji: '🤸', title: 'Practicar con el cuerpo', text: 'Ejercicios cortos para perderle el miedo a lo que el pánico hace sentir.' },
              { to: '/enojo', emoji: '🔥', title: '¿Es enojo lo que no se va?', text: 'Escríbelo, rómpelo y bájale al cuerpo la alerta.' },
              // Pendientes de revisión con psicóloga: Lo que no sale y Para escuchar.
              { to: '/lo-que-no-sale', emoji: '💧', title: 'Lo que no sale', text: 'Cuando quieres llorar y no puedes, o todo se siente sin sentido.' },
              { to: '/escuchar', emoji: '🎧', title: 'Para escuchar', text: 'Reflexiones cortas con voz, para un día pesado.' },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

/** 5-4-3-2-1 en su propia pantalla, sin nada más alrededor. */
export function Presente() {
  return (
    <div className="stack">
      <PageHeader title="Volver al presente" subtitle="Cuando los pensamientos van muy rápido, los sentidos te regresan al aquí y ahora." />
      <Grounding />
    </div>
  )
}
