import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Plus, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pop } from '../../lib/audio'
import { buzz, useStored } from '../../lib/storage'
import './burbujas.css'

type Burbuja = {
  id: number
  /** Posición como fracción del espacio libre, para que se acomode si cambia el tamaño. */
  x: number
  y: number
  /** Diámetro en píxeles. */
  d: number
  reventando?: boolean
}
type Huella = { id: number; x: number; y: number }

const SEPARACION = 10
let siguiente = 1

/** Cuántas caben sin amontonarse: pocas en el teléfono, unas más en la computadora. */
const cuantas = (w: number, h: number) => Math.max(5, Math.min(14, Math.round((w * h) / 26000)))

/** Acomoda burbujas nuevas donde no choquen con las que ya están. */
function acomodar(w: number, h: number, ya: Burbuja[], meta: number): Burbuja[] {
  const todas = [...ya]
  const maxD = Math.min(150, w * 0.4, h * 0.3)
  const minD = Math.min(44, maxD)
  let intentos = 0
  while (todas.length < meta && intentos < 600) {
    intentos++
    const d = Math.round(minD + Math.random() * (maxD - minD))
    const x = Math.random()
    const y = Math.random()
    const cx = x * (w - d) + d / 2
    const cy = y * (h - d) + d / 2
    const choca = todas.some((b) => {
      const bx = b.x * (w - b.d) + b.d / 2
      const by = b.y * (h - b.d) + b.d / 2
      return Math.hypot(cx - bx, cy - by) < (d + b.d) / 2 + SEPARACION
    })
    if (!choca) todas.push({ id: siguiente++, x, y, d })
  }
  return todas
}

const tamano = (d: number) => (d >= 120 ? 'grande' : d >= 80 ? 'mediana' : d >= 56 ? 'chica' : 'pequeñita')

export default function Burbujas() {
  const [sound, setSound] = useStored('burbujas-sonido', true)
  const [burbujas, setBurbujas] = useState<Burbuja[]>([])
  const [huellas, setHuellas] = useState<Huella[]>([])
  const [campo, setCampo] = useState<{ w: number; h: number } | null>(null)
  const campoRef = useRef<HTMLDivElement>(null)
  const masRef = useRef<HTMLButtonElement>(null)
  // El id de React lleva «:», que no sirve dentro de url(#…).
  const gradiente = 'pompa' + useId().replace(/[^a-zA-Z0-9]/g, '')

  // En el teléfono la escena pasa por detrás de las dos barras que flotan: se oscurecen mientras
  // esta pantalla está abierta, y vuelven a ser como siempre al salir.
  useEffect(() => {
    const raiz = document.documentElement
    raiz.dataset.burbujas = ''
    return () => {
      delete raiz.dataset.burbujas
    }
  }, [])

  useEffect(() => {
    const el = campoRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setCampo({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // La primera tanda sale en cuanto se sabe cuánto espacio hay.
  const listo = !!campo
  useEffect(() => {
    if (!listo || !campoRef.current) return
    const { clientWidth: w, clientHeight: h } = campoRef.current
    setBurbujas(acomodar(w, h, [], cuantas(w, h)))
  }, [listo])

  const mas = () => {
    if (!campo) return
    const { w, h } = campo
    setBurbujas((ya) => {
      const enteras = ya.filter((b) => !b.reventando)
      const meta = cuantas(w, h)
      // Si ya está lleno, se intenta hacer lugar para unas cuantas más.
      return acomodar(w, h, enteras, enteras.length >= meta ? enteras.length + 3 : meta)
    })
  }

  const reventar = useCallback(
    (b: Burbuja, boton: HTMLButtonElement) => {
      if (b.reventando || !campo) return
      const conFoco = document.activeElement === boton
      setBurbujas((ya) => ya.map((o) => (o.id === b.id ? { ...o, reventando: true } : o)))
      if (sound) pop()
      buzz(15)
      const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!quieto) {
        const huella = { id: b.id, x: b.x * (campo.w - b.d) + b.d / 2, y: b.y * (campo.h - b.d) + b.d / 2 }
        setHuellas((hs) => [...hs, huella])
        setTimeout(() => setHuellas((hs) => hs.filter((h) => h.id !== huella.id)), 700)
      }
      setTimeout(
        () => {
          setBurbujas((ya) => ya.filter((o) => o.id !== b.id))
          // Con el teclado, el foco pasa a la siguiente burbuja en vez de perderse.
          if (conFoco) {
            const otra = campoRef.current?.querySelector<HTMLButtonElement>('.burbuja:not(.reventando)')
            ;(otra ?? masRef.current)?.focus()
          }
        },
        quieto ? 0 : 240,
      )
    },
    [campo, sound],
  )

  return (
    <section className="burbujas-escena" aria-labelledby="burbujas-titulo">
      <header className="burbujas-arriba vidrio">
        <h1 id="burbujas-titulo">Burbujas</h1>
        <Link to="/distraer" className="burbujas-terminar">
          Terminar
        </Link>
      </header>

      <p className="burbujas-frase">Toca una burbuja. No hay prisa.</p>

      <svg width="0" height="0" className="burbujas-defs" aria-hidden="true">
        <defs>
          <radialGradient id={gradiente} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="0.45" stopColor="#9fd8e8" stopOpacity="0.1" />
            <stop offset="0.85" stopColor="#b9a7f0" stopOpacity="0.16" />
            <stop offset="1" stopColor="#9ff0dd" stopOpacity="0.45" />
          </radialGradient>
        </defs>
      </svg>

      <div className="burbujas-campo" ref={campoRef}>
        {campo &&
          burbujas.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`burbuja${b.reventando ? ' reventando' : ''}`}
              style={{
                left: b.x * (campo.w - b.d),
                top: b.y * (campo.h - b.d),
                width: b.d,
                height: b.d,
              }}
              aria-label={`Reventar burbuja ${tamano(b.d)}`}
              onClick={(e) => reventar(b, e.currentTarget)}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill={`url(#${gradiente})`}
                  stroke="rgb(200 240 255 / 0.5)"
                  strokeWidth={Math.min(2, 120 / b.d)}
                />
                <path
                  d="M24 34 Q30 20 44 16"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={Math.min(5, 450 / b.d)}
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </button>
          ))}
        {huellas.map((h) => (
          <svg
            key={h.id}
            className="burbuja-huella"
            viewBox="0 0 60 60"
            width="60"
            height="60"
            style={{ left: h.x - 30, top: h.y - 30 }}
            aria-hidden="true"
          >
            <path d="M30 14v6M30 40v6M14 30h6M40 30h6M19 19l4 4M37 37l4 4M41 19l-4 4M19 41l4-4" />
          </svg>
        ))}
        <p className="burbujas-listo" aria-live="polite">
          {campo && burbujas.length === 0 ? 'Ya no quedan. Si quieres, hay más.' : ''}
        </p>
      </div>

      <div className="burbujas-opciones vidrio" role="group" aria-label="Opciones del juego">
        <button type="button" className="burbujas-pildora" ref={masRef} onClick={mas}>
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Más burbujas
        </button>
        <span className="burbujas-raya" aria-hidden="true" />
        <Link to="/distraer/manos" className="burbujas-pildora">
          Otro juego
        </Link>
        <span className="burbujas-raya" aria-hidden="true" />
        <button
          type="button"
          className="burbujas-pildora burbujas-sonido"
          aria-pressed={sound}
          aria-label="Sonido"
          onClick={() => setSound(!sound)}
        >
          {sound ? (
            <Volume2 size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <VolumeX size={18} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>
    </section>
  )
}
