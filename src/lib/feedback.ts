// Envío de opiniones y testimonios. La app no tiene servidor propio, así que el
// destino se configura con variables de entorno (ver .env.example):
//   VITE_FEEDBACK_ENDPOINT  URL que recibe un POST con JSON (Formspree, Google Apps Script, Supabase…)
// Sin destino configurado, la opinión se guarda en el dispositivo y se envía
// sola la próxima vez que haya uno configurado y conexión.

export type Feedback = {
  id: string
  createdAt: string
  helped: 'si' | 'un-poco' | 'no' | null
  useful: string[]
  missing: string
  story: string
  shareStory: boolean
  contact: string
}

const ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined
const QUEUE_KEY = 'sv:opiniones-pendientes'

function readQueue(): Feedback[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as Feedback[]
  } catch {
    return []
  }
}

function writeQueue(items: Feedback[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {
    // sin espacio: se pierde la cola, la app sigue funcionando
  }
}

async function post(item: Feedback): Promise<boolean> {
  if (!ENDPOINT) return false
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(item),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Intenta enviar las opiniones pendientes. Devuelve cuántas quedan. */
export async function flushFeedback(): Promise<number> {
  const pending = readQueue()
  const left: Feedback[] = []
  for (const item of pending) if (!(await post(item))) left.push(item)
  writeQueue(left)
  return left.length
}

/** Devuelve true si llegó al equipo, false si quedó guardada para enviarse después. */
export async function sendFeedback(item: Feedback): Promise<boolean> {
  if (await post(item)) return true
  writeQueue([...readQueue(), item])
  return false
}

export const feedbackConfigured = !!ENDPOINT
