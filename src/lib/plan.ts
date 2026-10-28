import { COUNTRIES, findCountry, guessCountry } from '../data/helplines'
import { BREATHING_HELPED, LIKE_ACTIONS, PLAN_STEPS, type StepKey } from '../data/plan'
import type { BodyRecord } from './bodyCheck'
import { useCompanion } from './companion'
import { usePeople } from './people'
import { useStored } from './storage'

// Mi plan de seguridad: una lista por paso. Las personas (paso 4) viven en «Mis personas».

export type Plan = Partial<Record<StepKey, string[]>>

export function usePlan() {
  const [plan, setPlan] = useStored<Plan>('plan', {})
  const { people } = usePeople()

  const has = (key: StepKey) =>
    key === 'personas' ? people.some((p) => p.name.trim()) : (plan[key]?.length ?? 0) > 0
  const ready = PLAN_STEPS.filter((s) => has(s.key)).length

  const add = (key: StepKey, item: string) => {
    const text = item.trim()
    if (text) setPlan((p) => ({ ...p, [key]: [...(p[key] ?? []).filter((i) => i !== text), text] }))
  }
  const remove = (key: StepKey, item: string) => setPlan((p) => ({ ...p, [key]: (p[key] ?? []).filter((i) => i !== item) }))
  const toggle = (key: StepKey, item: string) => (plan[key]?.includes(item) ? remove(key, item) : add(key, item))

  return { plan, has, ready, add, remove, toggle }
}

/** Lo que la app ya sabe de la persona y le sirve en un paso: así el plan no empieza en blanco. */
export function useKnown(key: StepKey): string[] {
  const { companion } = useCompanion()
  const [body] = useStored<BodyRecord[]>('cuerpo-registros', [])
  const [code] = useStored('country', guessCountry)

  if (key === 'yo') {
    // Si respirar le bajó alguna vez lo que sentía en el cuerpo, eso ya le funcionó.
    const breathing = body.some((r) => r.intensity !== null && r.after !== null && r.after < r.intensity)
    const likes = (companion?.likes ?? []).map((id) => LIKE_ACTIONS[id]).filter(Boolean)
    return [...(breathing ? [BREATHING_HELPED] : []), ...likes]
  }
  if (key === 'profesionales') {
    const country = findCountry(code) ?? COUNTRIES[0]
    return [...country.lines.map((l) => `${l.name}: ${l.number}`), `Emergencias: ${country.emergency}`]
  }
  return []
}

const digitsOf = (s: string) => s.replace(/\D/g, '')

/** El teléfono escrito en un renglón del plan («Mi psicóloga: 55 1234 5678»), para llamar con un toque. */
export function phoneIn(text: string) {
  const found = text.match(/\*?\+?\d(?:[\d\s-]*\d)?/g) ?? []
  const best = found.sort((a, b) => digitsOf(b).length - digitsOf(a).length)[0]
  return best && digitsOf(best).length >= 3 ? `tel:${best.replace(/[^\d+*#]/g, '')}` : undefined
}
