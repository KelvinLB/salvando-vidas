import type { BodyRecord } from './bodyCheck'
import type { Review } from './companion'
import { type DayPlan, planDone } from './dayplan'
import { listThoughts } from './db'
import { type JournalEntry, type Letter, localDate, read, store, today, useStored } from './storage'

// Los momentos que la persona vive con su mascota. Cada uno deja algo en el rincón de la
// mascota y una página en su álbum, y se queda para siempre: nada se pierde ni se apaga si
// un día no entra. No hay rachas ni prisa: no importa cuándo ni cada cuánto, solo que pasó.

export type MomentId =
  | 'conocernos'
  | 'respirar'
  | 'cuerpo'
  | 'plan'
  | 'razon'
  | 'carta'
  | 'diario'
  | 'personas'
  | 'mi-dia'
  | 'platica'
  | 'especialista'

export type Moment = { id: MomentId; emoji: string; title: string; text: string; item: string }

/** En el orden en que suelen pasar; el álbum los ordena por fecha. */
export const MOMENTS: Moment[] = [
  {
    id: 'conocernos',
    emoji: '🐣',
    title: 'El día que nos conocimos',
    text: 'Desde ese día hay alguien que te espera aquí, sin prisa.',
    item: 'su camita y una plantita que crece con cada momento',
  },
  {
    id: 'respirar',
    emoji: '🌬️',
    title: 'Nuestra primera respiración',
    text: 'Un minuto para ti, y tu cuerpo lo notó.',
    item: 'unas nubecitas que se mecen como tu respiración',
  },
  {
    id: 'cuerpo',
    emoji: '🌿',
    title: 'Le bajaste a lo que sentías',
    text: 'Tu cuerpo aprendió que se puede calmar, y fuiste tú quien le enseñó.',
    item: 'una bufanda tejida para los días fríos',
  },
  {
    id: 'plan',
    emoji: '🛟',
    title: 'Tu plan para los días difíciles',
    text: 'Lo armaste en un rato de calma para cuidarte en uno difícil. Eso es valentía.',
    item: 'una lamparita para los días oscuros',
  },
  {
    id: 'razon',
    emoji: '⭐',
    title: 'Tu primera razón para seguir',
    text: 'Cada razón que guardas se vuelve una estrellita en su rincón.',
    item: 'estrellitas de papel, una por cada razón',
  },
  {
    id: 'carta',
    emoji: '💌',
    title: 'La carta que te escribiste',
    text: 'Para el día que la necesites, ya hay palabras tuyas esperándote.',
    item: 'un sobre en la repisa',
  },
  {
    id: 'diario',
    emoji: '📔',
    title: 'Tu primera página del diario',
    text: 'Sacar lo que traes dentro también es cuidarte.',
    item: 'un cuaderno en la repisa',
  },
  {
    id: 'personas',
    emoji: '📞',
    title: 'Alguien con quien contar',
    text: 'Anotaste a alguien de confianza. Saber a quién buscar ya es un paso.',
    item: 'un teléfono de latas',
  },
  {
    id: 'mi-dia',
    emoji: '☀️',
    title: 'Tu primer día cumplido',
    text: 'Un plan pequeño, hecho. Ese día también contó.',
    item: 'un cuadro con un sol',
  },
  {
    id: 'platica',
    emoji: '🫖',
    title: 'Nuestra primera plática',
    text: 'Me contaste cómo has estado. Gracias por confiarme eso.',
    item: 'dos tazas para platicar',
  },
  {
    id: 'especialista',
    emoji: '🧭',
    title: 'Un paso hacia tu especialista',
    text: 'Buscar ayuda es de las cosas más valientes que hay.',
    item: 'una brújula para el camino',
  },
]

/** La fecha de cada momento vivido. */
export type Got = Partial<Record<MomentId, string>>
const KEY = 'momentos'
const SEEN = 'momentos-vistos'

const hasPet = () => read<unknown>('mascota', null) !== null

/** La primera vez que pasa algo, se guarda con su fecha; las siguientes ya no la cambian. */
export function markMoment(id: MomentId) {
  if (!hasPet()) return
  const got = read<Got>(KEY, {})
  if (got[id]) return
  store(KEY, { ...got, conocernos: got.conocernos ?? today(), [id]: today() })
}

const earliest = (dates: (string | undefined)[]) => dates.filter((d): d is string => !!d).sort()[0]

/**
 * Encuentra lo que ya pasó, aunque haya sido antes de esta versión o en otra pantalla.
 * Lo de antes de conocerse cuenta desde el día en que se conocieron: el álbum empieza ahí.
 */
export async function syncMoments() {
  if (!hasPet()) return
  const got: Got = { ...read<Got>(KEY, {}) }
  // Si ya tenía mascota antes de esta versión, su primera plática dice desde cuándo se conocen.
  const reviews = read<Review[]>('mascota-revisiones', [])
  const met = (got.conocernos ??= earliest([today(), ...reviews.map((r) => r.date)]))
  const on = (id: MomentId, found: boolean, date?: string) => {
    if (got[id] || !found) return
    got[id] = date && date > met ? date : met
  }

  const plan = read<Record<string, unknown>>('plan', {})
  on('plan', Object.values(plan).some((v) => Array.isArray(v) && v.length > 0))

  const reasons = read<JournalEntry[]>('razones', [])
  on('razon', reasons.length > 0, earliest(reasons.map((r) => r.date)))

  const letter = read<Letter | null>('carta', null)
  on('carta', !!letter?.text.trim(), letter?.date)

  const people = read<{ name: string; phone: string }[]>('personas', [])
  on('personas', people.some((p) => p.name.trim() || p.phone.trim()))

  const days = Object.values(read<Record<string, DayPlan>>('mi-dia', {})).filter(planDone)
  on('mi-dia', days.length > 0, earliest(days.map((d) => d.date)))

  on('platica', reviews.length > 0, earliest(reviews.map((r) => r.date)))

  const steps = read<Record<string, boolean>>('camino', {})
  on('especialista', Object.values(steps).some(Boolean))

  const body = read<BodyRecord[]>('cuerpo-registros', [])
  const breathed = body.filter((r) => r.after !== null)
  on('respirar', breathed.length > 0, earliest(breathed.map((r) => r.date)))
  const eased = body.filter((r) => r.after !== null && r.intensity !== null && r.after < r.intensity)
  on('cuerpo', eased.length > 0, earliest(eased.map((r) => r.date)))

  if (!got.diario) {
    const thoughts = await listThoughts()
    on('diario', thoughts.length > 0, earliest(thoughts.map((t) => localDate(new Date(t.createdAt)))))
  }

  // Lo que se guardó mientras se buscaba (por ejemplo, desde Tu cuerpo) también se queda.
  const now = read<Got>(KEY, {})
  const merged = { ...got, ...now }
  if (JSON.stringify(merged) !== JSON.stringify(now)) store(KEY, merged)
}

/** Las claves que, al cambiar, pueden traer un momento nuevo. */
export const MOMENT_SOURCES = new Set([
  'mascota',
  'plan',
  'razones',
  'carta',
  'personas',
  'mi-dia',
  'mascota-revisiones',
  'camino',
  'cuerpo-registros',
])

/** Qué tan grande va la plantita: de 0 (un brote) a 4 (con flor). */
export const plantStage = (count: number) => Math.min(4, Math.floor(Math.max(0, count - 1) / 2))

export function useMoments() {
  const [got] = useStored<Got>(KEY, {})
  const [seen, setSeen] = useStored<MomentId[]>(SEEN, [])
  const lived = MOMENTS.filter((m) => got[m.id]).sort((a, b) => got[a.id]!.localeCompare(got[b.id]!))
  // Lo nuevo desde la última visita al rincón, para que se note (sin contarlo como logro).
  const fresh = lived.filter((m) => !seen.includes(m.id) && m.id !== 'conocernos')
  const markSeen = () => {
    if (fresh.length) setSeen(lived.map((m) => m.id))
  }
  return { got, lived, fresh, markSeen, has: (id: MomentId) => !!got[id] }
}
