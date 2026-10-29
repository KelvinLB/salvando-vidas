import { type CompanionMood, MOOD_STATES } from '../data/companion'
import { MOODS } from '../data/content'
import { feelingLabel } from '../data/feelings'
import type { HoleState, Step } from '../data/hueco'
import { type BodyRecord, readBody } from './bodyCheck'
import { type CompanionToday, type Review, REVIEW_EVERY_DAYS, daysSince, mixKind, scores } from './companion'
import { listThoughts } from './db'
import { dayOf } from './diary'
import { soundsLikeRisk } from './risk'
import { type MoodEntry, read, today, useStored } from './storage'

// Salir del hueco: el lugar se parece a lo que la persona ya anotó en la app (el hueco para el
// ánimo bajo, el faro para los nervios, los faroles para la soledad), y lo que construye al
// avanzar se queda. Todo se lee aquí, en el teléfono; nada sale de él.

/** Un «¿y si…?» del faro, en el frasco que la persona eligió. */
export type Sorted = { worry: string; mine: boolean }

/**
 * La subida de hoy. Si la persona sale de la pantalla y vuelve, sigue donde iba. Los pasos se
 * guardan juntos aunque cambie de lugar: lo que hizo en uno cuenta en el otro.
 */
export type Climb = {
  date: string
  /** Lo que eligió en «¿Así te sientes hoy?»; sin valor, el lugar sale de sus registros. */
  state?: HoleState
  built: Step[]
  /** En el hueco, lo que nombró: va escrito en su escalón. */
  named?: string
  /** En el faro, los «¿y si…?» que ya acomodó. */
  sorted?: Sorted[]
  /** En los faroles, de quién se acordó: una de sus personas (`persona:<id>`) o alguien más. */
  remembered?: string
  /** La razón de su caja de esperanza que se prendió. */
  reason?: string
  out?: boolean
}

/** Cada vez que salieron, para el álbum de su mascota. */
export type HoleExit = { date: string; state: HoleState }

export const EXITS_KEY = 'hueco-salidas'

export function useClimb() {
  const [saved, setSaved] = useStored<Climb | null>('hueco-hoy', null)
  const fresh = (): Climb => ({ date: today(), built: [] })
  const climb = saved?.date === today() ? saved : fresh()
  const update = (patch: Partial<Climb>) =>
    setSaved((prev) => ({ ...(prev?.date === today() ? prev : fresh()), ...patch }))
  return [climb, update] as const
}

export type HoleReading = {
  /** El lugar que más se parece a estos días, o nada si todavía no hay registros. */
  state: HoleState | null
  /** Lo que se leyó, en palabras sencillas, para «¿Por qué se ve así?». */
  why: string[]
  /** Contó hace poco que ha pensado en hacerse daño, o lo que escribió suena a eso. */
  risk: boolean
  /** Un día pesado: los pasos se hacen más chiquitos. */
  heavy: boolean
  /** El diario tiene clave: lo que se marca ahí no se usa. */
  locked: boolean
}

// Lo que se marca en el diario, según a qué se parece.
const LONELY = new Set(['soledad', 'nadie', 'duelo', 'ruptura'])
const NERVOUS = new Set(['ansiedad', 'paralisis', 'pensamientos', 'cuerpo', 'miedo', 'panico', 'corazon', 'irreal'])
const DOWN = new Set([
  'vacio',
  'no-siento',
  'nada-entretiene',
  'sin-energia',
  'no-puedo-llorar',
  'mucho-sueno',
  'solo-existo',
  'tristeza',
  'llorar',
  'culpa',
  'carga',
  'cansancio',
])

const PET_VOTES: Partial<Record<CompanionMood, 'animo' | 'nervios'>> = {
  triste: 'animo',
  cansado: 'animo',
  apagado: 'animo',
  nervios: 'nervios',
}
const HEAVY_MOODS: CompanionMood[] = ['triste', 'apagado', 'nervios', 'cansado']

const quoted = (labels: string[]) => labels.map((l) => `«${l}»`).join(' y ')

/**
 * Lee su ánimo, la plática con su mascota, Tu cuerpo y su diario para que el hueco se parezca
 * a sus días. `name` es el de su mascota y `mood`, la cara que tiene hoy.
 */
export async function readHole(name: string, mood: CompanionMood): Promise<HoleReading> {
  const votes = { animo: 0, nervios: 0, soledad: 0 }
  const why: string[] = []
  let risk = false

  const moods = read<MoodEntry[]>('moods', [])
  const todayMood = moods.find((m) => m.date === today())?.mood
  if (todayMood !== undefined && todayMood <= 2) {
    votes.animo += 2
    why.push(`Hoy marcaste que te sientes ${MOODS[todayMood - 1].label.toLowerCase()}.`)
  }
  const low = moods.filter((m) => daysSince(m.date) < 7 && m.mood <= 2).length
  if (low >= 3) {
    votes.animo += 1
    why.push(`Esta semana marcaste tu ánimo bajo ${low} días.`)
  }

  const pet = read<CompanionToday | null>('mascota-hoy', null)
  const vote = pet?.date === today() ? PET_VOTES[pet.mood] : undefined
  if (pet && vote) {
    votes[vote] += 2
    why.push(`Hoy contaste que ${name} anda ${MOOD_STATES.find((m) => m.id === pet.mood)!.label.toLowerCase()}.`)
  }

  // La plática con su mascota (PHQ-9 y GAD-7), si fue en las últimas dos semanas.
  const [latest] = read<Review[]>('mascota-revisiones', [])
  if (latest && daysSince(latest.date) <= REVIEW_EVERY_DAYS) {
    const s = scores(latest.answers)
    const kind = mixKind(s.phq, s.gad)
    if (kind === 'mezcla') {
      votes.animo += 2
      votes.nervios += 2
      why.push(`En la plática con ${name} salieron las dos cosas: ánimo bajo y nervios.`)
    } else if (kind === 'depresion') {
      votes.animo += 2
      why.push(`En la plática con ${name} salió que el ánimo anda bajo.`)
    } else if (kind === 'ansiedad') {
      votes.nervios += 2
      why.push(`En la plática con ${name} salieron muchos nervios.`)
    }
    risk ||= s.risk
  }

  const recentBody = read<BodyRecord[]>('cuerpo-registros', []).filter((r) => daysSince(r.date) < 3)
  const patterns = new Set(recentBody.flatMap((r) => readBody(r.ids, r.intensity).mix))
  const alarm = patterns.has('ansiedad') || patterns.has('panico')
  if (alarm || patterns.has('estres')) {
    votes.nervios += 2
    why.push(`En Tu cuerpo, lo que marcaste se parece ${alarm ? 'a los nervios' : 'al estrés'}.`)
  }
  if (patterns.has('depresion')) {
    votes.animo += 2
    why.push('En Tu cuerpo, lo que marcaste se parece al ánimo bajo.')
  }

  // Si el diario tiene clave, lo que se marca ahí no sale de él. Lo que suena a riesgo sí se
  // toma en cuenta, sin mostrarlo, para que la ayuda llegue primero.
  const week = (await listThoughts()).filter((t) => daysSince(dayOf(t)) < 7)
  risk ||= week.some((t) => daysSince(dayOf(t)) < 3 && soundsLikeRisk(t.text))
  const locked = read<unknown>('diario-clave', null) !== null
  if (!locked) {
    const marked = [...new Set(week.flatMap((t) => t.feelings))]
    const lonely = marked.filter((f) => LONELY.has(f))
    const nervous = marked.filter((f) => NERVOUS.has(f))
    const down = marked.filter((f) => DOWN.has(f))
    votes.soledad += Math.min(4, lonely.length * 2)
    votes.nervios += Math.min(2, nervous.length)
    votes.animo += Math.min(2, down.length)
    const shown = [...lonely, ...nervous, ...down].slice(0, 2).map(feelingLabel)
    if (shown.length) why.push(`En tu diario marcaste ${quoted(shown)}.`)
  }

  const { animo, nervios, soledad } = votes
  const state: HoleState | null =
    soledad >= 2 && soledad >= animo && soledad >= nervios
      ? 'soledad'
      : animo >= 2 && nervios >= 2
        ? 'mezcla'
        : nervios > animo
          ? 'nervios'
          : animo > 0
            ? 'animo'
            : null

  const heavy = risk || (todayMood ?? 3) <= 2 || HEAVY_MOODS.includes(mood)
  return { state, why, risk, heavy, locked }
}
