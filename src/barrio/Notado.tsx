import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBarrio } from '../lib/barrio'
import { SUMMARY_TITLE, noticedOf, summaryLines } from '../lib/barrioNoticed'
import './insights.css'

// «Lo que notó» su mascota: lo que vio en el barrio, en palabras sencillas, y qué cambia por
// eso. La persona lo corrige o lo borra, y decide si va como contexto en su resumen.

export default function Notado({ petName }: { petName: string }) {
  const { barrio, patch } = useBarrio()
  const [erased, setErased] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const items = noticedOf(barrio, petName)
  const lines = summaryLines(barrio)

  const mark = (id: string, value: 'no-es-asi' | 'borrado' | null) =>
    patch((b) => {
      const noticed = { ...b.noticed }
      if (value) noticed[id] = value
      else delete noticed[id]
      return { noticed }
    })

  return (
    <section className="card bi-notado" aria-labelledby="bi-notado-title">
      <h2 id="bi-notado-title">Lo que {petName} notó</h2>
      <p className="muted small">
        Solo en tu teléfono. {petName} cuenta lo que vio y qué cambia por eso. Si no es así, dile; también lo puedes borrar.
      </p>

      <ul className="bi-layers">
        <li>
          <strong>Tus gustos no se interpretan.</strong> Los colores, tu casa y cómo decoras solo hacen que el barrio se sienta
          tuyo. No dicen nada de ti y no van en tu resumen.
        </li>
        <li>
          <strong>Lo que haces adapta el barrio.</strong> Las misiones que haces o dejas para otro día, y cómo te sientes antes y
          después, cambian el tablero. Tú lo puedes corregir.
        </li>
        <li>
          <strong>Solo lo que contestas puede sugerir un especialista.</strong> Tu ánimo del día y la plática con {petName}. El
          barrio nunca dice qué tienes.
        </li>
      </ul>

      {items.length ? (
        <ul className="bi-noticed">
          {items.map((n) => {
            const off = barrio.noticed[n.id] === 'no-es-asi'
            return (
              <li key={n.id} className={off ? 'off' : undefined}>
                <p className="bi-saw">{n.saw}</p>
                <p className="bi-then">
                  {off && <strong>Lo corregiste: </strong>}
                  {n.then}
                </p>
                <div className="row">
                  <button type="button" className="btn small ghost" onClick={() => mark(n.id, off ? null : 'no-es-asi')}>
                    {off ? 'Sí es así' : 'No es así'}
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => {
                      mark(n.id, 'borrado')
                      setErased(n.id)
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="bi-empty muted">
          Todavía nada. Cuando hagas algunas misiones, aquí aparece lo que {petName} vaya notando.
        </p>
      )}

      {erased && (
        <p className="bi-undo small" role="status">
          Lo borraste.{' '}
          <button
            type="button"
            className="bi-link"
            onClick={() => {
              mark(erased, null)
              setErased(null)
            }}
          >
            Deshacer
          </button>
        </p>
      )}

      <label className="toggle bi-toggle">
        <input type="checkbox" role="switch" checked={barrio.inSummary} onChange={(e) => patch({ inSummary: e.target.checked })} />
        Incluir lo del barrio en mi resumen para el especialista
      </label>
      <p className="muted small">
        Va como contexto, no como diagnóstico. Lo que corregiste o borraste no va, ni tus gustos. Tú revisas el resumen en{' '}
        <Link to="/especialista">Camino al especialista</Link> y decides si lo mandas.
      </p>
      {barrio.inSummary && (
        <>
          <button type="button" className="btn small ghost bi-preview-btn" aria-expanded={preview} onClick={() => setPreview((p) => !p)}>
            {preview ? 'Ocultar cómo iría' : 'Ver cómo iría en tu resumen'}
          </button>
          {preview && (
            <pre className="summary bi-preview">
              {lines.length ? [SUMMARY_TITLE, ...lines.map((l) => `- ${l}`)].join('\n') : 'Todavía nada del barrio.'}
            </pre>
          )}
        </>
      )}
    </section>
  )
}
