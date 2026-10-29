import { type KeyboardEvent, type Ref, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { WORLD, ZONES, type ZoneId, terrainAt, zoneAt } from './layout'

// El mapita del barrio, en una esquina del mundo: las zonas con sus colores, dónde va la
// mascota y en qué zona están. Al tocarlo se abre «¿A dónde vamos?», con el mapa grande y la
// lista de zonas: al elegir una, la mascota camina hasta allá. Lo que todavía no conocen se ve
// más tenue, pero nada está cerrado: todo el barrio se puede recorrer desde el principio.

export type MinimapHandle = {
  /** Lo llama el mundo cada vez que la mascota pisa un cuadrito nuevo. */
  setPet: (r: number, c: number) => void
}

export type Zone = (typeof ZONES)[number]

type Props = {
  /** Las zonas que ya conocieron. */
  seen: string[]
  petName: string
  onGo: (zone: Zone) => void
  ref?: Ref<MinimapHandle>
}

const N = WORLD.n

/** El mapa en el mismo ángulo que el mundo: cada cuadrito es un rombo chiquito. */
function MapArt({ seen, pet, names }: { seen: string[]; pet: [number, number] | null; names?: boolean }) {
  // El terreno no cambia: se junta en tiras del mismo color por fila, para dibujar poco.
  const strips = useMemo(() => {
    const out: { r: number; c: number; w: number; t: string }[] = []
    for (let r = 0; r < N; r++) {
      let c0 = 0
      for (let c = 1; c <= N; c++) {
        const t = terrainAt(r, c0)
        if (c < N && terrainAt(r, c) === t) continue
        out.push({ r, c: c0, w: c - c0, t })
        c0 = c
      }
    }
    return out
  }, [])
  const seenKey = seen.join(' ')
  const land = useMemo(
    () => (
      <g transform="matrix(1 .5 -1 .5 0 0)">
        {strips.map((s) => (
          <rect key={`${s.r}-${s.c}`} className={`m-${s.t}`} x={s.c} y={s.r} width={s.w + 0.04} height={1.04} />
        ))}
        {ZONES.map((z) => (
          <rect
            key={z.id}
            className={seen.includes(z.id) ? 'm-zone' : 'm-zone dim'}
            x={z.c0}
            y={z.r0}
            width={z.c1 - z.c0 + 1}
            height={z.r1 - z.r0 + 1}
          />
        ))}
      </g>
    ),
    [strips, seenKey],
  )
  return (
    <svg className="b-map-art" viewBox={`${-N - 1} -1 ${2 * N + 2} ${N + 2}`} aria-hidden="true">
      {land}
      {names &&
        ZONES.map((z) => {
          const r = (z.r0 + z.r1 + 1) / 2
          const c = (z.c0 + z.c1 + 1) / 2
          return (
            <text key={z.id} className="m-name" x={c - r} y={(c + r) / 2 + 1} textAnchor="middle">
              {z.name}
            </text>
          )
        })}
      {pet && <circle className="m-pet" cx={pet[1] - pet[0]} cy={(pet[0] + pet[1] + 1) / 2} r={names ? 1 : 1.5} />}
    </svg>
  )
}

export default function Minimap({ seen, petName, onGo, ref }: Props) {
  const [pet, setPet] = useState<[number, number] | null>(null)
  const [here, setHere] = useState<ZoneId | null>(null)
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const panelId = useId()

  useImperativeHandle(ref, () => ({
    setPet: (r, c) => {
      setPet((p) => (p && p[0] === r && p[1] === c ? p : [r, c]))
      const z = zoneAt(r, c)
      if (z) setHere(z)
    },
  }))

  const hereZone = ZONES.find((z) => z.id === here)

  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => toggle.current?.focus())
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    // Primero se cierra el mapa; la pantalla completa, si está, se queda.
    e.stopPropagation()
    close()
  }

  return (
    <div className={open ? 'b-map open' : 'b-map'}>
      <button
        ref={toggle}
        type="button"
        className="b-map-btn"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Mapa del barrio${hereZone ? `. Están en ${hereZone.name}` : ''}. ¿A dónde vamos?`}
        onClick={() => {
          if (open) return close()
          setOpen(true)
          requestAnimationFrame(() => title.current?.focus())
        }}
      >
        <MapArt seen={seen} pet={pet} />
        <span className="b-map-here">{hereZone?.name ?? 'El mapa'}</span>
      </button>

      {open && (
        <section id={panelId} className="b-map-panel" aria-labelledby={`${panelId}-t`} onKeyDown={onKey}>
          <div className="b-map-head">
            <h2 id={`${panelId}-t`} ref={title} tabIndex={-1}>
              ¿A dónde vamos?
            </h2>
            <button type="button" className="btn small ghost" onClick={close}>
              Cerrar mapa
            </button>
          </div>
          <MapArt seen={seen} pet={pet} names />
          <ul className="b-zones">
            {ZONES.map((z) => {
              const isHere = z.id === here
              const known = seen.includes(z.id)
              return (
                <li key={z.id}>
                  <button
                    type="button"
                    className={`b-zone${isHere ? ' here' : ''}${known ? '' : ' new'}`}
                    onClick={() => {
                      close()
                      onGo(z)
                    }}
                  >
                    <strong>{z.name}</strong>
                    <small>{isHere ? `Aquí están ${petName} y tú.` : known ? z.hint : `${z.hint} Todavía no la conocen.`}</small>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
