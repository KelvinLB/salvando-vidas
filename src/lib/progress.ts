import { type Review, daysSince, scores } from './companion'
import { type MoodEntry, localDate } from './storage'

// «Cómo voy»: el camino visto desde lejos, con lo que la persona ya marca en la app.
// Sin rachas ni calificaciones: un día sin marcar no es un fracaso.

/** Las fechas de los últimos `n` días, de la más vieja a hoy. */
export function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return localDate(d)
  })
}

export type Trend = 'mejor' | 'parejo' | 'pesado'

export const TREND_WORDS: Record<Trend, string> = {
  mejor: 'Un poco mejor',
  parejo: 'Parejo',
  pesado: 'Más pesado',
}

const mean = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length

/** Esta semana contra la anterior; con menos de 3 días marcados en alguna, todavía no se sabe. */
export function moodTrend(moods: MoodEntry[]): Trend | null {
  const days = lastDays(14)
  const week = (from: number) => {
    const span = new Set(days.slice(from, from + 7))
    return moods.filter((m) => span.has(m.date)).map((m) => m.mood)
  }
  const before = week(0)
  const now = week(7)
  if (before.length < 3 || now.length < 3) return null
  const diff = mean(now) - mean(before)
  return diff >= 0.5 ? 'mejor' : diff <= -0.5 ? 'pesado' : 'parejo'
}

const between = (from: string, to: string) => daysSince(from) - daysSince(to)

export type Move = 'baja' | 'igual' | 'sube'

/**
 * La revisión más nueva contra la de hace como un mes (o la anterior, si no hay de tan atrás).
 * 5 puntos es lo que los médicos toman como un cambio real en el PHQ-9 y el GAD-7.
 */
export function reviewChange(reviews: Review[]) {
  const [now, ...older] = reviews
  if (!now || !older.length) return null
  const spaced = older.filter((r) => between(r.date, now.date) >= 10)
  const then = (spaced.length ? spaced : older).reduce((best, r) =>
    Math.abs(between(r.date, now.date) - 30) < Math.abs(between(best.date, now.date) - 30) ? r : best,
  )
  const a = scores(then.answers)
  const b = scores(now.answers)
  const move = (x: number, y: number): Move => (y <= x - 5 ? 'baja' : y >= x + 5 ? 'sube' : 'igual')
  return { then, now, phq: { then: a.phq, now: b.phq, move: move(a.phq, b.phq) }, gad: { then: a.gad, now: b.gad, move: move(a.gad, b.gad) } }
}

/** «hoy», «hace 5 días», «hace 3 semanas», «hace un mes»… */
export function agoWords(date: string) {
  const n = daysSince(date)
  if (n <= 0) return 'hoy'
  if (n === 1) return 'ayer'
  if (n < 14) return `hace ${n} días`
  if (n < 28) return `hace ${Math.round(n / 7)} semanas`
  if (n < 45) return 'hace un mes'
  return `hace ${Math.round(n / 30)} meses`
}
