import { Link } from 'react-router-dom'
import { FACADES, FLOORS, type ItemId, VIEWS, WALLS } from '../../data/barrio'
import type { House } from '../../lib/barrio'
import { SEASONS } from '../../lib/barrioSeason'
import { ItemThumb } from './items'
import type { inventory } from './unlocks'

// Hazlo tuyo: el nombre y el color de la casa, el cuarto y lo que va ganando para ponerle. Sus
// gustos solo hacen que el barrio se sienta suyo; nunca se interpretan.

type Props = {
  house: House
  onHouse: (next: Partial<House>) => void
  stock: ReturnType<typeof inventory>
  picking: ItemId | null
  onPick: (item: ItemId | null) => void
  hidden: string[]
  onSeason: (season: string, show: boolean) => void
  petName: string
  hasPet: boolean
}

function Swatches({ list, value, onChange, label }: { list: readonly (readonly [string, string])[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="b-swatches" role="radiogroup" aria-label={label}>
      {list.map(([color, name]) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={name}
          title={name}
          className="b-swatch"
          style={{ background: color || undefined }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}

export default function HousePanel({ house, onHouse, stock, picking, onPick, hidden, onSeason, petName, hasPet }: Props) {
  return (
    <section className="card b-panel" aria-label="Hazlo tuyo">
      <h2>Hazlo tuyo</h2>

      <div className="b-inv">
        <h3>Para tu cuarto</h3>
        <p className="muted small">Elige una cosa y toca el piso para ponerla. Tócala en el cuarto para guardarla.</p>
        <div className="b-items">
          {stock.mine.map((item) => {
            const placed = !!house.placed[item.id]
            return (
              <button
                key={item.id}
                type="button"
                className={`b-item${picking === item.id ? ' on' : ''}`}
                aria-pressed={picking === item.id}
                disabled={placed}
                onClick={() => onPick(picking === item.id ? null : item.id)}
              >
                <ItemThumb id={item.id} />
                <span>{item.label}</span>
                {placed && <small>Ya está puesto</small>}
              </button>
            )
          })}
        </div>
        {stock.next.length > 0 && (
          <>
            <h3 className="b-next-title">Lo que viene</h3>
            <ul className="b-next">
              {stock.next.map((item) => (
                <li key={item.id}>
                  <span className="b-next-thumb" aria-hidden="true">
                    <ItemThumb id={item.id} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                </li>
              ))}
            </ul>
            <p className="muted small">Nada se compra ni se vence: lo que ganas se queda para siempre.</p>
          </>
        )}
      </div>

      <div className="field">
        <label htmlFor="b-house-name">Nombre de tu casa</label>
        <input id="b-house-name" type="text" maxLength={16} value={house.name} onChange={(e) => onHouse({ name: e.target.value })} />
      </div>
      <div className="b-opt">
        <span className="b-lbl">Fachada</span>
        <Swatches list={FACADES} value={house.facade} onChange={(facade) => onHouse({ facade })} label="Color de la fachada" />
      </div>
      <div className="b-opt">
        <span className="b-lbl">Pared de tu cuarto</span>
        <Swatches list={WALLS} value={house.wall} onChange={(wall) => onHouse({ wall })} label="Color de la pared" />
      </div>
      <div className="b-opt">
        <span className="b-lbl">Piso</span>
        <Swatches list={FLOORS} value={house.floor} onChange={(floor) => onHouse({ floor })} label="Piso del cuarto" />
      </div>
      <div className="b-opt">
        <span className="b-lbl" id="b-view-lbl">
          Ventana de tu cuarto
        </span>
        <div className="chips" role="radiogroup" aria-labelledby="b-view-lbl">
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={house.view === id}
              className={`chip${house.view === id ? ' selected' : ''}`}
              onClick={() => onHouse({ view: id })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <details className="b-seasons">
        <summary>Las fiestas de la plaza</summary>
        <p className="muted small">Cada temporada pone adornos en la plaza. Si alguna no te late, la puedes ocultar.</p>
        <ul>
          {SEASONS.map((s) => (
            <li key={s.id}>
              <label>
                <input type="checkbox" checked={!hidden.includes(s.id)} onChange={(e) => onSeason(s.id, e.target.checked)} />
                <span>
                  {s.label} <small className="muted">{s.when}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </details>

      <div className="row">
        <Link to="/mascota" className="btn small ghost">
          {hasPet ? `Cambiar a ${petName}` : 'Crear a tu mascota'}
        </Link>
      </div>
      {!hasPet && <p className="muted small">Si creas tu mascota, será ella quien camine contigo por el barrio.</p>}
    </section>
  )
}
