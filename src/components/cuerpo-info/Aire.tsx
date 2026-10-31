import type { CSSProperties } from 'react'

// La cadena del aire: al respirar rápido, las burbujitas de CO₂ salen de la sangre y se
// escapan con el aire; el nivel de CO₂ baja y llegan el mareo y el hormigueo. Al soltar el aire
// despacio regresan, el nivel sube y todo se apaga. Fuentes: MedlinePlus (hiperventilación);
// Meuret y Ritz 2010, Int J Psychophysiol.

type Mode = 'rapido' | 'cadena' | 'lento'

const BUBBLES = [0, 1, 2, 3, 4, 5, 6, 7]
/** Cuánto CO₂ queda en la sangre en cada momento (para el medidor). */
const LEVEL: Record<Mode, number> = { rapido: 0.45, cadena: 0.35, lento: 0.85 }
/** Cuáles burbujas ya se fueron cuando el nivel está bajo. */
const GONE = new Set([1, 2, 4, 6, 7])
/** Qué hacen esas burbujas: se van, ya no están o regresan. */
const MOVED: Record<Mode, string> = { rapido: 'leaving', cadena: 'gone', lento: 'back' }

export default function Aire({ mode }: { mode: Mode }) {
  return (
    <svg className="ci-svg" viewBox="0 0 320 160">
      <g className="ci-lungs">
        <path className="ci-airway" d="M100 8 V40 M100 40 q-10 6 -18 14 M100 40 q10 6 18 14" />
        <path className="ci-lung" d="M90 46 C70 40 46 60 44 86 C42 102 56 106 72 102 C86 98 92 86 92 70 Z" />
        <path className="ci-lung" d="M110 46 C130 40 154 60 156 86 C158 102 144 106 128 102 C114 98 108 86 108 70 Z" />
      </g>
      <rect className="ci-blood" x="16" y="114" width="190" height="24" rx="12" />
      <text className="ci-label" x="20" y="154">
        sangre
      </text>
      {BUBBLES.map((i) => {
        const x = 32 + i * 22
        return (
          <circle
            key={`${mode}-${i}`}
            className={`ci-bubble${GONE.has(i) ? ` ${MOVED[mode]}` : ''}`}
            cx={x}
            cy="126"
            r="6"
            style={{ '--dx': `${100 - x}px`, '--i': i } as CSSProperties}
          />
        )
      })}
      <g className="ci-meter">
        <text className="ci-label" x="238" y="14" textAnchor="middle">
          CO₂
        </text>
        <rect className="ci-tube" x="228" y="22" width="20" height="116" rx="10" />
        <rect
          className="ci-fill"
          x="231"
          y="25"
          width="14"
          height="110"
          rx="7"
          style={{ transform: `scaleY(${LEVEL[mode]})` }}
        />
      </g>
      <g className="ci-head" transform="translate(286 44)">
        <circle r="16" />
        <path className="ci-swirl" d="M-12 -26 c4 -8 18 -8 22 0 c-4 6 -14 6 -16 0 c2 -3 7 -3 9 0" />
      </g>
      <g className="ci-hand" transform="translate(284 104)">
        <path d="M-12 18 V-2 c0 -4 6 -4 6 0 V-10 c0 -4 6 -4 6 0 V-12 c0 -4 6 -4 6 0 V-8 c0 -4 6 -4 6 0 V10 c0 6 -4 8 -10 8 Z" />
        <circle className="ci-tingle" cx="-9" cy="-10" r="2" />
        <circle className="ci-tingle" cx="3" cy="-20" r="2" />
        <circle className="ci-tingle" cx="12" cy="-14" r="2" />
      </g>
    </svg>
  )
}
