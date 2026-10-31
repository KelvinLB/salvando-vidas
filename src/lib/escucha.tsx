import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Lo que suena en «Para escuchar» vive a nivel de la app, en un solo <audio>: así la reflexión
// sigue si la persona se va a otra pantalla, y solo puede sonar una a la vez.

export type Pista = {
  id: string
  title: string
  /** El tema (capítulo de /escuchar) donde vive, para poder regresar a ella. */
  serie: string
}

type Escucha = {
  pista: Pista | null
  sonando: boolean
  cargando: boolean
  /** Las que no se pudieron abrir: casi siempre es que no hay internet y aún no se habían guardado. */
  fallidas: string[]
  /** Si ya es la que suena, la pausa o la sigue; si es otra, empieza esa. Nunca suena sola. */
  tocar: (p: Pista) => void
  seguir: () => void
  pausar: () => void
  mover: (segundos: number) => void
  ir: (segundo: number) => void
  cerrar: () => void
  reintentar: (id: string) => void
}

type Tiempo = { t: number; d: number }

const EscuchaCtx = createContext<Escucha | null>(null)
// El tiempo cambia varias veces por segundo; va aparte para que solo se redibuje lo que lo muestra.
const TiempoCtx = createContext<Tiempo>({ t: 0, d: 0 })

export const urlDe = (id: string) => `/audio/escuchar/${id}.m4a`
export const volverA = (p: Pista) => `/escuchar?c=${encodeURIComponent(p.serie)}`

// En la ayuda y en el pánico, la voz se calla sola para no encimarse con lo urgente.
const CALLA_EN = ['/ayuda', '/panico']

export function EscuchaProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [pista, setPista] = useState<Pista | null>(null)
  const [sonando, setSonando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [fallidas, setFallidas] = useState<string[]>([])
  const [tiempo, setTiempo] = useState<Tiempo>({ t: 0, d: 0 })
  const { pathname } = useLocation()

  const cerrar = useCallback(() => {
    const a = audio.current
    if (a) {
      a.pause()
      a.removeAttribute('src')
      a.load()
    }
    setPista(null)
    setSonando(false)
    setCargando(false)
    setTiempo({ t: 0, d: 0 })
  }, [])

  const seguir = useCallback(() => {
    audio.current?.play().catch(() => setSonando(false))
  }, [])
  const pausar = useCallback(() => audio.current?.pause(), [])

  const tocar = useCallback(
    (p: Pista) => {
      const a = audio.current
      if (!a) return
      if (pista?.id === p.id) {
        if (a.paused) seguir()
        else a.pause()
        return
      }
      setPista(p)
      setTiempo({ t: 0, d: 0 })
      setCargando(true)
      a.src = urlDe(p.id)
      a.play().catch(() => setSonando(false))
    },
    [pista, seguir],
  )

  const mover = useCallback((s: number) => {
    const a = audio.current
    if (!a) return
    a.currentTime = Math.min(Math.max(a.currentTime + s, 0), a.duration || Infinity)
  }, [])
  const ir = useCallback((s: number) => {
    if (audio.current) audio.current.currentTime = s
  }, [])

  const reintentar = useCallback((id: string) => setFallidas((l) => l.filter((x) => x !== id)), [])

  useEffect(() => {
    if (CALLA_EN.some((r) => pathname.startsWith(r))) audio.current?.pause()
  }, [pathname])

  // El título se ve también en la pantalla bloqueada y en los controles del teléfono.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.metadata = pista ? new MediaMetadata({ title: pista.title, artist: 'Salvando Vidas', album: 'Para escuchar' }) : null
    const acciones: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', pista ? seguir : null],
      ['pause', pista ? pausar : null],
      ['stop', pista ? cerrar : null],
      ['seekbackward', pista ? () => mover(-15) : null],
      ['seekforward', pista ? () => mover(15) : null],
    ]
    for (const [accion, fn] of acciones) {
      try {
        ms.setActionHandler(accion, fn)
      } catch {
        // Algunos navegadores no conocen todas las acciones.
      }
    }
  }, [pista, seguir, pausar, cerrar, mover])

  const valor = useMemo<Escucha>(
    () => ({ pista, sonando, cargando, fallidas, tocar, seguir, pausar, mover, ir, cerrar, reintentar }),
    [pista, sonando, cargando, fallidas, tocar, seguir, pausar, mover, ir, cerrar, reintentar],
  )

  const medir = (a: HTMLAudioElement) => setTiempo({ t: a.currentTime, d: Number.isFinite(a.duration) ? a.duration : 0 })

  return (
    <EscuchaCtx.Provider value={valor}>
      <TiempoCtx.Provider value={tiempo}>
        {children}
        <audio
          ref={audio}
          preload="none"
          hidden
          onPlay={() => setSonando(true)}
          onPlaying={() => setCargando(false)}
          onWaiting={() => setCargando(true)}
          onPause={() => {
            setSonando(false)
            setCargando(false)
          }}
          onTimeUpdate={(e) => medir(e.currentTarget)}
          onLoadedMetadata={(e) => medir(e.currentTarget)}
          // Al terminar, se quita sola: no queda nada pendiente en la pantalla.
          onEnded={cerrar}
          onError={() => {
            if (!pista) return
            setFallidas((l) => (l.includes(pista.id) ? l : [...l, pista.id]))
            cerrar()
          }}
        />
      </TiempoCtx.Provider>
    </EscuchaCtx.Provider>
  )
}

export function useEscucha() {
  const ctx = useContext(EscuchaCtx)
  if (!ctx) throw new Error('useEscucha va dentro de EscuchaProvider')
  return ctx
}

export const useTiempo = () => useContext(TiempoCtx)

/** «1:05» */
export function minutos(s: number) {
  const n = Math.max(0, Math.floor(s))
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
}

/** El reproductor chico flota fuera de /escuchar, salvo donde estorbaría a la ayuda. */
export function useMiniVisible() {
  const { pista } = useEscucha()
  const { pathname, search } = useLocation()
  if (!pista || CALLA_EN.some((r) => pathname.startsWith(r))) return false
  // Dentro del tema donde está la reflexión ya se ve el reproductor completo.
  const enSuTema = pathname === '/escuchar' && new URLSearchParams(search).get('c') === pista.serie
  return !enSuTema
}
