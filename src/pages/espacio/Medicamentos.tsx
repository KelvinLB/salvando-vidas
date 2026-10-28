import { useState } from 'react'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import ReminderCard from '../../components/ReminderCard'
import { lastDays } from '../../lib/progress'
import { type JournalEntry, type Medication, newId, today, useStored } from '../../lib/storage'

// Mis medicamentos: qué tomo, si ya lo tomé hoy y lo que noto. Todo entra al resumen para la
// consulta; los días sin marcar no se señalan como falla.

export default function Medicamentos() {
  const [meds, setMeds] = useStored<Medication[]>('meds', [])
  const [taken, setTaken] = useStored<string[]>('meds-tomados', [])
  const [changes, setChanges] = useStored<JournalEntry[]>('meds-cambios', [])
  const [draft, setDraft] = useState({ name: '', dose: '', when: '' })
  const [change, setChange] = useState('')
  const tookToday = taken.includes(today())
  const days = lastDays(14)

  const addMed = () => {
    if (!draft.name.trim()) return
    setMeds((all) => [...all, { id: newId(), ...draft }])
    setDraft({ name: '', dose: '', when: '' })
  }

  const addChange = () => {
    if (!change.trim()) return
    setChanges((all) => [{ id: newId(), date: today(), text: change.trim() }, ...all])
    setChange('')
  }

  return (
    <div className="stack">
      <PageHeader title="Mis medicamentos" subtitle="Lo que tomas, lo que notas y un recordatorio si te sirve. Todo se suma a tu resumen para la consulta." />

      {meds.length > 0 && (
        <section className="card center">
          <h2>{tookToday ? '¡Listo por hoy!' : '¿Ya tomaste tu medicamento hoy?'}</h2>
          <button
            className={`btn big ${tookToday ? 'ghost' : ''}`}
            onClick={() => setTaken((all) => (tookToday ? all.filter((d) => d !== today()) : [...all, today()]))}
          >
            {tookToday ? '✓ Tomado (toca para deshacer)' : 'Sí, ya lo tomé'}
          </button>
          <div className="med-days" aria-label="Últimos 14 días">
            {days.map((d) => (
              <span key={d} className={taken.includes(d) ? 'on' : ''} title={d} />
            ))}
          </div>
          <small className="muted">Últimos 14 días</small>
        </section>
      )}

      <section className="card field">
        <h2>Lo que tomo</h2>
        {meds.map((m) => (
          <div key={m.id} className="row spread med">
            <span>
              <strong>{m.name}</strong> {m.dose && `· ${m.dose}`} {m.when && <small className="muted">· {m.when}</small>}
            </span>
            <button className="icon-btn" onClick={() => setMeds((all) => all.filter((x) => x.id !== m.id))} aria-label={`Quitar ${m.name}`}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
        <input placeholder="Nombre (p. ej. sertralina, de marca o genérico)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Nombre del medicamento" />
        <input placeholder="Dosis (p. ej. 50 mg)" value={draft.dose} onChange={(e) => setDraft({ ...draft, dose: e.target.value })} aria-label="Dosis" />
        <input placeholder="Cuándo (p. ej. en la mañana)" value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} aria-label="Cuándo lo tomas" />
        <button className="btn ghost" onClick={addMed} disabled={!draft.name.trim()}>
          Agregar
        </button>
      </section>

      {meds.length > 0 && (
        <ReminderCard
          kind="medicamento"
          title="Que tu teléfono te lo recuerde"
          text="Un aviso diario en tu calendario, a la hora que lo tomas. No necesita internet ni cuenta."
        />
      )}

      <section className="card field">
        <h2>Cambios y efectos que noto</h2>
        <small className="muted">
          Por ejemplo: «cambié de marca a genérico», «me bajaron la dosis», «ya no puedo llorar». Todo
          esto aparece en tu resumen para la consulta.
        </small>
        <input value={change} onChange={(e) => setChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChange()} aria-label="Nuevo cambio" />
        <button className="btn ghost" onClick={addChange} disabled={!change.trim()}>
          Anotar
        </button>
        {changes.map((c) => (
          <p key={c.id} className="small">
            <span className="muted">{new Date(c.date + 'T12:00').toLocaleDateString('es')}:</span> {c.text}
          </p>
        ))}
      </section>

      <section className="card soft">
        <strong>Para cuidar tu tratamiento</strong>
        <ul className="plain">
          <li>No lo dejes ni bajes la dosis por tu cuenta, aunque te sientas mejor: hazlo siempre con tu médico.</li>
          <li>Si cambias de marca o pasas a genérico, avísale y fíjate cómo te sientes las semanas siguientes.</li>
          <li>
            Los antidepresivos suelen tardar varias semanas (a menudo de 4 a 6) en notarse. No es que no funcionen.{' '}
            <Link to="/cuerpo?ver=medicamento">Por qué tarda</Link>
          </li>
          <li>
            Ten cuidado con remedios y suplementos, aunque sean naturales: pregunta antes de mezclarlos con tu
            medicamento. <Link to="/redes">Lo que se dice en redes</Link>
          </li>
          <li>La fe, la terapia y el medicamento pueden ir juntos. No tienes que elegir.</li>
        </ul>
      </section>
    </div>
  )
}
