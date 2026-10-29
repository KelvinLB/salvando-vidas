import { type ItemId, type MissionId, type ValueId } from '../data/barrio'
import { localDate, newId, read, store, today, useStored } from './storage'

// El barrio de la mascota: una plaza con vecinos, misiones chiquitas y la casa de la persona.
// Todo se guarda solo en este teléfono. Lo que la persona elige (sus gustos) nunca se interpreta;
// lo que hace en el barrio sirve para adaptarlo y para contarle «Lo que notó» su mascota,
// y solo lo que contesta en sus registros puede sugerir ir con un especialista.
// Nada se pierde: sin puntos, sin rachas, sin misiones que caduquen. «Hoy no» siempre vale.

/** Capa 1: sus gustos. Solo hacen que el barrio se sienta suyo. */
export type House = {
  name: string
  facade: string
  wall: string
  floor: string
  view: 'cerro' | 'mar' | 'ciudad' | 'milpa'
  /** Dónde puso cada cosa en su cuarto, fila y columna de la cuadrícula. */
  placed: Partial<Record<ItemId, [number, number]>>
}

export const DEFAULT_HOUSE: House = {
  name: 'Mi casita',
  facade: '#e46a8f',
  wall: '',
  floor: '',
  view: 'cerro',
  placed: {},
}

/** Capa 2: lo que hace en el barrio. Cada cosa con su fecha; nunca se cuenta ni se compara. */
export type BarrioEvent =
  | { id: string; at: string; kind: 'mision'; mission: MissionId; result: 'hecha' | 'hoy-no' }
  /** Ánimo de 1 (muy mal) a 5 (muy bien) que la persona marcó antes y después de un mandado. */
  | { id: string; at: string; kind: 'mandado'; activity: string; before: number; after?: number }
  /** Un escalón de la ruta del mercado: el miedo de 0 a 10 que esperaba y el que sintió. */
  | { id: string; at: string; kind: 'escalon'; step: string; expected: number; felt?: number }
  | { id: string; at: string; kind: 'visita' }

export type Ladder = { id: string; text: string; fear: number; done?: string }[]

/** Lo que su mascota notó y la persona corrigió («No es así») o borró. */
export type NoticedFeedback = Record<string, 'no-es-asi' | 'borrado'>

export type Barrio = {
  /** La primera vez que entró: desde ahí el barrio existe. */
  since: string
  /** El último día que vino, para recibirle con «¡qué gusto verte!» si pasó tiempo. */
  lastVisit: string
  house: House
  /** Rumbos que le importan (idea 5); vacío es «todavía no elijo». */
  values: ValueId[]
  /** Cada misión, la fecha en que la terminó por primera vez: deja su estampita y su cosa. */
  done: Partial<Record<MissionId, string>>
  /** Lo que dejó para otro día; sigue ahí, sin castigo. */
  later: Partial<Record<MissionId, string>>
  events: BarrioEvent[]
  /** Su escalera de la ruta del mercado, armada por ella misma. */
  ladder: Ladder
  noticed: NoticedFeedback
  /** Capítulo de la historia de cada vecino: solo avanza, nunca retrocede. */
  chapters: Record<string, number>
  /** Las fiestas de temporada que prefiere no ver (por ejemplo, la ofrenda). */
  hiddenSeasons: string[]
  /** Las temporadas que ya le tocaron: su adorno se queda en la casa para siempre. */
  seasonsSeen: string[]
  /** Las zonas del barrio que ya conoció: la primera vez se presentan. */
  zonesSeen: string[]
  /** Si quiere que lo que hace en el barrio vaya como contexto en su resumen. */
  inSummary: boolean
}

export const BARRIO_KEY = 'barrio'

export const emptyBarrio = (): Barrio => ({
  since: today(),
  lastVisit: today(),
  house: DEFAULT_HOUSE,
  values: [],
  done: {},
  later: {},
  events: [],
  ladder: [],
  noticed: {},
  chapters: {},
  hiddenSeasons: [],
  seasonsSeen: [],
  zonesSeen: [],
  inSummary: true,
})

/** Cuántos eventos se guardan: suficiente para ver patrones, sin acumular de más. */
const MAX_EVENTS = 300

// Lo guardado por una versión anterior puede no traer los campos nuevos: se completan.
const complete = (b: Partial<Barrio>): Barrio => ({ ...emptyBarrio(), ...b, house: { ...DEFAULT_HOUSE, ...b.house } })

export function useBarrio() {
  const [saved, setBarrio] = useStored<Barrio>(BARRIO_KEY, emptyBarrio)
  const barrio = complete(saved)
  const patch = (next: Partial<Barrio> | ((b: Barrio) => Partial<Barrio>)) =>
    setBarrio((b) => {
      const full = complete(b)
      return { ...full, ...(typeof next === 'function' ? next(full) : next) }
    })
  return { barrio, setBarrio, patch }
}

/** Para guardar desde fuera de un componente (por ejemplo, al terminar una misión). */
export function readBarrio(): Barrio {
  return complete(read<Partial<Barrio>>(BARRIO_KEY, {}))
}

export function updateBarrio(change: (b: Barrio) => Partial<Barrio>) {
  const b = readBarrio()
  store(BARRIO_KEY, { ...b, ...change(b) })
}

type NewEvent = BarrioEvent extends infer E ? (E extends BarrioEvent ? Omit<E, 'id' | 'at'> : never) : never

export function logEvent(event: NewEvent): string {
  const id = newId()
  updateBarrio((b) => ({
    events: [{ ...event, id, at: new Date().toISOString() } as BarrioEvent, ...b.events].slice(0, MAX_EVENTS),
  }))
  return id
}

/** Completa un evento ya guardado (el ánimo «después» de un mandado, el miedo que sí sintió). */
export function amendEvent(id: string, change: Partial<BarrioEvent>) {
  updateBarrio((b) => ({ events: b.events.map((e) => (e.id === id ? ({ ...e, ...change } as BarrioEvent) : e)) }))
}

/** Terminó una misión: queda su estampita y su cosa para la casa; la primera fecha no cambia. */
export function finishMission(mission: MissionId) {
  logEvent({ kind: 'mision', mission, result: 'hecha' })
  updateBarrio((b) => {
    const later = { ...b.later }
    delete later[mission]
    return { done: { [mission]: today(), ...b.done }, later }
  })
}

/** «Hoy no»: la misión se queda en el tablero para otro día. */
export function missionLater(mission: MissionId) {
  logEvent({ kind: 'mision', mission, result: 'hoy-no' })
  updateBarrio((b) => ({ later: { ...b.later, [mission]: today() } }))
}

/** El capítulo de un vecino solo sube. */
export function advanceChapter(npc: string, chapter: number) {
  updateBarrio((b) => ({ chapters: { ...b.chapters, [npc]: Math.max(b.chapters[npc] ?? 0, chapter) } }))
}

/** Días desde su última visita; se marca la de hoy. */
export function visit(): number {
  const b = readBarrio()
  const [y, m, d] = b.lastVisit.split('-').map(Number)
  const away = Math.round((new Date(localDate() + 'T00:00').getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000)
  if (b.lastVisit !== today()) {
    updateBarrio(() => ({ lastVisit: today() }))
    logEvent({ kind: 'visita' })
  }
  return away
}
