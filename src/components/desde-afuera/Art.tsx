import type { ReactNode } from 'react'
import { type CritId, HAIR_COLORS, type Hair, SHIRTS, SKINS, type SceneId, type Yo } from '../../data/desdeAfuera'

// Los dibujos de Desde afuera: la persona hecha muñequito, las tres escenas, los bichitos y
// las calcomanías. La escena mide 400×300; el muñequito vive en x = 0 y se mueve a x = 200.
// Lo que respira, se tensa o saluda (pecho, brazos, cara) se acomoda cuadro por cuadro con
// `pose`, sin pasar por React: por eso esas partes llevan `data-a` y no traen su forma aquí.

export type Parts = Record<string, SVGElement>

/** Las partes con `data-a` (o `data-c`) de un dibujo, por nombre. */
export function partsOf(el: Element | null, attr: 'a' | 'c' = 'a'): Parts {
  const out: Parts = {}
  el?.querySelectorAll<SVGElement>(`[data-${attr}]`).forEach((e) => {
    out[e.dataset[attr]!] = e
  })
  return out
}

function hairParts(st: Hair, c: string): { b: ReactNode; f: ReactNode } {
  switch (st) {
    case 'corto':
      return { b: null, f: <path fill={c} d="M-25.5 115 C-28 87 -8 83 2 85.5 C21 86.5 29 98 25.5 115 C22 104 15 98 5 100 C-5 96 -17 101 -25.5 115Z" /> }
    case 'largo':
      return {
        b: <path fill={c} d="M-27 108 C-32 134 -31 158 -25 172 L25 172 C31 158 32 134 27 108Z" />,
        f: <path fill={c} d="M-26.5 120 C-30 87 -8 83 2 85.5 C23 86 31 101 26.5 122 C22 104 12 97 -2 98.5 C-12 101 -21 108 -26.5 120Z" />,
      }
    case 'chongo':
      return {
        b: <circle fill={c} cx="0" cy="82" r="11.5" />,
        f: <path fill={c} d="M-25.2 113 C-26 89 -12 86.5 0 86.5 C12 86.5 26 89 25.2 113 C18 100 6 98.5 0 99.5 C-6 98.5 -18 100 -25.2 113Z" />,
      }
    case 'trenzas':
      return {
        b: null,
        f: (
          <>
            <path fill={c} d="M-25.2 115 C-26 89 -12 86.5 0 86.5 C12 86.5 26 89 25.2 115 C19 101 6 98.5 0 100 C-6 98.5 -19 101 -25.2 115Z" />
            {[-1, 1].map((s) => (
              <g key={s}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} fill={c} cx={s * 22} cy={128 + i * 8.5} r={5.4 - i * 0.3} />
                ))}
                <circle cx={s * 22} cy="172" r="2.6" style={{ fill: 'var(--da-c1)' }} />
              </g>
            ))}
          </>
        ),
      }
    case 'rizos': {
      const curls: number[] = []
      for (let a = 192; a <= 348; a += 17) curls.push((a * Math.PI) / 180)
      return {
        b: [-1, 1].map((s) => (
          <g key={s}>
            <circle fill={c} cx={s * 26} cy="118" r="8" />
            <circle fill={c} cx={s * 25} cy="131" r="7" />
          </g>
        )),
        f: (
          <>
            <path fill={c} d="M-22 108 C-20 92 20 92 22 108 C12 99 -12 99 -22 108Z" />
            {curls.map((r) => (
              <circle key={r} fill={c} cx={(27 * Math.cos(r)).toFixed(1)} cy={(111 + 27 * Math.sin(r)).toFixed(1)} r="9" />
            ))}
          </>
        ),
      }
    }
    default:
      return { b: null, f: null }
  }
}

/** La persona, como se hizo. `sfx` separa los degradados de la vista previa y de la escena. */
export function Avatar({ yo, sfx }: { yo: Yo; sfx: string }) {
  const skin = SKINS[yo.skin][0]
  const hc = HAIR_COLORS[yo.hcol][0]
  const shirt = `var(${SHIRTS[yo.shirt][0]})`
  const hair = hairParts(yo.hair, hc)
  const brow = yo.hair === 'sin' ? '#3a2a22' : hc === '#b9b3ab' ? '#8f8880' : hc === '#c69a55' ? '#9a7440' : hc
  return (
    <>
      <defs>
        <radialGradient id={`da-gt${sfx}`}>
          <stop offset="0" style={{ stopColor: 'var(--da-tense)', stopOpacity: 0.85 }} />
          <stop offset="1" style={{ stopColor: 'var(--da-tense)', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={`da-gc${sfx}`}>
          <stop offset="0" style={{ stopColor: 'var(--tone-calma)', stopOpacity: 0.75 }} />
          <stop offset="1" style={{ stopColor: 'var(--tone-calma)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <ellipse data-a="at" cx="0" cy="168" rx="72" ry="110" fill={`url(#da-gt${sfx})`} />
      <ellipse data-a="ac" cx="0" cy="168" rx="72" ry="110" fill={`url(#da-gc${sfx})`} />
      <g>{hair.b}</g>
      <rect x="-17" y="204" width="14" height="60" rx="6" fill="#3f4b5e" />
      <rect x="3" y="204" width="14" height="60" rx="6" fill="#3f4b5e" />
      <ellipse cx="-11" cy="266" rx="12" ry="5.5" fill="#2a2522" />
      <ellipse cx="11" cy="266" rx="12" ry="5.5" fill="#2a2522" />
      <rect x="-6.5" y="126" width="13" height="24" rx="4" fill={skin} />
      <rect x="-6.5" y="134" width="13" height="16" fill="#000" opacity=".08" />
      <g data-a="torso">
        <path data-a="shirt" style={{ fill: shirt }} />
        <path data-a="coll" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
      </g>
      <path data-a="arml" fill="none" strokeWidth="10" strokeLinecap="round" style={{ stroke: shirt }} />
      <path data-a="armr" fill="none" strokeWidth="10" strokeLinecap="round" style={{ stroke: shirt }} />
      <g data-a="head">
        <circle cx="-24" cy="117" r="5" fill={skin} />
        <circle cx="24" cy="117" r="5" fill={skin} />
        <circle cx="0" cy="113" r="24" fill={skin} />
        <g>{hair.f}</g>
        <ellipse data-a="bh1" cx="-15" cy="124.5" rx="4.2" ry="2.4" fill="#ef8a8a" />
        <ellipse data-a="bh2" cx="15" cy="124.5" rx="4.2" ry="2.4" fill="#ef8a8a" />
        <g data-a="eyes">
          <ellipse data-a="sl1" cx="-9" cy="116" rx="3.6" fill="#fffaf3" />
          <ellipse data-a="sl2" cx="9" cy="116" rx="3.6" fill="#fffaf3" />
          <circle cx="-9" cy="116.8" r="2.35" fill="#1d1512" />
          <circle cx="9" cy="116.8" r="2.35" fill="#1d1512" />
          <circle cx="-8.2" cy="115.8" r=".85" fill="#fff" />
          <circle cx="9.8" cy="115.8" r=".85" fill="#fff" />
        </g>
        <g data-a="happy" className="da-off">
          <path
            d="M-12.6 117.5 Q-9 112.6 -5.4 117.5 M5.4 117.5 Q9 112.6 12.6 117.5"
            stroke="#1d1512"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <path data-a="bl" fill="none" stroke={brow} strokeWidth="2.3" strokeLinecap="round" />
        <path data-a="br" fill="none" stroke={brow} strokeWidth="2.3" strokeLinecap="round" />
        <path d="M0.4 118.6 q-2.2 3.6 .6 4.1" stroke="#000" strokeOpacity=".25" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path data-a="m" fill="none" stroke="#3a1d18" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path data-a="sw" d="M21 97 q-3.6 5.4 0 7.4 q3.6 -2 0 -7.4Z" fill="#8cc6ee" stroke="#5b9cc9" strokeWidth=".6" />
        {yo.lentes && (
          <g fill="#fff" fillOpacity=".14" stroke="#2b2522" strokeWidth="1.7">
            <circle cx="-9" cy="116" r="6.8" />
            <circle cx="9" cy="116" r="6.8" />
            <path d="M-2.3 115.5 Q0 113.8 2.3 115.5" fill="none" />
          </g>
        )}
      </g>
    </>
  )
}

/** Las manos van aparte, encima del vaso, para que lo «agarren». */
export function Hands({ yo }: { yo: Yo }) {
  const s = SKINS[yo.skin][0]
  return (
    <>
      <circle data-a="hl" fill={s} />
      <circle data-a="hr" fill={s} />
    </>
  )
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k
export const smooth = (x: number) => {
  x = clamp(x, 0, 1)
  return x * x * (3 - 2 * x)
}

export type Pose = {
  /** Tensión, de 0 a 1. */
  t: number
  /** Cuánto aire tiene el pecho, de 0 a 1. */
  inh: number
  pose: 'tense' | 'hold' | 'wave'
  happy: boolean
  glass?: boolean
  /** El choque de manos del final, de 0 a 1. */
  five?: number
}

const f1 = (n: number) => n.toFixed(1)

/** Acomoda pecho, brazos, manos y cara. `A` son las partes del cuerpo y `H` las de las manos. */
export function pose(A: Parts, H: Parts, s: Pose, clock: number, still: boolean) {
  if (!A.shirt || !H.hl) return
  const t = s.t
  const sy = 146 - 5 * t - 2.5 * s.inh
  A.shirt.setAttribute('d', `M-26 ${f1(sy + 7)} Q-26 ${f1(sy)} -14 ${f1(sy - 1)} L14 ${f1(sy - 1)} Q26 ${f1(sy)} 26 ${f1(sy + 7)} L24 208 Q0 212 -24 208Z`)
  A.coll.setAttribute('d', `M-7 ${f1(sy - 0.5)} Q0 ${f1(sy + 6)} 7 ${f1(sy - 0.5)}`)
  A.torso.setAttribute('transform', `translate(0 182) scale(${(1 + 0.06 * s.inh).toFixed(3)} ${(1 + 0.035 * s.inh).toFixed(3)}) translate(0 -182)`)
  let L: [number, number] = [-31, 198]
  let R: [number, number] = [31, 198]
  if (s.pose === 'hold') {
    L = [-9, 184]
    R = [9, 184]
  } else if (s.pose === 'wave') {
    if (s.glass) L = [-12, 190]
    const f = s.five ?? 0
    R = [38 + (still ? 0 : 5 * Math.sin(clock * 7)) * (1 - f), lerp(98, 118, f)]
  } else {
    const k = smooth((t - 0.45) / 0.35)
    R = [lerp(31, 10, k), lerp(198, 165, k)]
  }
  const arm = (S: [number, number], P: [number, number], sg: number) =>
    `M${S[0]} ${f1(S[1])} Q${f1((S[0] + P[0]) / 2 + sg * 9)} ${f1((S[1] + P[1]) / 2 + 5)} ${f1(P[0])} ${f1(P[1])}`
  A.arml.setAttribute('d', arm([-21, sy + 5], L, -1))
  A.armr.setAttribute('d', arm([21, sy + 5], R, 1))
  H.hl.setAttribute('cx', f1(L[0]))
  H.hl.setAttribute('cy', f1(L[1]))
  H.hr.setAttribute('cx', f1(R[0]))
  H.hr.setAttribute('cy', f1(R[1]))
  H.hl.setAttribute('r', '5.8')
  H.hr.setAttribute('r', f1(5.8 + (s.five ?? 0) * 7))
  A.head.setAttribute('transform', `translate(0 ${(2 * t).toFixed(2)})`)
  const hp = s.happy
  const yi = 106 - 3.4 * t - (hp ? 1.2 : 0)
  const yo = 106.6 + 0.9 * t
  const mid = Math.min(yi, yo) - 1.8
  A.bl.setAttribute('d', `M-14.5 ${f1(yo)} Q-9.5 ${f1(mid)} -4.5 ${f1(yi)}`)
  A.br.setAttribute('d', `M14.5 ${f1(yo)} Q9.5 ${f1(mid)} 4.5 ${f1(yi)}`)
  A.eyes.classList.toggle('da-off', hp)
  A.happy.classList.toggle('da-off', !hp)
  const ry = (3.9 + 0.5 * t).toFixed(2)
  A.sl1.setAttribute('ry', ry)
  A.sl2.setAttribute('ry', ry)
  let m: string
  if (hp) m = 'M-7.5 126 Q0 134.5 7.5 126'
  else if (t > 0.72) m = 'M-6 128.4 q1.5 -1.7 3 0 t3 0 t3 0 t3 0'
  else m = `M-6 127.5 Q0 ${f1(127.5 + 4.6 - 8 * t)} 6 127.5`
  A.m.setAttribute('d', m)
  const blush = (hp ? 0.7 : 0.12 + 0.5 * (1 - t)).toFixed(2)
  A.bh1.setAttribute('opacity', blush)
  A.bh2.setAttribute('opacity', blush)
  A.sw.setAttribute('opacity', clamp((t - 0.55) * 3, 0, 1).toFixed(2))
  A.at.setAttribute('opacity', (t * 0.6).toFixed(2))
  A.ac.setAttribute('opacity', ((1 - t) * 0.55).toFixed(2))
  A.at.setAttribute('rx', f1(72 + (still ? 0 : Math.sin(clock * 4) * 3 * t)))
}

const eyes = (y: number) => (
  <>
    <g data-c="eo">
      <circle cx="-3.6" cy={y} r="1.7" fill="#2b1f1a" />
      <circle cx="3.6" cy={y} r="1.7" fill="#2b1f1a" />
      <circle cx="0" cy={y + 3.4} r="1.1" fill="#2b1f1a" />
    </g>
    <g data-c="ec" className="da-off">
      <path
        d={`M-5.4 ${y} q1.8 1.6 3.6 0 M1.8 ${y} q1.8 1.6 3.6 0 M-1.6 ${y + 3.4} q1.6 1.2 3.2 0`}
        stroke="#2b1f1a"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  </>
)

const ant = (x: number, i: number) => (
  <g data-c={`ant${i}`} transform={`translate(${x} 0)`}>
    <path d="M-2 1.5 l-2 3.2 M0 1.8 l0 3.4 M2 1.5 l2 3.2 M-2 -1.5 l-2 -3 M0 -1.8 l0 -3 M2 -1.5 l2 -3" stroke="#8f3c26" strokeWidth="1" strokeLinecap="round" />
    <ellipse cx="-3.4" cy="0" rx="2.7" ry="2.2" fill="#c0573a" />
    <circle cx="0" cy="0" r="1.9" fill="#c0573a" />
    <circle cx="3.4" cy="-.4" r="2.1" fill="#c0573a" />
    <circle cx="4" cy="-1" r=".6" fill="#fff" />
  </g>
)

/** El cuerpo de cada bichito. Lo que se mueve lleva `data-c`. */
export function CritBody({ id }: { id: CritId }) {
  switch (id) {
    case 'corazon':
      return (
        <>
          <g data-c="k1">
            <path d="M-5 -9 L-12 -19" stroke="#b9875a" strokeWidth="2" strokeLinecap="round" />
            <circle cx="-12.5" cy="-19.6" r="2.3" fill="#e8c9a0" />
          </g>
          <g data-c="k2">
            <path d="M5 -9 L12 -19" stroke="#b9875a" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12.5" cy="-19.6" r="2.3" fill="#e8c9a0" />
          </g>
          <path d="M0 11 C-15 1 -13 -12 -5.5 -11.5 C-2.5 -11.3 -.6 -9 0 -6.8 C.6 -9 2.5 -11.3 5.5 -11.5 C13 -12 15 1 0 11Z" fill="#e46a8f" />
          {eyes(-2.5)}
        </>
      )
    case 'remolino':
      return (
        <>
          <g data-c="spin">
            <path
              d="M0 -2 A2 2 0 0 1 2 0 A4 4 0 0 1 -2 4 A6 6 0 0 1 -8 -2 A8 8 0 0 1 2 -10 A10 10 0 0 1 12 0 A12 12 0 0 1 0 12"
              fill="none"
              stroke="#8f6bb8"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </g>
          <circle r="6.6" fill="#efe6fb" />
          {eyes(-1.4)}
        </>
      )
    case 'llamita':
      return (
        <>
          <path d="M0 -15 C6 -7 11 -2 10.5 5 C9.5 12.5 -9.5 12.5 -10.5 5 C-11 -2 -4 -5 0 -15Z" fill="#f0a03c" />
          <path d="M0 -4 C3 0 5.5 3 4.5 6.5 C3.5 9.5 -3.5 9.5 -4.5 6.5 C-5.5 3 -2 1 0 -4Z" fill="#f7d35b" />
          {eyes(2.5)}
        </>
      )
    case 'hormigas':
      return (
        <>
          {ant(-11, 0)}
          {ant(0, 1)}
          {ant(11, 2)}
        </>
      )
    default:
      return (
        <>
          <circle r="11" fill="#d9a36a" />
          <path data-c="tight" d="M-9 -4 C-3 5 3 -5 9 4 M-9 4 C-3 -5 3 5 9 -4 M-4 -9.5 C3 -2 -3 2 4 9.5" stroke="#9c6534" strokeWidth="1.6" fill="none" />
          <path data-c="loose" className="da-off" d="M-9 1 C-4 -3 4 5 9 1" stroke="#9c6534" strokeWidth="1.6" fill="none" />
          {eyes(-1)}
        </>
      )
  }
}

const STICKER_COLOR: Record<SceneId, string> = { metro: '#e0669a', banco: '#5f9e82', cuarto: '#4c5ea8' }

/** La calcomanía de cada escena. */
export function Sticker({ scene }: { scene: SceneId }) {
  const c = STICKER_COLOR[scene]
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill={c} stroke="#fff" strokeWidth="3" />
      {scene === 'metro' ? (
        <>
          <rect x="18" y="16" width="28" height="30" rx="7" fill="#fff" />
          <rect x="22" y="21" width="20" height="10" rx="2" fill={c} />
          <circle cx="25" cy="38" r="2.4" fill={c} />
          <circle cx="39" cy="38" r="2.4" fill={c} />
          <path d="M22 50 l4 -4 M42 50 l-4 -4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </>
      ) : scene === 'banco' ? (
        <>
          <rect x="16" y="20" width="32" height="24" rx="4" fill="#fff" />
          <text x="32" y="37" fontSize="11" fontWeight="700" textAnchor="middle" fill={c} fontFamily="Inter,system-ui,sans-serif">
            A23
          </text>
          <circle cx="16" cy="32" r="3.5" fill={c} />
          <circle cx="48" cy="32" r="3.5" fill={c} />
        </>
      ) : (
        <>
          <circle cx="30" cy="31" r="12" fill="#f5e7b2" />
          <circle cx="36" cy="26" r="10.5" fill={c} />
          <circle cx="44" cy="40" r="1.8" fill="#fff3c4" />
          <circle cx="20" cy="18" r="1.4" fill="#fff3c4" />
          <circle cx="46" cy="20" r="1.2" fill="#fff3c4" />
        </>
      )}
    </svg>
  )
}

// Las tres escenas, fijas. Los colores que cambian en modo oscuro van por clase (da-k-*).

const METRO = (
  <>
    <defs>
      <clipPath id="da-cw">
        <rect x="16" y="56" width="104" height="68" rx="12" />
        <rect x="280" y="56" width="104" height="68" rx="12" />
      </clipPath>
    </defs>
    <rect width="400" height="300" className="da-k-wall" />
    <rect width="400" height="17" className="da-k-floor2" />
    <rect y="15" width="400" height="4" className="da-k-metal" />
    <rect x="16" y="56" width="104" height="68" rx="12" className="da-k-window" />
    <rect x="280" y="56" width="104" height="68" rx="12" className="da-k-window" />
    <g clipPath="url(#da-cw)">
      <g className="da-streak">
        <rect x="24" y="76" width="44" height="2.6" rx="1.3" fill="#ffd98a" opacity=".6" />
        <rect x="70" y="102" width="30" height="2.6" rx="1.3" fill="#ffd98a" opacity=".4" />
        <rect x="292" y="72" width="38" height="2.6" rx="1.3" fill="#ffd98a" opacity=".55" />
        <rect x="334" y="104" width="30" height="2.6" rx="1.3" fill="#ffd98a" opacity=".4" />
      </g>
    </g>
    <rect x="16" y="56" width="104" height="68" rx="12" fill="none" strokeWidth="3.5" style={{ stroke: 'var(--da-metal)' }} />
    <rect x="280" y="56" width="104" height="68" rx="12" fill="none" strokeWidth="3.5" style={{ stroke: 'var(--da-metal)' }} />
    <rect x="22" y="34" width="92" height="13" rx="3" className="da-k-rep" style={{ stroke: 'var(--da-metal)' }} strokeWidth=".8" />
    <line x1="30" y1="40.5" x2="106" y2="40.5" stroke="#e0669a" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="30" cy="40.5" r="2.4" fill="#fff" stroke="#e0669a" strokeWidth="1.4" />
    <circle cx="45" cy="40.5" r="2.4" fill="#fff" stroke="#e0669a" strokeWidth="1.4" />
    <circle cx="60" cy="40.5" r="2.4" fill="#fff" stroke="#e0669a" strokeWidth="1.4" />
    <circle cx="75" cy="40.5" r="2.4" fill="#fff" stroke="#e0669a" strokeWidth="1.4" />
    <circle cx="90" cy="40.5" r="2.4" fill="#fff" stroke="#e0669a" strokeWidth="1.4" />
    <circle cx="106" cy="40.5" r="2.4" fill="#fff" stroke="#e0669a" strokeWidth="1.4" />
    <rect x="158" y="38" width="84" height="218" rx="5" className="da-k-floor2" />
    <rect x="163" y="62" width="32" height="64" rx="6" className="da-k-glass" />
    <rect x="205" y="62" width="32" height="64" rx="6" className="da-k-glass" />
    <line x1="200" y1="38" x2="200" y2="256" strokeWidth="2" style={{ stroke: 'var(--da-metal)' }} />
    <rect x="179" y="23" width="42" height="13" rx="3" fill="#2f8f5b" />
    <text x="200" y="32.4" fontSize="7.6" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Inter,system-ui,sans-serif">SALIDA</text>
    <rect x="137" y="17" width="6" height="240" rx="3" className="da-k-metal" />
    <rect x="257" y="17" width="6" height="240" rx="3" className="da-k-metal" />
    <rect x="8" y="182" width="118" height="16" rx="6" className="da-k-seat" />
    <rect x="14" y="197" width="106" height="9" rx="3" className="da-k-seat" opacity=".7" />
    <rect x="274" y="182" width="118" height="16" rx="6" className="da-k-seat" />
    <rect x="280" y="197" width="106" height="9" rx="3" className="da-k-seat" opacity=".7" />
    <rect x="44" y="190" width="30" height="11" rx="5" className="da-k-ppl2" />
    <rect x="46" y="198" width="10" height="54" rx="4" fill="#3f4b5e" />
    <rect x="62" y="198" width="10" height="54" rx="4" fill="#3f4b5e" />
    <rect x="42" y="146" width="28" height="48" rx="11" className="da-k-ppl" />
    <rect x="58" y="164" width="9" height="13" rx="2" fill="#bfe3ff" />
    <path d="M48 160 Q54 176 60 172" strokeWidth="7" strokeLinecap="round" fill="none" style={{ stroke: 'var(--da-ppl)' }} />
    <circle cx="56" cy="135" r="12" fill="#c69068" />
    <path fill="#2a201b" d="M44 133 C43 117 69 117 68 134 C62 126 50 126 44 133Z" />
    <rect x="327" y="212" width="8" height="42" rx="4" fill="#3f4b5e" />
    <rect x="337" y="212" width="8" height="42" rx="4" fill="#3f4b5e" />
    <rect x="322" y="150" width="28" height="64" rx="11" className="da-k-ppl2" />
    <rect x="348" y="156" width="16" height="40" rx="6" fill="#6d8cc7" />
    <rect x="351" y="168" width="10" height="9" rx="2" fill="#5a78b0" />
    <circle cx="336" cy="137" r="12" fill="#8a5a3b" />
    <path fill="#2a201b" d="M324 135 C322 118 350 118 348 135 C344 125 330 124 324 135Z" />
    <rect y="256" width="400" height="44" className="da-k-floor" />
    <circle cx="30" cy="268" r="1.6" className="da-k-floor2" />
    <circle cx="88" cy="284" r="1.6" className="da-k-floor2" />
    <circle cx="150" cy="272" r="1.6" className="da-k-floor2" />
    <circle cx="250" cy="286" r="1.6" className="da-k-floor2" />
    <circle cx="300" cy="266" r="1.6" className="da-k-floor2" />
    <circle cx="372" cy="278" r="1.6" className="da-k-floor2" />
    <circle cx="120" cy="296" r="1.6" className="da-k-floor2" />
    <circle cx="220" cy="262" r="1.6" className="da-k-floor2" />
  </>
)

const BANCO = (
  <>
    <defs>
      <pattern id="da-tiles" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" className="da-k-floor" />
        <rect width="16" height="16" className="da-k-floor2" />
        <rect x="16" y="16" width="16" height="16" className="da-k-floor2" />
      </pattern>
    </defs>
    <rect width="400" height="300" className="da-k-wall2" />
    <rect x="30" y="24" width="76" height="34" rx="5" fill="#1f2624" />
    <text x="68" y="35" fontSize="7" textAnchor="middle" fill="#9fd8b5" fontFamily="Inter,system-ui,sans-serif" letterSpacing=".5">TURNO</text>
    <text x="68" y="52" fontSize="14" fontWeight="700" textAnchor="middle" fill="#ffd27a" fontFamily="Inter,system-ui,sans-serif">A23</text>
    <circle cx="68" cy="96" r="14" style={{ fill: 'var(--da-rep)', stroke: 'var(--da-line)' }} strokeWidth="2.4" />
    <path d="M68 96 V87 M68 96 L74 99" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--da-line)' }} />
    <rect x="336" y="108" width="34" height="34" rx="9" fill="#7c9bc9" />
    <circle cx="353" cy="96" r="11" fill="#b07a52" />
    <path fill="#2a201b" d="M342 95 C341 81 365 81 364 95 C360 88 346 88 342 95Z" />
    <rect x="236" y="56" width="160" height="80" className="da-k-glass" opacity=".72" />
    <rect x="314" y="56" width="4" height="80" className="da-k-metal" />
    <rect x="252" y="39" width="52" height="13" rx="3" fill="#23433d" />
    <text x="278" y="48.4" fontSize="7.5" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Inter,system-ui,sans-serif">CAJA 1</text>
    <rect x="330" y="39" width="52" height="13" rx="3" fill="#23433d" />
    <text x="356" y="48.4" fontSize="7.5" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Inter,system-ui,sans-serif">CAJA 2</text>
    <rect x="230" y="134" width="170" height="8" rx="2" className="da-k-wood" />
    <rect x="236" y="142" width="164" height="72" className="da-k-wood" opacity=".78" />
    <line x1="245" y1="131" x2="258" y2="124" stroke="#23433d" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M258 124 q7 4 4 10" fill="none" strokeDasharray="1.6 1.4" strokeWidth="1.4" style={{ stroke: 'var(--da-metal)' }} />
    <path d="M24 222 L56 222 L52 250 L28 250Z" fill="#c9774a" />
    <ellipse cx="33" cy="198" rx="7" ry="21" transform="rotate(-22 33 198)" fill="#5f9e82" />
    <ellipse cx="47" cy="197" rx="7" ry="21" transform="rotate(20 47 197)" fill="#4f8e72" />
    <ellipse cx="40" cy="190" rx="6" ry="24" fill="#6aab8c" />
    <rect y="250" width="400" height="50" fill="url(#da-tiles)" />
    <rect x="109" y="206" width="6" height="44" rx="3" className="da-k-metal" />
    <ellipse cx="112" cy="251" rx="9" ry="3" className="da-k-metal" />
    <rect x="285" y="206" width="6" height="44" rx="3" className="da-k-metal" />
    <ellipse cx="288" cy="251" rx="9" ry="3" className="da-k-metal" />
    <path d="M115 210 Q200 224 285 210" stroke="#b9473b" strokeWidth="4" fill="none" />
    <rect x="76" y="212" width="8" height="42" rx="4" fill="#3f4b5e" />
    <rect x="86" y="212" width="8" height="42" rx="4" fill="#3f4b5e" />
    <rect x="71" y="150" width="28" height="64" rx="11" className="da-k-ppl" />
    <rect x="94" y="170" width="8" height="12" rx="2" fill="#bfe3ff" />
    <circle cx="85" cy="137" r="12" fill="#e8bd96" />
    <path fill="#5b3a26" d="M73 140 C70 120 100 120 97 140 L98 152 L94 152 C95 138 92 130 85 129 C78 130 75 138 76 152 L72 152Z" />
    <rect x="303" y="212" width="8" height="42" rx="4" fill="#3f4b5e" />
    <rect x="313" y="212" width="8" height="42" rx="4" fill="#3f4b5e" />
    <rect x="298" y="150" width="28" height="64" rx="11" className="da-k-ppl2" />
    <circle cx="312" cy="137" r="12" fill="#5c3a24" />
    <path fill="#2a201b" d="M300 136 C300 120 324 120 324 136 C318 129 306 129 300 136Z M312 121 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" />
  </>
)

const CUARTO = (
  <>
    <defs>
      <radialGradient id="da-lampg">
        <stop offset="0" stopColor="#ffd98a" stopOpacity=".5" />
        <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" className="da-k-night" />
    <rect x="30" y="28" width="110" height="82" rx="6" className="da-k-sky" />
    <g fill="#fff3c4">
      <circle className="da-tw" cx="46" cy="44" r="1.6" />
      <circle className="da-tw" cx="70" cy="80" r="1.2" />
      <circle className="da-tw" cx="92" cy="40" r="1.4" />
      <circle className="da-tw" cx="128" cy="94" r="1.3" />
      <circle className="da-tw" cx="54" cy="98" r="1.1" />
      <circle className="da-tw" cx="80" cy="60" r="1.7" />
      <circle className="da-tw" cx="134" cy="70" r="1.1" />
      <circle className="da-tw" cx="100" cy="96" r="1.4" />
    </g>
    <circle cx="112" cy="52" r="11" fill="#f5e7b2" />
    <circle cx="118" cy="47" r="9.5" className="da-k-sky" />
    <rect x="30" y="28" width="110" height="82" rx="6" fill="none" stroke="#e9dcc4" strokeWidth="4" />
    <line x1="85" y1="28" x2="85" y2="110" stroke="#e9dcc4" strokeWidth="3" />
    <rect x="24" y="110" width="122" height="7" rx="2" className="da-k-wood" />
    <rect x="53" y="98" width="15" height="12" rx="2" fill="#c9774a" />
    <rect x="56.5" y="80" width="8" height="20" rx="4" fill="#5f9e82" />
    <path d="M57 90 h-4 v-6" stroke="#5f9e82" strokeWidth="4" fill="none" strokeLinecap="round" />
    <rect x="282" y="42" width="56" height="62" rx="3" fill="#f3ece0" />
    <path d="M286 99 L302 72 L313 86 L322 76 L334 99Z" fill="#5f9e82" />
    <circle cx="326" cy="55" r="5" fill="#e8a462" />
    <circle cx="94" cy="184" r="54" fill="url(#da-lampg)" />
    <rect y="254" width="400" height="46" className="da-k-wood" />
    <path d="M0 271 H400 M0 287 H400 M60 254 V271 M180 271 V287 M300 254 V271 M120 287 V300 M340 287 V300" stroke="#000" strokeOpacity=".13" strokeWidth="1.2" />
    <rect x="70" y="206" width="48" height="48" rx="4" className="da-k-wood" />
    <rect x="70" y="206" width="48" height="48" rx="4" fill="#000" opacity=".12" />
    <line x1="74" y1="228" x2="114" y2="228" stroke="#000" strokeOpacity=".2" />
    <circle cx="94" cy="219" r="2" fill="#e9dcc4" />
    <rect x="90" y="190" width="8" height="16" fill="#c9a27d" />
    <path d="M79 192 L109 192 L102 170 L86 170Z" fill="#f2c879" />
    <rect x="384" y="146" width="16" height="108" rx="3" className="da-k-wood" />
    <rect x="250" y="214" width="150" height="40" className="da-k-wood" />
    <rect x="250" y="214" width="150" height="40" fill="#000" opacity=".15" />
    <rect x="252" y="190" width="146" height="28" rx="7" className="da-k-rep" />
    <ellipse cx="360" cy="187" rx="22" ry="9" className="da-k-rep" style={{ stroke: 'var(--border)' }} strokeWidth="1.2" />
    <path d="M268 197 Q330 191 398 197 L398 232 Q330 237 268 232Z" style={{ fill: 'var(--da-c2)' }} opacity=".85" />
    <circle cx="310" cy="197" r="12" fill="#bfe3ff" opacity=".25" />
    <rect x="303.5" y="193.5" width="13" height="7" rx="1.6" fill="#bfe3ff" />
    <ellipse cx="256" cy="273" rx="9" ry="4.2" style={{ fill: 'var(--da-c1)' }} />
    <ellipse cx="272" cy="279" rx="9" ry="4.2" style={{ fill: 'var(--da-c1)' }} />
  </>
)

export const SCENE_ART: Record<SceneId, ReactNode> = { metro: METRO, banco: BANCO, cuarto: CUARTO }
