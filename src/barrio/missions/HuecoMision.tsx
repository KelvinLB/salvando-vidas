import { useState } from 'react'
import { Link } from 'react-router-dom'
import PetSays from '../../components/PetSays'
import { EXITS_KEY, type HoleExit, useClimb } from '../../lib/hueco'
import { read, today } from '../../lib/storage'
import type { FlowProps } from '../types'
import { Flow, NotNow } from './parts'

// La misión grande de su mascota: Salir del hueco. Aquí solo se explica y se abre el juego;
// si hoy ya salieron juntos, «Ya salimos» la da por hecha.

export default function HuecoMision({ petName, heavy, onDone, onClose }: FlowProps) {
  const [climb] = useClimb()
  const [outToday] = useState(() => read<HoleExit[]>(EXITS_KEY, []).some((e) => e.date === today()))
  const started = climb.built.length > 0 && !climb.out

  return (
    <Flow label={`Salir del hueco con ${petName}`}>
      <PetSays mood={outToday ? 'feliz' : 'calma'} compact>
        <p aria-live="polite">
          {outToday
            ? '¡Hoy ya salimos juntos! Lo que hicimos se quedó: la cuerda, el faro o los faroles.'
            : started
              ? `Ya llevamos ${climb.built.length} de 4 pasos para salir. Lo que hicimos sigue ahí, no se cayó nada.`
              : 'A veces me toca estar en un hueco, en la niebla o en una calle oscura, según cómo va el día. ¿Me ayudas a salir? Lo hacemos juntos, un paso a la vez: respirar, nombrar lo que pasa, acordarnos de algo bueno y pedir una mano.'}
          {!outToday && heavy && ' Hoy los pasos son chiquitos: con una respiración ya empezamos.'}
        </p>
      </PetSays>

      <div className="row">
        {outToday ? (
          <button type="button" className="btn" onClick={onDone}>
            Ya salimos
          </button>
        ) : (
          <Link to="/juegos/hueco" className="btn">
            {started ? 'Seguir subiendo' : `Ir con ${petName}`}
          </Link>
        )}
        {outToday ? (
          <Link to="/juegos/hueco" className="btn ghost">
            Volver a jugar
          </Link>
        ) : (
          <NotNow onClose={onClose} />
        )}
      </div>
      {!outToday && <p className="muted small">No hay vidas ni reloj: aquí nada se pierde ni se cae.</p>}
    </Flow>
  )
}
