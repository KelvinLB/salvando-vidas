import type { ReactNode } from 'react'
import type { Band } from '../data/bodyCheck'

// Marco del cuerpo: el título arriba a la izquierda, el estado arriba a la derecha, la
// pista para tocar abajo a la izquierda y la lectura en vivo abajo a la derecha. Así las
// palabras quedan fuera del dibujo. Debajo pueden ir herramientas (cambiar de vista, marcar).

export default function BodyFrame({
  title,
  state,
  hint,
  readout,
  tools,
  children,
}: {
  title: string
  state?: string
  hint?: string
  readout?: ReactNode
  tools?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="body-frame">
      <div className="frame-row">
        <span className="eyebrow">{title}</span>
        {state && <span className="frame-state">{state}</span>}
      </div>
      {children}
      {(hint || readout) && (
        <div className="frame-row">
          <span className="muted small">{hint}</span>
          {readout}
        </div>
      )}
      {tools}
    </div>
  )
}

/** Qué tan fuerte se siente, de 1 a 5, con el color de su banda. */
export function LevelMeter({ level, band }: { level: number; band: Band }) {
  return (
    <span className={`level-meter ${band}`} role="img" aria-label={`Intensidad: ${level} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= level ? 'on' : undefined} />
      ))}
    </span>
  )
}
