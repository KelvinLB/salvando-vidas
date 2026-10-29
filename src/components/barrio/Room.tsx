import type { Ref } from 'react'
import { ITEMS, type ItemId } from '../../data/barrio'
import type { CompanionLook, CompanionMood } from '../../data/companion'
import type { House } from '../../lib/barrio'
import { blockedBy, unreachable } from './iso'
import IsoScene, { type SceneHandle, type Thing } from './IsoScene'
import { ITEM_ART, VIEW_ART } from './items'
import { ROOM, ROOM_START } from './layout'

// El cuarto de su casa: dos paredes del color que eligió, la ventana con su vista, el nombre de
// la casa en la pared y el piso donde va poniendo lo que gana. Tocar una cosa puesta la guarda.

// El cuarto mide menos que la plaza: se recortan las orillas para que se vea grande.
export const ROOM_X = 92
export const ROOM_W = 416
export const ROOM_H = 326

type Props = {
  house: House
  /** La cosa que eligió para poner: el siguiente toque en el piso la deja ahí. */
  picking: ItemId | null
  /** Las que puede tener (si dejó de verse una temporada, su cosa se guarda sola). */
  owned: Set<ItemId>
  pet: { look: CompanionLook; mood: CompanionMood; name: string }
  onPlace: (item: ItemId, at: [number, number]) => void
  onNoRoom: () => void
  onPutAway: (item: ItemId) => void
  ref?: Ref<SceneHandle>
}

export default function Room({ house, picking, owned, pet, onPlace, onNoRoom, onPutAway, ref }: Props) {
  const wall = house.wall || 'var(--b-wall)'
  const side = house.wall ? `color-mix(in srgb, ${house.wall} 86%, #000)` : 'var(--b-wall-2)'
  const name = house.name.trim() || 'Mi casita'
  const { ox, oy, n } = ROOM
  const left = ox - n * 32
  const right = ox + n * 32
  const floor = oy + n * 16
  const tall = 108

  const things: Thing[] = ITEMS.filter((i) => owned.has(i.id) && house.placed[i.id]).map((i) => {
    const [r, c] = house.placed[i.id]!
    return {
      id: i.id,
      r,
      c,
      art: ITEM_ART[i.id],
      label: `${i.label}. Tocar para guardarlo`,
      now: true,
      onTap: () => onPutAway(i.id),
    }
  })

  // Si dejó algo donde entra la mascota, entra al cuadrito libre más cercano.
  const taken = new Set(things.map((t) => t.r * n + t.c))
  const start = [...Array(n * n).keys()]
    .map((k): [number, number] => [Math.floor(k / n), k % n])
    .filter(([r, c]) => !taken.has(r * n + c))
    .sort((a, b) => Math.hypot(a[0] - ROOM_START[0], a[1] - ROOM_START[1]) - Math.hypot(b[0] - ROOM_START[0], b[1] - ROOM_START[1]))[0] ?? ROOM_START

  const tileFill = (r: number, c: number) => {
    const odd = (r + c) % 2 === 1
    if (!house.floor) return odd ? 'var(--b-tile-a)' : 'var(--b-tile-b)'
    return odd ? house.floor : `color-mix(in srgb, ${house.floor} 88%, #000)`
  }

  const back = (
    <g aria-hidden="true">
      <path d={`M${left} ${floor} L${ox} ${oy} L${ox} ${oy - tall} L${left} ${floor - tall}Z`} fill={wall} stroke="var(--b-tile-edge)" />
      <path d={`M${ox} ${oy} L${right} ${floor} L${right} ${floor - tall} L${ox} ${oy - tall}Z`} fill={side} stroke="var(--b-tile-edge)" />
      <g transform={`matrix(.64 .32 0 .46 372 ${oy - 82})`}>{VIEW_ART[house.view] ?? VIEW_ART.cerro}</g>
      <path d={`M372 ${oy - 36} L436 ${oy - 4} L436 ${oy - 50} L372 ${oy - 82}Z`} fill="none" stroke="var(--b-wood-2)" strokeWidth="4" />
      <path d={`M404 ${oy - 66} L404 ${oy - 20} M372 ${oy - 59} L436 ${oy - 27}`} stroke="var(--b-wood-2)" strokeWidth="2" />
      {/* El letrero con el nombre de la casa, pegado a la pared */}
      <g transform={`translate(196 ${oy - 22}) skewY(-26.57)`}>
        <rect x="-56" y="-16" width="112" height="28" rx="5" fill="var(--b-wood)" />
        <text y="4" textAnchor="middle" fontSize="16" className="b-sign">
          {name.length > 16 ? name.slice(0, 16) : name}
        </text>
      </g>
    </g>
  )

  return (
    <div className={picking ? 'b-room placing' : 'b-room'}>
      <IsoScene
        ref={ref}
        grid={ROOM}
        width={ROOM_W}
        left={ROOM_X}
        height={ROOM_H}
        label={`Tu cuarto en ${name}. Toca el piso para que ${pet.name} camine${picking ? ' o para poner lo que elegiste' : ''}.`}
        tileFill={tileFill}
        things={things}
        back={back}
        pet={pet}
        start={start}
        onTile={(r, c, free, petAt) => {
          if (!picking) return false
          // Que nunca quede un rincón al que la mascota no pueda llegar.
          const closed = () => unreachable(n, blockedBy(n, [...things, { r, c }]), petAt).length > 0
          if (!free || (petAt[0] === r && petAt[1] === c) || closed()) onNoRoom()
          else onPlace(picking, [r, c])
          return true
        }}
      />
    </div>
  )
}
