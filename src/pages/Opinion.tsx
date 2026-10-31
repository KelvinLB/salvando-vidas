import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RiskNotice from '../components/RiskNotice'
import { type Feedback, flushFeedback, sendFeedback } from '../lib/feedback'
import { soundsLikeRisk } from '../lib/risk'
import { newId } from '../lib/storage'
import './opinion.css'

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
  // La pregunta que se ve. Lo contestado vive en `form`, así que ir y volver no borra nada.
  const [paso, setPaso] = useState(0)
  const titulo = useRef<HTMLHeadingElement>(null)
  const cambio = useRef(false)

  // Al cambiar de pregunta, se sube y el lector de pantalla cae en la pregunta nueva (no al llegar).
  useEffect(() => {
    if (!cambio.current) return
    window.scrollTo(0, 0)
    titulo.current?.focus({ preventScroll: true })
  }, [paso])

  const irA = (n: number) => {
    cambio.current = true
    setPaso(n)
  }

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
    setPaso(0)
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

  // Una pregunta a la vez. Todas son opcionales: «Siguiente» avanza aunque se deje en blanco.
  const preguntas: { id: string; content: ReactNode }[] = [
    {
      id: 'ayudo',
      content: (
        <section className="card">
          <h2 ref={titulo} tabIndex={-1}>¿La app te ayudó hoy?</h2>
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
      ),
    },
    {
      id: 'sirvio',
      content: (
        <section className="card">
          <h2 ref={titulo} tabIndex={-1}>¿Qué te sirvió?</h2>
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
      ),
    },
    {
      id: 'falta',
      content: (
        <label className="card field">
          <h2 ref={titulo} tabIndex={-1}>¿Qué te hizo falta o qué cambiarías?</h2>
          <textarea rows={4} value={form.missing} onChange={(e) => set('missing', e.target.value)} />
          <small className="muted">No escribas nombres ni datos que te identifiquen dentro del texto.</small>
        </label>
      ),
    },
    {
      id: 'historia',
      content: (
        <section className="card field">
          <h2 ref={titulo} tabIndex={-1}>Tu historia (opcional)</h2>
          <small className="muted">
            ¿Qué te ayudó a ti en un momento difícil? Tu experiencia puede darle esperanza a alguien
            que hoy está donde tú estuviste.
          </small>
          <textarea rows={5} value={form.story} onChange={(e) => set('story', e.target.value)} aria-label="Tu historia" />
          <label className="toggle">
            <input type="checkbox" checked={form.shareStory} onChange={(e) => set('shareStory', e.target.checked)} />
            Acepto que se comparta como testimonio anónimo
          </label>
          <small className="muted">No escribas nombres ni datos que te identifiquen dentro del texto.</small>
        </section>
      ),
    },
    {
      id: 'contacto',
      content: (
        <label className="card field">
          <h2 ref={titulo} tabIndex={-1}>Contacto (opcional)</h2>
          <small className="muted">Solo si quieres que te escribamos. Puedes dejarlo vacío y será totalmente anónimo.</small>
          <input type="email" inputMode="email" value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="correo@ejemplo.com" />
        </label>
      ),
    },
  ]
  const ultima = paso === preguntas.length - 1

  return (
    <div className="stack">
      <PageHeader
        title="Tu opinión"
        subtitle={paso === 0 ? 'Esta app la hacemos entre todos. Cuéntanos qué te sirve, qué no y qué te hace falta.' : undefined}
      />

      <div className="callout info">
        <p>
          Esto no es un canal de emergencia: nadie lo lee en tiempo real. Si necesitas ayuda ahora,{' '}
          <Link to="/ayuda">habla con alguien aquí</Link>.
        </p>
      </div>

      <p className="eyebrow op-paso">
        Pregunta {paso + 1} de {preguntas.length}
      </p>

      {preguntas[paso].content}

      {risk && <RiskNotice />}

      <div className="op-pie">
        {ultima ? (
          <>
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
            {!canSend && <p className="muted small">Contesta al menos una pregunta para poder enviarla.</p>}
          </>
        ) : (
          <>
            <button className="btn big" onClick={() => irA(paso + 1)}>
              Siguiente
            </button>
            {canSend && (
              <button type="button" className="link-btn op-ya" onClick={submit} disabled={sending}>
                Enviar ya, así como está
              </button>
            )}
          </>
        )}
        {paso > 0 && (
          <button type="button" className="link-btn op-atras" onClick={() => irA(paso - 1)}>
            Volver a la pregunta anterior
          </button>
        )}
      </div>
    </div>
  )
}
