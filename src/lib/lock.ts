import { useEffect, useReducer } from 'react'
import { newId, useStored } from './storage'

// La clave del diario: cuatro números que se piden al abrirlo. No cifra lo guardado; es un
// cerrojo para que quien tome el teléfono no lo lea. Por eso se guarda una huella de la clave
// y nunca la clave tal cual. Una copia de seguridad no la lleva: si alguien la olvida, su copia
// le devuelve el diario sin ella.

export type DiaryKey = { salt: string; hash: string; hint?: string }

export const PIN_LENGTH = 4

/** Si la persona sale de la app (o del diario) más de este tiempo, se vuelve a pedir la clave. */
export const LOCK_AFTER = 60_000

// cyrb53, de bryc (dominio público). Con cuatro números ninguna huella es difícil de adivinar
// para quien sepa programar; basta con que no se lea a simple vista.
function cyrb53(text: string) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const fingerprint = (pin: string, salt: string) => cyrb53(`${salt}:${pin}`)

export function makeKey(pin: string, hint: string): DiaryKey {
  const salt = newId() + newId()
  return { salt, hash: fingerprint(pin, salt), hint: hint.trim() || undefined }
}

// Abierto con la clave: dura mientras la persona siga en el diario. Al salir de él quedan
// LOCK_AFTER para volver sin clave (por ejemplo, ir a «Ayuda» y regresar).
let unlocked = false
let expires = 0
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((l) => l())

const isOpen = () => unlocked && (!expires || Date.now() < expires)

export function lockDiary() {
  unlocked = false
  expires = 0
  changed()
}

let hiddenAt = 0
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now()
  else if (unlocked && hiddenAt && Date.now() - hiddenAt > LOCK_AFTER) lockDiary()
})

/**
 * La clave y si el diario está abierto. `stay` va en las pantallas que muestran lo del diario:
 * mientras sigan en pantalla no se cierra; al irse, empiezan a correr los LOCK_AFTER.
 */
export function useDiaryLock(stay = false) {
  const [key, setKey] = useStored<DiaryKey | null>('diario-clave', null)
  const [, render] = useReducer((n: number) => n + 1, 0)
  const open = isOpen()

  useEffect(() => {
    listeners.add(render)
    return () => void listeners.delete(render)
  }, [])

  useEffect(() => {
    if (!stay || !open) return
    expires = 0
    return () => {
      if (unlocked) expires = Date.now() + LOCK_AFTER
    }
  }, [stay, open])

  const matches = (pin: string) => !!key && fingerprint(pin, key.salt) === key.hash

  const unlock = (pin: string) => {
    if (!matches(pin)) return false
    unlocked = true
    expires = stay ? 0 : Date.now() + LOCK_AFTER
    changed()
    return true
  }

  return { key, setKey, locked: !!key && !open, unlock, matches }
}
