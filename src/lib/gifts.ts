import { daysSince } from './companion'
import { type Thought, listThoughts } from './db'
import { type JournalEntry, type MoodEntry, localDate, pick, read, store, today, useStored } from './storage'

// De vez en cuando la mascota trae un regalo: una de las razones para seguir de la persona,
// o un recuerdo de su diario. Uno cada dos días como mucho (al día siguiente si el día pesa).
// Si no lo abre, no pasa nada: no se acumula ni se le reclama. Con clave en el diario, solo
// trae razones, porque sus recuerdos están bajo llave.

export type Gift = { date: string; kind: 'razon' | 'recuerdo'; ref: string; opened?: boolean; thanked?: boolean }

const KEY = 'regalo'
const EVERY_DAYS = 2
/** Un recuerdo se regala cuando ya tiene unos días: «¿te acuerdas?». */
const MEMORY_AGE_DAYS = 3

const locked = () => read<unknown>('diario-clave', null) !== null

const oldMemories = async () =>
  locked()
    ? []
    : (await listThoughts()).filter(
        (t) => t.kind === 'recuerdo' && (t.text.trim() || t.photo) && daysSince(localDate(new Date(t.createdAt))) >= MEMORY_AGE_DAYS,
      )

/** Al abrir la app decide si hoy hay regalo. */
export async function prepareGift() {
  if (read<unknown>('mascota', null) === null) return
  const last = read<Gift | null>(KEY, null)
  const day = today()
  if (last?.date === day) return
  const low = (read<MoodEntry[]>('moods', []).find((m) => m.date === day)?.mood ?? 3) <= 2
  if (last && daysSince(last.date) < (low ? 1 : EVERY_DAYS)) return

  const reasons = read<JournalEntry[]>('razones', []).filter((r) => r.text.trim())
  const options: Pick<Gift, 'kind' | 'ref'>[] = [
    ...reasons.map((r) => ({ kind: 'razon' as const, ref: r.id })),
    ...(await oldMemories()).map((t) => ({ kind: 'recuerdo' as const, ref: t.id })),
  ]
  // Que no repita el último, si hay de dónde escoger.
  const fresh = options.filter((o) => o.ref !== last?.ref)
  // Mientras se buscaban los recuerdos, otra revisión pudo haberlo preparado ya.
  if (!options.length || read<Gift | null>(KEY, null)?.date === day) return
  store<Gift>(KEY, { date: day, ...pick(fresh.length ? fresh : options) })
}

export type GiftContent =
  | { kind: 'razon'; reason: JournalEntry }
  | { kind: 'recuerdo'; memory: Thought }

/** Lo que trae dentro el regalo de hoy, si sigue existiendo (y si no quedó bajo llave). */
export async function giftContent(gift: Gift): Promise<GiftContent | null> {
  if (gift.kind === 'razon') {
    const reason = read<JournalEntry[]>('razones', []).find((r) => r.id === gift.ref)
    return reason ? { kind: 'razon', reason } : null
  }
  if (locked()) return null
  const memory = (await listThoughts()).find((t) => t.id === gift.ref)
  return memory ? { kind: 'recuerdo', memory } : null
}

export function useGift() {
  const [stored, setStored] = useStored<Gift | null>(KEY, null)
  const gift = stored?.date === today() ? stored : null
  return {
    gift,
    /** Hay algo que abrir hoy. */
    waiting: !!gift && !gift.opened,
    open: () => gift && setStored({ ...gift, opened: true }),
    thank: () => gift && setStored({ ...gift, opened: true, thanked: true }),
  }
}
