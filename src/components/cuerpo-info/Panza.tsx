import type { CSSProperties } from 'react'

// Intestino y cerebro, ida y vuelta: un circuito con un carril que baja (de la cabeza a la
// panza) y otro que sube. Con el estrés, el estómago se frena y el intestino se acelera; en
// calma, los dos vuelven a su ritmo. Fuentes: Harvard Health («The gut-brain connection»);
// Taché y Bonaz 2007, J Clin Invest.

type Mode = 'baja' | 'sube' | 'ambas' | 'calma'

const DOTS = [0, 1, 2]

function Lane({ x, dir, on }: { x: number; dir: 'down' | 'up'; on: boolean }) {
  const [y1, y2] = dir === 'down' ? [58, 96] : [96, 58]
  const tip = dir === 'down' ? `M${x - 5} 92 l5 6 5 -6` : `M${x - 5} 62 l5 -6 5 6`
  return (
    <g className={`ci-lane ${dir}${on ? ' on' : ''}`}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <path className="ci-tip" d={tip} />
      {on &&
        DOTS.map((i) => <circle key={i} className="ci-signal" cx={x} cy={y1} r="3.5" style={{ '--i': i } as CSSProperties} />)}
    </g>
  )
}

export default function Panza({ mode }: { mode: Mode }) {
  const down = mode !== 'sube'
  const up = mode !== 'baja'
  const words = mode === 'calma' ? ['a su ritmo', 'a su ritmo'] : ['se frena', 'se acelera']
  return (
    <svg className={`ci-svg ci-gut ${mode}`} viewBox="0 0 320 170">
      <g className="ci-brain" transform="translate(160 32)">
        <circle r="24" />
        <path d="M-12 -4 c4 -8 10 -8 12 0 c2 -8 10 -8 12 0 M-10 8 c4 -4 8 -4 10 0 c2 -4 8 -4 10 0" />
      </g>
      <Lane x={142} dir="down" on={down} />
      <Lane x={178} dir="up" on={up} />
      <path
        className="ci-stomach"
        d="M136 102 C150 100 158 112 156 126 C154 142 134 150 118 146 C102 142 98 128 106 120 C112 114 122 118 128 112 C132 108 130 103 136 102 Z"
      />
      <path className="ci-colon" d="M172 160 V122 C172 112 178 106 188 106 H222 C232 106 238 112 238 122 V160" />
      <path className="ci-colon-wave" d="M172 160 V122 C172 112 178 106 188 106 H222 C232 106 238 112 238 122 V160" />
      <text className="ci-label" x="100" y="158" textAnchor="end">
        {words[0]}
      </text>
      <text className="ci-label" x="246" y="150">
        {words[1]}
      </text>
    </svg>
  )
}
