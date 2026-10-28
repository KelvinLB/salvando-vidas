import { useState } from 'react'
import DayPlanCard from '../components/DayPlanCard'
import PageHeader from '../components/PageHeader'
import { DAY_TASK_IDEAS, MAX_DAY_TASKS, REWARD_IDEAS } from '../data/content'
import { type DayPlan, tomorrow, useDayPlans } from '../lib/dayplan'
import { newId, today } from '../lib/storage'

function Planner({ date, initial, onSave, onCancel }: { date: string; initial?: DayPlan; onSave: (p: DayPlan) => void; onCancel: () => void }) {
  const [tasks, setTasks] = useState<string[]>(initial?.tasks.map((t) => t.text) ?? [])
  const [custom, setCustom] = useState('')
  const [reward, setReward] = useState(initial?.reward ?? '')
  const full = tasks.length >= MAX_DAY_TASKS

  const toggle = (text: string) =>
    setTasks((all) => (all.includes(text) ? all.filter((t) => t !== text) : all.length < MAX_DAY_TASKS ? [...all, text] : all))

  const addCustom = () => {
    const text = custom.trim()
    if (!text || full || tasks.includes(text)) return
    setTasks((all) => [...all, text])
    setCustom('')
  }

  const save = () =>
    onSave({
      date,
      tasks: tasks.map((text) => ({ id: newId(), text, done: initial?.tasks.find((t) => t.text === text)?.done ?? false })),
      reward: reward.trim() || REWARD_IDEAS[0],
      light: initial?.light ?? false,
    })

  return (
    <section className="card field">
      <h2>{date === today() ? 'Mi plan de hoy' : 'Mi plan de mañana'}</h2>
      <p className="muted small">
        Hasta {MAX_DAY_TASKS} cosas pequeñas. Menos es más: un plan que sí se puede cumplir ayuda más que
        uno perfecto. Incluye al menos una cosa para ti.
      </p>

      {DAY_TASK_IDEAS.map((group) => (
        <div key={group.title} className="option-group">
          <small className="muted">{group.title}</small>
          <div className="chips">
            {group.tasks.map((t) => {
              const on = tasks.includes(t)
              return (
                <button
                  key={t}
                  className={`chip ${on ? 'selected' : ''}`}
                  aria-pressed={on}
                  disabled={!on && full}
                  onClick={() => toggle(t)}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="row">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="Otra cosa…"
          aria-label="Otra tarea"
          maxLength={60}
          disabled={full}
        />
        <button className="btn small ghost" onClick={addCustom} disabled={!custom.trim() || full}>
          Agregar
        </button>
      </div>

      {tasks.length > 0 && (
        <ol className="plain">
          {tasks.map((t) => (
            <li key={t}>
              {t}{' '}
              <button className="icon-btn" onClick={() => toggle(t)} aria-label={`Quitar ${t}`}>
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <h3>🎁 Mi premio al terminar</h3>
      <div className="chips">
        {REWARD_IDEAS.map((r) => (
          <button key={r} className={`chip ${reward === r ? 'selected' : ''}`} aria-pressed={reward === r} onClick={() => setReward(r)}>
            {r}
          </button>
        ))}
      </div>
      <input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="O escribe el tuyo" aria-label="Tu premio" maxLength={60} />

      <div className="row">
        <button className="btn" onClick={save} disabled={tasks.length === 0}>
          Guardar mi plan
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </section>
  )
}

export default function MiDia() {
  const plans = useDayPlans()
  const [editing, setEditing] = useState<string | null>(null)
  const evening = new Date().getHours() >= 18

  const planner = (date: string, initial?: DayPlan) => (
    <Planner
      date={date}
      initial={initial}
      onSave={(p) => {
        plans.save(p)
        setEditing(null)
      }}
      onCancel={() => setEditing(null)}
    />
  )

  return (
    <div className="stack">
      <PageHeader
        title="Un día a la vez"
        subtitle="Cuando cuesta levantarse, ayuda tener poquitas cosas claras y un premio al final. Mejor si lo planeas la noche anterior."
      />

      {editing === today() ? (
        planner(today(), plans.today)
      ) : plans.today ? (
        <>
          <DayPlanCard plan={plans.today} />
          <button className="btn small ghost" onClick={() => setEditing(today())}>
            Cambiar el plan de hoy
          </button>
        </>
      ) : (
        <section className="card">
          <h2>Hoy</h2>
          <p className="muted">Todavía no tienes plan para hoy. Puedes hacerlo ahora: toma un minuto.</p>
          <button className={`btn ${evening ? 'ghost' : ''}`} onClick={() => setEditing(today())}>
            Hacer mi plan de hoy
          </button>
        </section>
      )}

      {editing === tomorrow() ? (
        planner(tomorrow(), plans.tomorrow)
      ) : (
        <section className={`card ${evening ? 'night' : ''}`}>
          <h2>🌙 Mañana</h2>
          {plans.tomorrow ? (
            <>
              <ul className="plain">
                {plans.tomorrow.tasks.map((t) => (
                  <li key={t.id}>{t.text}</li>
                ))}
              </ul>
              <p className="muted">🎁 Premio: {plans.tomorrow.reward}</p>
              <p className="muted small">Mañana te lo mostramos en Inicio. Ya no tienes que pensarlo esta noche.</p>
              <button className="btn small ghost" onClick={() => setEditing(tomorrow())}>
                Cambiarlo
              </button>
            </>
          ) : (
            <>
              <p className="muted">
                Dejarlo listo desde hoy hace que mañana no tengas que decidir nada al despertar, que es
                cuando más cuesta.
              </p>
              <button className="btn" onClick={() => setEditing(tomorrow())}>
                Planear mañana
              </button>
            </>
          )}
        </section>
      )}

      <section className="card soft">
        <h2>Si te levantas por quienes dependen de ti</h2>
        <p>
          Eso habla de tu amor, y también es muy cansado. Tú también mereces cuidado: deja en tu plan
          algo solo para ti, aunque sea pequeño. Y si hay días en que no puedes ni con lo mínimo, no es
          flojera: es una señal para pedir ayuda.
        </p>
      </section>
    </div>
  )
}
