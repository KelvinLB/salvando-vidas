import type { ReactNode, Ref } from 'react'
import { MISSIONS, type MissionId, NEIGHBORS, type NeighborId } from '../../data/barrio'
import type { CompanionLook, CompanionMood } from '../../data/companion'
import type { House } from '../../lib/barrio'
import type { Season } from '../../lib/barrioSeason'
import {
  Banca,
  Buzon,
  Casa,
  CasaVecina,
  CasitaJuegos,
  Correo,
  Farol,
  Farolito,
  Flores,
  Gato,
  Gente,
  Globero,
  Globo,
  Kiosco,
  LetreroHueco,
  Marker,
  Mercado,
  Neighbor,
  Paloma,
  Panaderia,
  Papeleria,
  Perrito,
  PosteRumbos,
  Puesto,
  Tablero,
  Taller,
  Tiendita,
  Toldo,
} from './drawings'
import IsoScene, { type SceneHandle, type Thing } from './IsoScene'
import { DECOR, DOCK, type DecorKind, GARLANDS, type PlazaSpot, type Terrain, WORLD, WORLD_H, WORLD_SPOTS, WORLD_W, isWater, terrainAt } from './layout'
import { Arbol, Arbusto, Brillos, Cerros, Faro, Fresno, Fuente, Lancha, Maguey, Maiz, Muelle, Nopal, Roca, Tule } from './Nature'
import { SeasonGround, SeasonRain, SeasonSky, StreetGarland } from './SeasonDecor'

// El barrio entero, afuera de la casa: la plaza con su kiosco al centro y, alrededor, el
// mercado, la calle de los oficios, la alameda, Mi calle, la orilla y la milpa. Los vecinos van
// junto a su lugar; quien tiene misión hoy lleva su circulito encima. El componente se sigue
// llamando Plaza porque la plaza es donde empieza todo.

export { WORLD_H, WORLD_W }
/** Los de antes: con cámara ya no se usan, pero sin ella el lienzo es el barrio entero. */
export const PLAZA_W = WORLD_W
export const PLAZA_H = WORLD_H

/** Los lugares que llevan con un vecino. */
const PLACE_OF: Partial<Record<PlazaSpot, NeighborId>> = {
  tiendita: 'tere',
  kiosco: 'chema',
  puesto: 'lupe',
  mercado: 'beto',
  taller: 'ramiro',
  buzon: 'memo',
}

const MARK_Y: Partial<Record<NeighborId, number>> = { nico: -56, rosa: -66 }

// ---------- El piso ----------

/** Dos tonos por piso, para que se note el cuadriculado sin que pese. Si barrio.css no los
 * define, cada uno trae su par de día y de noche (`light-dark`, que sigue al modo oscuro). */
const FILL: Record<Terrain, [string, string]> = {
  pasto: ['var(--b-grass)', 'var(--b-grass-b)'],
  jardin: ['var(--b-garden, light-dark(#c2dbb0, #2a392e))', 'var(--b-garden-b, light-dark(#b7d3a3, #26342a))'],
  camino: ['var(--b-path, light-dark(#d8ccb8, #37322b))', 'var(--b-path-b, light-dark(#cec0a8, #322e28))'],
  plaza: ['var(--b-plaza, light-dark(#e9e0d2, #413b33))', 'var(--b-plaza-b, light-dark(#e2d7c6, #3b362f))'],
  mercado: ['var(--b-market, light-dark(#e8cfb5, #45362b))', 'var(--b-market-b, light-dark(#dfc2a4, #3e3127))'],
  agua: ['var(--b-water, light-dark(#9cc9e0, #22405a))', 'var(--b-water-b, light-dark(#93c1da, #1d3a4b))'],
  arena: ['var(--b-sand, light-dark(#eee0bb, #423b2b))', 'var(--b-sand-b, light-dark(#e6d6ad, #3b3526))'],
  milpa: ['var(--b-milpa, light-dark(#c9a57c, #47372a))', 'var(--b-milpa-b, light-dark(#bb966c, #3f3024))'],
}

/** Lo que va en parejo (calles, plaza, mercado) va en damero; lo natural, salpicado. */
function fillOf(r: number, c: number) {
  const t = terrainAt(r, c)
  const [a, b] = FILL[t]
  if (t === 'milpa') return r % 2 ? a : b // los surcos
  if (t === 'pasto' || t === 'jardin' || t === 'arena') return (r * 7 + c * 13) % 5 === 0 ? b : a
  return (r + c) % 2 ? a : b
}

const FILLS = Array.from({ length: WORLD.n * WORLD.n }, (_, k) => fillOf(Math.floor(k / WORLD.n), k % WORLD.n))
const tileFill = (r: number, c: number) => FILLS[r * WORLD.n + c]

/** Unos brillitos sueltos en la laguna y el río. */
const SPARKLES: [number, number][] = [
  [2, 25],
  [3, 29],
  [1, 30],
  [6, 29],
  [12, 30],
  [18, 31],
  [24, 30],
  [30, 6],
  [31, 13],
  [30, 20],
  [31, 26],
  [30, 29],
]

type Props = {
  house: House
  values: number
  board: MissionId[]
  /** Con quién está platicando ahorita (su circulito cambia a «…»). */
  talking: NeighborId | 'lumi' | null
  glow: number
  season: Season | null
  pet: { look: CompanionLook; mood: CompanionMood; name: string }
  start: [number, number]
  onNeighbor: (npc: NeighborId) => void
  onSpot: (spot: PlazaSpot) => void
  /** Lo que cabe en pantalla: con esto, la cámara sigue a la mascota. */
  view?: { width: number; height: number; cover?: number }
  /** Cada cuadrito nuevo que pisa la mascota (para el mapa y saber en qué rumbo va). */
  onStep?: (r: number, c: number) => void
  ref?: Ref<SceneHandle>
}

/** El papel picado cuelga sin estorbar: la escena lo deja pasar por `walkable`. */
type Hanging = Thing & { walkable: true }

export default function Plaza({ house, values, board, talking, glow, season, pet, start, onNeighbor, onSpot, view, onStep, ref }: Props) {
  const waiting = new Set(board.map((id) => MISSIONS.find((m) => m.id === id)!.npc as string))
  const S = WORLD_SPOTS

  const thing = (id: PlazaSpot, art: Thing['art'], label?: string, tap?: () => void, extra?: Partial<Thing>): Thing => ({
    id,
    r: S[id].r,
    c: S[id].c,
    art,
    label,
    onTap: tap,
    ...extra,
  })
  const place = (id: PlazaSpot, art: Thing['art'], label: string) => {
    const npc = PLACE_OF[id]
    return thing(id, art, label, () => (npc ? onNeighbor(npc) : onSpot(id)))
  }
  const spot = (id: PlazaSpot, art: Thing['art'], label: string) => thing(id, art, label, () => onSpot(id))

  const neighbors: Thing[] = NEIGHBORS.map((n) => {
    const has = waiting.has(n.id)
    const art = (
      <>
        <Neighbor id={n.id} />
        {has && <Marker y={MARK_Y[n.id] ?? -70} talking={talking === n.id} />}
      </>
    )
    return thing(
      n.id,
      n.id === 'rosa' ? <Banca>{art}</Banca> : art,
      `${n.name}, ${n.role}${has ? '. Tiene algo para hoy' : ''}`,
      () => onNeighbor(n.id),
    )
  })

  const houseName = house.name.trim() || 'Mi casita'
  const places: Thing[] = [
    // La plaza
    { ...place('kiosco', <Kiosco lit={glow} />, 'El kiosco de Don Chema'), span: true },
    spot('tablero', <Tablero notes={board.length} />, 'El tablero de misiones de hoy'),
    spot('paloma', <Paloma />, 'Una paloma'),
    spot('globo', <Globo />, 'Un globo rojo'),
    spot('globero', <Globero />, 'El señor de los globos'),
    spot('farolA', <Farol />, 'Un farol'),
    spot('farolB', <Farol />, 'Un farol'),
    spot('florA', <Flores />, 'Unas flores de cempasúchil'),
    // Mi calle
    spot('casa', <Casa facade={house.facade} name={houseName} />, `Tu casa, ${houseName}. Entrar`),
    spot('florB', <Flores />, 'Unas flores de cempasúchil'),
    spot('gato', <Gato />, 'Un gato dormido'),
    spot('rumbos', <PosteRumbos chosen={values} />, 'El poste de los rumbos: elegir por dónde caminar'),
    spot('juegos', <CasitaJuegos />, 'La casita de los juegos tranquilos'),
    spot('perrito', <Perrito />, 'Un perrito del barrio'),
    // La calle de los oficios
    place('taller', <Taller />, 'El taller de Don Ramiro'),
    place('tiendita', <Tiendita />, 'La tiendita de Tere'),
    spot('panaderia', <Panaderia />, 'La panadería'),
    spot('papeleria', <Papeleria />, 'La papelería'),
    // El mercado
    place('mercado', <Mercado />, 'El puesto del mercado de Don Beto'),
    place('puesto', <Puesto />, 'El puesto de aguas frescas de Doña Lupe'),
    // La alameda
    { ...spot('fuente', <Fuente />, 'La fuente de la alameda'), span: true },
    place('buzon', <Buzon />, 'El buzón de Memo, el cartero'),
    // La orilla
    thing(
      'hueco',
      <>
        <LetreroHueco />
        {waiting.has('lumi') && <Marker y={-70} talking={talking === 'lumi'} />}
      </>,
      `El camino a Salir del hueco${waiting.has('lumi') ? '. Está en el tablero de hoy' : ''}`,
      () => onSpot('hueco'),
    ),
    spot('lancha', <Lancha />, 'Una lanchita en el muelle'),
    // La milpa
    spot('maiz', <Maiz v={3} />, 'Una mata de maíz'),
  ]

  const bloom = season === 'primavera'
  const ART: Record<DecorKind, (v: number) => ReactNode> = {
    arbol: (v) => <Arbol v={v} />,
    fresno: (v) => <Fresno v={v} bloom={bloom} />,
    arbusto: () => <Arbusto />,
    maiz: (v) => <Maiz v={v} />,
    maguey: () => <Maguey />,
    nopal: () => <Nopal />,
    casa: (v) => <CasaVecina v={v} />,
    toldo: (v) => <Toldo v={v} />,
    gente: (v) => <Gente v={v} />,
    farol: () => <Farol />,
    farolito: () => <Farolito />,
    flores: () => <Flores />,
    paloma: () => <Paloma />,
    tule: () => <Tule />,
    roca: () => <Roca />,
    faro: () => <Faro />,
    correo: () => <Correo />,
    banca: () => <Banca />,
  }
  const decor: Thing[] = DECOR.map((d) => ({ id: `${d.kind}-${d.r}-${d.c}`, r: d.r, c: d.c, art: ART[d.kind](d.v ?? 0) }))

  const garlands: Hanging[] = GARLANDS.map((g, i) => ({
    id: `picado-${i}`,
    r: g.r,
    c: g.c,
    art: <StreetGarland season={season} across={g.across} i={i} />,
    walkable: true,
  }))

  const things: Thing[] = [...places, ...neighbors, ...decor, ...garlands]

  return (
    <IsoScene
      ref={ref}
      grid={WORLD}
      width={WORLD_W}
      height={WORLD_H}
      label={`El barrio. Toca el piso para que ${pet.name} camine, arrastra para mirar, o toca a un vecino para platicar.`}
      tileFill={tileFill}
      things={things}
      back={
        <>
          <Cerros grid={WORLD} width={WORLD_W} />
          {season && <SeasonSky season={season} grid={WORLD} />}
        </>
      }
      ground={
        <>
          <Brillos grid={WORLD} tiles={SPARKLES} />
          <Muelle grid={WORLD} tiles={DOCK} />
          {season && <SeasonGround season={season} grid={WORLD} />}
        </>
      }
      front={season && <SeasonRain season={season} width={view?.width ?? WORLD_W} height={view?.height ?? WORLD_H} />}
      pet={pet}
      start={start}
      view={view}
      isBlocked={isWater}
      onStep={onStep}
    />
  )
}
