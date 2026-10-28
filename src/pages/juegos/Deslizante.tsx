import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { buzz } from '../../lib/storage'

const N = 3
const SOLVED = [...Array.from({ length: N * N - 1 }, (_, i) => i + 1), 0]

function neighbors(index: number): number[] {
  const r = Math.floor(index / N)
  const c = index % N
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ]
    .filter(([y, x]) => y >= 0 && y < N && x >= 0 && x < N)
    .map(([y, x]) => y * N + x)
}

// Se mezcla con movimientos válidos desde la solución: siempre tiene solución.
function shuffle(): number[] {
  const tiles = [...SOLVED]
  let empty = tiles.indexOf(0)
  let previous = -1
  for (let i = 0; i < 120; i++) {
    const options = neighbors(empty).filter((n) => n !== previous)
    const next = options[Math.floor(Math.random() * options.length)]
    ;[tiles[empty], tiles[next]] = [tiles[next], tiles[empty]]
    previous = empty
    empty = next
  }
  return tiles.join() === SOLVED.join() ? shuffle() : tiles
}

export default function Deslizante() {
  const [tiles, setTiles] = useState(shuffle)
  const [moves, setMoves] = useState(0)
  const solved = tiles.join() === SOLVED.join()

  const move = (index: number) => {
    if (solved) return
    const empty = tiles.indexOf(0)
    if (!neighbors(empty).includes(index)) return
    const next = [...tiles]
    ;[next[empty], next[index]] = [next[index], next[empty]]
    setTiles(next)
    setMoves((m) => m + 1)
    buzz(8)
  }

  return (
    <div className="stack">
      <PageHeader
        title="Rompecabezas deslizante"
        subtitle="Toca una pieza junto al espacio vacío para moverla. Ordena del 1 al 8."
      />

      <div className="slider">
        {tiles.map((t, i) => (
          <button
            key={t}
            className={`slide-tile ${t === 0 ? 'empty' : ''}`}
            style={{ gridRow: Math.floor(i / N) + 1, gridColumn: (i % N) + 1 }}
            onClick={() => move(i)}
            disabled={t === 0}
            aria-label={t === 0 ? 'Espacio vacío' : `Pieza ${t}`}
          >
            {t || ''}
          </button>
        ))}
      </div>

      <p className="muted center">Movimientos: {moves}</p>

      {solved ? (
        <div className="card center">
          <p className="big-emoji">🌟</p>
          <h2>¡Resuelto!</h2>
          <p className="muted">Paso a paso se llega. Igual que con todo lo demás.</p>
          <button className="btn" onClick={() => { setTiles(shuffle()); setMoves(0) }}>
            Otro
          </button>
        </div>
      ) : (
        <button className="btn ghost" onClick={() => { setTiles(shuffle()); setMoves(0) }}>
          Mezclar de nuevo
        </button>
      )}
    </div>
  )
}
