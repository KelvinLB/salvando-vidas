import type { CSSProperties } from 'react'

// Dos alarmas. La rápida (adrenalina) es un chispazo que sube en segundos y se gasta en
// minutos. La lenta (cortisol) sigue el día: alta al despertar, baja en la noche; con semanas de
// estrés la curva se aplana y de noche no baja tanto. Sin números en los ejes: se ve la forma,
// no un resultado de laboratorio. Fuentes: Harvard Health (respuesta al estrés); Fries et al.
// 2009, Int J Psychophysiol (ritmo del cortisol).

type Mode = 'chispazo' | 'dia' | 'semanas'

const SPARK = 'M16 104 H70 C80 104 84 28 96 28 C112 28 124 92 170 100 C210 106 260 104 304 104'
const DAY = 'M24 92 C34 46 46 30 60 32 C100 38 160 88 214 104 C246 112 276 104 304 84'
const WEEKS = 'M24 90 C36 68 48 60 62 62 C104 68 160 80 214 84 C246 86 276 84 304 78'

/** Un puntito que recorre la curva, como el paso de las horas. */
function Walker({ d, slow }: { d: string; slow?: boolean }) {
  return <circle className={`ci-walker${slow ? ' slow' : ''}`} r="5" style={{ offsetPath: `path('${d}')` } as CSSProperties} />
}

export default function Alarmas({ mode }: { mode: Mode }) {
  if (mode === 'chispazo') {
    return (
      <svg className="ci-svg" viewBox="0 0 320 140">
        <line className="ci-base" x1="16" y1="104" x2="304" y2="104" />
        <path key="spark" className="ci-curve ci-draw loop tone-alarma" d={SPARK} pathLength={1} />
        <path className="ci-spark" d="M96 -2 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path className="ci-bracket" d="M70 116 v4 H96 v-4" />
        <path className="ci-bracket" d="M98 116 v4 H230 v-4" />
        <text className="ci-label" x="83" y="134" textAnchor="middle">
          segundos
        </text>
        <text className="ci-label" x="164" y="134" textAnchor="middle">
          minutos
        </text>
      </svg>
    )
  }
  const weeks = mode === 'semanas'
  return (
    <svg className="ci-svg" viewBox="0 0 320 140">
      <rect className="ci-night" x="200" y="10" width="110" height="102" rx="12" />
      <g className="ci-sun" transform="translate(34 18)">
        <circle r="6" />
        <path d="M0 -11 v3 M0 8 v3 M-11 0 h3 M8 0 h3 M-8 -8 l2 2 M6 6 l2 2 M-8 8 l2 -2 M6 -6 l2 -2" />
      </g>
      <path className="ci-moon" d="M292 14 a9 9 0 1 0 8 13 a7 7 0 1 1 -8 -13z" />
      <line className="ci-base" x1="20" y1="112" x2="304" y2="112" />
      {weeks ? (
        <>
          <path className="ci-curve ci-ghost" d={DAY} />
          <path key="weeks" className="ci-curve ci-draw tone-estres" d={WEEKS} pathLength={1} />
          <path className="ci-rise tone-estres" d="M240 106 V92 m-4 4 l4 -4 4 4" />
          <Walker d={WEEKS} slow />
        </>
      ) : (
        <>
          <path key="day" className="ci-curve ci-draw tone-calma" d={DAY} pathLength={1} />
          <Walker d={DAY} />
        </>
      )}
      <text className="ci-label" x="20" y="130">
        Despiertas
      </text>
      <text className="ci-label" x="130" y="130" textAnchor="middle">
        Tarde
      </text>
      <text className="ci-label" x="255" y="130" textAnchor="middle">
        Noche
      </text>
      {weeks && (
        <g className="ci-legend" transform="translate(210 40)">
          <line className="ci-ghost" x1="0" y1="0" x2="16" y2="0" />
          <text x="20" y="4">de siempre</text>
          <line className="tone-estres" x1="0" y1="16" x2="16" y2="16" />
          <text x="20" y="20">con estrés</text>
        </g>
      )}
    </svg>
  )
}
