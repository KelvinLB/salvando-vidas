import { ITEMS, type ItemId, missionById, NEIGHBORS } from '../../data/barrio'
import type { Barrio } from '../../lib/barrio'
import { seasonLabel } from '../../lib/barrioSeason'
import type { Got } from '../../lib/moments'

// Qué cosas de la casa ya ganó y cómo se gana cada una de las que faltan. Para no abrumar, se
// enseñan las que ya tiene y, como mucho, tres de las que vienen.

type Item = (typeof ITEMS)[number]

const MOMENT_HINT: Record<string, string> = {
  hueco: 'Se gana al salir del hueco en «Salir del hueco».',
  faro: 'Se gana al salir de la niebla del faro en «Salir del hueco».',
  faroles: 'Se gana al llegar a la calle de los faroles en «Salir del hueco».',
}

export function owns(item: Item, barrio: Barrio, got: Got): boolean {
  const from = item.from as { always?: boolean; moment?: string; mission?: string; values?: number; missions?: number; season?: string }
  if (from.always) return true
  if (from.moment) return !!got[from.moment as keyof Got]
  if (from.mission) return !!barrio.done[from.mission as keyof Barrio['done']]
  if (from.values) return barrio.values.length >= from.values
  if (from.missions) return Object.keys(barrio.done).length >= from.missions
  if (from.season) return barrio.seasonsSeen.includes(from.season) && !barrio.hiddenSeasons.includes(from.season)
  return false
}

export function hintOf(item: Item): string {
  const from = item.from as { moment?: string; mission?: string; values?: number; missions?: number; season?: string }
  if (from.moment) return MOMENT_HINT[from.moment] ?? 'Se gana jugando con tu mascota.'
  if (from.mission) {
    const m = missionById(from.mission as Parameters<typeof missionById>[0])
    const who = NEIGHBORS.find((n) => n.id === m.npc)?.name
    return `Se gana con «${m.title}»${who ? `, con ${who}` : ''}.`
  }
  if (from.values) return from.values === 1 ? 'Se gana al elegir un rumbo en el poste de la plaza.' : `Se gana al elegir ${from.values} rumbos en el poste de la plaza.`
  if (from.missions) return `Se gana con ${from.missions} misiones distintas, a tu ritmo.`
  if (from.season) return `Llega con ${seasonLabel(from.season).toLowerCase()}, cuando entres al barrio en esos días.`
  return ''
}

/** Lo que ya tiene y lo que se enseña de lo que viene (misiones primero: son lo que sí se puede hacer). */
export function inventory(barrio: Barrio, got: Got) {
  const mine = ITEMS.filter((i) => owns(i, barrio, got))
  const order = (i: Item) => ('mission' in i.from ? 0 : 'moment' in i.from ? 1 : 'values' in i.from ? 2 : 'missions' in i.from ? 3 : 4)
  const next = ITEMS.filter((i) => !owns(i, barrio, got))
    .filter((i) => !('season' in i.from && barrio.hiddenSeasons.includes(i.from.season)))
    .sort((a, b) => order(a) - order(b))
    .slice(0, 3)
    .map((i) => ({ ...i, hint: hintOf(i) }))
  return { mine, next, owned: new Set<ItemId>(mine.map((i) => i.id)) }
}
