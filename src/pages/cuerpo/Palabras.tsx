import { Fragment, useState } from 'react'
import { TERMINOS, partirTexto } from '../../data/diccionario'
import { useStored } from '../../lib/storage'

// Palabras que se abren y «Mi diccionario». Las guardadas se quedan solo en este teléfono, sin
// contar cuántas llevas: no es una colección que llenar, es un lugar para volver.

/** Un texto con sus palabras difíciles como botones que se abren ahí mismo. */
export function Texto({ texto, abierta, onPalabra }: { texto: string; abierta: string | null; onPalabra(id: string): void }) {
  return (
    <>
      {partirTexto(texto).map((p, i) =>
        'termino' in p ? (
          <button
            key={i}
            type="button"
            className="dic-term"
            aria-expanded={abierta === p.termino}
            onClick={() => onPalabra(p.termino)}
          >
            {p.texto}
          </button>
        ) : (
          <Fragment key={i}>{p.texto}</Fragment>
        ),
      )}
    </>
  )
}

/** La explicación corta de una palabra, con la opción de guardarla. */
export function Definicion({ id, onCerrar }: { id: string; onCerrar(): void }) {
  const [guardadas, setGuardadas] = useStored<string[]>('diccionario', [])
  const t = TERMINOS[id]
  if (!t) return null
  const ya = guardadas.includes(id)
  return (
    <div className="dic-def" role="region" aria-label={t.nombre}>
      <strong>{t.nombre}</strong>
      <p>{t.def}</p>
      <div className="row">
        <button
          type="button"
          className="btn small"
          aria-pressed={ya}
          onClick={() => setGuardadas((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))}
        >
          {ya ? 'Quitar de mi diccionario' : 'Guardar en mi diccionario'}
        </button>
        <button type="button" className="btn ghost small" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

export function MiDiccionario() {
  const [guardadas] = useStored<string[]>('diccionario', [])
  const [abierta, setAbierta] = useState<string | null>(null)
  const mias = guardadas.filter((id) => TERMINOS[id])
  const otras = Object.keys(TERMINOS).filter((id) => !mias.includes(id))
  const chip = (id: string) => (
    <button
      key={id}
      type="button"
      className={`chip${abierta === id ? ' selected' : ''}`}
      aria-expanded={abierta === id}
      onClick={() => setAbierta((a) => (a === id ? null : id))}
    >
      {TERMINOS[id].nombre}
    </button>
  )
  return (
    <section className="card dic-mio" aria-labelledby="dic-mio-title">
      <h2 id="dic-mio-title">Mi diccionario</h2>
      <p className="muted">Las palabras que te sirvieron, para volver a ellas. Se quedan solo en este teléfono.</p>
      {mias.length ? (
        <div className="chips">{mias.map(chip)}</div>
      ) : (
        <p>
          Todavía no guardas palabras. Cuando leas una explicación, toca una palabra subrayada y elige «Guardar en mi
          diccionario».
        </p>
      )}
      {abierta && mias.includes(abierta) && <Definicion id={abierta} onCerrar={() => setAbierta(null)} />}
      {otras.length > 0 && (
        <>
          <h3 className="eyebrow">{mias.length ? 'Otras palabras' : 'Palabras para conocer'}</h3>
          <div className="chips">{otras.map(chip)}</div>
          {abierta && otras.includes(abierta) && <Definicion id={abierta} onCerrar={() => setAbierta(null)} />}
        </>
      )}
    </section>
  )
}
