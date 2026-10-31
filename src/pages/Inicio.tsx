import { useState } from 'react'
import { Link } from 'react-router-dom'
import BodyEntry from '../components/BodyEntry'
import CompanionView from '../components/Companion'
import Filas from '../components/Filas'
import { DEFAULT_COMPANION, companionName } from '../data/companion'
import { FAITH_MESSAGES, GENTLE_MESSAGES, MOODS } from '../data/content'
import { moodFromScale, useCompanion } from '../lib/companion'
import { planDone, useDayPlans } from '../lib/dayplan'
import { type Letter, type MoodEntry, pick, today, useAddress, useStored } from '../lib/storage'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Es tarde y sigues aquí. Te acompañamos'
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Atajos de un toque: lo mismo que la barra de abajo, pero ya en la acción.
const SHORTCUTS = [
  { to: '/calma', emoji: '🫧', title: 'Respirar' },
  { to: '/distraer', emoji: '🧩', title: 'Distraerme' },
  { to: '/musica', emoji: '🎵', title: 'Sonidos' },
  { to: '/videos', emoji: '🎬', title: 'Ver algo' },
]

const isNight = () => {
  const h = new Date().getHours()
  return h >= 22 || h < 6
}

export default function Inicio() {
  const [faith] = useStored('fe', false)
  // Si la mascota ya flota en la pantalla, no se repite aquí arriba.
  const [floating] = useStored('mascota-flotante', true)
  const say = useAddress()
  const messages = faith ? [...GENTLE_MESSAGES, ...FAITH_MESSAGES] : GENTLE_MESSAGES
  const [message, setMessage] = useState(() => pick(messages))
  const [moods, setMoods] = useStored<MoodEntry[]>('moods', [])
  const [letter] = useStored<Letter | null>('carta', null)
  const todayMood = moods.find((m) => m.date === today())?.mood
  const { companion, mood, setMood: setCompanionMood } = useCompanion()
  const { today: todayPlan, tomorrow: tomorrowPlan } = useDayPlans()
  const evening = new Date().getHours() >= 18
  const name = companion ? companionName(companion) : ''
  const tareas = todayPlan?.tasks.filter((t) => t.done).length ?? 0

  const saveMood = (mood: number) => {
    setMoods((prev) => [...prev.filter((m) => m.date !== today()), { date: today(), mood }])
    // Lo último que dijiste manda: la mascota toma la cara de este ánimo.
    if (companion) setCompanionMood(moodFromScale(mood))
  }

  // Una sola pregunta al frente: «¿Cómo te sientes hoy?». Arriba de ella, solo la ayuda para el
  // pánico (y la de la noche, a esa hora); debajo, cuatro atajos y unas pocas puertas. Tu día, la
  // misión pequeña y lo que le gusta a tu mascota viven en «Mi día». En computadora se abre en dos
  // columnas: a la izquierda lo de este momento y a la derecha lo demás.
  return (
    <div className="inicio">
      <section className="hero inicio-hero">
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

      <div className="inicio-col">
        {isNight() && (
          <Link to="/noche" className="card link-card night inicio-noche">
            <h2>🌙 ¿No puedes dormir?</h2>
            <p className="muted">Sonidos, relajación y alguien con quien platicar a esta hora.</p>
          </Link>
        )}

        <Link to="/panico" className="card link-card emergency-soft inicio-panico">
          <h2>Tengo un ataque de pánico</h2>
          <p className="muted">Te guiamos paso a paso. Va a pasar.</p>
        </Link>

        <section className="card inicio-animo">
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
                  <Link to="/mi-espacio/caja?c=carta" className="btn ghost">
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

        <BodyEntry soloSiMarcaste />
      </div>

      <div className="inicio-col">
        <nav className="inicio-atajos" aria-labelledby="inicio-atajos-title">
          <h2 id="inicio-atajos-title" className="section-title">
            Para este momento
          </h2>
          <div className="atajos">
            {SHORTCUTS.map((s) => (
              <Link key={s.to} to={s.to} className="atajo">
                <span className="tile-emoji" aria-hidden="true">
                  {s.emoji}
                </span>
                {s.title}
              </Link>
            ))}
          </div>
        </nav>

        <Filas
          className="inicio-mas"
          label="Más para ti"
          filas={[
            {
              to: '/mi-dia',
              title: 'Mi día',
              text: todayPlan
                ? planDone(todayPlan)
                  ? 'Día logrado ✓'
                  : `${tareas} de ${todayPlan.tasks.length} cosas hechas hoy`
                : evening && !tomorrowPlan
                  ? 'Deja listo tu mañana: tres cosas pequeñas y un premio.'
                  : '¿Hoy cuesta levantarse? Un plan pequeño, con un premio al final.',
            },
            {
              to: '/diario',
              title: '¿No sabes bien qué sientes?',
              text: 'Te ayudamos a ponerle nombre, y puedes escribirlo o decirlo en voz alta.',
            },
            {
              to: '/especialista',
              title: 'Sé que debería ir al especialista, pero no puedo',
              text: 'Es la ansiedad, no falta de voluntad. Vamos paso a paso.',
            },
            ...(companion
              ? []
              : [
                  {
                    to: '/mascota',
                    title: 'Crea tu mascota',
                    text: 'A veces es más fácil contar cómo está tu mascota que cómo estás tú.',
                    icon: <CompanionView look={DEFAULT_COMPANION} mood="feliz" size={44} />,
                  },
                ]),
          ]}
        />

      </div>

      <p className="disclaimer inicio-pie">
        ¿Te sirvió la app? <Link to="/opinion">Cuéntanos</Link>.
        <br />
        Esta app acompaña, pero no sustituye a un profesional de la salud. Si estás en peligro,
        llama a emergencias o a la <Link to="/ayuda">línea de ayuda de tu país</Link>.
      </p>
    </div>
  )
}
