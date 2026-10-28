import { useEffect, useRef, useState } from 'react'
import PageHeader from '../../components/PageHeader'

const COLORS = ['#7cc6b8', '#f6c47a', '#f2a3a3', '#a7b8f0', '#c8a7e8', '#ffffff']

type Point = { x: number; y: number; t: number; color: string; size: number }
const FADE_MS = 6000

export default function Pizarra() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Point[][]>([])
  const drawing = useRef<Point[] | null>(null)
  const [color, setColor] = useState(COLORS[0])
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const el = canvas.current!
    const ctx = el.getContext('2d')!
    let frame = 0

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      el.width = el.clientWidth * ratio
      el.height = el.clientHeight * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      const now = performance.now()
      ctx.clearRect(0, 0, el.width, el.height)
      if (fade) {
        strokes.current = strokes.current.filter((s) => now - s[s.length - 1].t < FADE_MS)
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const stroke of strokes.current) {
        const last = stroke[stroke.length - 1]
        ctx.globalAlpha = fade ? Math.max(0, 1 - (now - last.t) / FADE_MS) : 1
        ctx.strokeStyle = last.color
        ctx.lineWidth = last.size
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (const p of stroke) ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [fade])

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: performance.now(),
      color,
      size: 10,
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Pizarra zen"
        subtitle="Dibuja lo que quieras. Los trazos se desvanecen solos, como los pensamientos."
      />

      <canvas
        ref={canvas}
        className="zen-canvas"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drawing.current = [point(e)]
          strokes.current.push(drawing.current)
        }}
        onPointerMove={(e) => drawing.current?.push(point(e))}
        onPointerUp={() => (drawing.current = null)}
        onPointerCancel={() => (drawing.current = null)}
        aria-label="Lienzo para dibujar"
      />

      <div className="row spread">
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${c === color ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <label className="toggle">
          <input type="checkbox" role="switch" checked={fade} onChange={(e) => setFade(e.target.checked)} />
          Desvanecer
        </label>
      </div>
      <button className="btn ghost" onClick={() => (strokes.current = [])}>
        Limpiar
      </button>
    </div>
  )
}
