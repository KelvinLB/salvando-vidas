import { Link } from 'react-router-dom'
import { companionName } from '../data/companion'
import { useCompanion } from '../lib/companion'
import { type DayPlan, planDone, useDayPlans } from '../lib/dayplan'
import { buzz } from '../lib/storage'
import CompanionView from './Companion'
import TearTicket from './bits/TearTicket'

/** El plan de un día: palomear tareas, cobrar el premio cortando su boleto y bajarle cuando el día pesa. */
export default function DayPlanCard({ plan, compact = false }: { plan: DayPlan; compact?: boolean }) {
  const { toggleTask, setLight, claim } = useDayPlans()
  const { companion } = useCompanion()
  const done = planDone(plan)

  return (
    <section className={`card day-plan ${done ? 'done' : ''}`}>
      <div className="row spread">
        <h2>Tu plan de hoy</h2>
        {compact && (
          <Link to="/mi-dia" className="small">
            Ver mi día
          </Link>
        )}
      </div>

      {plan.light && !done && (
        <p className="muted small">
          Hoy está pesado, y está bien. Con una sola cosa basta, y el premio sigue en pie.
        </p>
      )}

      <div className="stack tight">
        {plan.tasks.map((t) => (
          <label key={t.id} className="toggle task">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => {
                toggleTask(plan.date, t.id)
                buzz(15)
              }}
            />
            <span className={t.done ? 'task-done' : ''}>{t.text}</span>
          </label>
        ))}
      </div>

      {done ? (
        <>
          <div className="callout info reward">
            {companion && <CompanionView look={companion} mood="feliz" size={72} name={companionName(companion)} />}
            <p>
              {plan.claimed ? (
                <>
                  <strong>¡Disfrútalo!</strong> Ahora sí: {plan.reward.toLowerCase()}. Te lo ganaste.
                </>
              ) : (
                <>
                  <strong>¡Lo lograste!</strong> Tu premio ya es tuyo: corta el boleto para cobrarlo.
                </>
              )}
            </p>
          </div>
          {/* Cortar el boleto con el dedo hace que el premio se sienta ganado, no solo anotado. */}
          <TearTicket
            torn={!!plan.claimed}
            onTear={() => {
              claim(plan.date)
              buzz(30)
            }}
            width={340}
            height={124}
            stubSize={92}
            radius={14}
            holes={8}
            rotate={3}
            background="var(--warm)"
            color="var(--text)"
            borderColor="var(--warm-border)"
            stubBackground="var(--accent)"
            ariaLabel={`Cortar el boleto de tu premio: ${plan.reward}`}
            usedLabel="Premio cobrado. Te lo ganaste."
            className="reward-ticket"
            stub={
              <span className="ticket-stub" aria-hidden="true">
                ✂️
                <small>Córtalo</small>
              </span>
            }
          >
            <span className="ticket-body">
              <small>Vale por</small>
              <strong>{plan.reward}</strong>
            </span>
          </TearTicket>
        </>
      ) : (
        <p className="reward-line">🎁 Tu premio: {plan.reward}</p>
      )}

      {!done &&
        (plan.light ? (
          <button className="btn small ghost" onClick={() => setLight(plan.date, false)}>
            Ya me siento con más fuerza
          </button>
        ) : (
          <button className="btn small ghost" onClick={() => setLight(plan.date, true)}>
            Hoy está muy pesado
          </button>
        ))}
    </section>
  )
}
