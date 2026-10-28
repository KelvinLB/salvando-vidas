import { type CSSProperties, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RiskNotice from '../components/RiskNotice'
import { soundsLikeRisk } from '../lib/risk'
import { buzz } from '../lib/storage'

const random = (min: number, max: number) => Math.round(min + Math.random() * (max - min))

/** Escribir lo que enoja y romperlo. No se guarda en ningún lado: es para soltarlo. */
function TearItUp() {
  const [text, setText] = useState('')
  const [pieces, setPieces] = useState<{ word: string; style: CSSProperties }[]>([])
  const [gone, setGone] = useState(false)
  const risk = soundsLikeRisk(text)

  const tear = () => {
    const words = text.split(/\s+/).filter(Boolean).slice(0, 120)
    setPieces(
      words.map((word) => ({
        word,
        style: {
          '--x': `${random(-120, 120)}px`,
          '--y': `${random(80, 240)}px`,
          '--r': `${random(-160, 160)}deg`,
          animationDelay: `${random(0, 250)}ms`,
        } as CSSProperties,
      })),
    )
    setText('')
    setGone(true)
    buzz(40)
    setTimeout(() => setPieces([]), 1800)
  }

  return (
    <section className="card field">
      <h2>Escríbelo y rómpelo</h2>
      <p className="muted small">
        Todo lo que te enoja, sin filtro y con las palabras que quieras. Esto no se guarda en ningún
        lado: es para sacarlo, no para leerlo después.
      </p>
      {pieces.length > 0 ? (
        // Las palabras se rompen desde donde estaban escritas.
        <div className="torn" aria-hidden="true">
          {pieces.map((p, i) => (
            <span key={i} style={p.style}>
              {p.word}
            </span>
          ))}
        </div>
      ) : (
        <textarea
          rows={5}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setGone(false)
          }}
          placeholder="Me enoja que…"
          aria-label="Lo que te enoja"
        />
      )}
      {risk && <RiskNotice />}
      <button className="btn danger" onClick={tear} disabled={!text.trim()}>
        Romperlo
      </button>
      {gone && (
        <p className="muted" role="status">
          Ya no está aquí. Suelta el aire despacio, una vez más.
        </p>
      )}
    </section>
  )
}

const RIGHT_NOW = [
  { emoji: '🌬️', text: 'Suelta el aire despacio, más largo de lo que lo tomas. Repite cinco veces.', to: '/calma', action: 'Respirar' },
  { emoji: '✊', text: 'Cierra los puños con fuerza cinco segundos y ábrelos despacio. El cuerpo entiende que ya puede bajar la guardia.', to: '/cuerpo#aflojar', action: 'Aflojar el cuerpo' },
  { emoji: '🚶', text: 'Muévete: camina rápido, sube escaleras o aprieta una almohada. El enojo es energía y necesita salir.' },
  { emoji: '💧', text: 'Agua fría en la cara y las muñecas.' },
  { emoji: '⏳', text: 'Espera para responder. Lo que se escribe o se dice con el enojo arriba casi siempre se lamenta después.' },
]

export default function Enojo() {
  return (
    <div className="stack">
      <PageHeader
        title="Cuando el enojo no se va"
        subtitle="Enojarte no te hace mala persona. Pero cargarlo mucho tiempo cansa al cuerpo y a la mente."
      />

      <section className="card">
        <h2>Lo que pasa en el cuerpo</h2>
        <p>
          El enojo prepara al cuerpo para defenderse: acelera el corazón, tensa los músculos y libera
          hormonas del estrés. Si dura días o semanas, el cuerpo se queda en alerta. Eso agota, nubla las
          ideas y hace ver amenazas donde no las hay.
        </p>
        <p>
          No es «carácter fuerte»: es un cuerpo sobrecargado. Y no es para asustarse: cuando el cuerpo
          descansa y se atiende, se recupera.
        </p>
        <p className="muted small">
          En la depresión y la ansiedad la irritabilidad es muy común, sobre todo en los hombres: a veces
          la tristeza sale como enojo.
        </p>
        <Link to="/cuerpo?ver=estres" className="btn small ghost">
          Ver cómo reacciona el cuerpo
        </Link>
      </section>

      <TearItUp />

      <section className="card">
        <h2>Para bajarlo ahora</h2>
        <ul className="helped">
          {RIGHT_NOW.map((r) => (
            <li key={r.text}>
              <span aria-hidden="true">{r.emoji}</span>
              <span>
                {r.text}{' '}
                {r.to && (
                  <Link to={r.to} className="small">
                    {r.action}
                  </Link>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card soft">
        <h2>Cuando ya bajó</h2>
        <p>
          Pregúntate qué necesitabas en ese momento: ¿que te escucharan?, ¿descansar?, ¿poner un límite?
          El enojo casi siempre cuida algo importante. Si está contigo casi todos los días, cuéntaselo a
          un especialista: también se trata.
        </p>
        <Link to="/diario" className="btn ghost">
          Escribir lo que pasó
        </Link>
      </section>

      <div className="callout warm">
        <p>
          Si sientes que podrías lastimar a alguien o lastimarte, aléjate de la situación ahora y pide
          ayuda.
        </p>
        <Link to="/ayuda" className="btn">
          Hablar con alguien ahora
        </Link>
      </div>
    </div>
  )
}
