import type { ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'

// Varias opciones en una sola tarjeta, una por fila con su flecha, en vez de una tarjeta grande
// por cada una: en el teléfono ocupa la mitad de alto y se lee de un vistazo. Es la «puerta» de
// cada tema: toca y abre su propia pantalla, con solo eso.

export type Fila = { to: To; title: string; text?: string; icon?: ReactNode; emoji?: string; state?: unknown }

export default function Filas({ filas, label, className = '' }: { filas: Fila[]; label: string; className?: string }) {
  return (
    <ul className={`card filas ${className}`} aria-label={label}>
      {filas.map((f) => (
        <li key={f.title}>
          <Link to={f.to} state={f.state} className="fila">
            {f.icon ??
              (f.emoji && (
                <span className="tile-emoji fila-emoji" aria-hidden="true">
                  {f.emoji}
                </span>
              ))}
            <span>
              <strong>{f.title}</strong>
              {f.text && <small>{f.text}</small>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
