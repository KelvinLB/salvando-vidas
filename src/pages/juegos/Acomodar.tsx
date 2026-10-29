import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PageHeader from '../../components/PageHeader'
import { newId, useStored } from '../../lib/storage'
import './acomodar.css'

// Despeja la mente: para cuando la cabeza no se calla. Se acomodan piezas suaves en un tablero
// de 8 × 8 y, cuando una fila o una columna se llena, se despeja. Es una pausa para la cabeza,
// nada más: no hay reloj, puntos, vidas ni final. Si ninguna pieza cabe, llegan otras sin
// decir nada de perder. El tablero se guarda para que siga ahí cuando vuelva.

const SIZE = 8

type Shape = { name: string; cells: [number, number][] }

const SHAPES: Shape[] = [
  { name: 'un cuadro', cells: [[0, 0]] },
  { name: 'dos cuadros acostados', cells: [[0, 0], [0, 1]] },
  { name: 'dos cuadros parados', cells: [[0, 0], [1, 0]] },
  { name: 'tres cuadros acostados', cells: [[0, 0], [0, 1], [0, 2]] },
  { name: 'tres cuadros parados', cells: [[0, 0], [1, 0], [2, 0]] },
  { name: 'una esquina', cells: [[0, 0], [1, 0], [1, 1]] },
  { name: 'una esquina', cells: [[0, 1], [1, 0], [1, 1]] },
  { name: 'una esquina', cells: [[0, 0], [0, 1], [1, 0]] },
  { name: 'una esquina', cells: [[0, 0], [0, 1], [1, 1]] },
  { name: 'un cuadrado', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { name: 'cuatro cuadros acostados', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { name: 'cuatro cuadros parados', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { name: 'una ele', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { name: 'una ele acostada', cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { name: 'una te', cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
]

const TONES = ['var(--tone-calma)', 'var(--tone-animo)', 'var(--accent)', 'var(--tone-mania)', 'var(--tone-estres)']

const tone = (t: number) => ({ '--fit': TONES[t % TONES.length] }) as React.CSSProperties
const height = (s: number) => Math.max(...SHAPES[s].cells.map(([r]) => r)) + 1
const width = (s: number) => Math.max(...SHAPES[s].cells.map(([, c]) => c)) + 1

type Piece = { id: string; shape: number; tone: number }
type Game = { board: (number | null)[]; hand: (Piece | null)[] }
type Spot = { r: number; c: number }

function fits(board: Game['board'], shape: number, { r, c }: Spot) {
  return SHAPES[shape].cells.every(([dr, dc]) => {
    const y = r + dr
    const x = c + dc
    return y >= 0 && y < SIZE && x >= 0 && x < SIZE && board[y * SIZE + x] === null
  })
}

function spots(board: Game['board'], shape: number): Spot[] {
  const all: Spot[] = []
  for (let r = 0; r <= SIZE - height(shape); r++)
    for (let c = 0; c <= SIZE - width(shape); c++) if (fits(board, shape, { r, c })) all.push({ r, c })
  return all
}

const randomPiece = (shape = Math.floor(Math.random() * SHAPES.length)): Piece => ({
  id: newId(),
  shape,
  tone: Math.floor(Math.random() * TONES.length),
})

// Tres piezas, y al menos una que sí cabe: el tablero nunca está lleno (una fila llena se
// despeja), así que siempre hay alguna.
function deal(board: Game['board']): Piece[] {
  const hand = [randomPiece(), randomPiece(), randomPiece()]
  if (hand.some((p) => spots(board, p.shape).length > 0)) return hand
  const ok = SHAPES.map((_, s) => s).filter((s) => spots(board, s).length > 0)
  hand[Math.floor(Math.random() * 3)] = randomPiece(ok[Math.floor(Math.random() * ok.length)] ?? 0)
  return hand
}

function fresh(): Game {
  const board = Array<number | null>(SIZE * SIZE).fill(null)
  return { board, hand: deal(board) }
}

const valid = (g: Game | null | undefined): g is Game =>
  !!g &&
  Array.isArray(g.board) &&
  g.board.length === SIZE * SIZE &&
  Array.isArray(g.hand) &&
  g.hand.length === 3 &&
  g.hand.every((p) => p === null || (p.shape >= 0 && p.shape < SHAPES.length))

const clamp = (s: number, { r, c }: Spot): Spot => ({
  r: Math.min(Math.max(r, 0), SIZE - height(s)),
  c: Math.min(Math.max(c, 0), SIZE - width(s)),
})

/** La posición donde sí cabe más cerca de la que se pide; si no hay, la misma. */
function nearest(board: Game['board'], shape: number, want: Spot, reach = SIZE): Spot | null {
  let best: Spot | null = null
  let distance = Infinity
  for (const s of spots(board, shape)) {
    const d = Math.abs(s.r - want.r) + Math.abs(s.c - want.c)
    if (d <= reach && d < distance) {
      best = s
      distance = d
    }
  }
  return best
}

type Fade = { key: string; index: number; tone: number }
type Drag = { slot: number; x: number; y: number; touch: boolean; moved: boolean; spot: Spot | null }

const REST_AFTER = 4 * 60 * 1000

export default function Acomodar() {
  const [stored, setGame] = useStored<Game>('acomodar', fresh)
  const [fallback] = useState(fresh)
  const game = valid(stored) ? stored : fallback
  const [selected, setSelected] = useState<number | null>(null)
  const [cursor, setCursor] = useState<Spot>({ r: 3, c: 3 })
  const [drag, setDrag] = useState<Drag | null>(null)
  const [fading, setFading] = useState<Fade[]>([])
  const [landed, setLanded] = useState<number[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [rest, setRest] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const dragRef = useRef<Drag | null>(null)
  const skipClick = useRef(false)
  const focusSlot = useRef<number | null>(null)

  const piece = selected === null ? null : game.hand[selected]

  // Después de un rato, una nota suave: puede dejarlo aquí si ya bajó el ruido.
  useEffect(() => {
    const timer = setTimeout(() => setRest(true), REST_AFTER)
    return () => clearTimeout(timer)
  }, [])

  // Si ninguna de las piezas que quedan cabe, se cambian por otras, sin aspavientos.
  useEffect(() => {
    const left = game.hand.filter((p): p is Piece => p !== null)
    if (left.length === 0 || left.some((p) => spots(game.board, p.shape).length > 0)) return
    const timer = setTimeout(() => {
      setGame({ board: game.board, hand: deal(game.board) })
      setSelected(null)
      setNote('Esas ya no cabían. Te traigo otras.')
      setStatus('Esas piezas ya no cabían. Te traigo otras.')
    }, 900)
    return () => clearTimeout(timer)
  }, [game, setGame])

  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => setNote(null), 5000)
    return () => clearTimeout(timer)
  }, [note])

  useEffect(() => {
    if (focusSlot.current === null) return
    const target = slotRefs.current[focusSlot.current]
    focusSlot.current = null
    target?.focus()
  })

  // Dónde está el tablero en pantalla: la esquina del primer cuadro y lo que mide cada paso.
  const metrics = () => {
    const board = boardRef.current
    const first = board?.querySelector('[data-cell="0"]')?.getBoundingClientRect()
    const last = board?.querySelector(`[data-cell="${SIZE * SIZE - 1}"]`)?.getBoundingClientRect()
    if (!first || !last) return null
    return { x: first.left, y: first.top, size: first.width, step: (last.left - first.left) / (SIZE - 1) }
  }

  const place = (slot: number, spot: Spot, fromKeyboard = false) => {
    const p = game.hand[slot]
    if (!p || !fits(game.board, p.shape, spot)) return false
    const board = [...game.board]
    const put = SHAPES[p.shape].cells.map(([dr, dc]) => (spot.r + dr) * SIZE + spot.c + dc)
    for (const i of put) board[i] = p.tone

    // Filas y columnas llenas: se despejan.
    const clear = new Set<number>()
    let lines = 0
    for (let k = 0; k < SIZE; k++) {
      const row = Array.from({ length: SIZE }, (_, j) => k * SIZE + j)
      const col = Array.from({ length: SIZE }, (_, j) => j * SIZE + k)
      for (const line of [row, col]) {
        if (line.every((i) => board[i] !== null)) {
          line.forEach((i) => clear.add(i))
          lines++
        }
      }
    }
    if (clear.size) {
      const stamp = newId()
      const gone = [...clear].map((index) => ({ key: `${stamp}-${index}`, index, tone: board[index] as number }))
      for (const i of clear) board[i] = null
      setFading((f) => [...f, ...gone])
      setTimeout(() => setFading((f) => f.filter((x) => !gone.includes(x))), 650)
    }
    setLanded(put.filter((i) => !clear.has(i)))

    const hand = game.hand.map((h, i) => (i === slot ? null : h))
    const next = hand.every((h) => h === null) ? deal(board) : hand
    setGame({ board, hand: next })
    setSelected(null)
    setStatus(
      lines === 0 ? 'Colocada.' : lines === 1 ? 'Colocada. Se despejó una línea.' : 'Colocada. Se despejaron varias líneas.',
    )
    if (fromKeyboard) {
      const order = [slot + 1, slot + 2, slot].map((i) => i % 3)
      focusSlot.current = order.find((i) => next[i] !== null) ?? 0
    }
    return true
  }

  const select = (slot: number) => {
    const p = game.hand[slot]
    if (!p) return
    if (selected === slot) {
      setSelected(null)
      setStatus('Pieza soltada.')
      return
    }
    const spot = nearest(game.board, p.shape, clamp(p.shape, cursor)) ?? clamp(p.shape, cursor)
    setSelected(slot)
    setCursor(spot)
    setStatus(
      `Elegiste ${SHAPES[p.shape].name}. Toca el tablero donde quieras ponerla, o muévela con las flechas y colócala con Enter.`,
    )
  }

  const describe = (shape: number, spot: Spot) =>
    `Fila ${spot.r + 1}, columna ${spot.c + 1}${fits(game.board, shape, spot) ? '' : '. Ahí no cabe'}.`

  const onSlotKey = (e: React.KeyboardEvent, slot: number) => {
    const p = game.hand[slot]
    if (!p) return
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }
    if (moves[e.key]) {
      e.preventDefault()
      if (selected !== slot) {
        select(slot)
        return
      }
      const [dr, dc] = moves[e.key]
      const spot = clamp(p.shape, { r: cursor.r + dr, c: cursor.c + dc })
      setCursor(spot)
      setStatus(describe(p.shape, spot))
    } else if (e.key === 'Enter' && selected === slot) {
      e.preventDefault()
      if (!place(slot, cursor, true)) setStatus('Ahí no cabe. Muévela con las flechas a otro lugar.')
    } else if (e.key === 'Escape' && selected !== null) {
      e.preventDefault()
      setSelected(null)
      setStatus('Pieza soltada.')
    }
  }

  // Arrastrar: la pieza sigue al dedo (un poco arriba, para que el dedo no la tape) y se
  // acomoda en el lugar libre más cercano.
  const dragSpot = (slot: number, x: number, y: number, touch: boolean) => {
    const p = game.hand[slot]
    const m = metrics()
    if (!p || !m) return { left: x, top: y, spot: null }
    const gap = m.step - m.size
    const left = x - (width(p.shape) * m.step - gap) / 2
    const top = touch ? y - height(p.shape) * m.step - m.step * 0.6 : y - (height(p.shape) * m.step - gap) / 2
    const want = { r: Math.round((top - m.y) / m.step), c: Math.round((left - m.x) / m.step) }
    const inside =
      want.r > -2 && want.c > -2 && want.r < SIZE - height(p.shape) + 2 && want.c < SIZE - width(p.shape) + 2
    return { left, top, spot: inside ? nearest(game.board, p.shape, want, 1) : null }
  }

  const onSlotDown = (e: React.PointerEvent<HTMLButtonElement>, slot: number) => {
    if (!game.hand[slot] || (e.pointerType === 'mouse' && e.button !== 0)) return
    skipClick.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { slot, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse', moved: false, spot: null }
  }

  const onSlotMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return
    const { spot } = dragSpot(d.slot, e.clientX, e.clientY, d.touch)
    const next = { ...d, x: e.clientX, y: e.clientY, moved: true, spot }
    dragRef.current = next
    setDrag(next)
  }

  const onSlotUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d?.moved) return
    skipClick.current = true
    setDrag(null)
    if (d.spot) place(d.slot, d.spot)
  }

  const onSlotCancel = () => {
    dragRef.current = null
    setDrag(null)
  }

  const cellAt = (x: number, y: number): Spot | null => {
    const m = metrics()
    if (!m) return null
    const gap = m.step - m.size
    const r = Math.floor((y - m.y + gap / 2) / m.step)
    const c = Math.floor((x - m.x + gap / 2) / m.step)
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return null
    return { r, c }
  }

  const onBoardClick = (e: React.MouseEvent) => {
    if (selected === null || !piece) {
      setNote('Primero elige una pieza de abajo.')
      return
    }
    const cell = cellAt(e.clientX, e.clientY)
    if (!cell) return
    const spot = clamp(piece.shape, cell)
    if (!place(selected, spot)) {
      setCursor(spot)
      setStatus('Ahí no cabe. Prueba en otro lugar.')
    }
  }

  const onBoardHover = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !piece) return
    const cell = cellAt(e.clientX, e.clientY)
    if (!cell) return
    const spot = clamp(piece.shape, cell)
    if (spot.r !== cursor.r || spot.c !== cursor.c) setCursor(spot)
  }

  const restart = () => {
    const stamp = newId()
    const gone = game.board.flatMap((t, index) => (t === null ? [] : [{ key: `${stamp}-${index}`, index, tone: t }]))
    setFading((f) => [...f, ...gone])
    setTimeout(() => setFading((f) => f.filter((x) => !gone.includes(x))), 650)
    setGame(fresh())
    setSelected(null)
    setLanded([])
    setNote(null)
    setStatus('Tablero limpio. Empezamos de nuevo.')
  }

  // La vista previa: donde caería la pieza que se arrastra o la elegida.
  const ghostShape = drag ? game.hand[drag.slot]?.shape : piece?.shape
  const ghostSpot = drag ? drag.spot : piece ? cursor : null
  const ghostTone = drag ? game.hand[drag.slot]?.tone : piece?.tone
  const ghostOk = ghostShape !== undefined && ghostSpot !== null && fits(game.board, ghostShape, ghostSpot)
  const ghost = new Set(
    ghostShape !== undefined && ghostSpot
      ? SHAPES[ghostShape].cells.map(([dr, dc]) => (ghostSpot.r + dr) * SIZE + ghostSpot.c + dc)
      : [],
  )

  const float = drag ? dragSpot(drag.slot, drag.x, drag.y, drag.touch) : null
  const floatPiece = drag ? game.hand[drag.slot] : null
  const m = drag ? metrics() : null

  return (
    <div className="stack">
      <PageHeader
        title="Despeja la mente"
        subtitle="Acomoda las piezas sin prisa. Si la cabeza se va a otra cosa, regresa a la siguiente pieza."
      />

      <div
        ref={boardRef}
        className="fit-board"
        onClick={onBoardClick}
        onPointerMove={onBoardHover}
        role="group"
        aria-label="Tablero de 8 por 8"
      >
        {game.board.map((t, i) => {
          const shown = ghost.has(i)
          const classes = [
            'fit-cell',
            t !== null ? 'filled' : '',
            shown ? (ghostOk ? 'ghost' : 'ghost blocked') : '',
            landed.includes(i) && t !== null ? 'landed' : '',
          ]
          return (
            <div
              key={i}
              data-cell={i}
              className={classes.filter(Boolean).join(' ')}
              style={{
                gridRow: Math.floor(i / SIZE) + 1,
                gridColumn: (i % SIZE) + 1,
                ...tone(t ?? (shown && ghostTone !== undefined ? ghostTone : 0)),
              }}
              aria-hidden="true"
            />
          )
        })}
        {fading.map((f) => (
          <div
            key={f.key}
            className="fit-fade"
            style={{ gridRow: Math.floor(f.index / SIZE) + 1, gridColumn: (f.index % SIZE) + 1, ...tone(f.tone) }}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="fit-note muted small center" aria-hidden="true">
        {note ?? ''}
      </p>

      <div className="fit-tray" role="group" aria-label="Piezas para acomodar">
        {game.hand.map((p, slot) =>
          p ? (
            <button
              key={p.id}
              ref={(el) => {
                slotRefs.current[slot] = el
              }}
              type="button"
              className={`fit-slot ${selected === slot ? 'selected' : ''} ${drag?.slot === slot ? 'lifted' : ''}`}
              aria-pressed={selected === slot}
              aria-label={`Pieza: ${SHAPES[p.shape].name}`}
              onClick={() => {
                if (skipClick.current) {
                  skipClick.current = false
                  return
                }
                select(slot)
              }}
              onKeyDown={(e) => onSlotKey(e, slot)}
              onPointerDown={(e) => onSlotDown(e, slot)}
              onPointerMove={onSlotMove}
              onPointerUp={onSlotUp}
              onPointerCancel={onSlotCancel}
            >
              <PieceShape piece={p} />
            </button>
          ) : (
            <div
              key={`vacio-${slot}`}
              ref={() => {
                slotRefs.current[slot] = null
              }}
              className="fit-slot empty"
              aria-hidden="true"
            />
          ),
        )}
      </div>

      <p className="muted small center">
        Arrastra una pieza al tablero, o tócala y luego toca dónde va. Cuando se llena una fila o una columna, se
        despeja.
      </p>

      {rest && (
        <p className="fit-rest muted center">
          Si ya bajó un poco el ruido, puedes dejarlo aquí. Tu tablero se queda como está.
        </p>
      )}

      <button type="button" className="btn ghost small fit-restart" onClick={restart}>
        Empezar de nuevo
      </button>

      <p className="visually-hidden" aria-live="polite">
        {status}
      </p>

      {drag && float && floatPiece && m &&
        createPortal(
          <div
            className="fit-float"
            style={{ left: float.left, top: float.top }}
            aria-hidden="true"
          >
            <PieceShape piece={floatPiece} cell={m.size} gap={m.step - m.size} />
          </div>,
          document.body,
        )}
    </div>
  )
}

function PieceShape({ piece, cell, gap }: { piece: Piece; cell?: number; gap?: number }) {
  const { cells } = SHAPES[piece.shape]
  return (
    <span
      className="fit-piece"
      style={{
        gridTemplateColumns: `repeat(${width(piece.shape)}, var(--cell))`,
        gridTemplateRows: `repeat(${height(piece.shape)}, var(--cell))`,
        ...(cell ? { '--cell': `${cell}px`, gap: `${gap}px` } : {}),
        ...tone(piece.tone),
      } as React.CSSProperties}
    >
      {cells.map(([r, c]) => (
        <i key={`${r}-${c}`} style={{ gridRow: r + 1, gridColumn: c + 1 }} />
      ))}
    </span>
  )
}
