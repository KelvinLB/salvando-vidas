import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import PeopleEditor from '../../components/PeopleEditor'
import { HELP_MESSAGES, firstName, telOf, usePeople, whatsappOf } from '../../lib/people'

// Mis personas: a quién buscar en un mal momento y qué mensaje les llega. Es el paso 4 del plan
// de seguridad; aquí también se elige el mensaje ya escrito para WhatsApp.

export default function Personas() {
  const { reachable, message, saved, setMessage, country } = usePeople()
  const [own, setOwn] = useState(() => !HELP_MESSAGES.includes(saved))

  return (
    <div className="stack">
      <PageHeader
        title="Mis personas"
        subtitle="Hasta tres personas de confianza para buscar en un mal momento. Aparecen en «Necesito ayuda» y en tu plan, para llamarles o escribirles con un toque."
      />

      <section className="card field">
        <h2>¿A quién puedes buscar?</h2>
        <p className="muted small">
          Alguien que te conteste y te escuche sin juzgarte. Si puedes, cuéntale que lo pusiste aquí:
          ayuda que sepa que puedes buscarle.
        </p>
        <PeopleEditor />
      </section>

      <section className="card field">
        <h2>El mensaje que les llega</h2>
        <p className="muted small">
          En un mal momento cuesta encontrar las palabras, así que por WhatsApp ya va escrito. Antes de
          mandarlo todavía lo puedes cambiar.
        </p>
        <div className="chips stacked" role="radiogroup" aria-label="Mensaje para pedir ayuda">
          {HELP_MESSAGES.map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={!own && message === m}
              className={`chip ${!own && message === m ? 'selected' : ''}`}
              onClick={() => {
                setMessage(m)
                setOwn(false)
              }}
            >
              {m}
            </button>
          ))}
          <button role="radio" aria-checked={own} className={`chip ${own ? 'selected' : ''}`} onClick={() => setOwn(true)}>
            Escribir el mío
          </button>
        </div>
        {own && (
          <input
            value={saved}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={HELP_MESSAGES[0]}
            aria-label="Tu mensaje"
            maxLength={200}
            autoFocus
          />
        )}
      </section>

      {reachable.length > 0 && (
        <section className="card soft">
          <h2>Así se ve en «Necesito ayuda»</h2>
          <ul className="lines">
            {reachable.map((p) => (
              <li key={p.id}>
                <strong>{p.name.trim() || p.phone}</strong>
                <div className="line-actions">
                  <a className="btn" href={telOf(p.phone)} aria-label={`Llamar a ${firstName(p)}`}>
                    📞 Llamar
                  </a>
                  <a className="btn ghost" href={whatsappOf(p.phone, country, message)} target="_blank" rel="noreferrer" aria-label={`Escribirle a ${firstName(p)} por WhatsApp`}>
                    WhatsApp
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="muted small">Puedes probarlo: nada se manda hasta que tú lo envíes en WhatsApp.</p>
        </section>
      )}

      <p className="muted small">Se guardan solo en este teléfono.</p>
    </div>
  )
}
