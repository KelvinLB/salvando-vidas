import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { MYTHS } from '../data/myths'

export default function Redes() {
  return (
    <div className="stack">
      <PageHeader
        title="Lo que se dice en redes"
        subtitle="En los grupos se comparte mucho, y casi siempre con cariño. Aquí está lo que se sabe de cada cosa, para que decidas con información."
      />

      {MYTHS.map((m) => (
        <details key={m.id} className="card myth">
          <summary>
            <h2>{m.said}</h2>
          </summary>
          <p>{m.known}</p>
          {m.to && (
            <Link to={m.to} className="btn small ghost">
              {m.action}
            </Link>
          )}
        </details>
      ))}

      <p className="disclaimer">
        Si algo de lo que leíste te hizo dudar de tu tratamiento, no lo dejes por tu cuenta: llévale la
        duda a tu médico. Esa pregunta también cabe en tu consulta.
      </p>
    </div>
  )
}
