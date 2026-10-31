import { MISSIONS, type MissionId, missionById } from '../data/barrio'
import type { Noticed } from '../barrio/types'
import type { Barrio, BarrioEvent } from './barrio'
import { daysSince } from './companion'
import { localDate } from './storage'

// «Lo que notó» su mascota (capa 2): solo describe lo que la persona hizo en el barrio, con
// sus fechas, y dice qué cambia en el barrio por eso. Nunca dice qué tiene la persona, nunca
// usa sus gustos (colores, casa, cómo decora, cómo se ve su mascota) y nunca sugiere ir con un
// especialista: eso solo lo hacen sus registros y la plática con su mascota (capa 3).
// La persona lo puede corregir («No es así») o borrar; lo corregido ya no se usa para el
// tablero ni para su resumen, y lo borrado ya no se le muestra.
// Los textos quedan pendientes de revisión de un psicólogo.

/** Lo que se mira hacia atrás: suficiente para ver un patrón, sin cargar meses viejos. */
export const RECENT_DAYS = 60

/** Con menos de esto, todavía no se dice nada: dos veces ya es «casi siempre» si las dos coinciden. */
const MIN_TIMES = 2

/** «Casi siempre»: al menos 3 de cada 5 veces. */
const MOSTLY = 0.6

const dayOf = (e: BarrioEvent) => localDate(new Date(e.at))
const recent = (events: BarrioEvent[]) => events.filter((e) => daysSince(dayOf(e)) < RECENT_DAYS)

const listJoin = (items: string[]) => new Intl.ListFormat('es', { type: 'conjunction' }).format(items)
const titleOf = (id: MissionId) => `«${missionById(id).title}»`
const avg = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length

export type Part = 'manana' | 'tarde' | 'noche'
const PART_WORDS: Record<Part, string> = { manana: 'en la mañana', tarde: 'en la tarde', noche: 'en la noche' }
const partOf = (hour: number): Part => (hour >= 6 && hour < 12 ? 'manana' : hour >= 12 && hour < 19 ? 'tarde' : 'noche')

/**
 * Los patrones en crudo, con los números que los sostienen. Cada uno tiene un id estable:
 * cambia si cambia lo que se afirma (por ejemplo, «mejor» o «igual» después de los mandados),
 * para que una corrección valga solo para lo que la persona corrigió.
 */
export type Pattern =
  | { id: 'mandado-mejor' | 'mandado-igual' | 'mandado-bajo'; kind: 'mandado'; better: number; same: number; lower: number; total: number }
  | { id: 'mercado-menor' | 'mercado-parecido' | 'mercado-mayor'; kind: 'mercado'; less: number; total: number; expected: number; felt: number }
  | { id: `hora-${Part}`; kind: 'hora'; part: Part }
  | { id: 'pendientes'; kind: 'pendientes'; missions: MissionId[] }
  | { id: `repite-${MissionId}`; kind: 'repite'; mission: MissionId; times: number }

export function patternsOf(barrio: Barrio): Pattern[] {
  const events = recent(barrio.events ?? [])
  const found: Pattern[] = []

  // Activación conductual: el ánimo (1 a 5) que marcó antes y después de cada mandado.
  const mandados = events.filter((e) => e.kind === 'mandado' && e.after !== undefined) as Extract<BarrioEvent, { kind: 'mandado' }>[]
  if (mandados.length >= MIN_TIMES) {
    const better = mandados.filter((e) => e.after! > e.before).length
    const lower = mandados.filter((e) => e.after! < e.before).length
    const same = mandados.length - better - lower
    const total = mandados.length
    const id = better / total >= MOSTLY ? 'mandado-mejor' : lower / total >= MOSTLY ? 'mandado-bajo' : 'mandado-igual'
    found.push({ id, kind: 'mandado', better, same, lower, total })
  }

  // Exposición gradual: el miedo (0 a 10) que esperaba en cada escalón y el que sí sintió.
  const escalones = events.filter((e) => e.kind === 'escalon' && e.felt !== undefined) as Extract<BarrioEvent, { kind: 'escalon' }>[]
  if (escalones.length >= MIN_TIMES) {
    const less = escalones.filter((e) => e.felt! < e.expected).length
    const more = escalones.filter((e) => e.felt! > e.expected).length
    const total = escalones.length
    const id = less / total >= MOSTLY ? 'mercado-menor' : more / total >= MOSTLY ? 'mercado-mayor' : 'mercado-parecido'
    found.push({
      id,
      kind: 'mercado',
      less,
      total,
      expected: avg(escalones.map((e) => e.expected)),
      felt: avg(escalones.map((e) => e.felt!)),
    })
  }

  // A qué hora suele venir: un evento por día (el primero), en al menos 3 días distintos.
  const firstOfDay = new Map<string, number>()
  for (const e of [...events].reverse()) if (!firstOfDay.has(dayOf(e))) firstOfDay.set(dayOf(e), new Date(e.at).getHours())
  if (firstOfDay.size >= 3) {
    const parts = [...firstOfDay.values()].map(partOf)
    const top = (['manana', 'tarde', 'noche'] as const)
      .map((p) => [p, parts.filter((x) => x === p).length] as const)
      .reduce((a, b) => (b[1] > a[1] ? b : a))
    if (top[1] / parts.length >= MOSTLY) found.push({ id: `hora-${top[0]}`, kind: 'hora', part: top[0] })
  }

  // Lo que dejó para otro día y sigue esperando (sin fecha límite).
  const waiting = MISSIONS.map((m) => m.id).filter((id) => barrio.later?.[id])
  if (waiting.length) found.push({ id: 'pendientes', kind: 'pendientes', missions: waiting })

  // Lo que repite: una misión terminada en 3 días distintos o más. Como mucho las dos que más.
  const days = new Map<MissionId, Set<string>>()
  for (const e of events) if (e.kind === 'mision' && e.result === 'hecha') days.set(e.mission, (days.get(e.mission) ?? new Set()).add(dayOf(e)))
  const repeated = [...days.entries()]
    .filter(([, d]) => d.size >= 3)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 2)
  for (const [mission, d] of repeated) found.push({ id: `repite-${mission}`, kind: 'repite', mission, times: d.size })

  return found
}

/** Lo que la persona dejó tal cual: ni corregido ni borrado. Solo eso usan el tablero y el resumen. */
export const standing = (barrio: Barrio) => patternsOf(barrio).filter((p) => !barrio.noticed?.[p.id])

function describe(p: Pattern, petName: string): Omit<Noticed, 'id'> {
  switch (p.kind) {
    case 'mandado':
      if (p.id === 'mandado-mejor')
        return {
          saw: `Después de los mandados ${p.better === p.total ? 'siempre' : 'casi siempre'} marcaste mejor que antes.`,
          then: 'Por eso el mandado de Tere sale antes en el tablero.',
        }
      if (p.id === 'mandado-bajo')
        return {
          saw: 'Después de los mandados casi siempre marcaste igual o más bajo que antes.',
          then: 'Por eso no van primero en el tablero. Si un día quieres, puedes probar con uno más chiquito o más a tu gusto.',
        }
      return {
        saw: 'Después de los mandados, a veces marcaste mejor y a veces igual.',
        then: 'Nada cambia por eso: los mandados siguen ahí cuando quieras. No todos los días ayudan igual, y está bien.',
      }
    case 'mercado':
      if (p.id === 'mercado-menor')
        return {
          saw: `En la ruta del mercado, el miedo que sentiste ${p.less === p.total ? 'fue' : 'casi siempre fue'} menor que el que esperabas.`,
          then: 'Por eso Don Beto te ofrece el siguiente escalón cuando tú quieras, sin prisa.',
        }
      if (p.id === 'mercado-mayor')
        return {
          saw: 'En la ruta del mercado, el miedo que sentiste casi siempre fue más del que esperabas.',
          then: 'Por eso Don Beto no te apura: puedes repetir un escalón o poner uno más chiquito antes de subir.',
        }
      return {
        saw: 'En la ruta del mercado, el miedo que sentiste se pareció al que esperabas.',
        then: 'Puedes quedarte en el mismo escalón las veces que quieras; Don Beto te espera.',
      }
    case 'hora':
      return p.part === 'noche'
        ? {
            saw: `Casi siempre vienes ${PART_WORDS.noche}.`,
            then: 'Por eso, ya noche, el tablero trae cosas para descansar antes que misiones.',
          }
        : {
            saw: `Casi siempre vienes ${PART_WORDS[p.part]}.`,
            then: `Nada cambia por eso: ${petName} y el barrio te esperan a la hora que quieras.`,
          }
    case 'pendientes':
      return {
        saw:
          p.missions.length === 1
            ? `Dejaste ${titleOf(p.missions[0])} para otro día.`
            : `Dejaste para otro día ${listJoin(p.missions.map(titleOf))}.`,
        then:
          p.missions.length === 1
            ? 'Por eso sigue en el tablero, sin castigo y sin fecha: vuelve cuando tú quieras.'
            : 'Por eso siguen en el tablero, sin castigo y sin fecha: vuelven cuando tú quieras.',
      }
    case 'repite':
      return {
        saw: `Has vuelto varias veces a ${titleOf(p.mission)}.`,
        then: 'Si te sirve, ahí sigue: el tablero lo tiene a la mano.',
      }
  }
}

/**
 * Lo que su mascota notó, para mostrárselo. Lo borrado no sale; lo que marcó «No es así» sale
 * corregido, para que pueda decir «Sí es así» si cambia de opinión.
 */
export function noticedOf(barrio: Barrio, petName: string): Noticed[] {
  return patternsOf(barrio)
    .filter((p) => barrio.noticed?.[p.id] !== 'borrado')
    .map((p) => {
      const d = describe(p, petName)
      return barrio.noticed?.[p.id] === 'no-es-asi' ? { id: p.id, saw: d.saw, then: `${petName} ya no lo toma en cuenta.` } : { id: p.id, ...d }
    })
}

/** La técnica de cada misión, con sus nombres para el especialista. */
const CLINICAL: Record<MissionId, string> = {
  mandado: 'activación conductual (mandados)',
  kiosco: 'respiración guiada',
  cinco: 'anclaje con los sentidos',
  agua: 'autocuidado básico',
  mercado: 'exposición gradual (ruta del mercado)',
  taller: 'revisar pensamientos (reestructuración cognitiva)',
  banca: 'autocompasión',
  carta: 'actos de bondad',
  hueco: 'el juego «Salir del hueco»',
  desenredar: 'una actividad tranquila para descansar la cabeza (el juego «Hilos sueltos»)',
  practicar: 'exposición interoceptiva con Don Chema (o solo platicarlo, si el filtro de salud dijo que mejor no)',
  receta: 'derreflexión: ayudar a un vecino a recordar su receta (la atención hacia afuera)',
}

const times = (n: number) => `${n} ${n === 1 ? 'vez' : 'veces'}`
const one = (n: number) => n.toFixed(1).replace('.0', '')

/** El título de la sección del barrio en «Mi resumen para la consulta». */
export const SUMMARY_TITLE = 'DEL BARRIO (contexto que registré yo en la app, no es diagnóstico)'

/**
 * Las líneas para «Mi resumen para la consulta», en primera persona como el resto del resumen.
 * Solo lo que la persona no corrigió ni borró. La hora a la que viene no va (no le sirve al
 * especialista y es más de lo necesario), y sus gustos nunca van.
 */
export function summaryLines(barrio: Barrio): string[] {
  const lines: string[] = []
  const done = recent(barrio.events ?? []).filter((e) => e.kind === 'mision' && e.result === 'hecha') as Extract<
    BarrioEvent,
    { kind: 'mision' }
  >[]
  if (done.length) {
    const byMission = MISSIONS.map((m) => [m.id, done.filter((e) => e.mission === m.id).length] as const).filter(([, n]) => n)
    lines.push(`Lo que practiqué: ${byMission.map(([id, n]) => `${CLINICAL[id]} (${times(n)})`).join(', ')}.`)
  }

  for (const p of standing(barrio)) {
    if (p.kind === 'mandado') {
      lines.push(
        `Ánimo de 1 a 5 antes y después de ${p.total} mandados (actividades chiquitas fuera del teléfono): ` +
          [p.better && `mejor ${times(p.better)}`, p.same && `igual ${times(p.same)}`, p.lower && `más bajo ${times(p.lower)}`]
            .filter(Boolean)
            .join(', ') +
          '.',
      )
    } else if (p.kind === 'mercado') {
      lines.push(
        `Exposición gradual: en ${p.total} escalones, el miedo que sentí fue menor que el que esperaba ${times(p.less)} (esperado ${one(p.expected)}, sentido ${one(p.felt)} en promedio, de 0 a 10).`,
      )
    } else if (p.kind === 'pendientes') {
      lines.push(`Dejé para otro día: ${listJoin(p.missions.map((id) => CLINICAL[id]))}.`)
    }
  }

  if (!lines.length) return []
  return [
    ...lines,
    `Son mis registros de los últimos ${RECENT_DAYS} días en el barrio de la app. Los revisé yo; no son un diagnóstico.`,
  ]
}
