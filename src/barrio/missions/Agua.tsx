import { useState } from 'react'
import type { FlowProps } from '../types'
import { Flow, NotNow, Says, Thanks } from './parts'

// Doña Lupe y el vaso de agua (autocuidado de verdad, fuera del teléfono). En un día pesado,
// con un traguito basta.

export default function Agua({ petName, heavy, onDone, onLater, onClose }: FlowProps) {
  const [stage, setStage] = useState<'intro' | 'wait' | 'end'>('intro')
  const what = heavy ? 'un traguito' : 'un vaso'

  return (
    <Flow label="Un vaso de agua con Doña Lupe">
      <Says who="lupe">
        {stage === 'intro' && (
          <p>
            ¿Ya tomaste agua hoy? La de mi puesto es de mentiritas, pero un vaso de verdad le hace bien al cuerpo, y el
            cuerpo a veces nos ayuda con el ánimo.
            {heavy && ' Hoy, aunque sea un traguito. Con eso basta.'}
          </p>
        )}
        {stage === 'wait' && (
          <p>
            Aquí te espero. Ve por {what}; {petName} me ayuda a exprimir los limones mientras. Cuando vuelvas, me
            cuentas.
          </p>
        )}
        {stage === 'end' && <p>¡Qué bueno! Tu cuerpo te lo agradece. Cuidarte en lo chiquito también cuenta.</p>}
      </Says>

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('wait')}>
            {heavy ? 'Voy por un traguito' : 'Voy por uno'}
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'wait' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('end')}>
            Ya lo hice
          </button>
          <button type="button" className="btn ghost" onClick={onLater}>
            Hoy no
          </button>
        </div>
      )}

      {stage === 'end' && <Thanks to="Doña Lupe" onDone={onDone} />}
    </Flow>
  )
}
