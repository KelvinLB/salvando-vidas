// En cámara lenta: una figura sencilla que camina. Con la depresión los pasos son cortos y
// lentos (las huellas quedan juntas); cuando el ritmo regresa, los pasos se alargan. Sin caras
// tristes ni caídas: solo el ritmo. Fuente: NIMH, folleto de la depresión («sentirse más lento»).

type Mode = 'lento' | 'vuelve'

const GAP: Record<Mode, number> = { lento: 20, vuelve: 36 }

export default function Lento({ mode }: { mode: Mode }) {
  const gap = GAP[mode]
  const prints = Array.from({ length: Math.floor(270 / gap) + 1 }, (_, i) => 26 + i * gap)
  return (
    <svg className={`ci-svg ci-walk ${mode}`} viewBox="0 0 320 120">
      <line className="ci-base" x1="10" y1="100" x2="310" y2="100" />
      {prints.map((x, i) => (
        <ellipse key={`${mode}-${x}`} className="ci-print" cx={x} cy={i % 2 ? 108 : 105} rx="5" ry="2.2" />
      ))}
      <g className="ci-figure" key={mode}>
        <g transform="translate(0 100)">
          <g className="ci-lean">
            <line className="ci-limb leg b" x1="0" y1="-30" x2="0" y2="-2" />
            <line className="ci-limb leg a" x1="0" y1="-30" x2="0" y2="-2" />
            <rect className="ci-torso" x="-8" y="-58" width="16" height="32" rx="8" />
            <line className="ci-limb arm a" x1="0" y1="-52" x2="0" y2="-32" />
            <line className="ci-limb arm b" x1="0" y1="-52" x2="0" y2="-32" />
            <circle className="ci-noggin" cy="-70" r="10" />
          </g>
        </g>
      </g>
    </svg>
  )
}
