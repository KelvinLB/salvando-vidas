import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Aviso suave cuando lo escrito suena a riesgo. No juzga ni alarma: abre una puerta.
 * Pregunta directo y con calma, como se hace en consulta: preguntar no aumenta el riesgo, y
 * la ayuda queda a la vista conteste lo que conteste. Pendiente de revisión con psicóloga.
 */
export default function RiskNotice() {
  const [answer, setAnswer] = useState<'si' | 'no' | null>(null)

  return (
    <div className="callout warm" role="status">
      <p>Lo que escribiste suena muy doloroso, y gracias por sacarlo.</p>
      {answer === null && (
        <>
          <p>
            <strong>¿Has pensado en hacerte daño o en no seguir viviendo?</strong>
          </p>
          <div className="row">
            <button className="btn ghost small" onClick={() => setAnswer('si')}>
              Sí
            </button>
            <button className="btn ghost small" onClick={() => setAnswer('no')}>
              No
            </button>
          </div>
        </>
      )}
      {answer === 'si' && (
        <p>
          Gracias por decírmelo. No tienes que pasar por esto sin compañía: hay alguien que puede escucharte ahora mismo, y
          tu plan y tus personas están a un toque.
        </p>
      )}
      {answer === 'no' && (
        <p>Gracias por decírmelo. Lo que sientes pesa mucho igual; si cambia, aquí está la ayuda.</p>
      )}
      <div className="row">
        <Link to="/ayuda" className="btn">
          Hablar con alguien ahora
        </Link>
        {answer === 'si' && (
          <Link to="/mi-espacio/plan" className="btn ghost">
            Ver mi plan
          </Link>
        )}
      </div>
    </div>
  )
}
