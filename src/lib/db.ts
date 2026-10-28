// Lo del diario (texto, audio y fotos) se guarda en IndexedDB, en el dispositivo.
// localStorage no sirve para audio ni fotos: tiene un límite de unos 5 MB y solo guarda texto.

/** Lo que siento, algo que pasó o un recuerdo. Lo guardado antes del diario cuenta como «siento». */
export type EntryKind = 'siento' | 'paso' | 'recuerdo'

export type Thought = {
  id: string
  createdAt: string
  text: string
  feelings: string[]
  kind?: EntryKind
  audio?: Blob
  seconds?: number
  photo?: Blob
}

const DB_NAME = 'salvando-vidas'
const STORE = 'pensamientos'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).finally(() => db.close())
}

// «Tres cosas buenas de hoy» se guardaba aparte, en Mi espacio. Ahora cada una es un recuerdo
// del diario: se pasan la primera vez que se lee el diario y solo después se borran de allá.
async function moveGratitude() {
  const old: { id: string; date: string; text: string }[] = JSON.parse(localStorage.getItem('sv:diario') ?? '[]')
  for (const e of old) {
    const [y, m, d] = e.date.split('-').map(Number)
    await saveThought({
      id: `gracias-${e.id}`,
      createdAt: new Date(y, m - 1, d, 21).toISOString(),
      kind: 'recuerdo',
      text: `Tres cosas buenas de hoy:\n${e.text}`,
      feelings: [],
    })
  }
  localStorage.removeItem('sv:diario')
}
let moved: Promise<void> | undefined

export async function listThoughts(): Promise<Thought[]> {
  try {
    await (moved ??= moveGratitude().catch(() => {}))
    const all = await run<Thought[]>('readonly', (s) => s.getAll())
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return []
  }
}

export const saveThought = (t: Thought) => run('readwrite', (s) => s.put(t))
export const deleteThought = (id: string) => run('readwrite', (s) => s.delete(id))

/** Cambia todo el diario de una vez: al recuperar una copia, o vacío para empezar uno nuevo. */
export async function replaceThoughts(list: Thought[]) {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    list.forEach((t) => store.put(t))
    tx.oncomplete = () => resolve()
    tx.onerror = tx.onabort = () => reject(tx.error)
  }).finally(() => db.close())
}

export function deleteDatabase() {
  try {
    indexedDB.deleteDatabase(DB_NAME)
  } catch {
    // nada que borrar
  }
}
