import { type Thought, listThoughts, replaceThoughts } from './db'
import { PREFIX, today } from './storage'

// Copia de seguridad: todo lo de la app en un archivo que la persona guarda donde quiera, para
// cambiar de teléfono o no perderlo si se le borra. No pasa por ningún servidor. La clave del
// diario no viaja en la copia (ver lock.ts).

const SKIP = new Set([PREFIX + 'diario-clave'])

type SavedThought = Omit<Thought, 'audio' | 'photo'> & { audio?: string; photo?: string }

export type Backup = {
  app: 'salvando-vidas'
  version: 1
  createdAt: string
  /** Cada clave de localStorage (sin «sv:») con su texto tal cual. */
  local: Record<string, string>
  /** El diario, con audios y fotos dentro del archivo. */
  diary: SavedThought[]
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

function fromDataUrl(url: string) {
  const [head, data] = url.split(',')
  const type = /data:([^;,]+)/.exec(head)?.[1] ?? ''
  return new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type })
}

export async function makeBackup(): Promise<File> {
  const local: Record<string, string> = {}
  for (const k of Object.keys(localStorage)) {
    const value = localStorage.getItem(k)
    if (k.startsWith(PREFIX) && !SKIP.has(k) && value !== null) local[k.slice(PREFIX.length)] = value
  }
  const diary = await Promise.all(
    (await listThoughts()).map(async ({ audio, photo, ...t }) => ({
      ...t,
      audio: audio && (await toDataUrl(audio)),
      photo: photo && (await toDataUrl(photo)),
    })),
  )
  const backup: Backup = { app: 'salvando-vidas', version: 1, createdAt: new Date().toISOString(), local, diary }
  return new File([JSON.stringify(backup)], `salvando-vidas-${today()}.json`, { type: 'application/json' })
}

/** El archivo, si de verdad es una copia de esta app; si no, nada. */
export async function readBackup(file: File): Promise<Backup | null> {
  try {
    const data = JSON.parse(await file.text())
    const ok =
      data?.app === 'salvando-vidas' &&
      data.version === 1 &&
      data.local &&
      typeof data.local === 'object' &&
      Array.isArray(data.diary)
    return ok ? data : null
  } catch {
    return null
  }
}

/** Lo que trae una copia, para que la persona sepa qué va a recuperar antes de hacerlo. */
export function backupContents(b: Backup) {
  const parse = (key: string) => {
    try {
      return JSON.parse(b.local[key] ?? 'null')
    } catch {
      return null
    }
  }
  const plan = parse('plan') as Record<string, string[]> | null
  return {
    date: new Date(b.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }),
    entries: b.diary.length,
    photos: b.diary.filter((t) => t.photo).length,
    audios: b.diary.filter((t) => t.audio).length,
    plan: !!plan && Object.values(plan).some((list) => Array.isArray(list) && list.length > 0),
    reasons: (parse('razones') as unknown[] | null)?.length ?? 0,
    people: (parse('personas') as unknown[] | null)?.length ?? 0,
    pet: !!parse('mascota'),
  }
}

/** Reemplaza todo lo de este teléfono por lo de la copia. Después hay que recargar la app. */
export async function restoreBackup(b: Backup) {
  await replaceThoughts(
    b.diary.map(({ audio, photo, ...t }) => ({
      ...t,
      audio: audio ? fromDataUrl(audio) : undefined,
      photo: photo ? fromDataUrl(photo) : undefined,
    })),
  )
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k))
  Object.entries(b.local).forEach(([k, v]) => typeof v === 'string' && localStorage.setItem(PREFIX + k, v))
}

/** Baja un archivo al teléfono. */
export function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Si el teléfono puede mandar el archivo a otra app (Drive, Archivos, correo…). */
export const canShareFile = (file: File) => !!navigator.canShare?.({ files: [file] })
