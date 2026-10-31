import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Varias opciones en una sola tarjeta, una por fila con su flecha, en vez de una tarjeta grande
// por cada una: en el teléfono ocupa la mitad de alto y se lee de un vistazo.

export type Fila = { to: string; title: string; text?: string; icon?: ReactNode }

export default function Filas({ filas, label, className = '' }: { filas: Fila[]; label: string; className?: string }) {
  return (
    <ul className={`card filas ${className}`} aria-label={label}>
      {filas.map((f) => (
        <li key={f.to}>
          <Link to={f.to} className="fila">
            {f.icon}
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
