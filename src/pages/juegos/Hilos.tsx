import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import PetSays from '../../components/PetSays'
import { PatchArt, Threads } from '../../components/hilos/Threads'
import { type CompanionMood, DEFAULT_COMPANION, companionName } from '../../data/companion'
import { useCompanion } from '../../lib/companion'
import {
  DIRS,
  HEX,
  MAX_PATCHES,
  NIGHT_KEY,
  type PatchTile,
  type Radius,
  SIZES,
  THREAD_COLORS,
  addPatch,
  boardBox,
  hexXY,
  opposite,
  ring,
  rotMask,
  usePatches,
} from '../../lib/hilos'
import { pick, useStored } from '../../lib/storage'
import './hilos.css'

// Hilos sueltos: se gira cada pieza hasta que ningún hilo quede suelto, y entonces el tejido se
// vuelve un bordado de colores que se queda en su rebozo. No hay reloj, puntos, contador de
// vueltas ni forma de perder; las pistas no se acaban y el tamaño lo elige la persona. No suena
// ni vibra. Al terminar puede respirar con el bordado, sin salir de la tarjeta.

type Tile = { q: number; r: number; base: number; rot: number; turns: number }
type Breath = { phase: 'in' | 'out'; round: number }

const HELLO = 'Mira estos hilos, andan sueltos. ¿Me ayudas a juntarlos? Sin prisa, uno por uno.'
const HELLO_SMALL = 'Uno chiquito, para empezar despacio.'
const HELLO_HEAVY = 'Mira estos hilos, andan sueltos. Si hoy el día pesa, uno chiquito también cuenta. Tú escoges.'
const NUDGE = 'Si quieres, una pista. O seguimos así, sin prisa: aquí nadie nos apura.'
const HINT = 'Esta va así. Las demás, cuando quieras.'
const SOLVED = [
  'Mira nomás. Ya no queda ningún hilo suelto, y fuiste tú quien los juntó.',
  'Así, poquito a poco, se desenredó todo.',
  'Quedó bordado. ¿Respiramos un momento viéndolo?',
]
const NIGHT_ON = 'Colores bajitos, para la noche. Si no puedes dormir, aquí te acompaño.'
const NIGHT_OFF = 'De vuelta a los colores de siempre.'
const BREATH_IN = 'Toma aire mientras el bordado crece… 1, 2, 3, 4'
const BREATH_OUT = 'Suéltalo despacio… 1, 2, 3, 4, 5, 6'
const BREATH_DONE = 'Listo. Tu bordado se quedó en tu rebozo.'
const BREATHS = 3
const NUDGE_AFTER = 30

const HEAVY_MOODS: CompanionMood[] = ['triste', 'apagado', 'nervios', 'cansado']
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const key = (q: number, r: number) => `${q},${r}`
const cur = (t: Tile) => rotMask(t.base, t.rot)
const indexOf = (tiles: Tile[]) => new Map(tiles.map((t) => [key(t.q, t.r), t]))

/** Una pieza está bien cuando cada hilo suyo encuentra el de su vecina, y ninguno da al vacío. */
function okTile(t: Tile, index: Map<string, Tile>) {
  const m = cur(t)
  for (let d = 0; d < 6; d++) {
    const n = index.get(key(t.q + DIRS[d][0], t.r + DIRS[d][1]))
    const mine = !!((m >> d) & 1)
    const theirs = n ? !!((cur(n) >> opposite(d)) & 1) : false
    if (mine !== theirs) return false
  }
  return true
}
const solved = (tiles: Tile[]) => {
  const index = indexOf(tiles)
  return tiles.every((t) => okTile(t, index))
}

// Se tejen hilos entre vecinas al azar y luego se revuelven las piezas: así cada tablero tiene
// solución y ninguno se repite. Si sale casi vacío o ya resuelto, se teje otro.
function weave(R: Radius): Tile[] {
  const cells: [number, number][] = []
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (Math.abs(q + r) <= R) cells.push([q, r])
  const p = R === 1 ? 0.62 : 0.52
  let tiles: Tile[] = []
  for (let tries = 0; tries < 80; tries++) {
    tiles = cells.map(([q, r]) => ({ q, r, base: 0, rot: 0, turns: 0 }))
    const index = indexOf(tiles)
    for (const t of tiles)
      for (let d = 0; d < 3; d++) {
        const n = index.get(key(t.q + DIRS[d][0], t.r + DIRS[d][1]))
        if (n && Math.random() < p) {
          t.base |= 1 << d
          n.base |= 1 << opposite(d)
        }
      }
    if (tiles.filter((t) => t.base).length < tiles.length * 0.7) continue
    for (const t of tiles) t.turns = t.rot = Math.floor(Math.random() * 6)
    if (!solved(tiles)) return tiles
  }
  return tiles
}

const HEX_POINTS = [0, 1, 2, 3, 4, 5]
  .map((i) => `${(Math.cos((i * Math.PI) / 3) * (HEX - 1.6)).toFixed(1)},${(Math.sin((i * Math.PI) / 3) * (HEX - 1.6)).toFixed(1)}`)
  .join(' ')

export default function Hilos() {
  const { companion, mood } = useCompanion()
  const name = companionName(companion ?? DEFAULT_COMPANION)
  const [radius, setRadius] = useState<Radius>(2)
  const [tiles, setTiles] = useState(() => weave(2))
  // El color de cada pieza ya bordada; mientras no termina, no hay.
  const [colors, setColors] = useState<number[] | null>(null)
  // En un día pesado, la mascota sugiere el chiquito, sin cambiarlo sola.
  const [says, setSays] = useState(() => (HEAVY_MOODS.includes(mood) ? HELLO_HEAVY : HELLO))
  const [status, setStatus] = useState('')
  const [breath, setBreath] = useState<Breath | null>(null)
  const [night, setNight] = useStored(NIGHT_KEY, false)
  const [patches] = usePatches()
  const taps = useRef(0)
  const nudged = useRef(false)
  const closing = useRef(false)
  const finishTimer = useRef<number | undefined>(undefined)
  const tileRefs = useRef<(SVGGElement | null)[]>([])
  const done = colors !== null

  useEffect(() => () => clearTimeout(finishTimer.current), [])

  // Respirar con el bordado: crece 4 segundos y se encoge 6, tres veces.
  useEffect(() => {
    if (!breath) return
    const timer = setTimeout(
      () => {
        if (breath.phase === 'in') return setBreath({ phase: 'out', round: breath.round })
        if (breath.round < BREATHS) return setBreath({ phase: 'in', round: breath.round + 1 })
        setBreath(null)
        setSays(BREATH_DONE)
      },
      breath.phase === 'in' ? 4000 : 6000,
    )
    return () => clearTimeout(timer)
  }, [breath])

  // Se borda por anillos, del centro hacia afuera, como las flores de un rebozo.
  const finish = (final: Tile[]) => {
    closing.current = false
    const shift = Math.floor(Math.random() * THREAD_COLORS.length)
    const tone = final.map((t) => (ring(t.q, t.r) + shift) % THREAD_COLORS.length)
    setColors(tone)
    setSays(pick(SOLVED))
    setStatus('Tejido terminado.')
    addPatch({
      radius,
      tiles: final.flatMap((t, i): PatchTile[] => (t.base ? [[t.q, t.r, cur(t), tone[i]]] : [])),
    })
  }

  const turn = (i: number, k = 1) => {
    const t = tiles[i]
    if (done || closing.current || !t.base) return
    const next = tiles.map((x, j) => (j === i ? { ...x, rot: (x.rot + k) % 6, turns: x.turns + k } : x))
    setTiles(next)
    taps.current++
    setStatus(okTile(next[i], indexOf(next)) ? 'Esa pieza ya quedó bien.' : 'Pieza girada.')
    if (solved(next)) {
      closing.current = true
      finishTimer.current = window.setTimeout(() => finish(next), reduced() ? 0 : 320)
      return
    }
    if (taps.current > NUDGE_AFTER && !nudged.current) {
      nudged.current = true
      setSays(NUDGE)
    }
  }

  const onKey = (e: KeyboardEvent<SVGGElement>, i: number) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    turn(i)
  }

  // Una pista acomoda una pieza que todavía no está bien; no se acaban ni cuestan nada.
  const hint = () => {
    if (done || closing.current) return
    const index = indexOf(tiles)
    const all = tiles.map((_, i) => i).filter((i) => tiles[i].base && cur(tiles[i]) !== tiles[i].base)
    const wrong = all.filter((i) => !okTile(tiles[i], index))
    const pool = wrong.length ? wrong : all
    if (!pool.length) return
    const i = pick(pool)
    const t = tiles[i]
    let k = 1
    while (k < 6 && rotMask(t.base, t.rot + k) !== t.base) k++
    setSays(HINT)
    tileRefs.current[i]?.focus({ preventScroll: true })
    turn(i, k)
  }

  const start = (R: Radius) => {
    clearTimeout(finishTimer.current)
    closing.current = false
    taps.current = 0
    nudged.current = false
    setTiles(weave(R))
    setColors(null)
    setBreath(null)
    setStatus('')
    setSays(R === 1 ? HELLO_SMALL : HELLO)
  }

  const choose = (R: Radius) => {
    setRadius(R)
    start(R)
  }

  const toggleNight = () => {
    setNight(!night)
    setSays(night ? NIGHT_OFF : NIGHT_ON)
  }

  const index = indexOf(tiles)
  const box = boardBox(radius)
  const shown = breath ? (breath.phase === 'in' ? BREATH_IN : BREATH_OUT) : says

  return (
    <div className="stack">
      <PageHeader
        title="Hilos sueltos"
        subtitle="Toca una pieza para girarla. Los hilos que ya quedaron bien se ven más oscuros. No hay reloj, puntos ni forma de perder."
      />

      <section className="card h-card" aria-label={`Hilos sueltos con ${name}`}>
        <div className="h-sizes" role="group" aria-label="Tamaño del tejido">
          {SIZES.map((s) => (
            <button
              key={s.radius}
              type="button"
              className={`chip${s.radius === radius ? ' selected' : ''}`}
              aria-pressed={s.radius === radius}
              onClick={() => choose(s.radius)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className={`h-board${night ? ' h-night' : ''}${done ? ' h-done' : ''}`}>
          <svg viewBox={box.viewBox} role="group" aria-label={done ? 'Tejido terminado, bordado de colores' : 'Tejido de hexágonos'}>
            <g className={`h-weave${breath ? ` ${breath.phase}` : ''}`}>
              {tiles.map((t, i) => {
                const [x, y] = hexXY(t.q, t.r)
                const live = !!t.base && !done
                const ok = live && okTile(t, index)
                const classes = ['h-hex', ok && 'h-ok', done && 'h-colored', !t.base && 'h-empty'].filter(Boolean).join(' ')
                return (
                  <g
                    key={key(t.q, t.r)}
                    ref={(el) => {
                      tileRefs.current[i] = el
                    }}
                    className={classes}
                    transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
                    style={colors ? ({ '--h-tc': `var(${THREAD_COLORS[colors[i]]})` } as CSSProperties) : undefined}
                    {...(live
                      ? {
                          role: 'button',
                          tabIndex: 0,
                          'aria-label': `Pieza ${i + 1}${ok ? ', ya quedó bien' : ''}. Toca para girar`,
                          onClick: () => turn(i),
                          onKeyDown: (e: KeyboardEvent<SVGGElement>) => onKey(e, i),
                        }
                      : { 'aria-hidden': true })}
                  >
                    <polygon className="h-bg" points={HEX_POINTS} />
                    <g className="h-spin" style={{ transform: `rotate(${t.turns * 60}deg)` }}>
                      <Threads mask={t.base} />
                    </g>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        <PetSays mood={done ? 'feliz' : 'calma'} compact>
          <p aria-live="polite">{shown}</p>
          {breath && (
            <div className="row h-breath">
              <span className="muted small">
                Respiración {breath.round} de {BREATHS}
              </span>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  setBreath(null)
                  setSays(BREATH_DONE)
                }}
              >
                Ya, con esto
              </button>
            </div>
          )}
        </PetSays>

        <div className="row h-acts">
          <button type="button" className="btn small ghost" disabled={done} onClick={hint}>
            Una pista
          </button>
          <button type="button" className="btn small ghost" onClick={() => start(radius)}>
            {done ? 'Seguir tejiendo' : 'Otro tejido'}
          </button>
          <button type="button" className={`btn small ghost h-night-btn${night ? ' on' : ''}`} aria-pressed={night} onClick={toggleNight}>
            Modo noche
          </button>
          {done && (
            <button type="button" className="btn small" disabled={!!breath} onClick={() => setBreath({ phase: 'in', round: 1 })}>
              Respirar con el bordado
            </button>
          )}
        </div>

        <p className="visually-hidden" aria-live="polite">
          {status}
        </p>
      </section>

      <section className="card h-rebozo">
        <h2>Tu rebozo</h2>
        <p className="muted small">
          Cada tejido que terminas se queda aquí como un parche, solo en tu teléfono. No se cuentan ni se comparan.
        </p>
        <div className="h-patches">
          {Array.from({ length: MAX_PATCHES }, (_, i) => {
            const patch = patches[i]
            return patch ? (
              <div key={`${i}-${patch.date}`} className="h-patch got" role="img" aria-label="Un parche de tu rebozo">
                <PatchArt patch={patch} />
              </div>
            ) : (
              <div key={i} className="h-patch" aria-hidden="true" />
            )
          })}
        </div>
      </section>

      <section className="card h-how">
        <h2>Cómo se siente</h2>
        <ul>
          <li>Las pistas no tienen límite ni costo.</li>
          <li>Si te atoras, «Otro tejido» cambia el tablero sin decir que perdiste.</li>
          <li>En días pesados, {name} te sugiere el tejido chiquito.</li>
          <li>El modo noche baja los colores para cuando no puedes dormir.</li>
        </ul>
      </section>
    </div>
  )
}
