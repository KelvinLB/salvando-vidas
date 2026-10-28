import { type CSSProperties, useEffect, useState } from 'react'
import { giggle, purr } from './audio'
import { buzz, read } from './storage'

// Lo que hace que la mascota se sienta viva, en el editor y flotando en la app.

export const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Sus sonidos se apagan en Ajustes; vienen prendidos y muy bajitos. */
export const SOUNDS_KEY = 'mascota-sonidos'

/** Al hacerle cariño: el michi ronronea y los demás se ríen bajito (y vibra en Android). */
export function petSound(species: string) {
  if (!read(SOUNDS_KEY, true)) return buzz(10)
  if (species === 'michi') {
    purr()
    buzz([8, 32, 8, 32, 8, 32, 8])
  } else {
    giggle()
    buzz([8, 40, 8])
  }
}

/** Un brinquito de gusto cada vez que se le cambia algo o se le hace cariño. */
export function hop(el: HTMLElement | null) {
  if (!el || still()) return
  el.animate(
    [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(3px) scale(1.08, 0.92)', offset: 0.15 },
      { transform: 'translateY(-18px) scale(0.95, 1.06)', offset: 0.5 },
      { transform: 'translateY(0) scale(1.04, 0.96)', offset: 0.82 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
    { duration: 560, easing: 'ease-out' },
  )
}

type Burst = { id: number; emoji: string; x: number }

/** Emojis que salen de la mascota y suben, como burbujas. */
export function useBursts() {
  const [bursts, setBursts] = useState<Burst[]>([])
  const add = (emoji: string) =>
    setBursts((all) => [...all.slice(-5), { id: Date.now() + Math.random(), emoji, x: Math.round(Math.random() * 60 - 30) }])
  const view = bursts.map((b) => (
    <span
      key={b.id}
      className="burst"
      style={{ '--x': `${b.x}px` } as CSSProperties}
      aria-hidden="true"
      onAnimationEnd={() => setBursts((all) => all.filter((x) => x.id !== b.id))}
    >
      {b.emoji}
    </span>
  ))
  return { add, view }
}

export type Period = 'dia' | 'tarde' | 'noche'

/** De día (de 7 a 19 h), de tarde (hasta las 22 h) o de noche. */
export function periodOf(d = new Date()): Period {
  const h = d.getHours()
  return h >= 22 || h < 7 ? 'noche' : h >= 19 ? 'tarde' : 'dia'
}

export function usePeriod() {
  const [period, setPeriod] = useState(periodOf)
  useEffect(() => {
    const timer = setInterval(() => setPeriod(periodOf()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return period
}
