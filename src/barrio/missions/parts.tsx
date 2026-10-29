import { type FormEvent, type ReactNode, useId, useState } from 'react'
import RiskNotice from '../../components/RiskNotice'
import { type MissionId, NEIGHBORS, type NeighborId } from '../../data/barrio'
import { MOODS } from '../../data/content'
import { type BarrioEvent, readBarrio } from '../../lib/barrio'
import { soundsLikeRisk } from '../../lib/risk'
import { localDate, today } from '../../lib/storage'
import './missions.css'

// Piezas que comparten las misiones del barrio: lo que dice cada vecino, las caritas del ánimo,
// la escala del miedo y lo que la persona escribe con sus palabras (siempre se revisa por si
// suena a riesgo, y nada de eso se guarda aquí).

export const nameOf = (id: NeighborId) => NEIGHBORS.find((n) => n.id === id)?.name ?? ''

/** Lo que dice un vecino: su carita con la inicial y su globo. El globo avisa con calma al lector de pantalla. */
export function Says({ who, children }: { who: NeighborId; children: ReactNode }) {
  const name = nameOf(who)
  const initial = name.replace(/^(Don|Doña)\s+/, '')[0]
  return (
    <div className={`bm-says bm-npc-${who}`}>
      <span className="bm-face" aria-hidden="true">
        {initial}
      </span>
      <div className="bm-bubble">
        <span className="bm-name">{name}</span>
        <div className="bm-line" aria-live="polite">
          {children}
        </div>
      </div>
    </div>
  )
}

/** El contenedor de cada misión: lo que dice arriba y lo que se puede hacer abajo. */
export function Flow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="bm-flow" role="group" aria-label={label}>
      {children}
    </div>
  )
}

/** Cómo se siente, de 1 (muy mal) a 5 (muy bien). Se elige con un toque. */
export function MoodFaces({ label, onPick }: { label: string; onPick: (mood: number) => void }) {
  return (
    <div className="moods bm-moods" role="group" aria-label={label}>
      {MOODS.map((m) => (
        <button key={m.value} type="button" className="mood" onClick={() => onPick(m.value)}>
          <span aria-hidden="true">{m.emoji}</span>
          <small>{m.label}</small>
        </button>
      ))}
    </div>
  )
}

export const moodLabel = (mood: number) => MOODS.find((m) => m.value === mood)?.label.toLowerCase() ?? ''

/** El miedo en palabras: el número solo, a veces, no dice mucho. */
export const fearWord = (n: number) =>
  n === 0 ? 'nada' : n <= 3 ? 'poquito' : n <= 6 ? 'más o menos' : n <= 8 ? 'bastante' : 'muchísimo'

/** Miedo de 0 (nada) a 10 (muchísimo). */
export function FearScale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const id = useId()
  return (
    <div className="bm-fear">
      <label htmlFor={id} className="bm-fear-label">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        aria-valuetext={`${value}, ${fearWord(value)}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="bm-fear-scale" aria-hidden="true">
        <span>0 nada</span>
        <b>
          {value} · {fearWord(value)}
        </b>
        <span>10 muchísimo</span>
      </div>
    </div>
  )
}

type OwnTextProps = {
  label: string
  placeholder?: string
  submit: string
  maxLength?: number
  multiline?: boolean
  /** `risk`: lo escrito sonó a riesgo; ya se le mostró el aviso y eligió seguir. */
  onSubmit: (text: string, risk: boolean) => void
  onCancel?: () => void
  /** Frases para empezar: con un toque se agregan a lo escrito. */
  starters?: string[]
  children?: ReactNode
}

/**
 * Algo con sus propias palabras. Si suena a riesgo, primero aparece el aviso con calma y luego
 * puede seguir. Quien lo usa decide qué hacer con el texto: casi siempre, no guardarlo.
 */
export function OwnText({ label, placeholder, submit, maxLength = 80, multiline, onSubmit, onCancel, starters, children }: OwnTextProps) {
  const id = useId()
  const [text, setText] = useState('')
  const [risk, setRisk] = useState(false)

  const send = (e: FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    if (!risk && soundsLikeRisk(t)) return setRisk(true)
    onSubmit(t, risk)
  }

  return (
    <form className="bm-own" onSubmit={send}>
      <label htmlFor={id} className="bm-own-label">
        {label}
      </label>
      {children}
      {starters && (
        <div className="chips">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => {
                setText((t) => ((t.trim() ? t.trimEnd() + ' ' : '') + s.replace(/…$/, ' ')).slice(0, maxLength))
                setRisk(false)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={text}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value)
            setRisk(false)
          }}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={text}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value)
            setRisk(false)
          }}
        />
      )}
      {risk && <RiskNotice />}
      <div className="row">
        <button type="submit" className="btn" disabled={!text.trim()}>
          {risk ? 'Seguir' : submit}
        </button>
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Mejor no
          </button>
        )}
      </div>
    </form>
  )
}

/** Cierre de una misión: aquí sí se avisa a la página que terminó. */
export function Thanks({ to, onDone }: { to: string; onDone: () => void }) {
  return (
    <div className="row">
      <button type="button" className="btn" onClick={onDone}>
        Gracias, {to}
      </button>
    </div>
  )
}

/** «Ahorita no»: antes de empezar, cerrar la plática no cambia nada. */
export function NotNow({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="btn ghost" onClick={onClose}>
      Ahorita no
    </button>
  )
}

/**
 * Lo que quedó a medias hoy: un mandado sin el ánimo de después o un escalón sin el miedo que
 * sintió. Si después de eso dijo «Hoy no» o terminó la misión, ya no se retoma.
 */
export function pendingToday(kind: 'mandado' | 'escalon', mission: MissionId): BarrioEvent | null {
  // Los eventos van del más nuevo al más viejo.
  const last = readBarrio().events.find((e) => e.kind === kind || (e.kind === 'mision' && e.mission === mission))
  if (!last || last.kind !== kind || localDate(new Date(last.at)) !== today()) return null
  if (last.kind === 'mandado' && last.after === undefined) return last
  if (last.kind === 'escalon' && last.felt === undefined) return last
  return null
}
