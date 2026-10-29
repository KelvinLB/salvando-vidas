import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CompanionView from './Companion'
import type { CompanionLook, CompanionMood } from '../data/companion'
import { still } from '../lib/petfx'

// Lo que comparten los lugares de Salir del hueco (el hueco, el faro y los faroles): las nubes,
// la gente, las etiquetas escritas a mano y la mascota, que brinca cada vez que avanza y
// respira con su aro.

/** Números al azar que siempre salen iguales, para que la lluvia o las piedras no brinquen. */
export function seeded(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g className="hole-cloud" transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="-12" cy="2" r="10" />
      <circle cx="2" cy="-4" r="13" />
      <circle cx="16" cy="2" r="9" />
      <rect x="-22" y="2" width="46" height="11" rx="5.5" />
    </g>
  )
}

/** Alguien de pie, con los pies en `y`. */
export function Person({ x, y, warm, small, className = '' }: { x: number; y: number; warm?: boolean; small?: boolean; className?: string }) {
  const r = small ? 6.5 : 7
  const h = small ? 17 : 18
  const half = small ? 8 : 9
  return (
    <g transform={`translate(${x} ${y})`} className={`hole-person${warm ? ' warm' : ''} ${className}`.trim()}>
      <circle cy={-h - r - 2} r={r} />
      <path d={`M${-half} 0 Q${-half} ${-h} 0 ${-h} Q${half} ${-h} ${half} 0 Z`} />
    </g>
  )
}

/**
 * Una etiqueta con lo que hizo la persona, escrito a mano. Mide `w` y, si la palabra no cabe,
 * crece hasta `max` desde su orilla (`left` o `right`) o desde el centro. Con `bounds`, se
 * recorre hacia adentro antes de salirse de esas orillas.
 */
export function Tag({
  x,
  y,
  w,
  max = 132,
  text,
  fresh,
  anchor,
  bounds,
}: {
  x: number
  y: number
  w: number
  max?: number
  text: string
  fresh: boolean
  anchor: 'left' | 'right' | 'center'
  bounds?: [number, number]
}) {
  const label = useRef<SVGTextElement>(null)
  const [long, setLong] = useState(0)
  useLayoutEffect(() => {
    let live = true
    const measure = () => live && label.current && setLong(Math.ceil(label.current.getComputedTextLength()) + 16)
    measure()
    // La letra a mano llega después: se vuelve a medir con ella.
    void document.fonts?.ready.then(measure)
    return () => {
      live = false
    }
  }, [text])
  const width = Math.min(max, Math.max(w, long))
  const free = anchor === 'left' ? x : anchor === 'right' ? x + w - width : x + (w - width) / 2
  const left = bounds ? Math.min(Math.max(free, bounds[0]), bounds[1] - width) : free
  return (
    <g className={fresh ? 'hole-ledge new' : 'hole-ledge'}>
      <rect className="hole-slab" x={left} y={y} width={width} height="18" rx="5" />
      <text
        ref={label}
        className="hole-slab-label"
        x={left + width / 2}
        y={y + 14}
        {...(long > width ? { textLength: width - 12, lengthAdjust: 'spacingAndGlyphs' } : {})}
      >
        {text}
      </text>
    </g>
  )
}

/** Brinca cada vez que cambia de lugar (no al abrir la pantalla). */
export function useHop(spot: string) {
  const hopper = useRef<SVGGElement>(null)
  const last = useRef(spot)
  useEffect(() => {
    if (last.current === spot) return
    last.current = spot
    if (still()) return
    hopper.current?.animate(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-22px)', offset: 0.4 },
        { transform: 'translateY(2px)', offset: 0.7 },
        { transform: 'translateY(0)' },
      ],
      { duration: 1000, easing: 'ease-out' },
    )
  }, [spot])
  return hopper
}

/**
 * La mascota en su lugar, con los pies en `at`. `scale` la achica cuando va lejos, y `echo` le
 * pone el eco de cuando está a solas.
 */
export function ScenePet({
  at,
  scale = 1,
  look,
  mood,
  name,
  echo,
  className = '',
}: {
  at: { x: number; y: number }
  scale?: number
  look: CompanionLook
  mood: CompanionMood
  name: string
  echo?: boolean
  className?: string
}) {
  const hopper = useHop(`${at.x},${at.y}`)
  return (
    <g className="hole-mover" style={{ transform: `translate(${at.x}px, ${at.y}px) scale(${scale})` }}>
      <g className={className}>
        <g ref={hopper}>
          {echo && (
            <g className="hole-echo">
              {[0, 1, 2].map((i) => (
                <circle key={i} cx="0" cy="-36" r="40" />
              ))}
            </g>
          )}
          <circle className="hole-ring" cx="0" cy="-36" r="46" />
          <g transform="translate(-37 -70)">
            <CompanionView look={look} mood={mood} size={74} name={name} />
          </g>
        </g>
      </g>
    </g>
  )
}
