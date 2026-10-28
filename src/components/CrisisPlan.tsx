import { useState } from 'react'
import { Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { STEP, type StepKey } from '../data/plan'
import { phoneIn, usePlan } from '../lib/plan'
import { type JournalEntry, type Letter, useStored } from '../lib/storage'

// En «Necesito ayuda», lo que la persona escribió para este momento, sin tener que buscarlo:
// su plan, sus razones y su carta. Solo se lee; para cambiarlo hay un enlace a Mi espacio.
// Las señales de alerta no van: si llegó aquí, ya las reconoció.
const SHOWN: StepKey[] = ['yo', 'lugares', 'profesionales', 'entorno']

/** Un renglón del plan; si trae teléfono, se llama con un toque. */
export function PlanItem({ text }: { text: string }) {
  const tel = phoneIn(text)
  return (
    <li>
      <span>{text}</span>
      {tel && (
        <a className="btn small" href={tel} aria-label={`Llamar: ${text}`}>
          <Phone size={16} aria-hidden="true" />
          Llamar
        </a>
      )}
    </li>
  )
}

/** Lo que hay para mostrar en una crisis; `empty` si la persona todavía no escribe nada. */
export function useCrisisPlan() {
  const { plan } = usePlan()
  const [reasons] = useStored<JournalEntry[]>('razones', [])
  const [letter] = useStored<Letter | null>('carta', null)
  const steps = SHOWN.filter((k) => plan[k]?.length)
  return { plan, steps, reasons, letter, empty: !steps.length && !reasons.length && !letter }
}

export default function CrisisPlan() {
  const { plan, steps, reasons, letter, empty } = useCrisisPlan()
  const [reading, setReading] = useState(false)

  if (empty) return null

  return (
    <section className="card my-plan" id="mi-plan">
      <h2>Lo que tú escribiste para este momento</h2>

      {steps.map((k) => (
        <div key={k} className="plan-block">
          <h3>{STEP[k].title}</h3>
          <ul className="plan-items">
            {plan[k]!.map((item) => (
              <PlanItem key={item} text={item} />
            ))}
          </ul>
        </div>
      ))}

      {reasons.length > 0 && (
        <div className="plan-block">
          <h3>Mis razones para seguir</h3>
          <ul className="reason-chips">
            {reasons.map((r) => (
              <li key={r.id}>💛 {r.text}</li>
            ))}
          </ul>
        </div>
      )}

      {letter &&
        (reading ? (
          <blockquote className="letter">
            <p className="pre">{letter.text}</p>
            <footer>Te la escribiste el {new Date(letter.date + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}.</footer>
          </blockquote>
        ) : (
          <button className="btn ghost" onClick={() => setReading(true)}>
            💌 Leer la carta que te escribiste
          </button>
        ))}

      <div className="row">
        <Link to="/mi-espacio/caja" className="btn small ghost">
          Abrir mi caja de esperanza
        </Link>
        <Link to="/mi-espacio/plan" className="btn small ghost">
          Cambiar mi plan
        </Link>
      </div>
    </section>
  )
}
