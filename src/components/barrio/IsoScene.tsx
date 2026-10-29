import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import CompanionView from '../Companion'
import type { CompanionLook, CompanionMood } from '../../data/companion'
import { still } from '../../lib/petfx'
import { type Grid, TILE_H, TILE_W, type Tile, besides, blockedBy, findPath, isFree, tileKey, tilePoints, tileXY } from './iso'

// El motor del barrio: dibuja los cuadritos, ordena las cosas de atrás hacia adelante y lleva a
// la mascota de la persona a donde toque, cuadrito por cuadrito. La posición de la mascota se
// mueve a mano (sin volver a dibujar todo en cada cuadro); React solo se entera al cambiar de
// cuadrito, para acomodarla delante o detrás de lo que tenga cerca. Con movimiento reducido,
// llega de un salto.
//
// Con `view`, el mundo es más grande que la pantalla: una cámara sigue a la mascota (también a
// mano, en el mismo cuadro de animación) y la persona puede arrastrar para mirar alrededor. Un
// arrastre no cuenta como toque; al volver a caminar, la cámara regresa con la mascota.

export type Pose = 'hop' | 'dance' | 'sit' | 'breathe'

export type Thing = {
  id: string
  r: number
  c: number
  /** Ocupa ese cuadrito y los ocho de alrededor (el kiosco). */
  span?: boolean
  /** Se puede pasar por debajo (el papel picado que cuelga sobre la calle). */
  walkable?: boolean
  art: ReactNode
  /** Con nombre y `onTap`, se puede tocar (y alcanzar con el teclado). */
  label?: string
  onTap?: () => void
  /** Se atiende al tocar, sin que la mascota camine hasta ahí (guardar algo del cuarto). */
  now?: boolean
  /** Para resaltarlo, por ejemplo cuando se va a poner una cosa. */
  className?: string
}

export type SceneHandle = {
  /** Camina hasta esa cosa y luego hace lo que le toca. */
  goTo: (id: string) => void
  /** Camina hasta ese cuadrito o, si está ocupado, al libre más cercano al que pueda llegar. */
  goToTile: (r: number, c: number, then?: () => void) => void
  pose: (pose: Pose) => void
  /** Dónde está parada ahorita. */
  petTile: () => Tile
}

/** Lo que cabe en pantalla, en unidades del lienzo. `cover` es lo que tapa la plática por abajo. */
export type View = { width: number; height: number; cover?: number }

type Props = {
  grid: Grid
  width: number
  height: number
  /** Dónde empieza el lienzo a la izquierda, para recortar las orillas vacías. */
  left?: number
  label: string
  tileFill: (r: number, c: number) => string
  things: Thing[]
  /** Lo que va detrás de todo (las paredes del cuarto, el cielo de la plaza). */
  back?: ReactNode
  /** Lo que va sobre el piso y debajo de las cosas. */
  ground?: ReactNode
  /** Lo que va encima de todo y no atrapa toques (la lluvia). Con cámara, se queda en la pantalla. */
  front?: ReactNode
  pet: { look: CompanionLook; mood: CompanionMood; name: string }
  start: Tile
  /** Antes de caminar: si devuelve true, el toque ya se atendió (poner una cosa en el cuarto). */
  onTile?: (r: number, c: number, free: boolean, petAt: Tile) => boolean
  /** Con esto, el mundo va con cámara (ver arriba). */
  view?: View
  /** Cuadritos que no se pisan aunque no haya nada encima (el agua). */
  isBlocked?: (r: number, c: number) => boolean
  /** Cada vez que la mascota llega a un cuadrito nuevo (y al empezar). */
  onStep?: (r: number, c: number) => void
  ref?: Ref<SceneHandle>
}

const STEP_MS = 220
const PET_SIZE = 56
/** Lo que se asoma por arriba de la última fila (lo alto) y el aire de las orillas. */
const TALL = 150
const EDGE = 28
/** Lo que hay que mover el dedo para que cuente como arrastre y no como toque. */
const DRAG_PX = 8

type Point = { x: number; y: number }

export default function IsoScene({
  grid,
  width,
  height,
  left = 0,
  label,
  tileFill,
  things,
  back,
  ground,
  front,
  pet,
  start,
  onTile,
  view,
  isBlocked,
  onStep,
  ref,
}: Props) {
  const blocked = useMemo(() => {
    const set = blockedBy(grid.n, things)
    if (isBlocked)
      for (let r = 0; r < grid.n; r++) for (let c = 0; c < grid.n; c++) if (isBlocked(r, c)) set.add(tileKey(grid.n, r, c))
    return set
  }, [grid.n, things, isBlocked])
  const latest = useRef(things)
  latest.current = things

  const [sx, sy] = tileXY(grid, start[0], start[1])
  const at = useRef({ r: start[0], c: start[1], x: sx, y: sy })
  const [depth, setDepth] = useState(start[0] + start[1])
  const [face, setFace] = useState(1)
  const [pose, setPose] = useState<{ kind: Pose | 'walk' | null; n: number }>({ kind: null, n: 0 })
  const petEl = useRef<SVGGElement | null>(null)
  const bobEl = useRef<SVGGElement | null>(null)
  const walkId = useRef(0)
  const stepped = useRef(onStep)
  stepped.current = onStep

  // La cámara: la esquina de arriba a la izquierda de lo que se ve, en unidades del lienzo.
  const camEl = useRef<SVGGElement | null>(null)
  const cam = useRef<Point>({ x: 0, y: 0 })
  const viewRef = useRef(view)
  viewRef.current = view
  /** Si sigue a la mascota; si no, va hacia `aim` (o se queda donde la dejó el dedo). */
  const follow = useRef(true)
  const aim = useRef<Point | null>(null)
  const loop = useRef(0)
  const lastT = useRef(0)
  const [away, setAway] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; from: Point; moved: boolean } | null>(null)
  const dragged = useRef(false)

  useEffect(
    () => () => {
      walkId.current++
      cancelAnimationFrame(loop.current)
    },
    [],
  )

  // Al empezar, quien escucha sabe dónde está la mascota (para el mapa y las zonas).
  useEffect(() => {
    stepped.current?.(at.current.r, at.current.c)
  }, [])

  const fit = (p: Point): Point => {
    const v = viewRef.current
    if (!v) return p
    const half = (grid.n * TILE_W) / 2
    const x0 = grid.ox - half - EDGE
    const x1 = grid.ox + half + EDGE
    const y0 = grid.oy - TALL
    const y1 = grid.oy + grid.n * TILE_H + EDGE + (v.cover ?? 0)
    const one = (q: number, lo: number, hi: number, size: number) => (hi - lo <= size ? (lo + hi - size) / 2 : Math.min(Math.max(q, lo), hi - size))
    return { x: one(p.x, x0, x1, v.width), y: one(p.y, y0, y1, v.height) }
  }

  /** Dónde debe ir la cámara para que la mascota quede al centro de lo que se alcanza a ver. */
  const onPet = (): Point => {
    const v = viewRef.current!
    return fit({ x: at.current.x - v.width / 2, y: at.current.y - PET_SIZE / 2 - (v.height - (v.cover ?? 0)) / 2 })
  }

  const showCam = () => camEl.current?.setAttribute('transform', `translate(${(-cam.current.x).toFixed(1)} ${(-cam.current.y).toFixed(1)})`)

  const tick = (t: number) => {
    loop.current = 0
    const goal = follow.current ? onPet() : aim.current
    if (!goal) return
    const dt = lastT.current ? Math.min(64, t - lastT.current) : 16
    const k = still() ? 1 : 1 - Math.exp(-dt / 150)
    const c = cam.current
    c.x += (goal.x - c.x) * k
    c.y += (goal.y - c.y) * k
    if (Math.abs(goal.x - c.x) < 0.4 && Math.abs(goal.y - c.y) < 0.4) {
      cam.current = goal
      lastT.current = 0
      showCam()
      return
    }
    lastT.current = t
    showCam()
    loop.current = requestAnimationFrame(tick)
  }

  /** Pone la cámara en marcha si estaba quieta. */
  const nudge = () => {
    if (viewRef.current && !loop.current) loop.current = requestAnimationFrame(tick)
  }

  /** De un salto, sin acercarse poco a poco (al empezar, al cambiar el tamaño, con movimiento reducido). */
  const jumpCam = () => {
    if (!viewRef.current) return
    cancelAnimationFrame(loop.current)
    loop.current = 0
    lastT.current = 0
    cam.current = follow.current ? onPet() : fit(aim.current ?? cam.current)
    showCam()
  }

  useLayoutEffect(jumpCam, [view?.width, view?.height, view?.cover])

  const backToPet = () => {
    follow.current = true
    aim.current = null
    setAway(false)
    if (still()) jumpCam()
    else nudge()
  }

  const place = (bob = 0) => {
    petEl.current?.setAttribute('transform', `translate(${at.current.x.toFixed(1)} ${at.current.y.toFixed(1)})`)
    bobEl.current?.setAttribute('transform', `translate(0 ${(-bob).toFixed(1)})`)
  }

  const walk = (path: Tile[] | null, done?: () => void) => {
    const id = ++walkId.current
    if (!path || path.length < 2) {
      setPose((p) => (p.kind === 'walk' ? { kind: null, n: p.n } : p))
      done?.()
      return
    }
    // Al volver a caminar, la cámara regresa con la mascota.
    if (viewRef.current && !follow.current) {
      follow.current = true
      aim.current = null
      setAway(false)
    }
    setPose((p) => ({ kind: 'walk', n: p.n }))
    if (still()) {
      const [r, c] = path[path.length - 1]
      const [x, y] = tileXY(grid, r, c)
      const [x0] = tileXY(grid, at.current.r, at.current.c)
      if (x !== x0) setFace(x > x0 ? 1 : -1)
      at.current = { r, c, x, y }
      place()
      jumpCam()
      setDepth(r + c)
      setPose((p) => ({ kind: null, n: p.n }))
      stepped.current?.(r, c)
      done?.()
      return
    }
    // En los caminos largos da pasos más rápidos, para que cruzar el barrio no canse.
    const ms = Math.max(110, Math.min(STEP_MS, 5000 / path.length))
    let i = 1
    const step = () => {
      if (id !== walkId.current) return
      const now = at.current
      if (i >= path.length) {
        setDepth(now.r + now.c)
        setPose((p) => ({ kind: null, n: p.n }))
        place()
        done?.()
        return
      }
      const [r, c] = path[i++]
      const [x0, y0] = [now.x, now.y]
      const [x1, y1] = tileXY(grid, r, c)
      if (Math.abs(x1 - x0) > 0.5) setFace(x1 > x0 ? 1 : -1)
      setDepth(Math.max(now.r + now.c, r + c))
      at.current = { ...now, r, c }
      stepped.current?.(r, c)
      const t0 = performance.now()
      const frame = (t: number) => {
        if (id !== walkId.current) return
        const k = Math.min(1, (t - t0) / ms)
        at.current.x = x0 + (x1 - x0) * k
        at.current.y = y0 + (y1 - y0) * k
        place(Math.sin(k * Math.PI) * 3)
        if (follow.current) nudge()
        if (k < 1) requestAnimationFrame(frame)
        else step()
      }
      requestAnimationFrame(frame)
    }
    step()
  }

  const from = (): Tile => [at.current.r, at.current.c]

  const approach = (thing: Thing) => {
    if (thing.now) return thing.onTap?.()
    const path = findPath(grid.n, blocked, from(), besides(thing))
    walk(path, () => {
      const [tx] = tileXY(grid, thing.r, thing.c)
      if (Math.abs(tx - at.current.x) > 0.5) setFace(tx > at.current.x ? 1 : -1)
      // Lo que tocaba puede haber cambiado mientras caminaba: se busca otra vez.
      latest.current.find((t) => t.id === thing.id)?.onTap?.()
    })
  }

  useImperativeHandle(ref, () => ({
    goTo: (id) => {
      const thing = latest.current.find((t) => t.id === id)
      if (thing) approach(thing)
    },
    goToTile: (r, c, then) => {
      // Si ese cuadrito está ocupado, el libre más cercano; poco a poco más lejos.
      for (let d = 0; d <= 6; d++) {
        const path = findPath(grid.n, blocked, from(), (rr, cc) => Math.max(Math.abs(rr - r), Math.abs(cc - c)) <= d)
        if (path) return walk(path, then)
      }
      then?.()
    },
    pose: (kind) => {
      walkId.current++
      place()
      setDepth(at.current.r + at.current.c)
      setPose((p) => ({ kind, n: p.n + 1 }))
    },
    petTile: from,
  }))

  const tapTile = (r: number, c: number) => {
    const free = isFree(grid.n, blocked, r, c)
    if (onTile?.(r, c, free, from())) return
    if (!free) return
    walk(findPath(grid.n, blocked, from(), (rr, cc) => rr === r && cc === c))
  }

  const keyTap = (e: KeyboardEvent, thing: Thing) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    approach(thing)
  }

  /** Con el teclado: si lo que tiene el foco quedó fuera de la vista, la cámara va a verlo. */
  const lookAt = (e: FocusEvent, thing: Thing) => {
    const v = viewRef.current
    if (!v || !(e.currentTarget as Element).matches(':focus-visible')) return
    const [x, y] = tileXY(grid, thing.r, thing.c)
    const c = cam.current
    const m = 48
    if (x > c.x + m && x < c.x + v.width - m && y - 40 > c.y + m && y < c.y + v.height - (v.cover ?? 0) - m) return
    follow.current = false
    aim.current = fit({ x: x - v.width / 2, y: y - 40 - (v.height - (v.cover ?? 0)) / 2 })
    setAway(true)
    if (still()) jumpCam()
    else nudge()
  }

  // Los manejadores cambian en cada vuelta; lo dibujado (que no cambia) los llama por aquí.
  const handlers = useRef({ tapTile, approach, keyTap, lookAt })
  handlers.current = { tapTile, approach, keyTap, lookAt }

  // El piso no se vuelve a dibujar mientras la mascota camina: solo si cambian sus colores.
  const fills: string[] = []
  for (let r = 0; r < grid.n; r++) for (let c = 0; c < grid.n; c++) fills.push(tileFill(r, c))
  const fillKey = fills.join(' ')
  const tiles = useMemo(() => {
    const out = []
    for (let r = 0; r < grid.n; r++)
      for (let c = 0; c < grid.n; c++)
        out.push(<polygon key={`${r}-${c}`} className="b-tile" data-r={r} data-c={c} points={tilePoints(grid, r, c)} fill={fills[r * grid.n + c]} />)
    return (
      <g
        onClick={(e: MouseEvent) => {
          const el = e.target as SVGElement
          const r = el.dataset?.r
          const c = el.dataset?.c
          if (r !== undefined && c !== undefined) handlers.current.tapTile(Number(r), Number(c))
        }}
      >
        {out}
      </g>
    )
  }, [grid.n, grid.ox, grid.oy, fillKey])

  // Atrás primero: fila + columna. Las cosas se ordenan una vez; la mascota, a la misma altura,
  // va delante de lo que tenga a su lado.
  const order = useMemo(
    () =>
      things
        .map((t) => ({ t, d: t.r + t.c }))
        .sort((a, b) => a.d - b.d)
        .map(({ t, d }) => {
          const [x, y] = tileXY(grid, t.r, t.c)
          const tappable = !!t.onTap
          const el = (
            <g
              key={t.id}
              transform={`translate(${x} ${y})`}
              className={`b-thing${tappable ? ' tap' : ''}${t.className ? ` ${t.className}` : ''}`}
              {...(tappable
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': t.label,
                    onClick: (e: MouseEvent) => {
                      e.stopPropagation()
                      handlers.current.approach(t)
                    },
                    onKeyDown: (e: KeyboardEvent) => handlers.current.keyTap(e, t),
                    onFocus: (e: FocusEvent) => handlers.current.lookAt(e, t),
                  }
                : { 'aria-hidden': true })}
            >
              {t.art}
            </g>
          )
          return { d, el }
        }),
    [things, grid.ox, grid.oy],
  )
  let cut = 0
  while (cut < order.length && order[cut].d <= depth) cut++

  const poseClass = pose.kind ? ` ${pose.kind}` : ''

  const petNode = (
    <g
      key="pet"
      className="b-pet"
      ref={(el) => {
        petEl.current = el
        if (el) el.setAttribute('transform', `translate(${at.current.x.toFixed(1)} ${at.current.y.toFixed(1)})`)
      }}
    >
      <ellipse rx="15" ry="5" fill="#000" opacity=".12" />
      <g ref={bobEl}>
        <g key={pose.n} className={`b-pose${poseClass}`}>
          <g transform={`scale(${face} 1)`}>
            <g transform={`translate(${-PET_SIZE / 2} ${-PET_SIZE * 0.95})`}>
              <CompanionView look={pet.look} mood={pet.mood} size={PET_SIZE} name={pet.name} />
            </g>
          </g>
        </g>
      </g>
    </g>
  )

  const world = (
    <>
      {back}
      {tiles}
      {ground}
      <g>
        {order.slice(0, cut).map((o) => o.el)}
        {petNode}
        {order.slice(cut).map((o) => o.el)}
      </g>
    </>
  )

  if (!view)
    return (
      <svg className="b-scene" viewBox={`${left} 0 ${width} ${height}`} role="group" aria-label={label}>
        {world}
        {front && <g className="b-front">{front}</g>}
      </svg>
    )

  // Arrastrar para mirar: solo cuenta pasando unos pixeles, y entonces ya no es un toque.
  const down = (e: PointerEvent<SVGSVGElement>) => {
    dragged.current = false
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (drag.current && drag.current.id !== e.pointerId) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: { ...cam.current }, moved: false }
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_PX) return
      d.moved = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
      cancelAnimationFrame(loop.current)
      loop.current = 0
      lastT.current = 0
      follow.current = false
      setAway(true)
    }
    const box = e.currentTarget.getBoundingClientRect()
    const v = viewRef.current!
    const scale = Math.max(v.width / box.width, v.height / box.height)
    cam.current = fit({ x: d.from.x - dx * scale, y: d.from.y - dy * scale })
    aim.current = cam.current
    showCam()
  }
  const up = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (d.moved) dragged.current = true
    drag.current = null
  }

  return (
    <div className="b-cam">
      <svg
        className="b-scene"
        viewBox={`0 0 ${view.width} ${view.height}`}
        role="group"
        aria-label={label}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          if (!dragged.current) return
          dragged.current = false
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <g
          ref={(el) => {
            camEl.current = el
            if (el) showCam()
          }}
        >
          {world}
        </g>
        {front && <g className="b-front">{front}</g>}
      </svg>
      {away && (
        <button type="button" className="chip b-back" onClick={backToPet}>
          Volver a {pet.name}
        </button>
      )}
    </div>
  )
}
