import { SENSE_CARDS, type PathId, type SenseCard, type WordId } from '../data/sentido'
import { newId, read, store, today, useStored } from './storage'

// Lo que se guarda de «Lo que no sale». Todo en el teléfono; nada se cuenta en rachas.
// Lo usan su pantalla (/lo-que-no-sale), el diario, la lotería del barrio y el resumen
// para la consulta (solo si la persona lo enciende).

export const WORDS_KEY = 'no-sale-palabras'
export const JAR_KEY = 'no-sale-frasco'
export const CARDS_KEY = 'no-sale-cartas'
export const SONGS_KEY = 'no-sale-canciones'
export const COMPASS_KEY = 'no-sale-brujula'
export const WINDOW_KEY = 'no-sale-ventana'
/** Si sus palabras, sus cartas y su brújula van al resumen para la consulta. */
export const INCLUDE_KEY = 'consulta-incluir-sentido'

/** Las palabras que eligió, una entrada por día (la de hoy se reemplaza). */
export type WordsEntry = { date: string; words: WordId[] }
/** Un momento guardado en el frasco. */
export type Moment = { id: string; date: string; text: string }
/** La respuesta a la carta de un día. `pass`: eligió dejarla para otro día. */
export type CardAnswer = { date: string; path: PathId; question: string; answer: string; pass: boolean }
export type Song = { id: string; title: string; url?: string }
export type CompassLevel = 'mucho' | 'algo' | 'ahorita-no'
/** Lo que importa (con los rumbos del barrio) y la acción mínima de hoy. */
export type Compass = { levels: Partial<Record<string, CompassLevel>>; action?: { date: string; text: string; done?: boolean } }
/** Lo limpio de la ventana empañada, en coordenadas de 0 a 1; se borra al cambiar de día. */
export type WindowWipes = { date: string; points: [number, number, number][] }

/** Se guardan los últimos 60 de cada cosa: suficiente para la consulta, sin crecer sin fin. */
const KEEP = 60

export const useWords = () => useStored<WordsEntry[]>(WORDS_KEY, [])
export const useJar = () => useStored<Moment[]>(JAR_KEY, [])
export const useCardAnswers = () => useStored<CardAnswer[]>(CARDS_KEY, [])
export const useSongs = () => useStored<Song[]>(SONGS_KEY, [])
export const useCompass = () => useStored<Compass>(COMPASS_KEY, { levels: {} })

export function saveWords(words: WordId[]) {
  const date = today()
  const rest = read<WordsEntry[]>(WORDS_KEY, []).filter((e) => e.date !== date)
  store(WORDS_KEY, words.length ? [...rest, { date, words }].slice(-KEEP) : rest)
}

export function addMoment(text: string) {
  const moment: Moment = { id: newId(), date: today(), text: text.trim() }
  store(JAR_KEY, [...read<Moment[]>(JAR_KEY, []), moment].slice(-KEEP))
  return moment
}

/** La carta del día: rota entre los tres caminos y sus preguntas, igual para todo el día. */
export function cardOfDay(date = today()): { card: SenseCard; question: SenseCard['questions'][number] } {
  const n = Math.floor(new Date(`${date}T12:00:00`).getTime() / 86_400_000)
  const card = SENSE_CARDS[n % SENSE_CARDS.length]
  const question = card.questions[Math.floor(n / SENSE_CARDS.length) % card.questions.length]
  return { card, question }
}

export function answerCard(path: PathId, question: string, answer: string, pass: boolean) {
  const date = today()
  const rest = read<CardAnswer[]>(CARDS_KEY, []).filter((a) => a.date !== date)
  store(CARDS_KEY, [...rest, { date, path, question, answer, pass }].slice(-KEEP))
}

/** Los caminos que ya contestó alguna vez (sin «hoy no»): cada uno deja su carta en la lotería. */
export function pathsAnswered(answers = read<CardAnswer[]>(CARDS_KEY, [])): PathId[] {
  return [...new Set(answers.filter((a) => !a.pass).map((a) => a.path))]
}

/** Tope de lo limpio que se guarda en un día: de sobra para dejar la ventana entera sin vaho. */
const MAX_WIPES = 2400

/** Lo limpio de la ventana de hoy; si lo guardado es de otro día, amanece empañada otra vez. */
export function readWindow(date = today()): WindowWipes['points'] {
  const saved = read<WindowWipes | null>(WINDOW_KEY, null)
  return saved?.date === date ? saved.points : []
}

export function saveWindow(points: WindowWipes['points']) {
  store<WindowWipes>(WINDOW_KEY, { date: today(), points: points.slice(-MAX_WIPES) })
}
