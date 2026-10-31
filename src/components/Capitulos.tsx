import { useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Filas from './Filas'

// Una lectura larga partida en capítulos: primero el índice, y cada capítulo en su propia
// pantalla con «Siguiente» al final. El capítulo va en la dirección (?c=…), así que el botón de
// atrás del teléfono regresa al índice y se puede volver justo al mismo lugar.

export type Capitulo = {
  id: string
  title: string
  /** Una línea en el índice para saber qué hay adentro sin entrar. */
  text?: string
  emoji?: string
  content: ReactNode
}

export function useCapitulo() {
  const [params] = useSearchParams()
  return params.get('c')
}

export default function Capitulos({
  capitulos,
  label,
  antes,
}: {
  capitulos: Capitulo[]
  /** Cómo se llama la lista en el índice (para lectores de pantalla). */
  label: string
  /** Lo que va arriba del índice: el título de la página y, si hace falta, una línea de ayuda. */
  antes?: ReactNode
}) {
  const actual = useCapitulo()
  const navigate = useNavigate()
  const { state, search } = useLocation()
  // La dirección con otro capítulo (o sin ninguno), sin tocar lo demás que ya trae (p. ej. ?v=…).
  const con = (c?: string) => {
    const p = new URLSearchParams(search)
    if (c) p.set('c', c)
    else p.delete('c')
    const q = p.toString()
    return q ? `?${q}` : ''
  }
  // Si se llegó desde el índice, volver a él es ir hacia atrás; si se llegó directo, se reemplaza.
  const alIndice = () => (state?.desdeIndice ? navigate(-1) : navigate({ search: con() }, { replace: true }))
  const i = capitulos.findIndex((c) => c.id === actual)
  const cap = capitulos[i]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [actual])

  if (!cap) {
    return (
      <>
        {antes}
        <Filas label={label} filas={capitulos.map((c) => ({ to: { search: con(c.id) }, state: { desdeIndice: true }, title: c.title, text: c.text, emoji: c.emoji }))} />
      </>
    )
  }

  const siguiente = capitulos[i + 1]
  return (
    <article className="capitulo" aria-labelledby="capitulo-titulo">
      <p className="eyebrow capitulo-paso">
        {i + 1} de {capitulos.length}
      </p>
      <h2 id="capitulo-titulo" className="capitulo-titulo">
        {cap.title}
      </h2>
      <div className="stack">{cap.content}</div>
      <nav className="capitulo-pie" aria-label="Capítulos">
        {siguiente ? (
          <Link to={{ search: con(siguiente.id) }} state={state} className="btn ghost capitulo-siguiente" replace>
            <span>
              <small>Siguiente</small>
              {siguiente.title}
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        ) : (
          <button type="button" className="btn ghost" onClick={alIndice}>
            Ver todos los temas
          </button>
        )}
        {siguiente && (
          <button type="button" className="link-btn capitulo-indice" onClick={alIndice}>
            Ver todos los temas
          </button>
        )}
      </nav>
    </article>
  )
}
