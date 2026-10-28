import { Link } from 'react-router-dom'
import CrisisPlan, { PlanItem, useCrisisPlan } from '../components/CrisisPlan'
import { BackLink } from '../components/PageHeader'
import {
  COUNTRIES,
  OTHER_COUNTRIES_URL,
  VERIFIED_ON,
  findCountry,
  guessCountry,
  telHref,
} from '../data/helplines'
import { firstName, telOf, usePeople, whatsappOf } from '../lib/people'
import { useStored } from '../lib/storage'

export default function Ayuda() {
  const [code, setCode] = useStored('country', guessCountry)
  const { reachable, message } = usePeople()
  const { plan, empty } = useCrisisPlan()
  const country = findCountry(code) ?? COUNTRIES[0]
  // Lo que se anotó a mano en el paso de personas del plan, antes de «Mis personas».
  const notes = plan.personas ?? []

  return (
    <div className="stack">
      <BackLink />
      <section className="hero help">
        <h1>Aquí hay ayuda, ahora mismo.</h1>
        <p>
          Lo que sientes importa. Hay personas preparadas para escucharte, sin juzgarte, gratis y de
          forma confidencial.
        </p>
      </section>

      <section className="card emergency">
        <p>
          <strong>Si estás en peligro inmediato</strong> o ya te hiciste daño, llama a emergencias.
        </p>
        <a className="btn big danger" href={`tel:${country.emergency}`}>
          Llamar a emergencias · {country.emergency}
        </a>
      </section>

      {reachable.length > 0 || notes.length > 0 ? (
        <section className="card">
          <h2>{reachable.length === 1 ? 'Tu persona de confianza' : 'Tus personas de confianza'}</h2>
          {reachable.length > 0 && (
            <>
              <ul className="lines">
                {reachable.map((p) => (
                  <li key={p.id}>
                    <strong>{p.name.trim() || p.phone}</strong>
                    <div className="line-actions">
                      <a className="btn" href={telOf(p.phone)} aria-label={`Llamar a ${firstName(p)}`}>
                        📞 Llamar
                      </a>
                      <a
                        className="btn ghost"
                        href={whatsappOf(p.phone, code, message)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Escribirle a ${firstName(p)} por WhatsApp`}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="muted small">Por WhatsApp el mensaje ya va escrito: «{message}»</p>
            </>
          )}
          {notes.length > 0 && (
            <>
              {reachable.length > 0 && <small className="muted">También anotaste</small>}
              <ul className="plan-items">
                {notes.map((n) => (
                  <PlanItem key={n} text={n} />
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <section className="card soft">
          <h2>¿Sientes que no tienes a nadie?</h2>
          <p>
            Las líneas de apoyo están justo para eso: alguien te escucha aunque no te conozca. No
            tienes que estar en peligro para llamar; también puedes llamar solo para platicar.
          </p>
        </section>
      )}

      <section className="card">
        <div className="row spread">
          <h2>Líneas de apoyo</h2>
          <select
            value={country.code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Tu país"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <ul className="lines">
          {country.lines.map((line) => (
            <li key={line.name}>
              <div>
                <strong>{line.name}</strong>
                <small className="muted">{line.hours}</small>
                {line.note && <small>{line.note}</small>}
              </div>
              <div className="line-actions">
                <a className="btn" href={telHref(line)}>
                  📞 {line.number}
                </a>
                {line.whatsapp && (
                  <a
                    className="btn ghost"
                    href={`https://wa.me/${line.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="muted small">
          ¿Tu país no aparece? Busca una línea en{' '}
          <a href={OTHER_COUNTRIES_URL} target="_blank" rel="noreferrer">
            findahelpline.com
          </a>
          . Números verificados en {VERIFIED_ON}; pueden cambiar.
        </p>
      </section>

      <CrisisPlan />

      <section className="card soft">
        <h2>Mientras tanto</h2>
        <ul className="plain">
          <li>Si puedes, no te quedes a solas: ve a donde haya otra persona.</li>
          <li>Aléjate de cualquier cosa con la que podrías hacerte daño.</li>
          <li>Respira despacio. Este momento, por intenso que sea, va a pasar.</li>
        </ul>
        <div className="row">
          <Link to="/panico" className="btn ghost">
            Es un ataque de pánico
          </Link>
          <Link to="/calma" className="btn ghost">
            Respirar juntos
          </Link>
          {/* Si ya escribió algo, está arriba; si no, queda para otro momento, sin presión. */}
          {empty && (
            <Link to="/mi-espacio/plan" className="btn ghost">
              Armar mi plan de seguridad
            </Link>
          )}
          <Link to="/especialista" className="btn ghost">
            Buscar un especialista
          </Link>
        </div>
      </section>
    </div>
  )
}
