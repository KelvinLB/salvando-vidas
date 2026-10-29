import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PatchArt } from '../../components/hilos/Threads'
import { usePatches, wovenToday } from '../../lib/hilos'
import type { FlowProps } from '../types'
import { Flow, NotNow, Says } from './parts'

// Doña Chayo, la tejedora del mercado, y sus hilos enredados: una actividad tranquila para
// los ojos y las manos, que le da un descanso a la cabeza (el juego «Hilos sueltos»). Aquí
// solo se explica y se abre el juego; si hoy ya quedó un tejido, «Ya lo tejí» la da por hecha.
// En un día pesado se sugiere el tamaño «Chiquito». Los textos quedan pendientes de revisión
// de un psicólogo.

export default function Desenredar({ petName, heavy, onDone, onClose }: FlowProps) {
  const [woven] = useState(wovenToday)
  const [patches] = usePatches()
  const newest = patches[0]

  return (
    <Flow label="Desenredar con Doña Chayo">
      <Says who="chayo">
        <p>
          {woven
            ? '¡Quedó bien bonito! Cada hilo en su lugar, sin prisa. Ya lo colgué en mi puesto, junto a los rebozos.'
            : `Ay, se me cayó la canasta y se me hicieron bolas los hilos. ¿Me ayudas a desenredarlos? Se giran las piezas, una por una, hasta que ningún hilo quede suelto. ${petName} me detiene la canasta.`}
          {!woven && heavy && ' Hoy, si quieres, nomás el chiquito: siete piezas y ya. Con eso me ayudas un montón.'}
        </p>
      </Says>

      {newest && (
        <figure className="bm-patch">
          <PatchArt patch={newest} className="bm-patch-art" />
          <figcaption className="muted small">Mira, tu bordado ya está en mi puesto.</figcaption>
        </figure>
      )}

      <div className="row">
        {woven ? (
          <button type="button" className="btn" onClick={onDone}>
            Ya lo tejí
          </button>
        ) : (
          <Link to="/juegos/hilos" className="btn">
            {heavy ? 'Tejer uno chiquito' : 'Ayudarle con los hilos'}
          </Link>
        )}
        {woven ? (
          <Link to="/juegos/hilos" className="btn ghost">
            Tejer otro
          </Link>
        ) : (
          <NotNow onClose={onClose} />
        )}
      </div>
      {!woven && <p className="muted small">No hay reloj ni puntos: si te cansas, se queda como va y nada se pierde.</p>}
    </Flow>
  )
}
