import { useLocation, useNavigate } from 'react-router-dom'

// Las seis secciones de la barra de abajo y las pantallas que cuelgan de cada una.
// `also` mantiene encendida la pestaña (por ejemplo, el cuerpo vive en Calma) y sirve
// de salida cuando alguien llega directo a una pantalla, sin nada atrás.
export const SECTIONS = [
  { to: '/', label: 'Inicio', also: [] },
  { to: '/calma', label: 'Calma', also: ['/cuerpo', '/panico', '/enojo', '/noche', '/nervios'] },
  { to: '/explorar', label: 'Explorar', also: [] },
  { to: '/distraer', label: 'Distraer', also: ['/juegos', '/musica', '/videos'] },
  { to: '/diario', label: 'Mi diario', also: ['/responder'] },
  { to: '/mi-espacio', label: 'Mi espacio', also: ['/mi-espacio/', '/mi-dia', '/especialista', '/mascota', '/redes', '/opinion'] },
] as const

/** Cómo se nombra cada pantalla en «Volver a…». */
const NAMES: Record<string, string> = {
  '/': 'Inicio',
  '/calma': 'Calma',
  '/distraer': 'Distraer',
  '/diario': 'Mi diario',
  '/mi-espacio': 'Mi espacio',
  '/mi-espacio/plan': 'tu plan',
  '/mi-espacio/caja': 'tu caja de esperanza',
  '/mi-espacio/personas': 'tus personas',
  '/mi-espacio/medicamentos': 'tus medicamentos',
  '/mi-espacio/como-voy': 'cómo vas',
  '/mi-espacio/ajustes': 'ajustes',
  '/cuerpo': 'tu cuerpo',
  '/explorar': 'Explorar',
  '/panico': 'pánico',
  '/enojo': 'enojo',
  '/noche': 'la noche',
  '/nervios': 'tus nervios',
  '/nervios/practicar': 'practicar con el cuerpo',
  '/musica': 'música',
  '/videos': 'videos',
  '/juegos/memorama': 'el memorama',
  '/juegos/deslizante': 'el rompecabezas',
  '/juegos/burbujas': 'burbujas',
  '/juegos/pizarra': 'la pizarra',
  '/juegos/hueco': 'salir del hueco',
  '/juegos/hilos': 'hilos sueltos',
  '/juegos/desde-afuera': 'desde afuera',
  '/responder': 'responderle',
  '/mascota': 'tu mascota',
  '/mi-dia': 'Mi día',
  '/especialista': 'el especialista',
  '/ayuda': 'la ayuda',
  '/opinion': 'tu opinión',
  '/redes': 'lo que se dice',
}

export const sectionOf = (pathname: string) =>
  SECTIONS.find((s) => s.to === pathname) ??
  SECTIONS.find((s) => s.also.some((p) => pathname.startsWith(p)))

const isRoot = (pathname: string) => SECTIONS.some((s) => s.to === pathname)

// Cada entrada del historial guarda qué pantalla era, por su número de entrada. Así
// «Volver» sabe si lo de atrás es de la app (y regresa ahí, como el botón del teléfono)
// o si la persona llegó directo (y entonces va a la sección de esa pantalla).
const KEY = 'sv:recorrido'
let trail: Record<number, string> = {}
try {
  trail = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
} catch {
  // Sin sessionStorage, el recorrido vive solo mientras la pestaña esté abierta.
}

const entry = (): number | undefined => {
  const idx = window.history.state?.idx
  return typeof idx === 'number' ? idx : undefined
}

/** Se llama en cada cambio de pantalla, desde el marco de la app. */
export function rememberStep(path: string) {
  const idx = entry()
  if (idx === undefined || trail[idx] === path) return
  trail[idx] = path
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trail))
  } catch {
    // Igual queda en memoria.
  }
}

const nameOf = (path: string) => NAMES[path.split('?')[0]]

/** A dónde lleva «Volver» desde aquí, o nada si es una de las secciones. */
export function useBack() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const idx = entry()
  const previous = idx ? trail[idx - 1] : undefined
  // Dentro de una misma pantalla (por ejemplo, editar la mascota) también se vuelve.
  if (isRoot(pathname) && !(previous && search)) return null

  if (previous && previous !== pathname + search) {
    return { label: nameOf(previous), go: () => navigate(-1) }
  }
  const parent = sectionOf(pathname)?.to ?? '/'
  return { label: nameOf(parent), go: () => navigate(parent) }
}
