import { type KeyboardEvent, type PointerEvent, type Ref, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { readWindow, saveWindow } from '../../lib/sentido'

// La ventana empañada: lo que no sale se siente como ver la vida tras un vidrio con vaho.
// Detrás está el barrio de noche, con su papel picado, sus faroles y una ventana con luz.
// Se limpia con el dedo (o con Enter, un pedazo a la vez) y cada paso cumplido despeja un
// pedazo en espiral. Lo limpio se guarda en coordenadas de 0 a 1, así sobrevive a cambiar de
// tamaño, y se queda todo el día. Con movimiento reducido el pedazo aparece de una vez, y
// fuera de pantalla no se anima nada: la espiral espera a que la ventana se vea.

type Point = [number, number, number]
export type VentanaHandle = { patch: () => void }

type Props = {
  still: boolean
  /** Lo que la mascota dice al limpiar con la mano; los pasos traen su propia frase. */
  onTalk: (text: string) => void
  ref?: Ref<VentanaHandle>
}

// Lo que dice la mascota conforme se ve más. Pendiente de revisión con psicóloga.
const LINES: [number, string][] = [
  [0.08, 'Así, poquito a poquito. Lo que limpias se queda limpio hoy.'],
  [0.3, 'Ya se ven las luces del barrio. Siguen ahí aunque hoy cueste verlas.'],
  [0.6, 'Mira cuánto se ve ya. Lo que sientes no tiene que salir de una forma especial para que cuente.'],
]

// Números al azar fijos, para que la escena y el vaho salgan iguales cada vez que se redibujan.
let seed = 7
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const STARS = Array.from({ length: 30 }, () => [rnd(), rnd() * 0.34, rnd() * 1.1 + 0.4])
const FAR = Array.from({ length: 16 }, () => [rnd(), rnd()])
const SPECKS = Array.from({ length: 260 }, () => [rnd(), rnd(), rnd() * 2 + 0.4, rnd()])

// Las casas: color, dónde empieza, ancho y altura del techo (fracciones del cuadro).
const HOUSES: [string, number, number, number][] = [
  ['#e9a7a0', -0.01, 0.2, 0.6],
  ['#f2cf7b', 0.19, 0.16, 0.55],
  ['#9cc9b5', 0.35, 0.2, 0.62],
  ['#c7a6d6', 0.55, 0.15, 0.56],
  ['#f0a86a', 0.7, 0.14, 0.6],
  ['#8fb3dd', 0.84, 0.17, 0.57],
]
const PAPEL = ['#e46a8f', '#f0c25a', '#5f9e82', '#6d8cc7', '#f0915c', '#b394dd']
const GROUND = 0.86

/** El barrio de noche. Los colores son de la escena (no cambian con el tema): es un dibujo. */
function drawScene(c: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  const sky = c.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#18204a')
  sky.addColorStop(0.45, '#2f3266')
  sky.addColorStop(0.7, '#5b4878')
  sky.addColorStop(0.9, '#a4687a')
  c.fillStyle = sky
  c.fillRect(0, 0, W, H)

  c.fillStyle = 'rgba(255,248,230,.85)'
  for (const [x, y, r] of STARS) {
    c.beginPath()
    c.arc(x * W, y * H, r * dpr, 0, 7)
    c.fill()
  }
  // La luna, con su halo.
  const mx = W * 0.83
  const my = H * 0.13
  const mr = H * 0.055
  const halo = c.createRadialGradient(mx, my, mr, mx, my, mr * 3.2)
  halo.addColorStop(0, 'rgba(251,241,214,.35)')
  halo.addColorStop(1, 'rgba(251,241,214,0)')
  c.fillStyle = halo
  c.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8)
  c.fillStyle = '#fbf1d6'
  c.beginPath()
  c.arc(mx, my, mr, 0, 7)
  c.fill()

  // Los cerros, con lucecitas de casas lejanas.
  c.fillStyle = '#3d3662'
  c.beginPath()
  c.moveTo(0, H * 0.5)
  c.quadraticCurveTo(W * 0.22, H * 0.38, W * 0.48, H * 0.5)
  c.quadraticCurveTo(W * 0.74, H * 0.4, W, H * 0.48)
  c.lineTo(W, H)
  c.lineTo(0, H)
  c.fill()
  c.fillStyle = 'rgba(255,214,140,.8)'
  for (const [x, y] of FAR) {
    const fx = x * W
    const fy = H * (0.5 + y * 0.08)
    c.fillRect(fx, fy, 1.6 * dpr, 1.6 * dpr)
  }

  // El papel picado que cruza la calle, con sus agujeritos.
  c.strokeStyle = 'rgba(255,255,255,.55)'
  c.lineWidth = dpr
  c.beginPath()
  c.moveTo(0, H * 0.24)
  c.quadraticCurveTo(W / 2, H * 0.36, W, H * 0.24)
  c.stroke()
  const fw = W * 0.026
  const fh = H * 0.075
  for (let i = 0; i < 13; i++) {
    const t = (i + 0.5) / 13
    const x = t * W
    const y = H * 0.24 + Math.sin(t * Math.PI) * H * 0.06
    c.fillStyle = PAPEL[i % PAPEL.length]
    c.beginPath()
    c.moveTo(x - fw, y)
    c.lineTo(x + fw, y)
    c.lineTo(x + fw, y + fh)
    c.lineTo(x + fw / 2, y + fh * 0.88)
    c.lineTo(x, y + fh)
    c.lineTo(x - fw / 2, y + fh * 0.88)
    c.lineTo(x - fw, y + fh)
    c.closePath()
    c.fill()
    c.fillStyle = 'rgba(30,32,80,.55)'
    for (const [dx, dy] of [[-0.45, 0.3], [0.45, 0.3], [0, 0.55]]) {
      const hx = x + dx * fw
      const hy = y + dy * fh
      const s = fw * 0.22
      c.beginPath()
      c.moveTo(hx, hy - s)
      c.lineTo(hx + s, hy)
      c.lineTo(hx, hy + s)
      c.lineTo(hx - s, hy)
      c.fill()
    }
  }

  // La banqueta y la calle.
  const gy = H * GROUND
  c.fillStyle = '#5f5470'
  c.fillRect(0, gy, W, H * 0.05)
  c.fillStyle = '#3a3350'
  c.fillRect(0, gy + H * 0.05, W, H)
  c.fillStyle = 'rgba(255,255,255,.12)'
  c.fillRect(0, gy + H * 0.05, W, dpr)

  // Las casas: fachada, cornisa, puerta y ventanas; casi todas con luz.
  HOUSES.forEach(([color, x, w, top], i) => {
    const hx = x * W
    const hw = w * W
    const ty = H * top
    const hh = gy - ty
    c.fillStyle = color
    c.fillRect(hx, ty, hw + 1, hh)
    c.fillStyle = 'rgba(25,22,60,.4)'
    c.fillRect(hx, ty, hw + 1, hh)
    c.fillStyle = 'rgba(255,255,255,.14)'
    c.fillRect(hx - W * 0.004, ty - H * 0.012, hw + W * 0.008, H * 0.018)

    // La puerta, de madera y con arco.
    const dw = Math.max(hw * 0.2, W * 0.03)
    const dh = hh * 0.42
    const dx = hx + hw * 0.5 - dw / 2
    const dy = gy - dh
    c.fillStyle = '#5a3a2c'
    c.beginPath()
    c.moveTo(dx, gy)
    c.lineTo(dx, dy + dw / 2)
    c.arc(dx + dw / 2, dy + dw / 2, dw / 2, Math.PI, 0)
    c.lineTo(dx + dw, gy)
    c.fill()
    c.fillStyle = '#f0c25a'
    c.beginPath()
    c.arc(dx + dw * 0.78, dy + dh * 0.6, Math.max(1, dw * 0.06), 0, 7)
    c.fill()

    // Ventanas de arriba; una se queda a oscuras, para que no todo brille igual.
    const n = Math.max(1, Math.round(hw / (W * 0.07)))
    const ww = W * 0.034
    const wh = H * 0.065
    const wy = ty + hh * 0.16
    for (let k = 0; k < n; k++) {
      const wx = hx + (hw * (k + 0.5)) / n - ww / 2
      const lit = (i * 2 + k) % 4 !== 1
      if (lit) {
        const glow = c.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww * 1.6)
        glow.addColorStop(0, 'rgba(255,210,130,.35)')
        glow.addColorStop(1, 'rgba(255,210,130,0)')
        c.fillStyle = glow
        c.fillRect(wx - ww * 1.6, wy - ww * 1.6, ww * 4.2, wh + ww * 3.2)
      }
      c.fillStyle = lit ? '#ffd98a' : '#3b3352'
      c.fillRect(wx, wy, ww, wh)
      c.fillStyle = 'rgba(60,40,30,.5)'
      c.fillRect(wx + ww / 2 - dpr / 2, wy, dpr, wh)
    }
  })

  // La ventana con más luz, en la casa verde: un gato mira la calle desde ahí.
  const [, x2, w2, t2] = HOUSES[2]
  const lx = (x2 + w2 * 0.2) * W
  const ly = H * t2 + (gy - H * t2) * 0.5
  const lw = W * 0.05
  const lh = H * 0.08
  const big = c.createRadialGradient(lx + lw / 2, ly + lh / 2, 0, lx + lw / 2, ly + lh / 2, lw * 2)
  big.addColorStop(0, 'rgba(255,220,150,.5)')
  big.addColorStop(1, 'rgba(255,220,150,0)')
  c.fillStyle = big
  c.fillRect(lx - lw * 2, ly - lw * 2, lw * 5, lh + lw * 4)
  c.fillStyle = '#ffe3a3'
  c.fillRect(lx, ly, lw, lh)
  c.fillStyle = '#2b2440'
  const cx = lx + lw * 0.55
  const cb = ly + lh
  c.beginPath()
  c.ellipse(cx, cb - lh * 0.2, lw * 0.22, lh * 0.22, 0, 0, 7)
  c.fill()
  c.beginPath()
  c.arc(cx, cb - lh * 0.5, lw * 0.13, 0, 7)
  c.fill()
  c.beginPath()
  c.moveTo(cx - lw * 0.12, cb - lh * 0.56)
  c.lineTo(cx - lw * 0.1, cb - lh * 0.72)
  c.lineTo(cx - lw * 0.02, cb - lh * 0.6)
  c.moveTo(cx + lw * 0.12, cb - lh * 0.56)
  c.lineTo(cx + lw * 0.1, cb - lh * 0.72)
  c.lineTo(cx + lw * 0.02, cb - lh * 0.6)
  c.fill()
  c.strokeStyle = '#2b2440'
  c.lineWidth = Math.max(1, lw * 0.06)
  c.beginPath()
  c.moveTo(cx + lw * 0.18, cb - lh * 0.08)
  c.quadraticCurveTo(cx + lw * 0.42, cb - lh * 0.1, cx + lw * 0.36, cb - lh * 0.34)
  c.stroke()
  c.fillStyle = '#5a3a2c'
  c.fillRect(lx - lw * 0.1, cb, lw * 1.2, H * 0.008)

  // Dos faroles en la banqueta, con su luz en el piso.
  for (const fx of [0.33, 0.68]) {
    const px = fx * W
    const base = gy + H * 0.04
    const top = base - H * 0.24
    const pool = c.createRadialGradient(px, base, 0, px, base, W * 0.09)
    pool.addColorStop(0, 'rgba(255,214,140,.35)')
    pool.addColorStop(1, 'rgba(255,214,140,0)')
    c.fillStyle = pool
    c.fillRect(px - W * 0.1, base - H * 0.05, W * 0.2, H * 0.1)
    const glow = c.createRadialGradient(px, top, 0, px, top, H * 0.12)
    glow.addColorStop(0, 'rgba(255,214,140,.55)')
    glow.addColorStop(1, 'rgba(255,214,140,0)')
    c.fillStyle = glow
    c.fillRect(px - H * 0.13, top - H * 0.13, H * 0.26, H * 0.26)
    c.fillStyle = '#231d33'
    c.fillRect(px - dpr, top, dpr * 2.2, base - top)
    c.fillRect(px - W * 0.008, base - H * 0.012, W * 0.016, H * 0.012)
    c.fillStyle = '#ffe2a0'
    c.beginPath()
    c.moveTo(px - W * 0.012, top - H * 0.035)
    c.lineTo(px + W * 0.012, top - H * 0.035)
    c.lineTo(px + W * 0.008, top)
    c.lineTo(px - W * 0.008, top)
    c.fill()
    c.fillStyle = '#231d33'
    c.fillRect(px - W * 0.015, top - H * 0.042, W * 0.03, H * 0.008)
  }
}

/** Lo que limpia un dedo: un círculo con la orilla suave. */
function dab(c: CanvasRenderingContext2D, W: number, H: number, [x, y, s]: Point) {
  const r = Math.min(W, H) * 0.075 * s
  const g = c.createRadialGradient(x * W, y * H, 0, x * W, y * H, r)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(0.6, 'rgba(0,0,0,.85)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = g
  c.beginPath()
  c.arc(x * W, y * H, r, 0, 7)
  c.fill()
}

/** Un pedazo que se despeja solo: una espiral suave alrededor de un punto. */
function spiral([cx, cy]: [number, number]): Point[] {
  const n = 40
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const a = t * Math.PI * 3
    const r = 0.065 * t
    return [+(cx + Math.cos(a) * r).toFixed(3), +(cy + Math.sin(a) * r * 1.25).toFixed(3), +(1.5 - t * 0.4).toFixed(2)]
  })
}

// Lo que se guarda se redondea a una cuadrícula fina: pasar el dedo dos veces por el mismo
// lugar no hace crecer lo guardado.
const cell = ([x, y, s]: Point) => `${Math.round(x * 70)}:${Math.round(y * 70)}:${s}`

export default function Ventana({ still, onTalk, ref }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLCanvasElement>(null)
  const fogRef = useRef<HTMLCanvasElement>(null)
  // Todo lo que cambia mientras se limpia vive en refs: así no se redibuja React a cada dedazo.
  const s = useRef({
    W: 0,
    H: 0,
    dpr: 1,
    wipes: readWindow() as Point[],
    cells: new Set<string>(),
    said: -1,
    primed: false,
    down: false,
    last: null as [number, number] | null,
    tick: 0,
    visible: true,
    queue: [] as { pts: Point[]; say: boolean }[],
    centers: [] as [number, number][],
    raf: 0,
  })
  const [hint, setHint] = useState(() => s.current.wipes.length === 0)
  const talk = useRef(onTalk)
  useEffect(() => {
    talk.current = onTalk
  }, [onTalk])

  const fog = () => fogRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const drawFog = () => {
    const c = fog()
    const box = fogRef.current
    if (!c || !box) return
    const { W, H, dpr, wipes } = s.current
    const css = getComputedStyle(box)
    c.globalCompositeOperation = 'source-over'
    c.clearRect(0, 0, W, H)
    c.globalAlpha = 0.94
    c.fillStyle = css.getPropertyValue('--ns-frost').trim() || '#e9eef0'
    c.fillRect(0, 0, W, H)
    c.fillStyle = css.getPropertyValue('--ns-frost-edge').trim() || '#cfd9dd'
    for (const [x, y, r, a] of SPECKS) {
      c.globalAlpha = 0.25 + a * 0.5
      c.beginPath()
      c.arc(x * W, y * H, r * dpr, 0, 7)
      c.fill()
    }
    c.globalAlpha = 1
    c.globalCompositeOperation = 'destination-out'
    for (const p of wipes) dab(c, W, H, p)
  }

  /** Cuánto se ve ya: se cuenta en una cuadrícula chica, no pixel por pixel. */
  const clearFrac = () => {
    const c = fog()
    const { W, H } = s.current
    if (!c || !W) return 0
    const d = c.getImageData(0, 0, W, H).data
    let clear = 0
    let n = 0
    for (let gy = 0; gy < 18; gy++)
      for (let gx = 0; gx < 24; gx++) {
        const i = (Math.floor(((gy + 0.5) / 18) * H) * W + Math.floor(((gx + 0.5) / 24) * W)) * 4 + 3
        n++
        if (d[i] < 90) clear++
      }
    return clear / n
  }

  /** La mascota comenta al cruzar cada umbral; `say` en falso solo los marca como dichos. */
  const progress = (say: boolean) => {
    const f = clearFrac()
    if (f > 0.03) setHint(false)
    const st = s.current
    let line: string | null = null
    while (st.said + 1 < LINES.length && f >= LINES[st.said + 1][0]) {
      st.said++
      line = LINES[st.said][1]
    }
    if (say && line) talk.current(line)
  }

  const record = (p: Point) => {
    const st = s.current
    const k = cell(p)
    if (st.cells.has(k)) return
    st.cells.add(k)
    st.wipes.push(p)
  }

  /** El lugar más empañado entre unos cuantos al azar, lejos de los pedazos que faltan por animar. */
  const foggiest = (): [number, number] | null => {
    const c = fog()
    const { W, H, centers } = s.current
    if (!c || !W) return null
    const d = c.getImageData(0, 0, W, H).data
    let best: [number, number] | null = null
    let bv = -1
    for (let k = 0; k < 48; k++) {
      const x = 0.12 + Math.random() * 0.76
      const y = 0.12 + Math.random() * 0.76
      if (centers.some(([px, py]) => Math.hypot(px - x, py - y) < 0.16)) continue
      const v = d[(Math.floor(y * H) * W + Math.floor(x * W)) * 4 + 3]
      if (v > bv) {
        bv = v
        best = [x, y]
      }
    }
    return best
  }

  // La espiral se dibuja un punto por cuadro, y solo mientras la ventana se ve.
  const run = () => {
    const st = s.current
    if (st.raf || !st.visible || !st.queue.length) return
    const step = () => {
      const c = fog()
      const batch = st.queue[0]
      if (!c || !batch || !st.visible) {
        st.raf = 0
        return
      }
      dab(c, st.W, st.H, batch.pts.shift()!)
      if (!batch.pts.length) {
        st.queue.shift()
        st.centers.shift()
        progress(batch.say)
      }
      st.raf = st.queue.length ? requestAnimationFrame(step) : 0
    }
    st.raf = requestAnimationFrame(step)
  }

  const patch = (say: boolean) => {
    const st = s.current
    const center = foggiest()
    if (!center) return
    const pts = spiral(center)
    pts.forEach(record)
    saveWindow(st.wipes)
    const c = fog()
    if (still || !c) {
      if (c) pts.forEach((p) => dab(c, st.W, st.H, p))
      progress(say)
      return
    }
    st.queue.push({ pts: [...pts], say })
    st.centers.push(center)
    run()
  }

  useImperativeHandle(ref, () => ({ patch: () => patch(false) }))

  useEffect(() => {
    const win = box.current
    const scene = sceneRef.current
    const glass = fogRef.current
    if (!win || !scene || !glass) return
    const st = s.current
    st.wipes.forEach((p) => st.cells.add(cell(p)))

    const size = () => {
      const b = win.getBoundingClientRect()
      st.dpr = Math.min(2, window.devicePixelRatio || 1)
      st.W = Math.round(b.width * st.dpr)
      st.H = Math.round(b.height * st.dpr)
      if (!st.W || !st.H) return
      for (const cv of [scene, glass]) {
        cv.width = st.W
        cv.height = st.H
      }
      const sc = scene.getContext('2d')
      if (sc) drawScene(sc, st.W, st.H, st.dpr)
      drawFog()
      // Lo ya dicho al abrir no se repite: la mascota solo comenta lo nuevo.
      if (!st.primed) {
        st.primed = true
        progress(false)
      }
    }
    const ro = new ResizeObserver(size)
    ro.observe(win)

    const dark = window.matchMedia('(prefers-color-scheme: dark)')
    const retheme = () => drawFog()
    dark.addEventListener('change', retheme)

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => {
        st.visible = e.isIntersecting
        if (st.visible) run()
      }, { threshold: 0.35 })
      io.observe(win)
    }
    return () => {
      ro.disconnect()
      io?.disconnect()
      dark.removeEventListener('change', retheme)
      cancelAnimationFrame(st.raf)
      st.raf = 0
    }
    // Se monta una vez; lo que cambia se lee de los refs.
  }, [])

  const at = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const b = e.currentTarget.getBoundingClientRect()
    return [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height]
  }
  const wipe = (p: [number, number]) => {
    const c = fog()
    if (!c) return
    const pt: Point = [+p[0].toFixed(3), +p[1].toFixed(3), 1]
    dab(c, s.current.W, s.current.H, pt)
    record(pt)
  }
  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const st = s.current
    st.down = true
    e.currentTarget.setPointerCapture(e.pointerId)
    st.last = at(e)
    wipe(st.last)
  }
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const st = s.current
    if (!st.down || !st.last) return
    const p = at(e)
    const dx = p[0] - st.last[0]
    const dy = p[1] - st.last[1]
    const steps = Math.ceil(Math.hypot(dx, dy) / 0.02)
    for (let i = 1; i <= steps; i++) wipe([st.last[0] + (dx * i) / steps, st.last[1] + (dy * i) / steps])
    st.last = p
    if (++st.tick % 8 === 0) progress(true)
  }
  const onUp = () => {
    const st = s.current
    if (!st.down) return
    st.down = false
    st.last = null
    saveWindow(st.wipes)
    progress(true)
  }
  const onKey = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    patch(true)
  }

  return (
    <div className="ns-win" ref={box}>
      <canvas ref={sceneRef} aria-hidden="true" />
      <canvas
        ref={fogRef}
        className="ns-fog"
        tabIndex={0}
        role="button"
        aria-label="Una ventana empañada con el barrio detrás. Arrastra el dedo para limpiarla; con el teclado, Enter limpia un pedazo."
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      />
      <div className="ns-mullion" aria-hidden="true" />
      <p className={`ns-win-hint${hint ? '' : ' gone'}`} aria-hidden="true">
        pasa el dedo
      </p>
    </div>
  )
}
