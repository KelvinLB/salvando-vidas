import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { ACOMPANA, LASTIMA, mensajes } from '../data/acompanar'
import { COUNTRIES, findCountry, guessCountry, telHref } from '../data/helplines'
import { useStored } from '../lib/storage'

// Para quien quiere ayudar: qué decir, qué no, qué hacer si la persona habla de quitarse la vida
// y mensajes listos para copiar. Nada se manda desde aquí: se copia y se pega donde cada quien
// quiera. Pendiente de revisión con psicóloga.

export default function Acompanar() {
  const [code] = useStored('country', guessCountry)
  const country = findCountry(code) ?? COUNTRIES[0]
  const linea = country.lines[0]
  const [copiado, setCopiado] = useState<{ id: string; ok: boolean } | null>(null)

  const copiar = async (id: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado({ id, ok: true })
      setTimeout(() => setCopiado((c) => (c?.id === id ? null : c)), 2000)
    } catch {
      // El portapapeles puede estar bloqueado; el texto sigue a la vista para copiarlo a mano.
      setCopiado({ id, ok: false })
    }
  }

  return (
    <div className="stack acompanar">
      <PageHeader
        title="Cuando alguien que quieres está mal"
        subtitle="No necesitas las palabras perfectas. Estar, escuchar y acercar ayuda vale más que cualquier consejo."
      />

      <section className="card">
        <h2>Lo que sí acompaña</h2>
        <ul className="ac-frases">
          {ACOMPANA.map((f) => (
            <li key={f.frase}>
              <strong>{f.frase}</strong>
              <span className="muted">{f.porque}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card soft">
        <h2>Lo que lastima, aunque se diga con cariño</h2>
        <ul className="ac-frases">
          {LASTIMA.map((f) => (
            <li key={f.frase}>
              <strong>{f.frase}</strong>
              <span className="muted">{f.porque}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card emergency">
        <h2>Si habla de quitarse la vida</h2>
        <ul className="plain">
          <li>Tómalo en serio, aunque lo diga como broma o de pasada.</li>
          <li>Pregúntale directo si está pensando en quitarse la vida. Preguntarlo no le mete la idea; suele ser un alivio que alguien lo nombre.</li>
          <li>Si hay peligro ahora, no le dejes a solas y llama a emergencias.</li>
          <li>Acércale una línea de ayuda y, si quiere, acompáñale mientras llama.</li>
          <li>En un grupo, también puedes reportar la publicación como «suicidio o autolesión»: la red le ofrece ayuda a esa persona sin decirle quién la reportó.</li>
        </ul>
        <div className="line-actions">
          <a className="btn danger" href={`tel:${country.emergency}`}>
            Emergencias · {country.emergency}
          </a>
          {linea && (
            <a className="btn" href={telHref(linea)}>
              {linea.name.includes(linea.number) ? linea.name : `${linea.name} · ${linea.number}`}
            </a>
          )}
        </div>
      </section>

      <section className="stack" aria-labelledby="ac-mensajes">
        <h2 id="ac-mensajes" className="section-title">
          Mensajes listos para copiar
        </h2>
        <p className="muted">Cámbiales lo que quieras para que suenen a ti. Llevan la línea de {country.name}.</p>
        {mensajes(country).map((m) => (
          <article key={m.id} className="card ac-mensaje">
            <h3>{m.titulo}</h3>
            <p>{m.texto}</p>
            <div className="row">
              <button type="button" className="btn small" onClick={() => copiar(m.id, m.texto)}>
                {copiado?.id === m.id && copiado.ok ? 'Copiado' : 'Copiar'}
              </button>
              {copiado?.id === m.id && !copiado.ok && (
                <span className="muted small" role="status">
                  No se pudo copiar. Puedes seleccionarlo y copiarlo a mano.
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="card soft">
        <h2>Cuídate tú también</h2>
        <p>
          Acompañar cansa, y no tienes que cargarlo a solas ni saberlo todo. Está bien pedir ayuda
          para ti y poner límites. Si alguien está en peligro, avisar a otras personas no es
          traicionarle.
        </p>
        <Link to="/ayuda" className="btn ghost small">
          Ver todas las líneas de ayuda
        </Link>
      </section>
    </div>
  )
}
