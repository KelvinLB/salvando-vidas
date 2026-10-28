import { useState } from 'react'
import { Link } from 'react-router-dom'
import BodyEntry from '../components/BodyEntry'
import CompanionView from '../components/Companion'
import DayPlanCard from '../components/DayPlanCard'
import { DEFAULT_COMPANION, LIKES, companionName, likePhrase } from '../data/companion'
import { FAITH_MESSAGES, GENTLE_MESSAGES, MICRO_MISSIONS, MOODS } from '../data/content'
import { moodFromScale, useCompanion } from '../lib/companion'
import { useDayPlans } from '../lib/dayplan'
import { type Letter, type MoodEntry, pick, today, useAddress, useStored } from '../lib/storage'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Es tarde y sigues aquí. Te acompañamos'
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const SHORTCUTS = [
  { to: '/calma', emoji: '🫧', title: 'Respirar', text: 'Un minuto para bajar el ritmo' },
  { to: '/juegos/memorama', emoji: '🧩', title: 'Un juego', text: 'Algo sencillo para la mente' },
  { to: '/musica', emoji: '🎵', title: 'Sonidos', text: 'Lluvia, mar o música' },
  { to: '/videos', emoji: '🎬', title: 'Ver algo', text: 'Videos y películas que reconfortan' },
]

const isNight = () => {
  const h = new Date().getHours()
  return h >= 22 || h < 6
}

function LikeCard({ like, name }: { like: (typeof LIKES)[number]; name: string }) {
  const body = (
    <>
      <h2>
        {like.emoji} {likePhrase(name, like)}
      </h2>
      <p className="muted">¿Le damos un rato? Aunque hoy no den ganas, a veces lo conocido ayuda.</p>
    </>
  )
  return like.to ? (
    <Link to={like.to} className="card link-card">
      {body}
    </Link>
  ) : (
    <a href={like.href} target="_blank" rel="noopener noreferrer" className="card link-card">
      {body}
    </a>
  )
}

export default function Inicio() {
  const [faith] = useStored('fe', false)
  // Si la mascota ya flota en la pantalla, no se repite aquí arriba.
  const [floating] = useStored('mascota-flotante', true)
  const say = useAddress()
  const messages = faith ? [...GENTLE_MESSAGES, ...FAITH_MESSAGES] : GENTLE_MESSAGES
  const [message, setMessage] = useState(() => pick(messages))
  const [mission, setMission] = useState(() => pick(MICRO_MISSIONS))
  const [moods, setMoods] = useStored<MoodEntry[]>('moods', [])
  const [letter] = useStored<Letter | null>('carta', null)
  const todayMood = moods.find((m) => m.date === today())?.mood
  const { companion, mood, setMood: setCompanionMood } = useCompanion()
  const { today: todayPlan, tomorrow: tomorrowPlan } = useDayPlans()
  const evening = new Date().getHours() >= 18
  const name = companion ? companionName(companion) : ''
  const [like] = useState(() => {
    const liked = LIKES.filter((l) => companion?.likes.includes(l.id))
    return liked.length ? pick(liked) : undefined
  })

  const saveMood = (mood: number) => {
    setMoods((prev) => [...prev.filter((m) => m.date !== today()), { date: today(), mood }])
    // Lo último que dijiste manda: la mascota toma la cara de este ánimo.
    if (companion) setCompanionMood(moodFromScale(mood))
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow">{greeting()}</p>
            <h1>{say('No estás sola.', 'No estás solo.', 'No estás sola. No estás solo.')}</h1>
          </div>
          {companion && !floating && (
            <Link to="/mascota" className="hero-mascot" aria-label={`Ir con ${name}`}>
              <CompanionView look={companion} mood={mood} size={92} name={name} />
            </Link>
          )}
        </div>
        <button
          className="message"
          onClick={() => setMessage(pick(messages))}
          aria-label="Mostrar otro mensaje"
        >
          “{message}”
        </button>
      </section>

      {isNight() && (
        <Link to="/noche" className="card link-card night">
          <h2>🌙 ¿No puedes dormir?</h2>
          <p className="muted">Sonidos, relajación y alguien con quien platicar a esta hora.</p>
        </Link>
      )}

      <Link to="/panico" className="card link-card emergency-soft">
        <h2>Tengo un ataque de pánico</h2>
        <p className="muted">Te guiamos paso a paso. Va a pasar.</p>
      </Link>

      <BodyEntry />

      <section className="card">
        <h2>¿Cómo te sientes hoy?</h2>
        <div className="moods" role="radiogroup" aria-label="Tu estado de ánimo">
          {MOODS.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={todayMood === m.value}
              className={`mood ${todayMood === m.value ? 'selected' : ''}`}
              onClick={() => saveMood(m.value)}
            >
              <span aria-hidden="true">{m.emoji}</span>
              <small>{m.label}</small>
            </button>
          ))}
        </div>

        {todayMood !== undefined && todayMood <= 2 && (
          <div className="callout warm">
            <p>
              Gracias por decirlo. Cuando el día pesa tanto, hablar con alguien ayuda. No tienes que
              estar en peligro para llamar: las líneas también escuchan.
            </p>
            <div className="row">
              <Link to="/ayuda" className="btn">
                Hablar con alguien
              </Link>
              {letter ? (
                <Link to="/mi-espacio/caja" className="btn ghost">
                  💌 Leer la carta que te escribiste
                </Link>
              ) : (
                <Link to="/diario" className="btn ghost">
                  Escribir lo que siento
                </Link>
              )}
            </div>
          </div>
        )}
        {todayMood !== undefined && todayMood >= 3 && (
          <p className="muted">
            Anotado. Puedes ver cómo vas en <Link to="/mi-espacio/como-voy">«Cómo voy»</Link>.
          </p>
        )}
      </section>

      {todayPlan ? (
        <DayPlanCard plan={todayPlan} compact />
      ) : evening && !tomorrowPlan ? (
        <Link to="/mi-dia" className="card link-card">
          <h2>📝 Deja listo tu mañana</h2>
          <p className="muted">Tres cosas pequeñas y un premio. Así, al despertar, no tienes que decidir nada.</p>
        </Link>
      ) : !evening ? (
        <Link to="/mi-dia" className="card link-card">
          <h2>¿Hoy cuesta levantarse?</h2>
          <p className="muted">Un plan pequeño, con un premio al final, ayuda a dar el primer paso.</p>
        </Link>
      ) : null}

      {companion && like && (
        <LikeCard like={like} name={name} />
      )}

      <section>
        <h2 className="section-title">Para este momento</h2>
        <div className="grid">
          {SHORTCUTS.map((s) => (
            <Link key={s.to} to={s.to} className="tile">
              <span className="tile-emoji" aria-hidden="true">
                {s.emoji}
              </span>
              <strong>{s.title}</strong>
              <small>{s.text}</small>
            </Link>
          ))}
        </div>
      </section>

      <Link to="/diario" className="card link-card">
        <h2>¿No sabes bien qué sientes?</h2>
        <p className="muted">
          Es muy común. Te ayudamos a ponerle nombre, y puedes escribirlo o decirlo en voz alta.
        </p>
      </Link>

      {!companion && (
        <Link to="/mascota" className="card link-card mascot-invite">
          <CompanionView look={DEFAULT_COMPANION} mood="feliz" size={72} />
          <div>
            <h2>Crea tu mascota</h2>
            <p className="muted">
              Alguien que te represente. A veces es más fácil contar cómo está tu mascota que cómo
              estás tú.
            </p>
          </div>
        </Link>
      )}

      <section className="card soft">
        <h2>Una pequeña misión</h2>
        <p className="mission">{mission}</p>
        <button className="btn ghost" onClick={() => setMission(pick(MICRO_MISSIONS))}>
          Dame otra
        </button>
      </section>

      <Link to="/especialista" className="card link-card">
        <h2>Sé que debería ir al especialista, pero no puedo</h2>
        <p className="muted">Es la ansiedad, no falta de voluntad. Vamos paso a paso.</p>
      </Link>

      <p className="disclaimer">
        ¿Te sirvió la app? <Link to="/opinion">Cuéntanos</Link>.
        <br />
        Esta app acompaña, pero no sustituye a un profesional de la salud. Si estás en peligro,
        llama a emergencias o a la <Link to="/ayuda">línea de ayuda de tu país</Link>.
      </p>
    </div>
  )
}
