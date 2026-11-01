import { useSyncExternalStore } from 'react'
import { read, write } from './storage'

// Instalar la app: en Chrome, Edge y Samsung Internet el navegador avisa que se puede instalar y
// basta un toque nuestro para abrir su ventana de «Instalar». En iPhone y en otros navegadores no
// hay ese aviso, así que se explica paso a paso. Nada sale del teléfono: solo se recuerda aquí.

type AvisoInstalar = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type Donde =
  | 'instalada' // ya se abrió como app
  | 'listo' // el navegador deja instalar con un toque
  | 'iphone' // Safari u otro navegador de iPhone o iPad: desde «Compartir»
  | 'dentro-de-app' // el navegador de Facebook, Instagram, TikTok…: hay que abrirla afuera
  | 'android' // Android sin el aviso todavía (o Firefox): desde el menú
  | 'mac-safari' // Safari en Mac: Archivo › Agregar al Dock
  | 'computadora' // otra computadora: desde la barra de direcciones o el menú

let aviso: AvisoInstalar | null = null
let recienInstalada = false
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((o) => o())

const comoApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: window-controls-overlay)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Se llama una vez, antes de dibujar, para no perder el aviso del navegador. */
export function escucharInstalar() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Sin la barrita automática del navegador: la invitación la damos nosotros, en calma.
    e.preventDefault()
    aviso = e as AvisoInstalar
    // Si el navegador vuelve a ofrecerla, es que ya no está instalada.
    write('app-instalada', false)
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    aviso = null
    recienInstalada = true
    // Se recuerda para no volver a invitar desde la pestaña del navegador.
    write('app-instalada', true)
    avisar()
  })
}

export function donde(): Donde {
  if (comoApp() || recienInstalada || read('app-instalada', false)) return 'instalada'
  if (aviso) return 'listo'
  const ua = navigator.userAgent
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Snapchat|Twitter|LinkedInApp|GSA\//i.test(ua)) {
    return 'dentro-de-app'
  }
  const iPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/i.test(ua) || iPad) return 'iphone'
  if (/Android/i.test(ua)) return 'android'
  if (/Macintosh/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua)) return 'mac-safari'
  return 'computadora'
}

export const recienInstalo = () => recienInstalada

/** Abierta como app (desde su ícono), no en una pestaña del navegador. */
export const abiertaComoApp = comoApp

/** Abre la ventana de «Instalar» del navegador. Devuelve si la persona dijo que sí. */
export async function instalar() {
  if (!aviso) return false
  const a = aviso
  await a.prompt()
  const { outcome } = await a.userChoice
  // Cada aviso sirve una sola vez; si dice que no, el navegador manda otro más adelante.
  aviso = null
  avisar()
  return outcome === 'accepted'
}

const suscribir = (o: () => void) => {
  oyentes.add(o)
  const mq = window.matchMedia('(display-mode: standalone)')
  mq.addEventListener('change', o)
  return () => {
    oyentes.delete(o)
    mq.removeEventListener('change', o)
  }
}

export function useDonde() {
  return useSyncExternalStore(suscribir, donde, () => 'computadora' as Donde)
}

/** En Android, abre esta misma página en Chrome desde el navegador de Facebook o Instagram. */
export function enChrome() {
  const { host, pathname, search } = window.location
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`
}
