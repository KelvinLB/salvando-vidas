import { Link } from 'react-router-dom'
import { VALUES, type ValueId } from '../data/barrio'
import { useBarrio } from '../lib/barrio'
import { useCompass } from '../lib/sentido'
import './insights.css'

// Rumbos: las calles del barrio son lo que a la persona le importa. Elige hasta tres y las
// misiones que van por ahí salen antes en el tablero. Se cambia cuando quiera; no elegir
// ninguna también vale.
// La brújula de «Lo que no sale» (/lo-que-no-sale#brujula) vive allá y aquí solo se lee: si en
// ella marcó «mucho» algo que todavía no es rumbo, se sugiere con suavidad; nunca se agrega
// solo. Pendiente de revisión con psicóloga. Fuente: valores en la terapia de aceptación y
// compromiso (Harris, «La trampa de la felicidad», Planeta).

const MAX = 3

const listJoin = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`)

export default function Rumbos({ onClose }: { onClose: () => void }) {
  const { barrio, patch } = useBarrio()
  const [compass] = useCompass()
  const chosen = barrio.values ?? []
  const full = chosen.length >= MAX
  // Lo que en su brújula importa «mucho» y todavía no es rumbo.
  const suggest = VALUES.filter((v) => compass.levels?.[v.id] === 'mucho' && !chosen.includes(v.id))

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

      <div className="callout bi-compass">
        {suggest.length > 0 ? (
          <>
            <p>
              En tu brújula marcaste que te importa mucho {listJoin(suggest.map((v) => `«${v.label}»`))}. Si te late,{' '}
              {suggest.length === 1 ? 'también puede ser un rumbo aquí' : 'también pueden ser rumbos aquí'}. Si no, así está bien.
            </p>
            {!full && (
              <div className="chips">
                {suggest.map((v) => (
                  <button key={v.id} type="button" className="chip" onClick={() => toggle(v.id)}>
                    Sumar {v.street}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="muted small">En «Lo que no sale» también tienes una brújula con lo que te importa.</p>
        )}
        <div className="row">
          <Link to="/lo-que-no-sale#brujula" className="btn small ghost">
            Ver mi brújula
          </Link>
        </div>
      </div>

      <div className="row">
        <button type="button" className="btn" onClick={onClose}>
          Listo
        </button>
      </div>
    </section>
  )
}
