import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { buzz, useStored } from '../../lib/storage'

const SYMBOLS = ['🌸', '🌊', '🌙', '⭐', '🍃', '🐢', '🦋', '🌈', '🍊', '🐳']
const SIZES = { facil: 6, normal: 8, dificil: 10 } as const
type Level = keyof typeof SIZES

type Card = { id: number; symbol: string; matched: boolean }

function deal(pairs: number): Card[] {
  const symbols = SYMBOLS.slice(0, pairs)
  return [...symbols, ...symbols]
    .map((symbol) => ({ symbol, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ symbol }, id) => ({ id, symbol, matched: false }))
}

export default function Memorama() {
  const [level, setLevel] = useStored<Level>('memorama-nivel', 'facil')
  const [cards, setCards] = useState(() => deal(SIZES[level]))
  const [open, setOpen] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const done = cards.every((c) => c.matched)

  const restart = (next: Level = level) => {
    setLevel(next)
    setCards(deal(SIZES[next]))
    setOpen([])
    setMoves(0)
  }

  useEffect(() => {
    if (open.length !== 2) return
    const [a, b] = open
    const match = cards[a].symbol === cards[b].symbol
    const timer = setTimeout(
      () => {
        if (match) {
          setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)))
          buzz(30)
        }
        setOpen([])
      },
      match ? 300 : 900,
    )
    return () => clearTimeout(timer)
  }, [open, cards])

  const flip = (id: number) => {
    if (open.length === 2 || open.includes(id) || cards[id].matched) return
    if (open.length === 1) setMoves((m) => m + 1)
    setOpen((prev) => [...prev, id])
  }

  return (
    <div className="stack">
      <PageHeader title="Memorama" subtitle="Sin reloj y sin prisa. Solo tú y las cartas." />

      <div className="chips">
        {(Object.keys(SIZES) as Level[]).map((l) => (
          <button key={l} className={`chip ${l === level ? 'selected' : ''}`} onClick={() => restart(l)}>
            {{ facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' }[l]}
          </button>
        ))}
      </div>

      <div className={`memory cols-${cards.length > 12 ? 5 : 4}`}>
        {cards.map((c) => {
          const visible = c.matched || open.includes(c.id)
          return (
            <button
              key={c.id}
              className={`memory-card ${visible ? 'visible' : ''} ${c.matched ? 'matched' : ''}`}
              onClick={() => flip(c.id)}
              aria-label={visible ? c.symbol : 'Carta boca abajo'}
            >
              {visible ? c.symbol : ''}
            </button>
          )
        })}
      </div>

      <p className="muted center">Intentos: {moves}</p>

      {done && (
        <div className="card center">
          <p className="big-emoji">🎉</p>
          <h2>¡Lo lograste!</h2>
          <p className="muted">Tu mente estuvo aquí, concentrada. Eso también es descanso.</p>
          <button className="btn" onClick={() => restart()}>
            Jugar otra vez
          </button>
        </div>
      )}
    </div>
  )
}
