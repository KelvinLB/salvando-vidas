import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { AREAS, type Area } from '../../data/bodyCheck'
import type { BodyNote, Spot } from '../../lib/bodyCheck'
import { newId, today, useStored } from '../../lib/storage'
import { type View, regionCenter } from './figura'
import { partName } from './Marcas'

// «Tus palabras»: notas sobre el cuerpo dichas como las diría la persona («aquí está el
// nudo»), pegadas a una parte o a una de sus marcas. Se quedan en este teléfono y solo van
// al resumen de la consulta si ella lo elige (consulta-incluir-cuerpo, igual que en
// Especialista). Aquí también se elige si la figura se ve como su muñequito de Desde afuera.
// Pendiente de revisión con psicóloga.

export const NOTES_KEY = 'cuerpo-notas'
export const INCLUDE_KEY = 'consulta-incluir-cuerpo'
export const MINE_KEY = 'cuerpo-figura-mia'
const MAX_NOTES = 12

/** Dónde va una nota, dicho en palabras. */
export function noteWhere(note: BodyNote) {
  if (note.at && note.area !== 'mente' && note.area !== 'todo') return partName(note.area, note.at.view)
  return AREAS.find((a) => a.id === note.area)?.label ?? ''
}

/** Las notas como alfileres numerados sobre la figura, en la vista que se ve. */
export function NotePins({ notes, view }: { notes: BodyNote[]; view: View }) {
  const pins = notes
    .map((n, i) => {
      if (n.at?.view === view) return { n: i + 1, x: n.at.x, y: n.at.y }
      if (n.at || n.area === 'todo') return null
      const [cx, cy] = regionCenter(view, n.area === 'mente' ? 'cabeza' : n.area)
      // Si hay varias en la misma parte, se acomodan en fila para que no se tapen.
      const k = notes.slice(0, i).filter((m) => !m.at && m.area === n.area).length
      return { n: i + 1, x: cx - 10 + (k % 3) * 10, y: cy - 8 + Math.floor(k / 3) * 11 }
    })
    .filter((p): p is { n: number; x: number; y: number } => !!p)
  if (!pins.length) return null
  return (
    <g className="b-pins" aria-hidden="true">
      {pins.map((p) => (
        <g key={p.n} className="b-pin" transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
          <circle r="5.2" />
          <text>{p.n}</text>
        </g>
      ))}
    </g>
  )
}

export default function TusPalabras({ spots, hasYo }: { spots: Spot[]; hasYo: boolean }) {
  const [notes, setNotes] = useStored<BodyNote[]>(NOTES_KEY, [])
  const [include, setInclude] = useStored(INCLUDE_KEY, false)
  const [mine, setMine] = useStored(MINE_KEY, true)
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  // Dónde va: una parte del cuerpo, o «s:<id>» para una de sus marcas.
  const [where, setWhere] = useState<string | null>(null)

  const save = () => {
    const spot = where?.startsWith('s:') ? spots.find((s) => `s:${s.id}` === where) : undefined
    const area = (spot ? (spot.region ?? 'todo') : where) as Area
    if (!text.trim() || !area) return
    const note: BodyNote = {
      id: newId(),
      date: today(),
      area,
      text: text.trim().slice(0, 160),
      ...(spot && { at: { view: spot.view, x: spot.x, y: spot.y } }),
    }
    setNotes((list) => [...list, note].slice(-MAX_NOTES))
    setText('')
    setWhere(null)
    setWriting(false)
  }

  // Mientras no hay notas, solo la pregunta y el botón: lo demás aparece cuando ya escribiste algo.
  const corta = notes.length === 0 && !writing

  if (corta) {
    return (
      <section className="card stack tight body-words">
        <p className="eyebrow">Tus palabras</p>
        <h2>¿Cómo lo dirías tú?</h2>
        <p className="muted">Pega una nota donde lo sientes, como «aquí está el nudo», para contárselo a tu especialista.</p>
        <button type="button" className="btn ghost" onClick={() => setWriting(true)}>
          Escribir una nota
        </button>
      </section>
    )
  }

  return (
    <section className="card stack tight body-words">
      <p className="eyebrow">Tus palabras</p>
      <h2>¿Cómo lo dirías tú?</h2>
      <p className="muted">
        Escribe lo que sientes con tus palabras y pégalo donde va, como «aquí está el nudo». Te ayuda a contarle a tu
        especialista dónde y cómo lo sientes.
      </p>

      {notes.length > 0 && (
        <ol className="body-notes">
          {notes.map((n, i) => (
            <li key={n.id}>
              <span className="body-note-num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <span className="muted small">{noteWhere(n)}</span>
                <p>{n.text}</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Borrar la nota «${n.text}»`}
                onClick={() => setNotes((list) => list.filter((m) => m.id !== n.id))}
              >
                <X size={18} />
              </button>
            </li>
          ))}
        </ol>
      )}

      {writing ? (
        <div className="stack tight">
          <label className="field">
            <strong>Tu nota</strong>
            <input
              value={text}
              maxLength={160}
              placeholder="Aquí está el nudo"
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </label>
          <div className="chips" role="group" aria-label="¿Dónde va?">
            {spots.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`chip${where === `s:${s.id}` ? ' selected' : ''}`}
                aria-pressed={where === `s:${s.id}`}
                onClick={() => setWhere(`s:${s.id}`)}
              >
                En tu marca {spots.length > 1 ? i + 1 : ''}
              </button>
            ))}
            {AREAS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`chip${where === a.id ? ' selected' : ''}`}
                aria-pressed={where === a.id}
                onClick={() => setWhere(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn" disabled={!text.trim() || !where} onClick={save}>
              Guardar nota
            </button>
            <button type="button" className="btn ghost" onClick={() => setWriting(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn ghost" onClick={() => setWriting(true)} disabled={notes.length >= MAX_NOTES}>
          Escribir una nota
        </button>
      )}

      {notes.length > 0 && (
        <label className="toggle">
          <input type="checkbox" role="switch" checked={include} onChange={(e) => setInclude(e.target.checked)} />
          Incluir mis notas en el resumen para la consulta
        </label>
      )}
      <p className="muted small">Se guardan solo en este teléfono.</p>

      {hasYo ? (
        <label className="toggle">
          <input type="checkbox" role="switch" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          Que la figura se vea como mi muñequito de Desde afuera
        </label>
      ) : (
        <p className="muted small">
          ¿Quieres que la figura se parezca a ti? Hazte en <Link to="/juegos/desde-afuera">Desde afuera</Link> y aquí
          se verá con tu piel, tu pelo y tu ropa.
        </p>
      )}
    </section>
  )
}
