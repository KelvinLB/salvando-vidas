import type { EntryKind } from '../lib/db'

// Las cosas que se pueden guardar en el diario. Las frases para empezar son para
// quien se queda en blanco: tocar una es más fácil que encontrar la primera palabra.
// Las que terminan en «:» abren una lista para llenar.

export type Kind = {
  id: EntryKind
  emoji: string
  label: string
  hint: string
  placeholder: string
  starters: string[]
}

export const KINDS: Kind[] = [
  {
    id: 'siento',
    emoji: '💭',
    label: 'Lo que siento',
    hint: 'Sin filtro, como te salga',
    placeholder: 'Lo que pasa por tu cabeza, sin filtro. No tiene que tener sentido.',
    starters: ['Ahorita siento…', 'Me preocupa…', 'Quisiera…', 'No sé por qué, pero…'],
  },
  {
    id: 'paso',
    emoji: '📌',
    label: 'Algo que pasó',
    hint: 'Para entenderlo después',
    placeholder: '¿Qué pasó? ¿Dónde estabas y con quién? ¿Qué pensaste y qué hiciste?',
    starters: ['Pasó que…', 'Pensé que…', 'Me sentí…', 'Lo que hice fue…'],
  },
  {
    id: 'recuerdo',
    emoji: '🌼',
    label: 'Un recuerdo',
    hint: 'Algo que no quieres olvidar',
    placeholder: 'Una persona, un lugar, un momento que te hizo bien.',
    starters: ['Tres cosas buenas de hoy:', 'Me acuerdo de…', 'Me hizo sonreír…', 'Quiero no olvidar…', 'Hoy agradezco…'],
  },
  // «Lo que no se manda»: una carta que nunca se envía, para lo que no sale en voz alta.
  // Sin reloj y con «Ya fue suficiente» siempre a la vista; al final, si sale, «algo que
  // entiendo ahora», para cerrar con algo que se entiende y no quedarse dando vueltas.
  // Fuente: escritura expresiva (Pennebaker y Smyth, «Opening Up by Writing It Down», 2016;
  // metaanálisis de Frattaroli, 2006: ayuda poco, pero ayuda). Pendiente de revisión con psicóloga.
  {
    id: 'carta',
    emoji: '✉️',
    label: 'Lo que no se manda',
    hint: 'Una carta que no se envía',
    placeholder: 'Escribe como si le hablaras. No se envía: se queda aquí, solo para ti.',
    starters: ['Lo que no te he dicho es…', 'Me dolió…', 'Quisiera que supieras…', 'Desde entonces…', 'No sé cómo decirte…'],
  },
]

export const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<EntryKind, Kind>
