import { useState } from 'react'
import { Link } from 'react-router-dom'
import Capitulos, { useCapitulo } from '../components/Capitulos'
import PageHeader from '../components/PageHeader'
import { ACOMPANA, LASTIMA, mensajes } from '../data/acompanar'
import { COUNTRIES, findCountry, guessCountry, telHref } from '../data/helplines'
import { useStored } from '../lib/storage'

// Para quien quiere ayudar: qué decir, qué no, qué hacer si la persona habla de quitarse la vida
// y mensajes listos para copiar. Nada se manda desde aquí: se copia y se pega donde cada quien
// quiera. Cada tema va en su propio capítulo, para no leerlo todo de un jalón. Pendiente de
// revisión con psicóloga.

export default function Acompanar() {
  const [code] = useStored('country', guessCountry)
  const country = findCountry(code) ?? COUNTRIES[0]
  const linea = country.lines[0]
  const capitulo = useCapitulo()
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

  // Llamar a emergencias o a la línea no se esconde detrás de un toque: va arriba del índice y
  // arriba de cada capítulo, menos en el de «Si habla de quitarse la vida», que ya trae los dos.
  const llamar = (
    <div className="callout warm ac-ya" role="note">
      <p>
        <strong>Si hay peligro ahora,</strong> no le dejes a solas y llama a emergencias.
      </p>
      <div className="line-actions">
        <a className="btn danger small" href={`tel:${country.emergency}`}>
          Emergencias · {country.emergency}
        </a>
        {linea && (
          <a className="btn ghost small" href={telHref(linea)}>
            {linea.name.includes(linea.number) ? linea.name : `${linea.name} · ${linea.number}`}
          </a>
        )}
      </div>
    </div>
  )

  return (
    <div className="stack acompanar">
      {capitulo && capitulo !== 'peligro' && llamar}
      <Capitulos
        label="Temas para acompañar"
        antes={
          <>
            <PageHeader
              title="Cuando alguien que quieres está mal"
              subtitle="No necesitas las palabras perfectas. Estar, escuchar y acercar ayuda vale más que cualquier consejo."
            />
            {llamar}
          </>
        }
        capitulos={[
          {
            id: 'peligro',
            emoji: '🆘',
            title: 'Si habla de quitarse la vida',
            text: 'Qué hacer, qué preguntar y a quién llamar',
            content: (
              <section className="card emergency">
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
            ),
          },
          {
            id: 'que-decir',
            emoji: '💬',
            title: 'Lo que sí acompaña',
            text: 'Frases sencillas que ayudan, y por qué',
            content: (
              <section className="card">
                <ul className="ac-frases">
                  {ACOMPANA.map((f) => (
                    <li key={f.frase}>
                      <strong>{f.frase}</strong>
                      <span className="muted">{f.porque}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          },
          {
            id: 'que-evitar',
            emoji: '🤐',
            title: 'Lo que lastima, aunque se diga con cariño',
            text: 'Lo que conviene no decir, aunque sea con buena intención',
            content: (
              <section className="card soft">
                <ul className="ac-frases">
                  {LASTIMA.map((f) => (
                    <li key={f.frase}>
                      <strong>{f.frase}</strong>
                      <span className="muted">{f.porque}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          },
          {
            id: 'mensajes',
            emoji: '✉️',
            title: 'Mensajes listos para copiar',
            text: `Para mandar por chat o en un grupo; llevan la línea de ${country.name}`,
            content: (
              <>
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
              </>
            ),
          },
          {
            id: 'tu',
            emoji: '🫶',
            title: 'Cuídate tú también',
            text: 'Acompañar cansa: pedir ayuda y poner límites',
            content: (
              <section className="card soft">
                <p>
                  Acompañar cansa, y no tienes que cargarlo a solas ni saberlo todo. Está bien pedir ayuda
                  para ti y poner límites. Si alguien está en peligro, avisar a otras personas no es
                  traicionarle.
                </p>
                <Link to="/ayuda" className="btn ghost small">
                  Ver todas las líneas de ayuda
                </Link>
              </section>
            ),
          },
        ]}
      />
    </div>
  )
}
