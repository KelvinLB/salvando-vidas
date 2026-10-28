import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { download } from '../lib/backup'
import { REMINDERS, type ReminderKind, googleCalendarUrl, icsFile, isApple } from '../lib/reminders'
import { useStored } from '../lib/storage'

type Props = { kind: ReminderKind; title: string; text: string }

/**
 * Un recordatorio diario en el calendario del teléfono. En iPhone el archivo .ics abre el
 * calendario; en Android lo más seguro es Google Calendar, así que cada uno ve primero el suyo.
 */
export default function ReminderCard({ kind, title, text }: Props) {
  const [time, setTime] = useStored(`recordatorio-${kind}`, REMINDERS[kind].time)
  const [sent, setSent] = useState(false)
  const apple = isApple()

  const file = (primary: boolean) => (
    <button
      className={primary ? 'btn' : 'btn small ghost'}
      onClick={() => {
        download(icsFile(kind, time))
        setSent(true)
      }}
    >
      {primary && <CalendarPlus size={18} aria-hidden="true" />}
      {primary ? 'Agregar a mi calendario' : 'Descargar para otro calendario'}
    </button>
  )

  const google = (primary: boolean) => (
    <a
      className={primary ? 'btn' : 'btn small ghost'}
      href={googleCalendarUrl(kind, time)}
      target="_blank"
      rel="noreferrer"
      onClick={() => setSent(true)}
    >
      {primary && <CalendarPlus size={18} aria-hidden="true" />}
      {primary ? 'Agregar a Google Calendar' : 'Usar Google Calendar'}
    </a>
  )

  return (
    <section className="card field reminder">
      <strong>{title}</strong>
      <small className="muted">{text}</small>
      <label className="reminder-time">
        Todos los días a las
        <input type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />
      </label>
      <div className="row">
        {apple ? file(true) : google(true)}
        {apple ? google(false) : file(false)}
      </div>
      {sent ? (
        <p className="muted small" role="status">
          Si tu calendario te pregunta, acepta el evento. Para quitar el recordatorio, bórralo desde tu
          calendario.
        </p>
      ) : (
        <p className="muted small">En la pantalla bloqueada solo se verá «{REMINDERS[kind].title}».</p>
      )}
    </section>
  )
}
