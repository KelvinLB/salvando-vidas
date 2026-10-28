import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RiskNotice from '../components/RiskNotice'
import { type Feedback, flushFeedback, sendFeedback } from '../lib/feedback'
import { soundsLikeRisk } from '../lib/risk'
import { newId } from '../lib/storage'

const HELPED = [
  { id: 'si', label: 'Sí' },
  { id: 'un-poco', label: 'Un poco' },
  { id: 'no', label: 'No' },
] as const

const SECTIONS = ['Respirar', 'Juegos', 'Música y sonidos', 'Videos y películas', 'Mi diario', 'Mi mascota', 'Plan de seguridad', 'Caja de esperanza', 'Cómo voy', 'Camino al especialista', 'Líneas de ayuda']

const empty = (): Feedback => ({
  id: newId(),
  createdAt: new Date().toISOString(),
  helped: null,
  useful: [],
  missing: '',
  story: '',
  shareStory: false,
  contact: '',
})

export default function Opinion() {
  const [form, setForm] = useState(empty)
  const [result, setResult] = useState<'sent' | 'queued' | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    flushFeedback()
  }, [])

  const set = <K extends keyof Feedback>(key: K, value: Feedback[K]) => setForm((f) => ({ ...f, [key]: value }))
  const toggleUseful = (s: string) =>
    set('useful', form.useful.includes(s) ? form.useful.filter((x) => x !== s) : [...form.useful, s])

  const risk = soundsLikeRisk(`${form.missing} ${form.story}`)
  const canSend = form.helped || form.useful.length || form.missing.trim() || form.story.trim()

  const submit = async () => {
    if (!canSend) return
    setSending(true)
    const sent = await sendFeedback({ ...form, createdAt: new Date().toISOString() })
    setSending(false)
    setResult(sent ? 'sent' : 'queued')
    setForm(empty())
  }

  if (result) {
    return (
      <div className="stack">
        <PageHeader title="Gracias" />
        <section className="card center">
          <p className="big-emoji">💛</p>
          <h2>Tu voz nos ayuda a acompañar mejor a otras personas.</h2>
          <p className="muted">
            {result === 'sent'
              ? 'Tu opinión ya llegó al equipo.'
              : 'Se guardó en tu teléfono y se enviará sola en cuanto sea posible.'}
          </p>
          <button className="btn ghost" onClick={() => setResult(null)}>
            Escribir otra
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        title="Tu opinión"
        subtitle="Esta app la hacemos entre todos. Cuéntanos qué te sirve, qué no y qué te hace falta."
      />

      <div className="callout info">
        <p>
          Esto no es un canal de emergencia: nadie lo lee en tiempo real. Si necesitas ayuda ahora,{' '}
          <Link to="/ayuda">habla con alguien aquí</Link>.
        </p>
      </div>

      <section className="card">
        <h2>¿La app te ayudó hoy?</h2>
        <div className="chips">
          {HELPED.map((h) => (
            <button
              key={h.id}
              className={`chip ${form.helped === h.id ? 'selected' : ''}`}
              aria-pressed={form.helped === h.id}
              onClick={() => set('helped', form.helped === h.id ? null : h.id)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>¿Qué te sirvió?</h2>
        <div className="chips">
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`chip ${form.useful.includes(s) ? 'selected' : ''}`}
              aria-pressed={form.useful.includes(s)}
              onClick={() => toggleUseful(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <label className="card field">
        <h2>¿Qué te hizo falta o qué cambiarías?</h2>
        <textarea rows={4} value={form.missing} onChange={(e) => set('missing', e.target.value)} />
      </label>

      <section className="card field">
        <h2>Tu historia (opcional)</h2>
        <small className="muted">
          ¿Qué te ayudó a ti en un momento difícil? Tu experiencia puede darle esperanza a alguien
          que hoy está donde tú estuviste.
        </small>
        <textarea rows={5} value={form.story} onChange={(e) => set('story', e.target.value)} />
        <label className="toggle">
          <input type="checkbox" checked={form.shareStory} onChange={(e) => set('shareStory', e.target.checked)} />
          Acepto que se comparta como testimonio anónimo
        </label>
      </section>

      {risk && <RiskNotice />}

      <label className="card field">
        <h2>Contacto (opcional)</h2>
        <small className="muted">Solo si quieres que te escribamos. Puedes dejarlo vacío y será totalmente anónimo.</small>
        <input type="email" inputMode="email" value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="correo@ejemplo.com" />
      </label>

      <p className="muted small">No escribas nombres ni datos que te identifiquen dentro del texto.</p>

      <button className="btn big" onClick={submit} disabled={!canSend || sending}>
        {sending ? (
          <>
            Enviando
            <span className="loader-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        ) : (
          'Enviar'
        )}
      </button>
    </div>
  )
}
