import {
  type Band,
  type Duration,
  type Feel,
  type Heat,
  type HelpId,
  type Pattern,
  type RedFlag,
  type Sensation,
  SENSATIONS,
} from '../data/bodyCheck'
import type { Fx, Tone } from '../data/bodyStories'

export type BodyRecord = {
  id: string
  date: string
  ids: string[]
  intensity: number | null
  /** Qué tan fuerte se sentía después de bajarle juntos. */
  after: number | null
  duration: Duration | null
}

export type BodyStage = 'marcar' | 'nivel' | 'resumen'
/** Lo que la persona está marcando ahora. Se recuerda unas horas, por si va a otra pantalla y regresa. */
export type BodyNow = { at: number; ids: string[]; intensity: number | null; duration: Duration | null; stage: BodyStage }

export const EMPTY_NOW: BodyNow = { at: 0, ids: [], intensity: null, duration: null, stage: 'marcar' }
const FRESH_MS = 6 * 60 * 60 * 1000
export const freshNow = (saved: BodyNow, at = Date.now()) => (at - saved.at < FRESH_MS ? saved : EMPTY_NOW)

export type Reading = {
  picked: Sensation[]
  red: RedFlag[]
  /** El patrón que más se parece, o dos si se parecen casi igual (una mezcla). */
  mix: Pattern[]
  feel: Feel
  /** De 1 a 5. */
  level: number
  band: Band
  tone: Tone | null
  fx: Fx[]
  heat: Heat
  helps: HelpId[]
  /** Marcó algo de alerta en el pecho: conviene recordar cuándo revisarse el corazón. */
  chest: boolean
}

export const sensationById = new Map(SENSATIONS.map((s) => [s.id, s]))

/** Primero lo que no puede esperar. */
const RED_ORDER: RedFlag[] = ['cerebro', 'corazon', 'aire', 'crisis', 'desmayo']

const TONES: Record<Pattern, Tone> = {
  ansiedad: 'alarma',
  panico: 'alarma',
  estres: 'estres',
  depresion: 'animo',
  bipolar: 'mania',
}

/** Cuánto pesa lo marcado, de 1 a 5, antes de saber qué tan fuerte se siente. */
const fromCount = (n: number) => (n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : n <= 7 ? 4 : 5)

export const bandOf = (level: number): Band => (level <= 2 ? 'suave' : level === 3 ? 'medio' : 'fuerte')

export function readBody(ids: string[], intensity: number | null): Reading {
  const picked = ids.map((id) => sensationById.get(id)).filter((s): s is Sensation => !!s)
  const red = RED_ORDER.filter((r) => picked.some((s) => s.red === r))
  const usual = picked.filter((s) => !s.red)

  const scores: Partial<Record<Pattern, number>> = {}
  for (const s of usual) {
    for (const [p, w] of Object.entries(s.weights ?? {}) as [Pattern, number][]) scores[p] = (scores[p] ?? 0) + w
  }
  const score = (p: Pattern) => scores[p] ?? 0
  const [top, second] = (Object.keys(scores) as Pattern[]).sort((a, b) => score(b) - score(a))
  const mix: Pattern[] = !top ? [] : second && score(second) >= Math.max(3, score(top) * 0.6) ? [top, second] : [top]
  // La energía muy alta siempre se nombra: cambia el tratamiento.
  if (score('bipolar') >= 4 && !mix.includes('bipolar')) mix.push('bipolar')

  const warm = picked.filter((s) => s.feel === 'alerta').length
  const feel: Feel = picked.length - warm > warm ? 'apagado' : 'alerta'

  const base = fromCount(usual.length)
  const level = intensity ? Math.round((2 * intensity + base) / 3) : base

  const heat: Heat = {}
  for (const s of picked) {
    const key = s.area === 'mente' ? 'cabeza' : s.area
    // Si en una zona hay de los dos, gana la alerta: es lo que más se nota.
    if (heat[key] !== 'alerta') heat[key] = s.feel
  }

  const helpScore = new Map<HelpId, number>()
  usual.forEach((s) => s.helps?.forEach((h, i) => helpScore.set(h, (helpScore.get(h) ?? 0) + (i === 0 ? 2 : 1))))
  const helps = [...helpScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([h]) => h)
    .slice(0, 3)

  return {
    picked,
    red,
    mix,
    feel,
    level,
    band: bandOf(level),
    tone: top ? TONES[top] : null,
    fx: [...new Set(picked.flatMap((s) => s.fx))],
    heat,
    helps,
    chest: usual.some((s) => s.area === 'pecho' && s.feel === 'alerta'),
  }
}

/** Mientras se respira para bajarle, el corazón y la respiración siguen el ritmo lento. */
export function calmingFx(fx: Fx[]): Fx[] {
  const fast: Fx[] = ['heart-fast', 'heart-very-fast', 'breath-fast']
  return [...fx.filter((f) => !fast.includes(f)), 'breath-slow', 'heart-calm']
}
