import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VALUES, type ValueId } from '../../data/barrio'
import { amendEvent, logEvent, useBarrio } from '../../lib/barrio'
import type { FlowProps } from '../types'
import { Flow, MoodFaces, NotNow, OwnText, Says, Thanks, moodLabel, pendingToday } from './parts'

// Tere y su mandado (activación conductual): algo chiquito y de verdad, fuera del teléfono.
// Antes y después marca cómo se siente; se compara con calma y nunca se juzga si no cambió.
// Si se va a hacerlo y vuelve más tarde, Tere le pregunta si ya lo hizo.

type Activity = { text: string; value?: ValueId; tiny?: boolean }

/** Los mandados, mezclados por rumbo para que sin rumbos elegidos haya de todo arriba. `tiny`: caben en un día pesado. */
const ACTIVITIES: Activity[] = [
  { text: 'Salir a la puerta cinco minutos', value: 'cuerpo', tiny: true },
  { text: 'Poner una canción que me guste', value: 'disfrutar', tiny: true },
  { text: 'Mandarle un mensaje a alguien que quiero', value: 'familia', tiny: true },
  { text: 'Regar una planta', value: 'comunidad', tiny: true },
  { text: 'Leer una página de un libro', value: 'aprender', tiny: true },
  { text: 'Lavar una taza', tiny: true },
  { text: 'Abrir la ventana y respirar el aire', value: 'cuerpo', tiny: true },
  { text: 'Prepararme un café o un té', value: 'disfrutar', tiny: true },
  { text: 'Llamarle a alguien un ratito', value: 'familia' },
  { text: 'Saludar a un vecino', value: 'comunidad' },
  { text: 'Aprender una receta y apuntarla', value: 'aprender' },
  { text: 'Caminar a la esquina y regresar', value: 'cuerpo' },
  { text: 'Ver el cielo un ratito', value: 'disfrutar', tiny: true },
  { text: 'Lavarme la cara con agua fresca', value: 'cuerpo', tiny: true },
]

const SHOWN = 6

type Stage = 'intro' | 'before' | 'pick' | 'own' | 'wait' | 'after' | 'end'

export default function Mandado({ petName, heavy, onDone, onLater, onClose }: FlowProps) {
  const { barrio } = useBarrio()
  // Si dejó un mandado a medias hoy, se retoma en «¿Ya lo hiciste?».
  const [pending] = useState(() => {
    const e = pendingToday('mandado', 'mandado')
    return e?.kind === 'mandado' ? e : null
  })
  const [stage, setStage] = useState<Stage>(pending ? 'wait' : 'intro')
  const [before, setBefore] = useState(pending?.before ?? 3)
  const [after, setAfter] = useState(3)
  const [activity, setActivity] = useState(pending?.activity ?? '')
  const [eventId, setEventId] = useState(pending?.id ?? '')
  const [more, setMore] = useState(false)

  // Primero lo que va con sus rumbos, si ya eligió; en un día pesado, solo lo más chiquito.
  const mine = (a: Activity) => !!a.value && barrio.values.includes(a.value)
  const list = ACTIVITIES.filter((a) => !heavy || a.tiny).sort((a, b) => Number(mine(b)) - Number(mine(a)))
  const shown = more ? list : list.slice(0, SHOWN)

  const choose = (text: string) => {
    setActivity(text)
    setEventId(logEvent({ kind: 'mandado', activity: text, before }))
    setStage('wait')
  }

  const finish = (mood: number) => {
    setAfter(mood)
    amendEvent(eventId, { after: mood })
    setStage('end')
  }

  const closing =
    after > before
      ? '¿Viste? A veces moverse tantito ayuda. Eso lo hiciste tú.'
      : after === before
        ? 'Gracias por hacerlo. A veces el ánimo tarda en moverse, y el mandado igual cuenta.'
        : 'Gracias por hacerlo y por decirme cómo te fue de verdad. Hay días en que nada se acomoda rápido, y está bien. Cuenta igual.'

  return (
    <Flow label="Un mandado con Tere">
      <Says who="tere">
        {stage === 'intro' && (
          <p>
            ¡Hola! ¿Me haces un mandado? Pero de los de verdad: algo chiquito, fuera del teléfono. {petName} me cuida la
            tiendita mientras.
            {heavy && ' Hoy uno bien chiquito, de esos que casi no cuestan.'}
          </p>
        )}
        {stage === 'before' && <p>Antes de ir: ¿cómo te sientes ahorita? Como sea, está bien.</p>}
        {(stage === 'pick' || stage === 'own') && <p>¿Cuál mandado te late? Escoge uno chiquito.</p>}
        {stage === 'wait' &&
          (pending && eventId === pending.id ? (
            <p>
              ¡Volviste! ¿Ya lo hiciste? Era: {activity.toLowerCase()}. Si todavía no, aquí sigo, sin prisa.
            </p>
          ) : (
            <p>
              Va: {activity.toLowerCase()}. Ve, aquí te espero. Puedes cerrar esto e ir; cuando vuelvas, me cuentas.
            </p>
          ))}
        {stage === 'after' && <p>¿Y ahora cómo te sientes?</p>}
        {stage === 'end' && <p>{closing}</p>}
      </Says>

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('before')}>
            Va
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'before' && (
        <MoodFaces
          label="Cómo te sientes antes del mandado"
          onPick={(m) => {
            setBefore(m)
            setStage('pick')
          }}
        />
      )}

      {stage === 'pick' && (
        <>
          <div className="bm-options">
            {shown.map((a) => (
              <button key={a.text} type="button" className="bm-option" onClick={() => choose(a.text)}>
                <span>{a.text}</span>
                {a.value && <small className="bm-tag">{VALUES.find((v) => v.id === a.value)?.label}</small>}
              </button>
            ))}
          </div>
          <div className="row">
            {!more && list.length > SHOWN && (
              <button type="button" className="btn small ghost" onClick={() => setMore(true)}>
                Ver más
              </button>
            )}
            <button type="button" className="btn small ghost" onClick={() => setStage('own')}>
              Otro, con mis palabras
            </button>
          </div>
        </>
      )}

      {stage === 'own' && (
        <OwnText
          label="¿Qué mandado chiquito vas a hacer?"
          placeholder="Por ejemplo: sacar la basura"
          submit="Este"
          maxLength={60}
          onCancel={() => setStage('pick')}
          // Si sonó a riesgo, el mandado se guarda sin esas palabras.
          onSubmit={(text, risk) => choose(risk ? 'Un mandado mío' : text)}
        />
      )}

      {stage === 'wait' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('after')}>
            Ya lo hice
          </button>
          <button type="button" className="btn ghost" onClick={onLater}>
            Hoy no
          </button>
        </div>
      )}

      {stage === 'after' && <MoodFaces label="Cómo te sientes después del mandado" onPick={finish} />}

      {stage === 'end' && (
        <>
          <p className="muted small">
            Antes marcaste «{moodLabel(before)}» y ahora «{moodLabel(after)}». Se queda aquí, en tu teléfono.
          </p>
          {after <= 2 && (
            <p className="small">
              Si hoy pesa mucho, en <Link to="/calma">Calma</Link> hay algo para acompañarte un rato.
            </p>
          )}
          <Thanks to="Tere" onDone={onDone} />
        </>
      )}
    </Flow>
  )
}
