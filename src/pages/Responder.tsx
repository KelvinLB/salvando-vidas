import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import RiskNotice from '../components/RiskNotice'
import { soundsLikeRisk } from '../lib/risk'
import { type JournalEntry, newId, today, useStored } from '../lib/storage'

// Ejercicio basado en terapia cognitiva: separar lo que dice la depresión
// de los hechos, y responderle como le responderíamos a alguien querido.

const EXAMPLES = [
  'Soy una carga',
  'A nadie le importaría si no estoy',
  'Nunca voy a estar bien',
  'No sirvo para nada',
  'Mi familia estaría mejor sin mí',
]

type Answer = JournalEntry & { reply: string; evidence: string }

export default function Responder() {
  const [answers, setAnswers] = useStored<Answer[]>('respuestas', [])
  const [thought, setThought] = useState('')
  const [reply, setReply] = useState('')
  const [evidence, setEvidence] = useState('')

  const save = () => {
    if (!thought.trim() || !reply.trim()) return
    setAnswers((all) => [
      { id: newId(), date: today(), text: thought.trim(), reply: reply.trim(), evidence: evidence.trim() },
      ...all,
    ])
    setThought('')
    setReply('')
    setEvidence('')
  }

  return (
    <div className="stack">
      <PageHeader
        title="Responderle a la depresión"
        subtitle="Tus pensamientos más oscuros no siempre cuentan toda la verdad."
      />

      <section className="card field">
        <h2>1. ¿Qué te está diciendo tu mente?</h2>
        <div className="chips">
          {EXAMPLES.map((e) => (
            <button key={e} className="chip" onClick={() => setThought(e)}>
              {e}
            </button>
          ))}
        </div>
        <textarea rows={3} value={thought} onChange={(e) => setThought(e.target.value)} aria-label="El pensamiento" />
        {soundsLikeRisk(thought) && <RiskNotice />}
      </section>

      <section className="card soft">
        <h2>2. ¿Es un hecho o es lo que sientes?</h2>
        <p>
          La depresión habla en absolutos: <em>nunca, nadie, todo, nada</em>. Lo que sientes es real,
          pero eso no lo convierte en verdad. Una cosa es sentirte una carga y otra es serlo.
        </p>
      </section>

      <label className="card field">
        <h2>3. ¿Qué le responderías a alguien que quieres?</h2>
        <small className="muted">
          Si tu mejor amiga, tu hijo o tu hermano te dijera esto de sí mismo, ¿qué le contestarías?
        </small>
        <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
      </label>

      <label className="card field">
        <h2>4. Una pequeña prueba de lo contrario</h2>
        <small className="muted">
          Algo que lo contradiga, aunque sea pequeño: alguien que te escribió, tu mascota que te
          busca, una vez que ayudaste a alguien, alguien que se alegra de verte.
        </small>
        <textarea rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)} />
      </label>

      <button className="btn big" onClick={save} disabled={!thought.trim() || !reply.trim()}>
        Guardar mi respuesta
      </button>

      {answers.map((a) => (
        <article key={a.id} className="card answer">
          <small className="muted">{new Date(a.date + 'T12:00').toLocaleDateString('es')}</small>
          <p className="muted">
            <s>{a.text}</s>
          </p>
          <p>
            <strong>{a.reply}</strong>
          </p>
          {a.evidence && <p className="muted">💛 {a.evidence}</p>}
          <button
            className="btn small ghost"
            onClick={() => setAnswers((all) => all.filter((x) => x.id !== a.id))}
          >
            Quitar
          </button>
        </article>
      ))}
    </div>
  )
}
