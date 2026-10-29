import { newId, read, store, today, useStored } from './storage'

// Lo que queda de cada crisis: por qué camino la atravesó y, si quiso anotarlo, qué temía y si
// pasó. Con el tiempo, sus propios datos le van enseñando que lo que temía casi nunca pasa.
// Todo se queda en el teléfono.

export type PanicPath = 'enfrentar' | 'acompanar'
export type Happened = 'no' | 'poco' | 'si'

export type PanicEntry = { id: string; date: string; path: PanicPath; fears: string[]; happened: Happened }
/** Cada vez que la persona llegó al final de la guía. */
export type PanicUse = { date: string; path: PanicPath }

export const PANIC_LOG = 'panico-registro'
export const PANIC_USES = 'panico-usos'

/** «label» va en el botón; «feared» completa «Temiste…» y «mine», «Temí…» (para el resumen de la consulta). */
export const FEARS = [
  { id: 'desmayo', label: 'Desmayarme', feared: 'desmayarte', mine: 'desmayarme' },
  { id: 'infarto', label: 'Un infarto', feared: 'un infarto', mine: 'un infarto' },
  { id: 'control', label: 'Perder el control', feared: 'perder el control', mine: 'perder el control' },
  { id: 'vieran', label: 'Que me vieran', feared: 'que te vieran', mine: 'que me vieran' },
  { id: 'morir', label: 'Morirme', feared: 'morirte', mine: 'morirme' },
  { id: 'otra', label: 'Otra cosa', feared: 'otra cosa', mine: 'otra cosa' },
] as const

export const HAPPENED: { id: Happened; label: string }[] = [
  { id: 'no', label: 'No' },
  { id: 'poco', label: 'Un poco' },
  { id: 'si', label: 'Sí' },
]

const fearById = new Map<string, (typeof FEARS)[number]>(FEARS.map((f) => [f.id, f]))

export function usePanicLog() {
  const [entries] = useStored<PanicEntry[]>(PANIC_LOG, [])
  return entries
}

export function addPanicEntry(entry: Omit<PanicEntry, 'id' | 'date'>) {
  const all = read<PanicEntry[]>(PANIC_LOG, [])
  store(PANIC_LOG, [{ id: newId(), date: today(), ...entry }, ...all])
}

/** Se cuenta una vez por crisis, al llegar al final. */
export function countPanicUse(path: PanicPath) {
  const all = read<PanicUse[]>(PANIC_USES, [])
  store(PANIC_USES, [...all, { date: today(), path }].slice(-200))
}

export function usePanicUses() {
  const [uses] = useStored<PanicUse[]>(PANIC_USES, [])
  return uses
}

/**
 * Del rescate a la confianza: después de tres crisis, si la última fue acompañada, se le ofrece
 * (sin insistir) probar el otro camino. El acompañamiento nunca se quita.
 */
export const suggestFacing = (uses: PanicUse[]) => uses.length >= 3 && uses[uses.length - 1].path === 'acompanar'

export type FearLine = { id: string; times: number; no: number; poco: number; si: number; text: string }

const times = (n: number) => (n === 1 ? '1 vez' : `${n} veces`)

/** Por cada miedo, cuántas veces lo temió y cuántas pasó, de lo más temido a lo menos. */
export function fearSummary(entries: PanicEntry[], voice: 'tu' | 'yo' = 'tu'): FearLine[] {
  const lines = new Map<string, Omit<FearLine, 'text'>>()
  for (const e of entries) {
    for (const id of e.fears) {
      if (!fearById.has(id)) continue
      const l = lines.get(id) ?? { id, times: 0, no: 0, poco: 0, si: 0 }
      l.times++
      l[e.happened]++
      lines.set(id, l)
    }
  }
  return [...lines.values()]
    .sort((a, b) => b.times - a.times)
    .map((l) => {
      const f = fearById.get(l.id)!
      const head = voice === 'yo' ? `Temí ${f.mine} ${times(l.times)}` : `Temiste ${f.feared} ${times(l.times)}`
      if (l.no === l.times) return { ...l, text: `${head}; ${l.times === 1 ? 'no pasó' : 'no pasó ninguna'}.` }
      const parts = [
        l.no && `no pasó en ${l.no}`,
        l.poco && `pasó un poco en ${l.poco}`,
        l.si && `sí pasó en ${l.si}`,
      ].filter(Boolean) as string[]
      const said = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}` : parts[0]
      return { ...l, text: l.times === 1 ? `${head}; ${l.poco ? 'pasó un poco' : 'sí pasó'}.` : `${head}; ${said}.` }
    })
}
