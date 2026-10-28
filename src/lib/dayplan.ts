import { localDate, today, useStored } from './storage'

export type DayTask = { id: string; text: string; done: boolean }
/** light: día pesado, con una sola tarea ya cuenta como día logrado. claimed: ya cortó el boleto del premio. */
export type DayPlan = { date: string; tasks: DayTask[]; reward: string; light: boolean; claimed?: boolean }

export function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return localDate(d)
}

/** Con una tarea en un día pesado, o con todas en un día normal, el premio está ganado. */
export function planDone(plan: DayPlan) {
  const done = plan.tasks.filter((t) => t.done).length
  return plan.tasks.length > 0 && done >= (plan.light ? 1 : plan.tasks.length)
}

const KEEP_DAYS = 14

export function useDayPlans() {
  const [plans, setPlans] = useStored<Record<string, DayPlan>>('mi-dia', {})

  const save = (plan: DayPlan) =>
    setPlans((all) => {
      const since = new Date()
      since.setDate(since.getDate() - KEEP_DAYS)
      const recent = Object.fromEntries(Object.entries(all).filter(([date]) => date >= localDate(since)))
      return { ...recent, [plan.date]: plan }
    })

  const update = (date: string, change: (plan: DayPlan) => DayPlan) =>
    setPlans((all) => (all[date] ? { ...all, [date]: change(all[date]) } : all))

  const toggleTask = (date: string, id: string) =>
    update(date, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }))

  const setLight = (date: string, light: boolean) => update(date, (p) => ({ ...p, light }))

  const claim = (date: string) => update(date, (p) => ({ ...p, claimed: true }))

  return { today: plans[today()], tomorrow: plans[tomorrow()], save, toggleTask, setLight, claim }
}
