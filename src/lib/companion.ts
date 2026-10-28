import { type Companion, type CompanionMood, QUESTIONS } from '../data/companion'
import { type MoodEntry, localDate, today, useStored } from './storage'

// Puntajes y cortes del PHQ-9 (Kroenke 2001) y del GAD-7 (Spitzer 2006).
// Orientan; no diagnostican. El diagnóstico es de un especialista.

export type Review = { id: string; date: string; answers: Record<string, number> }
export type CompanionToday = { date: string; mood: CompanionMood }

const sum = (answers: Record<string, number>, scale: 'phq' | 'gad') =>
  QUESTIONS.filter((q) => q.scale === scale).reduce((s, q) => s + (answers[q.id] ?? 0), 0)

export function scores(answers: Record<string, number>) {
  return {
    phq: sum(answers, 'phq'),
    gad: sum(answers, 'gad'),
    // Cualquier respuesta distinta de «ningún día» en la pregunta 9 cuenta, sin importar el total.
    risk: (answers.dano ?? 0) > 0,
  }
}

export const PHQ_MAX = 27
export const GAD_MAX = 21

/** 0 mínima · 1 leve · 2 moderada · 3 moderadamente severa · 4 severa */
export const phqLevel = (score: number) => (score >= 20 ? 4 : score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0)
/** 0 mínima · 1 leve · 2 moderada · 3 severa */
export const gadLevel = (score: number) => (score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0)

// Para la persona, en palabras sencillas.
export const SIGNALS = ['Pocas señales', 'Algunas señales', 'Varias señales', 'Muchas señales', 'Muchas señales']
// Para el especialista, con los nombres clínicos de cada nivel.
export const PHQ_CLINICAL = ['mínima', 'leve', 'moderada', 'moderadamente severa', 'severa']
export const GAD_CLINICAL = ['mínima', 'leve', 'moderada', 'severa']

/** A qué se parece lo que carga: 10 o más es el corte que usan los médicos en ambos cuestionarios. */
export function mixKind(phq: number, gad: number) {
  if (phq >= 10 && gad >= 10) return 'mezcla'
  if (phq >= 10) return 'depresion'
  if (gad >= 10) return 'ansiedad'
  if (phq >= 5 || gad >= 5) return 'leve'
  return 'pocas'
}

const mean = (answers: Record<string, number>, ids: string[]) => {
  const values = ids.map((id) => answers[id]).filter((v) => v !== undefined)
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
}

/** La cara de la mascota según lo que respondió (sirve también a mitad de las preguntas). */
export function moodFromAnswers(answers: Record<string, number>): CompanionMood {
  const loads: [CompanionMood, number][] = [
    ['triste', mean(answers, ['animo', 'valor'])],
    ['apagado', mean(answers, ['interes'])],
    ['nervios', mean(answers, ['nervios', 'no-parar', 'todo', 'relajar', 'miedo'])],
    ['cansado', mean(answers, ['energia', 'sueno'])],
  ]
  const [mood, load] = loads.reduce((a, b) => (b[1] > a[1] ? b : a))
  return load >= 1.5 ? mood : 'calma'
}

/** La cara del ánimo de hoy que se marca en Inicio (1 a 5). */
export const moodFromScale = (value: number): CompanionMood => (value >= 4 ? 'feliz' : value === 3 ? 'calma' : 'triste')

export const REVIEW_EVERY_DAYS = 14

export function daysSince(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const now = new Date(localDate() + 'T00:00')
  return Math.round((now.getTime() - then.getTime()) / 86_400_000)
}

/** La mascota y cómo se ve hoy: lo que la persona dijo hoy pesa más que lo de hace días. */
export function useCompanion() {
  const [companion, setCompanion] = useStored<Companion | null>('mascota', null)
  const [todayState, setTodayState] = useStored<CompanionToday | null>('mascota-hoy', null)
  const [reviews, setReviews] = useStored<Review[]>('mascota-revisiones', [])
  const [moods] = useStored<MoodEntry[]>('moods', [])

  const latest = reviews[0]
  const recentReview = latest && daysSince(latest.date) <= REVIEW_EVERY_DAYS ? latest : undefined
  const todayMood = moods.find((m) => m.date === today())?.mood

  const mood: CompanionMood =
    todayState?.date === today()
      ? todayState.mood
      : todayMood !== undefined
        ? moodFromScale(todayMood)
        : recentReview
          ? moodFromAnswers(recentReview.answers)
          : 'calma'

  const setMood = (m: CompanionMood) => setTodayState({ date: today(), mood: m })

  return { companion, setCompanion, mood, setMood, reviews, setReviews, latest, recentReview }
}
