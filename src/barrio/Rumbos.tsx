import { VALUES, type ValueId } from '../data/barrio'
import { useBarrio } from '../lib/barrio'
import './insights.css'

// Rumbos: las calles del barrio son lo que a la persona le importa. Elige hasta tres y las
// misiones que van por ahí salen antes en el tablero. Se cambia cuando quiera; no elegir
// ninguna también vale.

const MAX = 3

export default function Rumbos({ onClose }: { onClose: () => void }) {
  const { barrio, patch } = useBarrio()
  const chosen = barrio.values ?? []
  const full = chosen.length >= MAX

  const toggle = (id: ValueId) =>
    patch((b) => {
      const now = b.values ?? []
      if (now.includes(id)) return { values: now.filter((v) => v !== id) }
      return now.length >= MAX ? {} : { values: [...now, id] }
    })

  return (
    <section className="card bi-rumbos" aria-labelledby="bi-rumbos-title">
      <h2 id="bi-rumbos-title">Tus rumbos</h2>
      <p>
        Cada calle del barrio es algo que puede importarte. Elige hasta tres: las misiones siguen lo que te importa, y las que van
        por esas calles salen antes en el tablero.
      </p>
      <p className="muted small">Lo puedes cambiar cuando quieras. Si todavía no sabes, no pasa nada.</p>

      <ul className="bi-streets">
        {VALUES.map((v) => {
          const on = chosen.includes(v.id)
          return (
            <li key={v.id}>
              <button
                type="button"
                className={`bi-street${on ? ' on' : ''}`}
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(v.id)}
              >
                <span className="bi-street-sign">{v.street}</span>
                <span className="bi-street-label">{v.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="muted small" aria-live="polite">
        {full ? 'Ya elegiste tres. Si quieres otra, quita una primero.' : ' '}
      </p>

      <div className="row">
        <button type="button" className="btn" onClick={onClose}>
          Listo
        </button>
      </div>
    </section>
  )
}
