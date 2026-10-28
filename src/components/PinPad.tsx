import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'
import { PIN_LENGTH } from '../lib/lock'
import { buzz } from '../lib/storage'

type Props = {
  title: string
  /** Debajo de los puntos: una pista o una instrucción. */
  hint?: string
  /** Al completar los cuatro números. Si devuelve un texto, no era: se avisa y se vuelve a empezar. */
  onSubmit: (pin: string) => string | void
  onCancel?: () => void
  children?: ReactNode
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Teclado de cuatro números, como el de un candado. También funciona con el teclado de la compu. */
export default function PinPad({ title, hint, onSubmit, onCancel, children }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => box.current?.focus(), [])

  const press = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return
    const next = pin + digit
    setPin(next)
    setError('')
    buzz(6)
    if (next.length < PIN_LENGTH) return
    // Un respiro para que se vea el cuarto punto lleno antes de la respuesta.
    setTimeout(() => {
      const wrong = onSubmit(next)
      setPin('')
      if (!wrong) return
      setError(wrong)
      setShake((n) => n + 1)
      buzz([30, 40, 30])
    }, 160)
  }

  return (
    <div
      ref={box}
      className="pin-pad"
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key)
        else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1))
        else if (e.key === 'Escape') onCancel?.()
      }}
    >
      <strong className="pin-title">{title}</strong>
      <div key={shake} className={`pin-dots ${error ? 'wrong' : ''}`} role="status" aria-label={`${pin.length} de ${PIN_LENGTH} números`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <i key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <p className="pin-msg" aria-live="polite">
        {error || hint || ' '}
      </p>
      <div className="pin-keys">
        {KEYS.map((d) => (
          <button key={d} type="button" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        {onCancel ? (
          <button type="button" className="pin-word" onClick={onCancel}>
            Cancelar
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="pin-word" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Borrar el último número">
          <Delete size={22} aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  )
}
