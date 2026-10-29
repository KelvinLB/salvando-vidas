import { Link } from 'react-router-dom'
import CompanionView from '../components/Companion'
import PageHeader from '../components/PageHeader'
import { DEFAULT_COMPANION, companionName } from '../data/companion'
import { WHAT_HELPED } from '../data/content'
import { useCompanion } from '../lib/companion'

const GAMES = [
  { to: '/juegos/memorama', emoji: '🧩', title: 'Memorama', text: 'Encuentra las parejas, sin reloj' },
  { to: '/juegos/deslizante', emoji: '🔢', title: 'Deslizante', text: 'Ordena las piezas a tu ritmo' },
  { to: '/juegos/burbujas', emoji: '🫧', title: 'Burbujas', text: 'Revienta burbujas, una por una' },
  { to: '/juegos/pizarra', emoji: '🖌️', title: 'Pizarra zen', text: 'Dibuja trazos que se desvanecen' },
  { to: '/juegos/acomodar', emoji: '🧱', title: 'Despeja la mente', text: 'Acomoda piezas, una pausa para la cabeza' },
]

const MEDIA = [
  { to: '/musica', emoji: '🎵', title: 'Música y sonidos', text: 'Lluvia, mar y listas para relajarte' },
  { to: '/videos', emoji: '🎬', title: 'Videos y películas', text: 'Cosas que hacen bien al corazón' },
]

export default function Distraer() {
  const { companion, mood } = useCompanion()
  return (
    <div className="stack">
      <PageHeader
        title="Distraer la mente"
        subtitle="A veces lo mejor es darle a la cabeza algo pequeño en qué ocuparse."
      />
      <div className="callout info">
        <strong>¿Sientes que ya nada te entretiene?</strong>
        <p>
          Es un síntoma de la depresión, no un defecto tuyo. No esperes disfrutarlo: elige
          cualquier cosa y hazla solo 2 minutos. A veces el ánimo llega después, no antes.
        </p>
      </div>
      <h2 className="section-title">Juegos tranquilos</h2>
      {/* El barrio va primero: su mascota pasea por la plaza, con vecinos y su propia casa. */}
      <Link to="/barrio" className="tile hole-tile">
        <span className="hole-tile-pet" aria-hidden="true">
          <CompanionView look={companion ?? DEFAULT_COMPANION} mood={mood} size={72} />
        </span>
        <span className="hole-tile-text">
          <strong>El barrio</strong>
          <small>
            {companion ? `${companionName(companion)} te espera` : 'Tu mascota te espera'} en la plaza: vecinos con
            cositas chiquitas que ayudan, y una casa que puedes hacer tuya.
          </small>
        </span>
      </Link>
      {/* Salir del hueco va primero: su mascota es quien juega, y el lugar se parece a su día. */}
      <Link to="/juegos/hueco" className="tile hole-tile">
        <span className="hole-tile-pet" aria-hidden="true">
          <CompanionView look={companion ?? DEFAULT_COMPANION} mood={mood} size={64} />
        </span>
        <span className="hole-tile-text">
          <strong>Salir del hueco</strong>
          <small>
            {companion ? `${companionName(companion)} y tú salen` : 'Tu mascota y tú salen'} adelante, un paso a la vez, en
            un lugar que se parece a tu día.
          </small>
        </span>
      </Link>
      <div className="grid">
        {GAMES.map((g) => (
          <Link key={g.to} to={g.to} className="tile">
            <span className="tile-emoji" aria-hidden="true">{g.emoji}</span>
            <strong>{g.title}</strong>
            <small>{g.text}</small>
          </Link>
        ))}
      </div>
      <section className="card">
        <h2>Lo que a otras personas les ha ayudado</h2>
        <p className="muted small">Ideas de quienes viven con depresión y ansiedad.</p>
        <ul className="helped">
          {WHAT_HELPED.map((h) => (
            <li key={h.text}>
              <span aria-hidden="true">{h.emoji}</span>
              {h.text}
            </li>
          ))}
        </ul>
        <div className="row">
          <Link to="/opinion" className="btn small ghost">
            ¿A ti qué te ha ayudado? Cuéntanos
          </Link>
          <Link to="/redes" className="btn small ghost">
            ¿Y lo que se dice en redes?
          </Link>
        </div>
      </section>
      <h2 className="section-title">Escuchar y ver</h2>
      <div className="grid">
        {MEDIA.map((m) => (
          <Link key={m.to} to={m.to} className="tile">
            <span className="tile-emoji" aria-hidden="true">{m.emoji}</span>
            <strong>{m.title}</strong>
            <small>{m.text}</small>
          </Link>
        ))}
      </div>
    </div>
  )
}
