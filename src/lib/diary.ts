import { useEffect, useState } from 'react'
import type { EntryKind, Thought } from './db'
import { daysSince } from './companion'
import { localDate } from './storage'

// Mi diario: cada día con algo guardado es una página.

export const kindOf = (t: Thought): EntryKind => t.kind ?? 'siento'

export const dayOf = (t: Thought) => localDate(new Date(t.createdAt))

/** La hora de ahora puesta en el día de la página, para escribir en un día que ya pasó. */
export function stampOn(day: string) {
  const now = new Date()
  if (day === localDate(now)) return now.toISOString()
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes()).toISOString()
}

const noon = (day: string) => new Date(day + 'T12:00')
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function dayTitle(day: string) {
  const d = noon(day)
  return {
    weekday: capital(d.toLocaleDateString('es', { weekday: 'long' })),
    date: d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }),
    short: d.toLocaleDateString('es', { weekday: 'short' }).replace('.', ''),
    month: d.toLocaleDateString('es', { month: 'short' }).replace('.', ''),
    number: d.getDate(),
  }
}

export function howLongAgo(day: string) {
  const n = daysSince(day)
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Ayer'
  if (n < 30) return `Hace ${n} días`
  return ''
}

export const timeOf = (t: Thought) =>
  new Date(t.createdAt).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' })

/**
 * Las fotos del teléfono pesan varios MB: se achican a 1280 px antes de guardarlas.
 * Si el navegador no puede leer el formato, se guarda tal cual.
 */
export async function shrinkPhoto(file: File, max = 1280): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Lo transparente (capturas, stickers) quedaría negro en JPEG: se pone sobre blanco.
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    }
    bitmap.close()
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.82))
  } catch {
    return file
  }
}

/** Un enlace temporal para mostrar un audio o una foto guardados; se libera al dejar de usarse. */
export function useBlobUrl(blob?: Blob) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}
