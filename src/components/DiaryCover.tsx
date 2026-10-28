import { useRef, useState } from 'react'
import { useAnimate } from 'motion/react'
import { Link } from 'react-router-dom'
import CompanionView from './Companion'
import PinPad from './PinPad'
import { audioContext, lockClick } from '../lib/audio'
import { useCompanion } from '../lib/companion'
import { dayTitle } from '../lib/diary'
import { still } from '../lib/petfx'
import { buzz, today } from '../lib/storage'

// El diario cerrado, con su correa y su candado. Se toca la llave (o el libro): la llave
// vuela al candado, entra, gira, el candado se abre y cae, y la tapa se abre desde el lomo.
// Es un ritual corto; un segundo toque lo salta y abre de una vez. Si la persona le puso clave,
// primero se pide la clave y el ritual es lo que sigue al acertar.

/** Dónde está la punta de la llave, como fracción del ancho del dibujo. */
const TIP = 10 / 120
const EASE = [0.6, 0, 0.3, 1] as const

function Key() {
  return (
    <svg className="key-shape" viewBox="0 0 120 44" width="108" height="40" aria-hidden="true">
      <defs>
        <linearGradient id="diary-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d38c" />
          <stop offset="1" stopColor="#c48a3a" />
        </linearGradient>
      </defs>
      <g fill="url(#diary-brass)" stroke="#8d6227" strokeWidth="1.5" strokeLinejoin="round">
        {/* Dientes, caña y cuello */}
        <path d="M10 18h72v8H34v10h-6v-6h-5v8h-6v-8h-7z" />
        <rect x="78" y="14" width="7" height="16" rx="2" />
        {/* El ojo de la llave, con un corazón calado */}
        <path
          fillRule="evenodd"
          d="M101 4a18 18 0 1 1 0 36a18 18 0 1 1 0-36zM101 30.5l-7.2-7a4.4 4.4 0 0 1 7.2-5.1a4.4 4.4 0 0 1 7.2 5.1z"
        />
      </g>
    </svg>
  )
}

function Lock() {
  return (
    <svg className="diary-lock" viewBox="0 0 56 72" width="46" height="59" aria-hidden="true">
      <path className="shackle" d="M15 32V21a13 13 0 0 1 26 0v11" fill="none" stroke="#9a6c2c" strokeWidth="7" strokeLinecap="round" />
      <rect x="4" y="29" width="48" height="39" rx="10" fill="url(#diary-brass)" stroke="#8d6227" strokeWidth="1.5" />
      <path className="keyhole" d="M28 39a5 5 0 0 1 3 9l2 10h-10l2-10a5 5 0 0 1 3-9z" fill="#4a3214" />
    </svg>
  )
}

type Props = {
  pages: number
  /** Se acaba de cerrar: el candado cae en su lugar con un clic. */
  relock: boolean
  onOpen: () => void
  /** Tiene clave y todavía no se escribe. */
  locked: boolean
  hint?: string
  onUnlock: (pin: string) => boolean
  /** Olvidó la clave: el diario se vacía y se queda sin clave. */
  onForget: () => Promise<void>
}

export default function DiaryCover({ pages, relock, onOpen, locked, hint, onUnlock, onForget }: Props) {
  const { companion, mood } = useCompanion()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [opening, setOpening] = useState(false)
  const [asking, setAsking] = useState(false)
  const [forgot, setForgot] = useState<'why' | 'sure' | 'done' | null>(null)
  const done = useRef(false)
  const t = dayTitle(today())

  const finish = () => {
    if (done.current) return
    done.current = true
    onOpen()
  }

  const open = () => {
    // Segundo toque: ya no se espera la animación.
    if (opening) return finish()
    if (locked) return setAsking(true)
    ritual()
  }

  const ritual = async () => {
    setOpening(true)
    if (still()) return finish()
    audioContext() // el sonido necesita nacer de un toque; suena más adelante
    buzz(8)
    await new Promise(requestAnimationFrame)
    const root = scope.current
    const key = root.querySelector<HTMLElement>('.key-move')
    const hole = root.querySelector('.keyhole')
    if (!key || !hole) return finish()

    // La llave vuela hasta que su punta queda en el ojo del candado.
    const k = key.getBoundingClientRect()
    const h = hole.getBoundingClientRect()
    const to = { x: h.left + h.width / 2 - (k.left + k.width * TIP), y: h.top + h.height * 0.35 - (k.top + k.height / 2) }
    await animate(key, { x: to.x, y: to.y, rotate: 0 }, { duration: 0.45, ease: [0.3, 1.25, 0.5, 1] })
    // Entra (se ve más corta, como si se metiera) y gira.
    await animate('.key-shape', { scaleX: 0.3, scaleY: 0.85 }, { duration: 0.16 })
    await animate(key, { rotate: 90 }, { duration: 0.24, ease: 'easeInOut' })
    lockClick()
    buzz(25)
    await animate('.shackle', { y: -9 }, { duration: 0.12 })
    animate('.diary-lock', { y: 70, rotate: 24, opacity: 0 }, { duration: 0.42, ease: 'easeIn' })
    animate(key, { y: to.y + 70, opacity: 0 }, { duration: 0.42, ease: 'easeIn' })
    await animate('.book-strap', { x: 60, opacity: 0 }, { duration: 0.32 })

    // La tapa se abre desde el lomo y el libro se acomoda para que quepa abierto.
    animate('.book', { x: '40%', scale: 0.8 }, { duration: 0.8, ease: EASE })
    await animate('.book-cover', { rotateY: -165 }, { duration: 0.8, ease: EASE })
    await animate(root, { opacity: 0, scale: 1.04 }, { duration: 0.18 })
    finish()
  }

  return (
    <div
      ref={scope}
      className={`diary-closed ${opening ? 'opening' : ''} ${relock ? 'relock' : ''}`}
      onClick={open}
    >
      <div className="book">
        <div className="book-block" aria-hidden="true" />
        <div className="book-first" aria-hidden="true">
          <small>Hoy</small>
          <strong>{t.weekday}</strong>
          <span>{t.date}</span>
        </div>
        <div className="book-cover" aria-hidden="true">
          <div className="cover-front">
            <span className="cover-title">Mi diario</span>
            <span className="cover-sticker">
              {companion ? <CompanionView look={companion} mood={mood} size={76} /> : '🌼'}
            </span>
            <small className="cover-count">
              {pages === 0 ? 'Listo para estrenarse' : pages === 1 ? '1 página escrita' : `${pages} páginas escritas`}
            </small>
          </div>
          <div className="cover-inside">
            <p>Este diario es tuyo. Lo que guardes aquí se queda en tu teléfono.</p>
          </div>
        </div>
        <div className="book-strap" aria-hidden="true" />
        <Lock />
        <button type="button" className="diary-key" aria-label="Abrir tu diario con la llave">
          <span className="key-idle">
            <span className="key-move">
              <Key />
            </span>
          </span>
        </button>
      </div>
      <p className="diary-hint">
        {opening ? 'Abriendo…' : locked ? 'Toca la llave y escribe tu clave' : 'Toca la llave para abrir tu diario'}
      </p>

      {forgot === 'done' && (
        <p className="cover-note" role="status">
          Listo: tu diario está en blanco y ya no tiene clave.
        </p>
      )}

      {asking && (
        <div className="cover-pin" onClick={(e) => e.stopPropagation()}>
          {forgot ? (
            <div className="pin-pad forgot">
              {forgot === 'why' ? (
                <>
                  <strong className="pin-title">¿Olvidaste tu clave?</strong>
                  <p>
                    Por tu privacidad no se puede ver ni recuperar. Si guardaste una copia de seguridad, con ella
                    recuperas tu diario sin la clave. Si no, puedes empezar un diario nuevo: lo de este se borra y lo
                    demás de la app se queda.
                  </p>
                  <Link to="/mi-espacio/ajustes" className="btn ghost">
                    Usar mi copia de seguridad
                  </Link>
                  <button className="btn ghost" onClick={() => setForgot('sure')}>
                    Empezar un diario nuevo
                  </button>
                  <button className="btn small ghost" onClick={() => setForgot(null)}>
                    Intentar otra vez
                  </button>
                </>
              ) : (
                <>
                  <strong className="pin-title">¿Borramos este diario?</strong>
                  <p>
                    {pages === 1 ? 'Se va a borrar 1 página' : `Se van a borrar ${pages} páginas`}, con sus fotos y
                    audios. No se puede deshacer.
                  </p>
                  <button
                    className="btn danger"
                    onClick={async () => {
                      await onForget()
                      setForgot('done')
                      setAsking(false)
                    }}
                  >
                    Sí, borrar y empezar de nuevo
                  </button>
                  <button className="btn ghost" onClick={() => setForgot('why')}>
                    No, mejor no
                  </button>
                </>
              )}
            </div>
          ) : (
            <PinPad
              title="La clave de tu diario"
              hint={hint && `Tu pista: ${hint}`}
              onSubmit={(pin) => {
                if (!onUnlock(pin)) return 'Esa no es. Intenta otra vez.'
                setAsking(false)
                ritual()
              }}
              onCancel={() => setAsking(false)}
            >
              <button className="pin-forgot" onClick={() => setForgot('why')}>
                ¿La olvidaste?
              </button>
            </PinPad>
          )}
        </div>
      )}
    </div>
  )
}
