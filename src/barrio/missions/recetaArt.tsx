import type { ReactNode } from 'react'

// Los dibujos de «La receta de Don Fermín»: los ingredientes de la alacena, el tazón, la masa,
// las tres piezas (concha, cuernito y oreja) en cada paso y el horno de leña. Los colores del pan
// y de la comida se quedan iguales de día y de noche, como en la vida; la madera y el fondo salen
// de las variables de la app (missions.css).

export type IngId = 'harina' | 'azucar' | 'mantequilla' | 'huevo' | 'levadura' | 'leche' | 'chile' | 'jitomate' | 'frijol'
export type Shape = 'concha' | 'cuernito' | 'oreja'
export type Costra = 'vainilla' | 'chocolate' | 'fresa'

export const COSTRA: Record<Costra, { label: string; fill: string; line: string }> = {
  vainilla: { label: 'Vainilla', fill: '#f6e6bd', line: '#d9bf86' },
  chocolate: { label: 'Chocolate', fill: '#7a4e33', line: '#4f3020' },
  fresa: { label: 'Fresa', fill: '#f2a7bd', line: '#d9809c' },
}

const DOUGH = { fill: '#f1dcc0', line: '#d6b993' }
const BAKED = { fill: '#d9954f', line: '#a9682f' }

/** Cada ingrediente, en una cajita de 40 × 40 con el centro en 0,0. */
export const ING_ART: Record<IngId, ReactNode> = {
  harina: (
    <>
      <path d="M-11 -12 q11 -5 22 0 l3 22 q-14 5 -28 0z" fill="#f3efe6" stroke="#c8beb0" strokeWidth="1.2" />
      <path d="M-11 -12 q11 3 22 0" stroke="#c8beb0" strokeWidth="1.2" fill="none" />
      <path d="M0 -5 v13 M0 -2 l-3 -3 M0 -2 l3 -3 M0 2 l-3 -3 M0 2 l3 -3" stroke="#d9b26a" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  azucar: (
    <>
      <rect x="-10" y="-8" width="20" height="19" rx="4" fill="#dfe3f1" stroke="#9fb0cf" strokeWidth="1.2" />
      <rect x="-8" y="-13" width="16" height="5" rx="1.5" fill="#4c6fb5" />
      <g fill="#fdfcfa" stroke="#b9b0a4" strokeWidth=".6">
        <rect x="-6" y="2" width="5" height="5" rx="1" />
        <rect x="1" y="3" width="5" height="5" rx="1" />
        <rect x="-3" y="-4" width="5" height="5" rx="1" />
      </g>
    </>
  ),
  mantequilla: (
    <>
      <ellipse cy="9" rx="15" ry="4" fill="#fdfcfa" stroke="#c8beb0" />
      <path d="M-11 7 v-9 h18 v9z" fill="#f6d77a" stroke="#d9b24a" />
      <path d="M-11 -2 l5 -5 h18 l-5 5z" fill="#fbe7a1" stroke="#d9b24a" />
      <path d="M7 7 v-9 l5 -5 v9z" fill="#ecc75c" stroke="#d9b24a" />
    </>
  ),
  huevo: (
    <>
      <ellipse cx="-5" cy="2" rx="7" ry="9" fill="#f6e7d0" stroke="#d9c3a3" />
      <ellipse cx="6" cy="4" rx="6.5" ry="8.5" fill="#fbf3e6" stroke="#d9c3a3" />
    </>
  ),
  levadura: (
    <>
      <rect x="-10" y="-8" width="20" height="17" rx="3" fill="#d9b98e" stroke="#a7764f" strokeWidth="1.2" />
      <g fill="none" stroke="#fdfcfa" strokeWidth="1.2">
        <circle cx="-4" cy="-1" r="2.4" />
        <circle cx="4" cy="2" r="3" />
        <circle cx="-1" cy="5" r="1.6" />
      </g>
      <path d="M-4 -12 v-3 M2 -12 v-4 M7 -12 v-2" stroke="#a7764f" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  leche: (
    <>
      <path d="M8 -4 q7 0 7 6 q0 6 -7 6" stroke="#9fb0cf" strokeWidth="2.2" fill="none" />
      <path d="M-9 -12 h15 l3 6 v16 q0 2 -2 2 h-17 q-2 0 -2 -2 v-16z" fill="#fdfcfa" stroke="#9fb0cf" strokeWidth="1.2" />
      <rect x="-11" y="0" width="20" height="5" fill="#6d8cc7" />
    </>
  ),
  chile: (
    <>
      <path d="M-9 -7 q3 -3 7 -1 q11 6 8 18 q-1 3 -3 0 q-2 -10 -12 -17z" fill="#d6453d" />
      <path d="M-9 -7 q-3 -4 1 -8" stroke="#4f8a4a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M-3 -6 q5 3 6 9" stroke="#fdfcfa" strokeWidth="1.2" fill="none" opacity=".5" strokeLinecap="round" />
    </>
  ),
  jitomate: (
    <>
      <circle cy="2" r="11" fill="#e0533f" />
      <path d="M0 -9 l-6 -2 l4 4 l-4 3 l5 -2 l1 4 l1 -4 l5 2 l-4 -3 l4 -4z" fill="#4f8a4a" />
      <path d="M-6 0 q0 -4 3 -6" stroke="#fdfcfa" strokeWidth="1.4" fill="none" opacity=".55" strokeLinecap="round" />
    </>
  ),
  frijol: (
    <>
      <path d="M-13 -3 h26 q1 15 -13 15 q-14 0 -13 -15z" fill="#c8714a" stroke="#9a5a3c" />
      <g fill="#5a3226">
        <ellipse cx="-6" cy="-5" rx="3.4" ry="2.2" />
        <ellipse cx="1" cy="-6" rx="3.4" ry="2.2" transform="rotate(-20 1 -6)" />
        <ellipse cx="7" cy="-4.5" rx="3.2" ry="2.1" />
      </g>
      <path d="M-14 -3 h28" stroke="#9a5a3c" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
}

/** El tazón de barro; lo que ya está en la mesa se asoma por arriba. */
export function Tazon({ inside }: { inside: IngId[] }) {
  return (
    <svg className="bm-rc-bowl-art" viewBox="-70 -46 140 80" aria-hidden="true" focusable="false">
      <ellipse cy="30" rx="54" ry="6" fill="#000" opacity=".1" />
      {inside.map((id, i) => {
        const x = -40 + (80 / Math.max(1, inside.length - 1 || 1)) * i
        return (
          <g key={id} transform={`translate(${inside.length === 1 ? 0 : x} ${-14 - (i % 2) * 7}) scale(.8)`}>
            {ING_ART[id]}
          </g>
        )
      })}
      <path d="M-60 -10 h120 q-4 42 -60 42 q-56 0 -60 -42z" fill="#c8714a" />
      <path d="M-60 -10 h120" stroke="#9a5a3c" strokeWidth="5" strokeLinecap="round" />
      <path d="M-46 4 q46 14 92 0" stroke="#f2c14e" strokeWidth="2.4" fill="none" opacity=".8" />
      <path d="M-40 12 q40 11 80 0" stroke="#fdfcfa" strokeWidth="1.4" fill="none" strokeDasharray="2 5" opacity=".7" />
    </svg>
  )
}

/** Un contorno cerrado y suave alrededor de una elipse; `rough` le pone grumos. */
export function blob(rx: number, ry: number, rough: number, seed: number, n = 24) {
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n
    const k = 1 + rough * (0.6 * Math.sin(5 * t + seed) + 0.4 * Math.sin(9 * t + 2 * seed))
    return [rx * k * Math.cos(t), ry * k * Math.sin(t)] as const
  })
  const at = (i: number) => pts[(i + n) % n]
  let d = `M${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

/** La masa sobre la tabla: con cada amasada se alisa (de 0, grumosa, a 1, lisita). */
export function Masa({ smooth, kneads }: { smooth: number; kneads: number }) {
  return (
    <svg className="bm-rc-art" viewBox="-160 -70 320 140" aria-hidden="true" focusable="false">
      <rect className="bm-rc-board" x="-130" y="-34" width="260" height="92" rx="14" />
      <path className="bm-rc-board-line" d="M-120 40 h240" />
      <g fill="#fdfcfa" opacity=".8">
        <circle cx="-98" cy="-14" r="2" />
        <circle cx="-86" cy="30" r="1.5" />
        <circle cx="92" cy="-8" r="2.2" />
        <circle cx="104" cy="26" r="1.4" />
        <circle cx="78" cy="36" r="1.8" />
      </g>
      <ellipse cy="40" rx={70 + smooth * 6} ry="8" fill="#000" opacity=".08" />
      <g key={kneads} className={kneads ? 'bm-rc-squish' : undefined} transform="translate(0 6)">
        <path d={blob(64 + smooth * 6, 34 - smooth * 2, 0.14 * (1 - smooth) + 0.015, kneads * 1.7)} fill={DOUGH.fill} stroke={DOUGH.line} strokeWidth="2" />
        <path d={`M-30 -14 q30 ${-8 + smooth * 4} 60 0`} stroke="#fdfcfa" strokeWidth="3" fill="none" opacity={0.25 + smooth * 0.5} strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** Una pieza de pan en su paso (0 a 3); `baked`: ya salió del horno. Centro en 0,0, unos 90 × 50. */
export function Pieza({ shape, step, costra = 'vainilla', baked = false }: { shape: Shape; step: number; costra?: Costra; baked?: boolean }) {
  const c = baked ? BAKED : DOUGH
  const top = COSTRA[costra]
  if (shape === 'concha') {
    if (step === 0) return <path d={blob(26, 20, 0.12, 1)} fill={c.fill} stroke={c.line} strokeWidth="2" />
    return (
      <>
        <path d="M-34 12 Q-34 -24 0 -24 Q34 -24 34 12 Q0 18 -34 12Z" fill={c.fill} stroke={c.line} strokeWidth="2" />
        {step >= 2 && <path d="M-31 5 Q-31 -24 0 -24 Q31 -24 31 5 Q0 12 -31 5Z" fill={top.fill} stroke={top.line} strokeWidth="1.5" />}
        {step >= 3 && (
          <path
            d="M0 8 Q-2 -8 0 -23 M0 8 Q-12 -6 -17 -20 M0 8 Q-20 -2 -28 -10 M0 8 Q12 -6 17 -20 M0 8 Q20 -2 28 -10"
            stroke={top.line}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </>
    )
  }
  if (shape === 'cuernito') {
    if (step === 0) return <path d="M-34 14 L34 14 L0 -20Z" fill={c.fill} stroke={c.line} strokeWidth="2" strokeLinejoin="round" />
    if (step === 1) return <path d="M-44 14 L44 14 L0 -14Z" fill={c.fill} stroke={c.line} strokeWidth="2" strokeLinejoin="round" />
    // Enrollado: un rollito con sus vueltas; al final se doblan las puntas como lunita.
    if (step === 2)
      return (
        <>
          <path d="M-44 4 Q-44 -6 -30 -9 Q0 -16 30 -9 Q44 -6 44 4 Q44 12 30 12 Q0 16 -30 12 Q-44 12 -44 4Z" fill={c.fill} stroke={c.line} strokeWidth="2" />
          <path d="M-26 -10 Q-30 2 -26 12 M-10 -13 Q-14 2 -10 15 M6 -13 Q2 2 6 15 M22 -11 Q18 2 22 13" stroke={c.line} strokeWidth="1.6" fill="none" />
        </>
      )
    return (
      <>
        <path d="M-44 12 C-42 -8 -22 -24 0 -24 C22 -24 42 -8 44 12 C38 15 31 6 24 1 C14 -6 -14 -6 -24 1 C-31 6 -38 15 -44 12Z" fill={c.fill} stroke={c.line} strokeWidth="2" strokeLinejoin="round" />
        <path d="M-30 4 Q-32 -6 -26 -14 M-15 -4 Q-16 -14 -11 -21 M0 -6 V-23 M15 -4 Q16 -14 11 -21 M30 4 Q32 -6 26 -14" stroke={c.line} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </>
    )
  }
  // La oreja: hojaldre estirado, azúcar, doblado al centro y abierto como corazón.
  if (step <= 1)
    return (
      <>
        <rect x={step ? -44 : -36} y={step ? -12 : -15} width={step ? 88 : 72} height={step ? 24 : 30} rx="5" fill={c.fill} stroke={c.line} strokeWidth="2" />
        {step === 1 && (
          <g fill="#fdfcfa">
            {[-34, -22, -10, 2, 14, 26, 36].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 5 : -4} r="1.8" />
            ))}
          </g>
        )}
      </>
    )
  if (step === 2)
    return (
      <>
        <rect x="-30" y="-14" width="29" height="28" rx="13" fill={c.fill} stroke={c.line} strokeWidth="2" />
        <rect x="1" y="-14" width="29" height="28" rx="13" fill={c.fill} stroke={c.line} strokeWidth="2" />
        <path d="M-16 0 m-6 0 a6 6 0 1 0 6 -6 M16 0 m6 0 a6 6 0 1 1 -6 -6" stroke={c.line} strokeWidth="1.6" fill="none" />
      </>
    )
  return (
    <>
      <path d="M0 18 C-34 12 -42 -16 -20 -20 C-9 -21 -2 -13 0 -6 C2 -13 9 -21 20 -20 C42 -16 34 12 0 18Z" fill={c.fill} stroke={c.line} strokeWidth="2" />
      <path d="M-18 -2 m-8 0 a8 8 0 1 0 8 -8 a5 5 0 1 0 -5 5 M18 -2 m8 0 a8 8 0 1 1 -8 -8 a5 5 0 1 1 5 5" stroke={c.line} strokeWidth="1.6" fill="none" />
      <g fill="#fdfcfa" opacity=".85">
        <circle cx="-26" cy="6" r="1.4" />
        <circle cx="24" cy="4" r="1.4" />
        <circle cx="-4" cy="10" r="1.2" />
      </g>
    </>
  )
}

/** La pieza en su lugar de trabajo: la tabla, con la pieza grande al centro. */
export function Formando({ shape, step, costra }: { shape: Shape; step: number; costra: Costra }) {
  return (
    <svg className="bm-rc-art" viewBox="-160 -70 320 140" aria-hidden="true" focusable="false">
      <rect className="bm-rc-board" x="-130" y="-34" width="260" height="92" rx="14" />
      <path className="bm-rc-board-line" d="M-120 40 h240" />
      <ellipse cy="34" rx="62" ry="7" fill="#000" opacity=".08" />
      <g key={`${shape}-${step}`} className="bm-rc-squish" transform="translate(0 10) scale(1.6)">
        <Pieza shape={shape} step={step} costra={costra} />
      </g>
    </svg>
  )
}

/**
 * El horno de leña: la charola espera afuera hasta que entra; adentro, la pieza crece y se dora
 * con cada vez que la persona se asoma (`peek`, de 0 a 1). `out`: ya salió, calientita.
 */
export function Horno({ shape, costra, inside, peek, out }: { shape: Shape; costra: Costra; inside: boolean; peek: number; out: boolean }) {
  const lit = inside || out
  return (
    <svg className={`bm-rc-art bm-rc-oven${lit ? ' lit' : ''}`} viewBox="-160 -114 320 200" aria-hidden="true" focusable="false">
      <path className="bm-rc-floor" d="M-160 62 H160" />
      <g transform="translate(-40 0)">
      {/* La chimenea y su humito. */}
      <rect x="40" y="-80" width="18" height="40" rx="3" fill="#9a5a3c" />
      {lit && (
        <g className="bm-rc-smoke" fill="none" stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" opacity=".5">
          <path d="M49 -84 q-6 -6 0 -12 q6 -6 0 -12" />
        </g>
      )}
      {/* El domo de ladrillo. */}
      <path d="M-104 62 V8 A104 78 0 0 1 104 8 V62Z" fill="#c8714a" />
      <path
        d="M-104 30 H104 M-100 -6 H100 M-80 -38 H80 M-60 30 V62 M-20 -6 V30 M30 30 V62 M70 -6 V30 M-40 -38 V-6 M20 -38 V-6"
        stroke="#9a5a3c"
        strokeWidth="2"
        fill="none"
        opacity=".7"
      />
      {/* La boca: oscura de día y de noche; prendida, brilla en naranja suave. */}
      <path d="M-50 62 V28 A50 40 0 0 1 50 28 V62Z" fill="#3a2b22" />
      {lit && <path className="bm-rc-fire" d="M-50 62 V28 A50 40 0 0 1 50 28 V62Z" fill="#f2a54a" />}
      {inside && !out && (
        <g transform={`translate(0 ${40 - peek * 2}) scale(${0.7 + peek * 0.18})`}>
          <rect x="-46" y="10" width="92" height="6" rx="2" fill="#8a8f96" />
          <Pieza shape={shape} step={3} costra={costra} baked={peek >= 0.6} />
        </g>
      )}
      <path d="M-58 62 h116" stroke="#9a5a3c" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* Afuera, la charola: antes de entrar y cuando sale calientita. */}
      {!inside && (
        <g className="bm-rc-tray" transform="translate(110 50)">
          <rect x="-44" y="6" width="88" height="6" rx="2" fill="#8a8f96" />
          <g transform="translate(0 -6) scale(.95)">
            <Pieza shape={shape} step={3} costra={costra} baked={out} />
          </g>
          {out && (
            <g className="bm-rc-steam" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" opacity=".6">
              <path d="M-10 -34 q-4 -5 0 -10 q4 -5 0 -10" />
              <path d="M8 -32 q-4 -5 0 -10 q4 -5 0 -10" />
            </g>
          )}
        </g>
      )}
    </svg>
  )
}
