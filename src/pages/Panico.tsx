import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '../components/PageHeader'
import { useStored } from '../lib/storage'
import { Breathing } from './Calma'

// Guía para atravesar un ataque de pánico. Frases cortas y letra grande:
// en plena crisis cuesta leer y pensar.

const STEPS = [
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

export default function Panico() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  // Muchas personas ya fueron a urgencias y les dijeron que su corazón está bien.
  // Recordárselo en plena crisis ayuda a creerle a la guía.
  const [heartChecked, setHeartChecked] = useStored('corazon-revisado', false)
  const current = STEPS[step]

  if (finished) {
    return (
      <div className="stack panic">
        <BackLink />
        <section className="card center">
          <p className="big-emoji">🌿</p>
          <h1>¿Cómo vas?</h1>
          <p className="muted">Lo atravesaste. Date un momento antes de seguir con tu día.</p>
          <button className="btn big" onClick={() => { setStep(0); setFinished(false) }}>
            Necesito repetirlo
          </button>
          <Link to="/ayuda" className="btn big ghost">
            Sigo mal, quiero hablar con alguien
          </Link>
          <Link to="/diario" className="btn ghost">
            Ya pasó, quiero escribir cómo fue
          </Link>
          <Link to="/cuerpo?ver=panico" className="btn ghost">
            ¿Por qué el cuerpo reacciona así?
          </Link>
        </section>
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
      </div>
    )
  }

  return (
    <div className="stack panic">
      <div className="row spread">
        <BackLink />
        <p className="muted small">
          Paso {step + 1} de {STEPS.length}
        </p>
      </div>
      <section className="card center" aria-live="polite">
        <p className="big-emoji">{current.emoji}</p>
        <h1>{current.title}</h1>
        <p className="panic-text">{current.text}</p>
        {step === 0 && heartChecked && (
          <p className="callout info panic-text">💚 Tu corazón ya fue revisado y salió bien. Esto es ansiedad.</p>
        )}
      </section>

      {current.breathing && <Breathing initial="calma" autoStart />}

      <button
        className="btn big"
        onClick={() => (step + 1 < STEPS.length ? setStep(step + 1) : setFinished(true))}
      >
        {step + 1 < STEPS.length ? 'Siguiente' : 'Terminé'}
      </button>
      {step > 0 && (
        <button className="btn ghost" onClick={() => setStep(step - 1)}>
          Volver al paso anterior
        </button>
      )}

      <p className="disclaimer">
        Si es la primera vez, si el dolor del pecho es fuerte o se va al brazo o la mandíbula, si te
        desmayas o tienes dudas, <Link to="/ayuda">llama a emergencias</Link>. Ir a revisarte no es
        exagerar.
      </p>
    </div>
  )
}
