// La escalera del sueño (un hipnograma sencillo): de izquierda a derecha pasa la noche, y la
// línea baja y sube por los escalones. En una noche tranquila, el sueño profundo llega al
// principio; con estrés hay más despertares, menos profundo y el de los sueños (REM) llega
// antes. Es un dibujo de cómo suele ser, no la medición de nadie. Fuentes: Riemann et al. 2020,
// Neuropsychopharmacology; Palagini et al. 2013, Sleep Med Rev.

type Mode = 'tranquila' | 'estres'

/** Altura de cada escalón: despierto, sueños (REM), ligero y profundo. */
const ROW = [26, 52, 78, 104]
const NAMES = ['Despierto', 'Sueños', 'Ligero', 'Profundo']
const X0 = 72

/** La noche, como tramos [escalón, hasta dónde llega]. */
const NIGHTS: Record<Mode, [number, number][]> = {
  tranquila: [
    [0, 78], [2, 86], [3, 128], [2, 140], [1, 154], [2, 164], [3, 190], [2, 204],
    [1, 224], [2, 236], [3, 246], [2, 256], [1, 282], [2, 294], [0, 308],
  ],
  estres: [
    [0, 84], [2, 98], [3, 108], [2, 114], [1, 136], [0, 144], [2, 160], [1, 184],
    [2, 192], [0, 202], [2, 224], [1, 250], [0, 260], [2, 282], [1, 298], [0, 308],
  ],
}

function stairs(night: [number, number][]) {
  let d = `M${X0} ${ROW[night[0][0]]}`
  for (const [level, until] of night) d += ` V${ROW[level]} H${until}`
  return d
}

export default function Sueno({ mode }: { mode: Mode }) {
  const night = NIGHTS[mode]
  // Dónde empieza cada tramo, para pintar debajo los de sueño profundo y los de sueños.
  const spans = night.map(([level, until], i) => ({ level, from: i === 0 ? X0 : night[i - 1][1], until }))
  return (
    <svg className="ci-svg" viewBox="0 0 320 150">
      {ROW.map((y, i) => (
        <g key={y}>
          <line className="ci-row" x1={X0} y1={y} x2="308" y2={y} />
          <text className="ci-label" x={X0 - 8} y={y + 4} textAnchor="end">
            {NAMES[i]}
          </text>
        </g>
      ))}
      {spans
        .filter((s) => s.level === 1 || s.level === 3)
        .map((s) => (
          <rect
            key={`${mode}-${s.from}`}
            className={`ci-stage ${s.level === 3 ? 'deep' : 'rem'}`}
            x={s.from}
            y={ROW[s.level] - 6}
            width={s.until - s.from}
            height="12"
            rx="6"
          />
        ))}
      <path key={mode} className={`ci-curve ci-draw ci-stairs ${mode}`} d={stairs(night)} pathLength={1} />
      <path className="ci-moon" d="M78 124 a7 7 0 1 0 6 10 a5.5 5.5 0 1 1 -6 -10z" />
      <text className="ci-label" x="92" y="138">
        Te duermes
      </text>
      <text className="ci-label" x="308" y="138" textAnchor="end">
        Despiertas
      </text>
    </svg>
  )
}
