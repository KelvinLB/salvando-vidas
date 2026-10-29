import { type Alike, EXERCISES, type Exercise, type ExerciseId, type HealthId } from '../data/practica'
import { localDate, useStored } from './storage'

// Lo que se guarda de Practicar con el cuerpo, solo en este teléfono: las respuestas del filtro
// de salud y, de cada vez que se practicó, el miedo antes y durante y si se pareció al pánico.
// No hay puntos ni rachas: solo se usa para mostrarle, con cariño, cómo va bajando el miedo.

export const HEALTH_KEY = 'practica-salud'
export const PRACTICE_KEY = 'practica-registro'
const MAX_RECORDS = 300

/** Lo que contestó en el filtro de salud: qué marcó y cuándo. */
export type HealthCheck = { date: string; yes: HealthId[] }

export type PracticeRecord = {
  id: ExerciseId
  date: string
  /** Miedo antes de empezar, de 0 (nada) a 10 (muchísimo). */
  before: number
  /** Miedo que hubo durante. */
  during: number
  alike: Alike
  /** Paró antes de que se cumpliera el tiempo. Está bien: también cuenta. */
  stopped?: boolean
}

/** Ya contestó el filtro de salud alguna vez. */
export const healthChecked = (h: HealthCheck | null): h is HealthCheck => !!h && Array.isArray(h.yes)

/** Puede practicar: contestó el filtro y no marcó nada. */
export const healthOk = (h: HealthCheck | null) => healthChecked(h) && h.yes.length === 0

/** Los ejercicios que se le ofrecen: todos si el filtro salió bien; ninguno si marcó algo. */
export const exercisesFor = (h: HealthCheck | null): Exercise[] => (healthOk(h) ? EXERCISES : [])

/** El filtro de salud, guardado en el teléfono. */
export function useHealthOk() {
  const [health, setHealth] = useStored<HealthCheck | null>(HEALTH_KEY, null)
  return {
    health,
    checked: healthChecked(health),
    ok: healthOk(health),
    save: (yes: HealthId[]) => setHealth({ date: localDate(), yes }),
    reset: () => setHealth(null),
  }
}

export function usePractice() {
  const [records, setRecords] = useStored<PracticeRecord[]>(PRACTICE_KEY, [])
  const add = (r: PracticeRecord) => setRecords((prev) => [...prev, r].slice(-MAX_RECORDS))
  return { records, add }
}

export const recordsOf = (records: PracticeRecord[], id: ExerciseId) => records.filter((r) => r.id === id)

/** El que conviene ahora: el más suave que todavía no ha probado, o el más suave de todos. */
export const suggested = (records: PracticeRecord[], allowed: Exercise[] = EXERCISES) =>
  allowed.find((e) => !records.some((r) => r.id === e.id)) ?? allowed[0]

/** El miedo en palabras: el número solo, a veces, no dice mucho. */
export const fearWord = (n: number) =>
  n === 0 ? 'nada' : n <= 3 ? 'poquito' : n <= 6 ? 'más o menos' : n <= 8 ? 'bastante' : 'muchísimo'

/**
 * Cómo ha cambiado el miedo de antes para un mismo ejercicio, dicho con cariño. Solo compara la
 * primera vez con la última; si todavía no baja, también se dice sin regaño.
 */
export function fearTrend(records: PracticeRecord[], id: ExerciseId): string | null {
  const mine = recordsOf(records, id)
  if (mine.length < 2) return null
  const first = mine[0].before
  const last = mine[mine.length - 1].before
  if (last < first)
    return `La primera vez le tenías ${first} de miedo (${fearWord(first)}); la última, ${last} (${fearWord(last)}). Tu cuerpo va aprendiendo.`
  if (last === 0) return 'Ya no le tienes miedo. Lo practicaste hasta que dejó de asustar.'
  return 'El miedo va a su ritmo. A veces tarda en bajar, y practicar igual cuenta.'
}
