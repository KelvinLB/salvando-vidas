import { guessCountry } from '../data/helplines'
import { useStored } from './storage'

// Mis personas: hasta tres personas de confianza a las que se les puede llamar o escribir
// con un toque desde «Necesito ayuda». Antes era una sola («contact»); migrate.ts la pasa aquí.

export type Person = { id: string; name: string; phone: string }

export const MAX_PEOPLE = 3

/** Mensajes ya escritos: en un mal momento cuesta encontrar las palabras. */
export const HELP_MESSAGES = [
  'No me siento bien, ¿me puedes llamar?',
  'Necesito hablar con alguien. ¿Tienes un momento?',
  '¿Puedes venir conmigo un rato? No quiero estar a solas.',
]

export function usePeople() {
  const [people, setPeople] = useStored<Person[]>('personas', [])
  const [saved, setMessage] = useStored('mensaje-ayuda', HELP_MESSAGES[0])
  const [country] = useStored('country', guessCountry)
  // Solo cuentan las que tienen a dónde llamar.
  const reachable = people.filter((p) => digits(p.phone).length >= 7)
  const message = saved.trim() || HELP_MESSAGES[0]
  return { people, setPeople, reachable, message, saved, setMessage, country }
}

const digits = (phone: string) => phone.replace(/\D/g, '')

export const telOf = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

// Código de cada país de la lista de líneas de ayuda, para WhatsApp.
const CALLING_CODES: Record<string, string> = {
  MX: '52', US: '1', PR: '1', ES: '34', AR: '54', CO: '57', CL: '56', PE: '51', EC: '593',
  UY: '598', PY: '595', PA: '507', CR: '506', SV: '503', DO: '1', VE: '58',
}

/**
 * WhatsApp necesita el número con código de país. Casi nadie lo escribe así, así que a un
 * número local (10 dígitos o menos, sin +) se le pone el del país elegido en Ajustes.
 */
export function whatsappOf(phone: string, country: string, text: string) {
  const raw = phone.trim()
  let number = digits(raw)
  if (raw.startsWith('00')) number = number.slice(2)
  else if (!raw.startsWith('+') && number.length <= 10 && CALLING_CODES[country]) {
    number = CALLING_CODES[country] + number.replace(/^0+/, '')
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

/** El primer nombre, para botones cortos: «Llamar a Ana». */
export const firstName = (p: Person) => p.name.trim().split(/\s+/)[0] || 'mi persona de confianza'
