import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import RiskNotice from '../RiskNotice'
import { VALUES } from '../../data/barrio'
import { soundsLikeRisk } from '../../lib/risk'
import { type CompassLevel, useCompass } from '../../lib/sentido'
import { today, useStored } from '../../lib/storage'

// Mi brújula: se reparten las cartas de lo que importa en tres montones («mucho», «algo» y
// «ahorita no») y luego se elige una sola acción mínima para hoy. No se pide tener ganas antes:
// en la activación conductual y en la terapia de aceptación y compromiso se actúa según lo que
// importa, y las ganas, si llegan, llegan después. Las cartas base son los rumbos del barrio;
// la de la fe solo sale si la persona la encendió en Ajustes.
//
// Fuentes: Ekers y colegas, 2014 (activación conductual); Harris, «La trampa de la felicidad»
// (aceptación y compromiso).
// Textos pendientes de revisión con psicóloga.

type Value = { id: string; label: string; emoji: string; ideas: string[] }

const EMOJI: Record<string, string> = { familia: '🫂', cuerpo: '🌞', aprender: '📚', comunidad: '🤝', disfrutar: '🎉' }

// Acciones de cinco minutos o menos, que se pueden hacer sin ganas.
const IDEAS: Record<string, string[]> = {
  familia: ['Mandarle un mensaje corto a alguien', 'Comer con alguien, aunque sea sin hablar mucho'],
  cuerpo: ['Salir cinco minutos al sol', 'Tomar un vaso de agua con calma', 'Bañarme con agua tibia'],
  aprender: ['Leer una página de algo', 'Ver un video corto de algo que me da curiosidad'],
  comunidad: ['Ayudar a alguien con algo pequeño', 'Darle las gracias a alguien'],
  disfrutar: ['Poner una canción que me guste', 'Comer algo despacio, fijándome en el sabor'],
  crear: ['Dibujar algo, aunque sea un garabato', 'Cocinar algo sencillo'],
  naturaleza: ['Regar una planta', 'Ver el cielo un ratito'],
  fe: ['Un momento en silencio con mi fe', 'Una oración o una lectura corta'],
}

const EXTRA: Value[] = [
  { id: 'crear', label: 'Crear', emoji: '🎨', ideas: IDEAS.crear },
  { id: 'naturaleza', label: 'Plantas y animales', emoji: '🌱', ideas: IDEAS.naturaleza },
]
const FAITH: Value = { id: 'fe', label: 'Mi fe', emoji: '🕯️', ideas: IDEAS.fe }

const PILES: { id: CompassLevel; label: string }[] = [
  { id: 'mucho', label: 'Mucho' },
  { id: 'algo', label: 'Algo' },
  { id: 'ahorita-no', label: 'Ahorita no' },
]

export default function Brujula({ onAction }: { onAction: () => void }) {
  const [compass, setCompass] = useCompass()
  const [faith] = useStored('fe', false)
  const [hand, setHand] = useState<string | null>(null)
  const [own, setOwn] = useState('')
  const [changing, setChanging] = useState(false)

  const values: Value[] = [
    ...VALUES.map((v) => ({ id: v.id, label: v.label, emoji: EMOJI[v.id], ideas: IDEAS[v.id] })),
    ...EXTRA,
    ...(faith ? [FAITH] : []),
  ]
  const levels = compass.levels
  const loose = values.filter((v) => !levels[v.id])
  const inHand = values.find((v) => v.id === hand)
  const action = compass.action?.date === today() ? compass.action : undefined

  const drop = (level: CompassLevel) => {
    if (!hand) return
    setCompass((c) => ({ ...c, levels: { ...c.levels, [hand]: level } }))
    setHand(null)
  }
  const restart = () => {
    setCompass((c) => ({ ...c, levels: {} }))
    setHand(null)
  }

  // Ideas de lo que importa «mucho» primero; si no hay, de «algo»; si no, de todas.
  const from = (lvl: CompassLevel) => values.filter((v) => levels[v.id] === lvl)
  const base = from('mucho').length ? from('mucho') : from('algo').length ? from('algo') : values.slice(0, 4)
  const ideas = [...new Set(base.flatMap((v) => v.ideas.slice(0, 2)))].slice(0, 5)

  const choose = (text: string) => {
    setCompass((c) => ({ ...c, action: { date: today(), text } }))
    setChanging(false)
    setOwn('')
    onAction()
  }
  const submitOwn = (e: FormEvent) => {
    e.preventDefault()
    if (own.trim()) choose(own.trim())
  }

  return (
    <section className="card ns-compass" id="ns-brujula" aria-labelledby="ns-brujula-t">
      <h2 id="ns-brujula-t">Mi brújula</h2>
      <p className="muted">
        Reparte lo que te importa en tres montones. No hay respuestas buenas ni malas, y puede cambiar mañana.
      </p>

      <div className="ns-deck" aria-label="Por repartir">
        {loose.length ? (
          loose.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`ns-vcard${hand === v.id ? ' held' : ''}`}
              aria-pressed={hand === v.id}
              onClick={() => setHand(hand === v.id ? null : v.id)}
            >
              <span aria-hidden="true">{v.emoji}</span> {v.label}
            </button>
          ))
        ) : (
          <p className="muted small">Ya quedaron todas repartidas. Toca una si quieres moverla.</p>
        )}
      </div>
      <p className="ns-hand muted small" aria-live="polite">
        {inHand ? `¿Dónde va «${inHand.label}»? Toca un montón.` : loose.length ? 'Toca una carta y luego el montón donde va.' : ''}
      </p>

      <div className={`ns-piles${hand ? ' ready' : ''}`}>
        {PILES.map((p) => {
          const here = values.filter((v) => levels[v.id] === p.id)
          return (
            <div key={p.id} className={`ns-pile ns-pile-${p.id}`}>
              <button
                type="button"
                className="ns-pile-drop"
                disabled={!hand}
                aria-label={inHand ? `Poner «${inHand.label}» en ${p.label}` : p.label}
                onClick={() => drop(p.id)}
              >
                {p.label}
              </button>
              {here.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`ns-vcard small${hand === v.id ? ' held' : ''}`}
                  aria-pressed={hand === v.id}
                  aria-label={`${v.label}, en ${p.label}. Tócala para moverla.`}
                  onClick={() => setHand(hand === v.id ? null : v.id)}
                >
                  <span aria-hidden="true">{v.emoji}</span> {v.label}
                </button>
              ))}
            </div>
          )
        })}
      </div>
      {Object.keys(levels).length > 0 && (
        <button type="button" className="ns-link" onClick={restart}>
          Repartir de nuevo
        </button>
      )}

      <div className="ns-action">
        <h3>Una acción mínima para hoy</h3>
        {action && !changing ? (
          <div className="ns-today">
            <p className="ns-today-text">{action.text}</p>
            {action.done ? (
              <p className="small" role="status">
                Hecho. No importa si se sintió diferente: lo hiciste, y eso cuenta.
              </p>
            ) : (
              <p className="muted small">Si hoy no sale, también está bien. Mañana se puede elegir otra.</p>
            )}
            <div className="row">
              {!action.done && (
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setCompass((c) => ({ ...c, action: c.action && { ...c.action, done: true } }))}
                >
                  <Check size={16} aria-hidden="true" /> Ya la hice
                </button>
              )}
              <button type="button" className="ns-link" onClick={() => setChanging(true)}>
                Elegir otra
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="muted small">
              No hace falta tener ganas primero. A veces las ganas llegan después de empezar, y si no llegan, también cuenta.
            </p>
            <div className="chips stacked-sm">
              {ideas.map((t) => (
                <button key={t} type="button" className="chip" onClick={() => choose(t)}>
                  {t}
                </button>
              ))}
            </div>
            <form className="ns-own" onSubmit={submitOwn}>
              <label className="visually-hidden" htmlFor="ns-own">
                O escribe la tuya
              </label>
              <input
                id="ns-own"
                type="text"
                maxLength={80}
                value={own}
                onChange={(e) => setOwn(e.target.value)}
                placeholder="O escribe la tuya…"
                autoComplete="off"
              />
              <button type="submit" className="btn ghost small" disabled={!own.trim()}>
                Esta
              </button>
            </form>
            {soundsLikeRisk(own) && <RiskNotice />}
          </>
        )}
      </div>

      <Link to="/barrio" className="ns-link-row">
        Tus rumbos en el barrio →
      </Link>
    </section>
  )
}
