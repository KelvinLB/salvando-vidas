import { MISSIONS, type MissionId, VALUES, missionById } from '../data/barrio'
import type { Board, BoardInput } from '../barrio/types'
import type { Barrio } from './barrio'
import { standing } from './barrioNoticed'
import { localDate, today } from './storage'

// El tablero de hoy: como mucho tres misiones, elegidas con lo que la persona contesta en sus
// registros (la lectura de Salir del hueco) y con lo que hace en el barrio. Es adaptación en el
// momento (JITAI), no un juicio: nada aquí dice qué tiene la persona. Sus gustos (colores, casa,
// cómo se ve su mascota) no entran. Reglas, en orden, para el psicólogo que revisa:
//
// 1. Riesgo (contó hace poco que ha pensado en hacerse daño, o lo que escribió suena a eso):
//    primero la ayuda, y solo lo más suave: respirar en el kiosco, un vaso de agua y Salir del
//    hueco (que ya trae su botón de ayuda). Nada de exposición ni de pensamientos difíciles.
// 2. De noche (de 22 a 6 h): algo para descansar, el kiosco, el agua y desenredar con Doña
//    Chayo (Hilos sueltos tiene su modo noche).
// 3. Día pesado (ánimo de hoy bajo o la mascota triste, apagada, nerviosa o cansada): solo
//    misiones chiquitas (`small`).
// 4. Lo que salió en sus registros va primero: con nervios, respirar y las cinco cosas (y la
//    ruta del mercado más atrás, nunca en un día pesado); con soledad, la carta de bondad; con
//    el ánimo bajo, un mandado. Con las dos cosas (ánimo y nervios), primero respirar y luego
//    el mandado.
// 5. Lo que hace en el barrio: si después de los mandados casi siempre marcó mejor, el mandado
//    sube; si en la ruta del mercado el miedo fue menor que el esperado, el mercado sube un
//    poco (en días que no son pesados); lo que dejó «hoy no» vuelve a salir, sin castigo; lo
//    que repite sigue a la mano. Lo que la persona marcó «No es así» o borró no se usa.
// 6. Sus rumbos (valores) suben las misiones que comparten alguno.
// 7. Las que todavía no hace van un poco antes, pero las hechas se pueden repetir. Las
//    chiquitas también van un poco antes: empezar fácil es parte de la activación conductual.
// 8. Practicar en el kiosco con Don Chema (exposición interoceptiva) nunca sale con riesgo ni de
//    noche (tampoco se ofrece al platicar con él), ni en un día pesado (no es chiquita), ni si
//    en el filtro de salud marcó algo. Con nervios sube poquito, como la ruta del mercado.
// 9. Cada vecino ofrece una sola cosa a la vez: si dos de Don Chema quedan arriba, va la que
//    sumó más y la otra deja su lugar a la siguiente.
//
// Para que el tablero no cambie a cada rato durante el día, lo que hace en el barrio se toma
// como estaba al empezar el día; lo único que lo cambia en el momento es la lectura de sus
// registros (si marca algo nuevo), la noche y sus rumbos. Los empates se rompen con la fecha:
// el mismo día da el mismo tablero.

export const isNight = (hour: number) => hour >= 22 || hour < 6
const GENTLE: MissionId[] = ['kiosco', 'agua', 'hueco']
const REST: MissionId[] = ['kiosco', 'agua', 'desenredar']
const MAX = 3

/** Lo que no se ofrece con señales de riesgo ni de noche, ni en el tablero ni al platicar. */
const NOT_NOW: MissionId[] = ['practicar']
export const canOffer = (id: MissionId, { reading, hour }: BoardInput) =>
  !NOT_NOW.includes(id) || (!reading?.risk && !isNight(hour))

/** Pesos: lo que contestó hoy pesa más que lo que hizo otros días; los rumbos y lo nuevo, poquito. */
const W = {
  state: 12,
  stateSecond: 9,
  stateFar: 3,
  mandadoHelps: 10,
  waiting: 3,
  value: 2,
  valueMax: 3,
  mercadoEasier: 2,
  notDone: 2,
  repeats: 1,
  hueco: 2,
  small: 1.5,
}

/** Un número fijo para cada misión según el día, para que los empates no bailen. */
function tieBreak(day: string, id: string) {
  let h = 0
  for (const c of day + id) h = (h * 31 + c.charCodeAt(0)) | 0
  return (h >>> 0) / 4294967296
}

/** El barrio como estaba al empezar el día de hoy. */
function asOfMorning(barrio: Barrio): Barrio {
  const t = today()
  const before = (d?: string) => !!d && d < t
  const keep = <K extends string>(record: Partial<Record<K, string>>) =>
    Object.fromEntries(Object.entries(record ?? {}).filter(([, d]) => before(d as string))) as Partial<Record<K, string>>
  return {
    ...barrio,
    events: (barrio.events ?? []).filter((e) => localDate(new Date(e.at)) < t),
    done: keep(barrio.done),
    later: keep(barrio.later),
  }
}

export function pickBoard(barrio: Barrio, { reading, hour, practiceNo }: BoardInput): Board {
  const why: string[] = []

  if (reading?.risk) {
    return {
      missions: [...GENTLE],
      why: [
        'Primero lo importante: si sientes que no puedes con esto, en Ayuda hay alguien que te escucha ahorita.',
        'Hoy el tablero solo trae cosas tranquilas.',
      ],
    }
  }

  const heavy = !!reading?.heavy
  const night = isNight(hour)
  const morning = asOfMorning(barrio)
  const patterns = new Set(standing(morning).map((p) => p.id))
  const repeats = new Set(standing(morning).flatMap((p) => (p.kind === 'repite' ? [p.mission] : [])))

  let pool: MissionId[] = MISSIONS.map((m) => m.id)
  if (night) {
    pool = REST
    why.push('Ya es de noche: el tablero trae cosas para descansar.')
  } else if (heavy) {
    pool = pool.filter((id) => missionById(id).small)
    why.push('Por lo que marcaste hoy, el tablero trae solo misiones chiquitas.')
  }
  if (practiceNo) pool = pool.filter((id) => id !== 'practicar')

  // Cada misión junta puntos y, con ellos, la razón en palabras sencillas.
  const scored = pool.map((id) => {
    const m = missionById(id)
    const reasons: [number, string][] = []
    let score = 0
    const add = (w: number, text?: string) => {
      score += w
      if (text) reasons.push([w, text])
    }

    const state = reading?.state
    if (state === 'nervios' || state === 'mezcla') {
      if (id === 'kiosco') add(W.state, 'Como en tus registros salieron nervios, primero va respirar con Don Chema.')
      if (id === 'cinco') add(W.stateSecond)
      if (id === 'mercado' && !heavy && state === 'nervios') add(W.stateFar)
      if (id === 'practicar' && !heavy && state === 'nervios') add(W.stateFar)
    }
    if (state === 'soledad' && id === 'carta') add(W.state, 'Como en tus registros salió la soledad, Memo te propone una carta.')
    if (state === 'animo' && id === 'mandado') add(W.state, 'Como en tus registros el ánimo anda bajo, Tere te propone un mandado chiquito.')
    if (state === 'mezcla' && id === 'mandado') add(W.stateSecond)
    // Salir del hueco ya se parece a lo que trae: con cualquier lectura, sube tantito.
    if (state && id === 'hueco') add(W.hueco)

    if (id === 'mandado' && patterns.has('mandado-mejor'))
      add(W.mandadoHelps, 'Después de los mandados casi siempre marcaste mejor: por eso el de Tere sale antes.')
    if (id === 'mercado' && !heavy && patterns.has('mercado-menor')) add(W.mercadoEasier)
    if (morning.later[id] && patterns.has('pendientes')) add(W.waiting, `${m.title} te sigue esperando, sin prisa.`)
    if (repeats.has(id)) add(W.repeats)

    const shared = (m.values as readonly string[]).filter((v) => (barrio.values ?? []).includes(v as never))
    if (shared.length) {
      const street = VALUES.find((v) => v.id === shared[0])!.street
      add(Math.min(W.valueMax, shared.length * W.value), `Salen antes las que siguen tu rumbo: ${street}.`)
    }
    if (!morning.done[id]) add(W.notDone)
    // Lo chiquito va un poco antes: empezar fácil también es parte de la técnica.
    if (m.small) add(W.small)

    return { id, score: score + tieBreak(today(), id), reasons }
  })

  // Una sola cosa por vecino.
  const npcs = new Set<string>()
  const chosen = scored
    .sort((a, b) => b.score - a.score)
    .filter((c) => {
      const npc = missionById(c.id).npc
      if (npcs.has(npc)) return false
      npcs.add(npc)
      return true
    })
    .slice(0, MAX)

  // Las razones de lo que sí quedó, de la más fuerte a la más suave, sin repetir.
  const reasons = chosen
    .flatMap((c) => c.reasons)
    .sort((a, b) => b[0] - a[0])
    .map(([, text]) => text)
  for (const r of reasons) if (!why.includes(r) && why.length < 3) why.push(r)

  return { missions: chosen.map((c) => c.id), why }
}
