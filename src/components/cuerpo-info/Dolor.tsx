import type { CSSProperties } from 'react'

// El volumen del dolor: la señal del cuerpo pasa por una perilla antes de sentirse. Con el
// ánimo bajo la perilla se queda alta y la misma señal se siente más grande; al moverse o
// dormir mejor, baja. Sin rojos ni puntos de dolor alarmantes. Fuente: Bair et al. 2003, Arch
// Intern Med (depresión y dolor comparten vías).

type Mode = 'medio' | 'alto' | 'bajo'

const TURN: Record<Mode, number> = { bajo: -100, medio: 0, alto: 100 }
const FELT: Record<Mode, number> = { bajo: 0.55, medio: 1, alto: 1.5 }
const TICKS = Array.from({ length: 11 }, (_, i) => -135 + i * 27)
const DOTS = [0, 1, 2]

export default function Dolor({ mode }: { mode: Mode }) {
  return (
    <svg className={`ci-svg ci-pain ${mode}`} viewBox="0 0 320 140" style={{ '--felt': FELT[mode] } as CSSProperties}>
      <line className="ci-wire" x1="24" y1="70" x2="96" y2="70" />
      <line className="ci-wire" x1="164" y1="70" x2="236" y2="70" />
      <circle className="ci-source" cx="22" cy="70" r="5" />
      {DOTS.map((i) => (
        <circle key={`in${i}`} className="ci-signal in" cx="28" cy="70" r="3.5" style={{ '--i': i } as CSSProperties} />
      ))}
      {DOTS.map((i) => (
        <circle key={`out${i}`} className="ci-signal out" cx="168" cy="70" r="3.5" style={{ '--i': i } as CSSProperties} />
      ))}
      <g transform="translate(130 70)">
        {TICKS.map((a) => (
          <line key={a} className="ci-tick" x1="0" y1="-40" x2="0" y2="-45" transform={`rotate(${a})`} />
        ))}
        <circle className="ci-knob" r="32" />
        <g className="ci-pointer" style={{ transform: `rotate(${TURN[mode]}deg)` }}>
          <line x1="0" y1="-8" x2="0" y2="-24" />
        </g>
        <text className="ci-label" x="-38" y="52" textAnchor="middle">
          bajo
        </text>
        <text className="ci-label" x="38" y="52" textAnchor="middle">
          alto
        </text>
      </g>
      <circle className="ci-felt-ring" cx="266" cy="70" r="20" />
      <circle className="ci-felt" cx="266" cy="70" r="20" />
      <text className="ci-label" x="22" y="96" textAnchor="middle">
        señal
      </text>
      <text className="ci-label" x="266" y="128" textAnchor="middle">
        lo que se siente
      </text>
    </svg>
  )
}
