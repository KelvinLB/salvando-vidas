import { useEffect, useRef, useState } from 'react'
import { Apple, Ear, Eye, Flower2, Hand, type LucideIcon } from 'lucide-react'
import type { FlowProps } from '../types'
import { Flow, NotNow, Says, Thanks } from './parts'

// Nico y el juego de buscar (anclaje 5-4-3-2-1): no en la plaza, sino donde está la persona de
// verdad. Cinco cosas que ve, cuatro que toca, tres que oye, dos que huele y una que saborea;
// en un día pesado, 3-2-1. Cada cosa se marca con un toque, sin escribir. Si no encuentra,
// sigue con la que sigue, y «Ya, con esto» cuenta.

type Sense = { id: string; icon: LucideIcon; verb: string; hint: string }

const SENSES: Sense[] = [
  { id: 'ver', icon: Eye, verb: 'ver', hint: 'Una ventana, tus manos, algo de color azul…' },
  { id: 'tocar', icon: Hand, verb: 'tocar', hint: 'La tela de tu ropa, la mesa, tu pelo…' },
  { id: 'oir', icon: Ear, verb: 'oír', hint: 'Un coche, tu respiración, un pajarito…' },
  { id: 'oler', icon: Flower2, verb: 'oler', hint: 'Tu ropa, el aire, el café… Si no hueles nada, también está bien.' },
  { id: 'saborear', icon: Apple, verb: 'saborear', hint: 'Un trago de agua, o tu boca como está ahorita.' },
]

const WORDS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco']

export default function Cinco({ petName, heavy, onDone, onClose }: FlowProps) {
  const counts = heavy ? [3, 2, 1] : [5, 4, 3, 2, 1]
  const [stage, setStage] = useState<'intro' | 'find' | 'end'>('intro')
  const [step, setStep] = useState(0)
  const [marked, setMarked] = useState<boolean[]>([])
  const dots = useRef<HTMLDivElement>(null)

  const sense = SENSES[step]
  const n = counts[step] ?? 0
  const all = marked.length === n && marked.every(Boolean)

  const next = () => {
    if (step + 1 >= counts.length) return setStage('end')
    setStep(step + 1)
    setMarked(Array(counts[step + 1]).fill(false))
  }

  // Con todas marcadas, pasa solita a la que sigue, con una pausa para verlo.
  useEffect(() => {
    if (stage !== 'find' || !all) return
    const timer = setTimeout(next, 700)
    return () => clearTimeout(timer)
  }, [all, stage])

  // Quien usa teclado sigue en los circulitos del sentido nuevo.
  useEffect(() => {
    if (stage === 'find' && dots.current?.contains(document.activeElement)) {
      dots.current.querySelector('button')?.focus()
    }
  }, [step])

  const start = () => {
    setStep(0)
    setMarked(Array(counts[0]).fill(false))
    setStage('find')
  }

  const toggle = (i: number) => setMarked(marked.map((m, j) => (j === i ? !m : m)))
  const things = (k: number) => `${WORDS[k]} ${k === 1 ? 'cosa' : 'cosas'}`

  return (
    <Flow label="Buscar cosas con Nico">
      <Says who="nico">
        {stage === 'intro' && (
          <p>
            ¡Hola, {petName}! ¿Jugamos a buscar? Pero no aquí en la plaza: allá donde estás tú, de verdad. Cuando la
            cabeza no para, fijarse en lo que hay alrededor ayuda a regresar al ahorita.
            {heavy && ' Hoy nomás tres rondas, bien tranquilo.'}
          </p>
        )}
        {stage === 'find' && (
          <p>
            {all
              ? `¡Eso! Ya encontraste ${things(n)} para ${sense.verb}.`
              : `${step === 0 ? 'Busca' : 'Ahora, busca'} ${things(n)} que puedas ${sense.verb}. ${n === 1 ? 'Toca el circulito cuando la tengas.' : 'Toca un circulito por cada una.'}`}
          </p>
        )}
        {stage === 'end' && (
          <p>¡Lo hiciste! ¿Sientes la cabeza un poquito más aquí? Yo siempre noto cosas nuevas cuando busco así.</p>
        )}
      </Says>

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={start}>
            ¡Va!
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'find' && (
        <>
          <div className="bm-sense">
            <sense.icon size={22} aria-hidden="true" />
            <span className="muted small">{sense.hint}</span>
          </div>
          <div className="bm-dots" ref={dots}>
            {marked.map((m, i) => (
              <button
                key={`${sense.id}-${i}`}
                type="button"
                className={`bm-dot${m ? ' on' : ''}`}
                aria-pressed={m}
                aria-label={`Cosa ${i + 1} de ${n} que puedes ${sense.verb}`}
                onClick={() => toggle(i)}
              >
                {m ? '✓' : i + 1}
              </button>
            ))}
          </div>
          <div className="row">
            {!all && (
              <button type="button" className="btn small ghost" onClick={next}>
                No encuentro más, sigo
              </button>
            )}
            <button type="button" className="btn small ghost" onClick={() => setStage('end')}>
              Ya, con esto
            </button>
          </div>
        </>
      )}

      {stage === 'end' && <Thanks to="Nico" onDone={onDone} />}
    </Flow>
  )
}
