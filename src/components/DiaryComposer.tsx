import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskNotice from './RiskNotice'
import VoicePill from './bits/VoicePill'
import { KIND, KINDS } from '../data/diary'
import { FEELING_GROUPS, FEELING_LINKS, FEELING_NOTES, feelingLabel } from '../data/feelings'
import type { EntryKind } from '../lib/db'
import { shrinkPhoto, useBlobUrl } from '../lib/diary'
import { type Recording, useRecorder } from '../lib/recorder'
import { soundsLikeRisk } from '../lib/risk'

export type Draft = {
  text: string
  feelings: string[]
  recording: Recording | null
  photo?: Blob
  /** Solo en la carta que no se manda: para quién va y lo que entiende ahora. */
  to?: string
  understood?: string
}
export const EMPTY_DRAFT: Draft = { text: '', feelings: [], recording: null }

/** Las sensaciones solo se eligen en lo que siento y en lo que pasó. */
export const withFeelings = (kind: EntryKind) => kind === 'siento' || kind === 'paso'

export const draftHasContent = (d: Draft, kind: EntryKind) =>
  kind === 'carta'
    ? !!(d.text.trim() || d.understood?.trim())
    : !!(d.text.trim() || (withFeelings(kind) && d.feelings.length) || d.recording || (kind === 'recuerdo' && d.photo))

/** Todo lo escrito en el borrador, para buscar si suena a riesgo. */
export const draftWords = (d: { to?: string; text: string; understood?: string }) => [d.to, d.text, d.understood].filter(Boolean).join('\n')

function Recorder({ value, onChange }: { value: Recording | null; onChange: (r: Recording | null) => void }) {
  const { status, start, stop, cancel, denied } = useRecorder(onChange)
  const url = useBlobUrl(value?.blob)

  if (status === 'unsupported') return null
  if (value) {
    return (
      <div className="recording">
        {url && <audio controls src={url} preload="metadata" />}
        <button className="btn small ghost" onClick={() => onChange(null)}>
          Borrar audio
        </button>
      </div>
    )
  }
  // Como las notas de voz de WhatsApp: se toca para empezar y otra vez para terminar,
  // o se mantiene presionado y al soltar se guarda; deslizar a la izquierda lo cancela.
  return (
    <div className="recording">
      <div className="voice-row">
        <span>
          <strong>O dilo en voz alta</strong>
          <small className="muted">Toca el micrófono para empezar y otra vez para terminar.</small>
        </span>
        <VoicePill
          reactive="mic"
          size={52}
          ariaLabel={status === 'recording' ? 'Terminar de grabar' : 'Grabar en voz alta'}
          background="var(--primary)"
          iconColor="var(--primary-ink)"
          accentColor="var(--primary-ink)"
          onStream={(stream) => start(stream)}
          onStop={({ reason }) => (reason === 'mic-denied' ? denied() : reason === 'cancel' ? cancel() : stop())}
        />
      </div>
      {status === 'denied' && (
        <small className="muted">
          No pudimos usar el micrófono. Revisa el permiso en los ajustes del navegador.
        </small>
      )}
    </div>
  )
}

function PhotoPicker({ value, onChange }: { value?: Blob; onChange: (b?: Blob) => void }) {
  const url = useBlobUrl(value)
  const [busy, setBusy] = useState(false)

  const choose = async (file?: File) => {
    if (!file) return
    setBusy(true)
    onChange(await shrinkPhoto(file))
    setBusy(false)
  }

  if (url) {
    return (
      <div className="photo-picked">
        <figure className="polaroid">
          <img src={url} alt="La foto de tu recuerdo" />
        </figure>
        <button className="btn small ghost" onClick={() => onChange(undefined)}>
          Quitar foto
        </button>
      </div>
    )
  }
  return (
    <label className="photo-drop">
      <ImagePlus size={26} strokeWidth={1.75} aria-hidden="true" />
      <span>
        <strong>{busy ? 'Preparando la foto…' : 'Agregar una foto'}</strong>
        <small className="muted">Se queda solo en tu teléfono.</small>
      </span>
      <input
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={(e) => {
          choose(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </label>
  )
}

type Props = {
  kind: EntryKind
  onKind: (k: EntryKind) => void
  draft: Draft
  onDraft: (change: (d: Draft) => Draft) => void
  onSave: () => void
  onClose: () => void
}

// La carta que no se manda: para quién (si quiere), lo que no ha dicho y, si sale, algo que
// entiende ahora. Sin reloj; «Ya fue suficiente» se queda a la vista aunque escriba mucho.
// Pendiente de revisión con psicóloga.

function LetterTo({ draft, onDraft }: Pick<Props, 'draft' | 'onDraft'>) {
  return (
    <>
      <p className="letter-intro">
        No se envía a nadie: se queda aquí, bajo la llave de tu diario. Escribe lo que no sale, sin
        prisa, y deja de escribir cuando tú digas.
      </p>
      <label className="letter-to">
        <span>Para</span>
        <input
          value={draft.to ?? ''}
          onChange={(e) => onDraft((d) => ({ ...d, to: e.target.value }))}
          placeholder="quien sea (si quieres)"
          aria-label="Para quién es la carta (si quieres)"
          maxLength={80}
        />
      </label>
    </>
  )
}

function LetterClose({ draft, onDraft }: Pick<Props, 'draft' | 'onDraft'>) {
  const [closing, setClosing] = useState(!!draft.understood)
  if (!closing) {
    return (
      <button className="starter letter-close-open" onClick={() => setClosing(true)}>
        + Algo que entiendo ahora (si sale)
      </button>
    )
  }
  return (
    <label className="letter-close">
      <strong>Algo que entiendo ahora</strong>
      <small className="muted">Si sale. Si no, la carta está bien así.</small>
      <textarea
        rows={2}
        value={draft.understood ?? ''}
        onChange={(e) => onDraft((d) => ({ ...d, understood: e.target.value }))}
        placeholder="Ahora entiendo que…"
      />
    </label>
  )
}

/** Escribir en la página del diario: lo que siento, algo que pasó, un recuerdo o una carta. */
export default function DiaryComposer({ kind, onKind, draft, onDraft, onSave, onClose }: Props) {
  const area = useRef<HTMLTextAreaElement>(null)
  const k = KIND[kind]
  const feelings = withFeelings(kind)
  const letter = kind === 'carta'
  const notes = feelings ? draft.feelings.filter((id) => FEELING_NOTES[id]) : []
  // Si dos sensaciones llevan al mismo lugar, el enlace se ofrece una sola vez (en la primera).
  const shown = new Set<string>()
  const linksOf = (id: string) =>
    (FEELING_LINKS[id] ?? []).filter((l) => !shown.has(l.to) && shown.add(l.to))
  // «Ya fue suficiente»: se guarda lo que haya y se cierra; si no hay nada, solo se cierra.
  const enough = () => (draftHasContent(draft, kind) ? onSave() : onClose())

  const toggleFeeling = (id: string) =>
    onDraft((d) => ({ ...d, feelings: d.feelings.includes(id) ? d.feelings.filter((x) => x !== id) : [...d.feelings, id] }))

  // La frase se agrega al final y el cursor queda listo para seguir escribiendo.
  const start = (starter: string) => {
    const piece = starter.endsWith(':') ? `${starter}\n1. ` : starter.replace('…', ' ')
    onDraft((d) => ({ ...d, text: (d.text.trim() ? d.text.trimEnd() + '\n' : '') + piece }))
    requestAnimationFrame(() => {
      const el = area.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })
  }

  return (
    <div className="composer" data-kind={kind}>
      <div className="composer-top">
        <small className="muted">¿Qué quieres guardar?</small>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar sin guardar (lo escrito se queda)">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="kind-switch" role="radiogroup" aria-label="Qué quieres guardar">
        {KINDS.map((x) => (
          <button
            key={x.id}
            role="radio"
            aria-checked={x.id === kind}
            className={`kind-pill ${x.id === kind ? 'selected' : ''}`}
            onClick={() => onKind(x.id)}
          >
            <span aria-hidden="true">{x.emoji}</span>
            {x.label}
          </button>
        ))}
      </div>

      {kind === 'recuerdo' && <PhotoPicker value={draft.photo} onChange={(photo) => onDraft((d) => ({ ...d, photo }))} />}

      {feelings && (
        <div className="composer-feelings">
          <strong>{kind === 'siento' ? '¿Qué sientes ahora?' : '¿Cómo te dejó?'}</strong>
          <small className="muted">
            No tienes que saberlo con exactitud. Toca lo que se parezca, aunque sea un poco.
          </small>
          {FEELING_GROUPS.map((group) => (
            <div key={group.title} className="feeling-group">
              <small className="muted">{group.title}</small>
              <div className="chips">
                {group.feelings.map((f) => (
                  <button
                    key={f.id}
                    className={`chip ${draft.feelings.includes(f.id) ? 'selected' : ''}`}
                    aria-pressed={draft.feelings.includes(f.id)}
                    onClick={() => toggleFeeling(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {notes.map((id) => {
            const links = linksOf(id)
            return (
              <div key={id} className="callout info">
                <strong>{feelingLabel(id)}</strong>
                <p>{FEELING_NOTES[id]}</p>
                {links.length > 0 && (
                  <div className="row">
                    {links.map((l) => (
                      <Link key={l.to} to={l.to} className="btn small ghost">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {letter && <LetterTo draft={draft} onDraft={onDraft} />}

      <div className="starters" aria-label="Frases para empezar">
        {k.starters.map((s) => (
          <button key={s} className="starter" onClick={() => start(s)}>
            {s}
          </button>
        ))}
      </div>
      <textarea
        ref={area}
        rows={letter ? 8 : 5}
        value={draft.text}
        onChange={(e) => onDraft((d) => ({ ...d, text: e.target.value }))}
        placeholder={k.placeholder}
        aria-label={letter ? 'Tu carta' : k.label}
      />
      {letter && <LetterClose draft={draft} onDraft={onDraft} />}
      {soundsLikeRisk(draftWords(draft)) && <RiskNotice />}
      {letter ? (
        <div className="letter-enough">
          <button className="btn big" onClick={enough}>
            Ya fue suficiente
          </button>
          <small>{draftHasContent(draft, kind) ? 'Se guarda aquí, sin enviarse.' : 'Puedes cerrar sin escribir nada.'}</small>
        </div>
      ) : (
        <>
          <Recorder value={draft.recording} onChange={(recording) => onDraft((d) => ({ ...d, recording }))} />
          <button className="btn big" onClick={onSave} disabled={!draftHasContent(draft, kind)}>
            Guardar en mi diario
          </button>
        </>
      )}
    </div>
  )
}
