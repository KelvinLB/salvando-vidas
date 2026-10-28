import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteDatabase } from './db'

// Todo se guarda solo en este dispositivo. No hay servidor ni cuentas:
// la privacidad de quien usa la app es lo primero.

export const PREFIX = 'sv:'

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): la app sigue funcionando.
  }
}

// Avisa a otros componentes que usan la misma clave (por ejemplo, el ánimo de
// Inicio y la cara de la mascota) para que se enteren sin recargar.
const CHANGED = 'sv:changed'

/** Guarda fuera de un componente y avisa, igual que lo hace useStored al cambiar algo. */
export function store<T>(key: string, value: T) {
  write(key, value)
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: key }))
}

/** Escucha cualquier cambio guardado; devuelve cómo dejar de escuchar. */
export function onStoredChange(listener: (key: string) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<string>).detail)
  window.addEventListener(CHANGED, handle)
  return () => window.removeEventListener(CHANGED, handle)
}

export function useStored<T>(key: string, fallback: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    read(key, typeof fallback === 'function' ? (fallback as () => T)() : fallback),
  )
  // El valor vigente, para calcular cambios encadenados sin esperar al siguiente render.
  const current = useRef(value)

  useEffect(() => {
    const sync = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== key) return
      const next = read(key, current.current)
      if (JSON.stringify(next) === JSON.stringify(current.current)) return
      current.current = next
      setValue(next)
    }
    window.addEventListener(CHANGED, sync)
    return () => window.removeEventListener(CHANGED, sync)
  }, [key])

  // Solo se escribe cuando la persona cambia algo, nunca al montar: así un
  // componente recién montado no pisa lo que otro acaba de guardar.
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(current.current) : next
      current.current = value
      setValue(value)
      write(key, value)
      window.dispatchEvent(new CustomEvent(CHANGED, { detail: key }))
    },
    [key],
  )
  return [value, update] as const
}

export function clearAll() {
  deleteDatabase()
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // nada que borrar
  }
}

export type MoodEntry = { date: string; mood: number }
export type JournalEntry = { id: string; date: string; text: string }
/** La carta para un día difícil, escrita en uno bueno. */
export type Letter = { text: string; date: string }
export type Medication = { id: string; name: string; dose: string; when: string }

/** Cómo prefiere la persona que le hablemos. */
export type Address = 'ambos' | 'femenino' | 'masculino'

export function useAddress() {
  const [address] = useStored<Address>('trato', 'ambos')
  return (fem: string, masc: string, both: string) =>
    address === 'femenino' ? fem : address === 'masculino' ? masc : both
}

/** Fecha local AAAA-MM-DD (no UTC: el día cambia a medianoche de quien usa la app). */
export function localDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const today = () => localDate()
export const newId = () => Math.random().toString(36).slice(2, 10)

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

/** Vibración corta (o un patrón) si el dispositivo la soporta. */
export function buzz(ms: number | number[] = 12) {
  navigator.vibrate?.(ms)
}
