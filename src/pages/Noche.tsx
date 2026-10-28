import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RiskNotice from '../components/RiskNotice'
import { saveThought } from '../lib/db'
import { soundsLikeRisk } from '../lib/risk'
import { newId } from '../lib/storage'

// Relajación muscular progresiva: tensar y soltar cada zona del cuerpo.
const BODY = [
  'Aprieta los puños con fuerza… y suelta.',
  'Sube los hombros hacia las orejas… y déjalos caer.',
  'Aprieta la cara, frunce todo… y suelta.',
  'Tensa la panza… y suelta.',
  'Estira las piernas y aprieta los muslos… y suelta.',
  'Encoge los dedos de los pies… y suelta.',
  'Ahora todo tu cuerpo pesa y descansa sobre la cama.',
]
const SECONDS_PER_STEP = 12

function Relax() {
  const [index, setIndex] = useState(-1)

  useEffect(() => {
    if (index < 0 || index >= BODY.length - 1) return
    const timer = setTimeout(() => setIndex((i) => i + 1), SECONDS_PER_STEP * 1000)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <section className="card">
      <h2>Relajar el cuerpo</h2>
      {index < 0 ? (
        <>
          <p className="muted">
            Acuéstate en una postura cómoda. Te iremos diciendo qué tensar y soltar, cada {SECONDS_PER_STEP}{' '}
            segundos. Solo sigue las instrucciones.
          </p>
          <button className="btn" onClick={() => setIndex(0)}>
            Empezar
          </button>
        </>
      ) : (
        <>
          <p className="relax-step" aria-live="polite">
            {BODY[index]}
          </p>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${((index + 1) / BODY.length) * 100}%` }} />
          </div>
          <button className="btn ghost" onClick={() => setIndex(-1)}>
            {index === BODY.length - 1 ? 'Terminar' : 'Parar'}
          </button>
        </>
      )}
    </section>
  )
}

function EmptyHead() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!text.trim()) return
    await saveThought({
      id: newId(),
      createdAt: new Date().toISOString(),
      text: text.trim(),
      feelings: ['sin-sueno'],
    })
    setSaved(true)
    setText('')
  }

  return (
    <section className="card field">
      <h2>Vaciar la cabeza</h2>
      <p className="muted">
        Escribe todo lo que da vueltas: pendientes, miedos, lo que sea. Ya quedó guardado; no tienes
        que seguir pensándolo esta noche.
      </p>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        aria-label="Lo que da vueltas en tu cabeza"
      />
      {soundsLikeRisk(text) && <RiskNotice />}
      <button className="btn" onClick={save} disabled={!text.trim()}>
        Guardar y soltar
      </button>
      {saved && <p className="muted">Guardado en «Mi diario». Mañana sigue ahí si lo necesitas.</p>}
    </section>
  )
}

export default function Noche() {
  return (
    <div className="stack">
      <PageHeader
        title="¿No puedes dormir?"
        subtitle="Las noches pesan más. No eres la única persona despierta sintiéndose así a esta hora."
      />

      <Link to="/ayuda" className="card link-card">
        <h2>¿Quieres platicar con alguien ahora?</h2>
        <p className="muted">
          Hay líneas que atienden toda la noche, gratis. Puedes llamar solo para hablar, aunque no
          sea una emergencia.
        </p>
      </Link>

      <EmptyHead />
      <Link to="/mi-dia" className="card link-card">
        <h2>📝 Deja listo tu mañana</h2>
        <p className="muted">Decide hoy tres cosas pequeñas y un premio. Así mañana no tienes que pensarlo.</p>
      </Link>
      <Relax />

      <div className="grid">
        <Link to="/musica" className="tile">
          <span className="tile-emoji" aria-hidden="true">🌧️</span>
          <strong>Sonidos para dormir</strong>
          <small>Lluvia o mar, con apagado automático</small>
        </Link>
        <Link to="/calma" className="tile">
          <span className="tile-emoji" aria-hidden="true">🫧</span>
          <strong>Respiración 4-7-8</strong>
          <small>Ayuda a soltar la tensión</small>
        </Link>
      </div>

      <section className="card soft">
        <h2>Si llevas mucho rato sin dormir</h2>
        <ul className="plain">
          <li>Después de unos 20 minutos, levántate y haz algo tranquilo con poca luz. Vuelve a la cama cuando te dé sueño.</li>
          <li>Baja el brillo de la pantalla o deja el teléfono lejos.</li>
          <li>Si llevas varios días durmiendo mal, coméntalo con tu médico: el sueño también se trata.</li>
        </ul>
      </section>
    </div>
  )
}
