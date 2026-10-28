import { Link } from 'react-router-dom'

/** Aviso suave cuando lo escrito suena a riesgo. No juzga ni alarma: abre una puerta. */
export default function RiskNotice() {
  return (
    <div className="callout warm" role="status">
      <p>
        Lo que escribiste suena muy doloroso, y gracias por sacarlo. Si estás pensando en quitarte
        la vida o en hacerte daño, no tienes que pasar por esto sin compañía: hay alguien que puede
        escucharte ahora mismo.
      </p>
      <div className="row">
        <Link to="/ayuda" className="btn">
          Hablar con alguien ahora
        </Link>
      </div>
    </div>
  )
}
