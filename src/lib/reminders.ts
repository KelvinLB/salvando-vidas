// Recordatorios sin servidor: un evento que se repite cada día en el calendario del teléfono,
// y es el calendario el que avisa. En la pantalla bloqueada se ve el título, por eso no lleva
// el nombre del medicamento ni de la app.

export type ReminderKind = 'medicamento' | 'animo'

export type Reminder = { title: string; details: string; path: string; time: string }

export const REMINDERS: Record<ReminderKind, Reminder> = {
  medicamento: {
    title: '💊 Mi medicamento',
    details: 'Cuando lo tomes, márcalo en la app.',
    path: '/mi-espacio/medicamentos',
    time: '09:00',
  },
  animo: {
    title: '🌱 ¿Cómo va tu día?',
    details: 'Un minuto para ti: marca cómo te sientes.',
    path: '/',
    time: '20:00',
  },
}

const pad = (n: number) => String(n).padStart(2, '0')
/** Hora local, sin zona: el calendario la toma en la hora del teléfono. */
const local = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** La primera vez: hoy, si la hora todavía no pasa; si no, mañana. Dura 10 minutos. */
function firstTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const start = new Date()
  start.setHours(h, m, 0, 0)
  if (start.getTime() <= Date.now()) start.setDate(start.getDate() + 1)
  return { start, end: new Date(start.getTime() + 10 * 60_000) }
}

const escape = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

// Un renglón de .ics no pasa de 75 bytes: lo que sobra sigue abajo, empezando con un espacio.
function fold(line: string) {
  const bytes = (s: string) => new TextEncoder().encode(s).length
  const parts: string[] = []
  let current = ''
  for (const ch of line) {
    if (bytes(current + ch) > (parts.length ? 74 : 75)) {
      parts.push(current)
      current = ''
    }
    current += ch
  }
  return [...parts, current].join('\r\n ')
}

/** El archivo .ics: el iPhone y casi cualquier calendario lo abren para agregarlo. */
export function icsFile(kind: ReminderKind, time: string) {
  const r = REMINDERS[kind]
  const { start, end } = firstTime(time)
  const url = location.origin + r.path
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salvando Vidas//Recordatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${kind}-${Date.now()}@salvando-vidas`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escape(r.title)}`,
    `DESCRIPTION:${escape(`${r.details}\n${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(r.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return new File([lines.map(fold).join('\r\n') + '\r\n'], `recordatorio-${kind}.ics`, { type: 'text/calendar' })
}

/** El mismo evento en Google Calendar, que en Android es lo más seguro. */
export function googleCalendarUrl(kind: ReminderKind, time: string) {
  const r = REMINDERS[kind]
  const { start, end } = firstTime(time)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: r.title,
    details: `${r.details}\n${location.origin + r.path}`,
    dates: `${local(start)}/${local(end)}`,
    recur: 'RRULE:FREQ=DAILY',
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export const isApple = () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document
