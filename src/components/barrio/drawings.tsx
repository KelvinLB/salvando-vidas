import type { ReactNode } from 'react'
import type { NeighborId } from '../../data/barrio'
import type { Patch } from '../../lib/hilos'
import { PatchArt } from '../hilos/Threads'

// Los dibujos de la plaza, con los pies (o la base) en 0,0 del cuadrito donde van. Los colores
// de la plaza salen de barrio.css para que se vean bien de día y en modo oscuro; los de las
// cosas pintadas (la fachada, los toldos, la fruta) se quedan iguales, como en la vida.

const INK = '#2a2433'

type PersonLook = {
  s?: number
  legs: string
  shirt: string
  skin: string
  over?: ReactNode
  head?: ReactNode
  /** Sentada en su banca: las piernas van hacia adelante. */
  sit?: boolean
}

function Person({ s = 1, legs, shirt, skin, over, head, sit }: PersonLook) {
  return (
    <>
      <ellipse rx="13" ry="5" fill="#000" opacity=".12" />
      <g transform={`scale(${s})${sit ? ' translate(0 -6)' : ''}`}>
        {sit ? (
          <path d="M-8 -12 h14 v6 h-14z M2 -8 h6 v10 h-6z" fill={legs} />
        ) : (
          <>
            <rect x="-7" y="-15" width="6" height="15" rx="2.5" fill={legs} />
            <rect x="1" y="-15" width="6" height="15" rx="2.5" fill={legs} />
          </>
        )}
        <rect x="-10" y="-39" width="20" height="27" rx="8" fill={shirt} />
        {over}
        <circle cy="-47" r="9" fill={skin} />
        {head}
        <circle cx="2.5" cy="-48" r="1.3" fill={INK} />
        <circle cx="-3.5" cy="-48" r="1.3" fill={INK} />
        <path d="M-2.5 -43.5 q2 1.4 4 0" stroke={INK} strokeWidth="1" fill="none" strokeLinecap="round" opacity=".7" />
      </g>
    </>
  )
}

/** Cada vecino, como se le reconoce de lejos. */
export const NEIGHBOR_LOOK: Record<NeighborId, PersonLook> = {
  chema: {
    legs: '#5b4a3a',
    shirt: '#f3efe6',
    skin: '#b98563',
    head: (
      <>
        <path d="M-4 -42.5 q4 3 8 0" stroke="#3a2b22" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cy="-54" rx="17" ry="4" fill="#d9b26a" />
        <path d="M-8 -54 Q0 -70 8 -54Z" fill="#d9b26a" />
      </>
    ),
  },
  nico: {
    s: 0.8,
    legs: '#3d4f74',
    shirt: '#6d8cc7',
    skin: '#c68f6b',
    head: (
      <>
        <path d="M-9 -50 a9 8 0 0 1 18 0Z" fill="#e8a462" />
        <path d="M5 -51 h9 v2 h-9z" fill="#e8a462" />
      </>
    ),
  },
  tere: {
    legs: '#3b3f3e',
    shirt: '#5f9e82',
    skin: '#c68f6b',
    over: <rect x="-9" y="-30" width="18" height="16" rx="3" fill="#fdfcfa" opacity=".9" />,
    head: <path d="M-9 -48 a9 9 0 0 1 18 0 l-2 6 -2 -6 h-10 l-2 6z" fill="#3a2b22" />,
  },
  lupe: {
    legs: '#4a3b55',
    shirt: '#7a5aa6',
    skin: '#a8775a',
    over: <path d="M-11 -37 Q0 -28 11 -37 L11 -30 Q0 -21 -11 -30Z" fill="#c0504a" />,
    head: (
      <>
        <path d="M-9 -49 a9 8 0 0 1 18 0Z" fill="#bdb7ae" />
        <circle cx="-8" cy="-53" r="4" fill="#bdb7ae" />
      </>
    ),
  },
  beto: {
    legs: '#3b3f3e',
    shirt: '#c0504a',
    skin: '#b07a58',
    over: (
      <>
        <path d="M-8 -33 h16 v20 h-16z" fill="#f3efe6" />
        <path d="M-8 -33 L-5 -39 M8 -33 L5 -39" stroke="#f3efe6" strokeWidth="2" />
      </>
    ),
    head: (
      <>
        <path d="M-9 -50 a9 7 0 0 1 18 0 v-2 h-18z" fill="#5c5650" />
        <path d="M-4 -43 q4 2.4 8 0" stroke="#5c5650" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  ramiro: {
    legs: '#46566e',
    shirt: '#d9b26a',
    skin: '#c08a66',
    over: <path d="M-9 -30 h18 v17 h-18z" fill="#8a5f3d" />,
    head: (
      <>
        <path d="M-8 -41 q8 9 16 0 v3 q-8 8 -16 0z" fill="#d8d2c8" />
        <path d="M-9 -51 a9 7 0 0 1 18 0z" fill="#d8d2c8" />
        <rect x="7" y="-53" width="2" height="9" rx="1" fill="#f2c14e" transform="rotate(25 8 -48)" />
      </>
    ),
  },
  rosa: {
    sit: true,
    legs: '#3d4f74',
    shirt: '#e46a8f',
    skin: '#b98563',
    over: (
      <path d="M-12 -38 Q0 -30 12 -38 L13 -28 Q0 -20 -13 -28Z" fill="#6d4c8f" stroke="#c7b5ee" strokeWidth="1" strokeDasharray="2 2" />
    ),
    head: (
      <>
        <path d="M-9 -48 a9 9 0 0 1 18 0 l-1 2 h-16z" fill="#2c2420" />
        <path d="M-8 -46 q-4 6 -2 13" stroke="#2c2420" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  memo: {
    legs: '#2f3a57',
    shirt: '#8fb0de',
    skin: '#a8775a',
    over: (
      <>
        <path d="M-9 -37 L9 -16" stroke="#8a5f3d" strokeWidth="2.5" />
        <rect x="5" y="-22" width="11" height="10" rx="2" fill="#a7764f" />
      </>
    ),
    head: (
      <>
        <path d="M-9 -50 a9 7 0 0 1 18 0z" fill="#2f3a57" />
        <path d="M2 -51 h11 v2.5 h-11z" fill="#2f3a57" />
      </>
    ),
  },
  chayo: {
    legs: '#3b2f3a',
    shirt: '#f3efe6',
    skin: '#a8775a',
    over: (
      <>
        {/* La falda de añil, la blusa bordada y su rebozo rosa con flecos. */}
        <path d="M-10 -16 L-13 -2 Q0 1 13 -2 L10 -16z" fill="#3f4f8a" />
        <g>
          <circle cx="-5" cy="-34" r="1.5" fill="#e46a8f" />
          <circle cx="0" cy="-33" r="1.5" fill="#f2c14e" />
          <circle cx="5" cy="-34" r="1.5" fill="#6fae7d" />
        </g>
        <path d="M-12 -39 Q0 -32 12 -39 L13 -19 h-6 L7 -31 Q0 -28 -11 -32Z" fill="#b8406f" />
        <path d="M-11 -35 Q0 -29 11 -35 M8.5 -30 L9.5 -20 M11.5 -32 L12.4 -20" stroke="#f2c14e" strokeWidth=".9" fill="none" />
        <path d="M7.5 -19 v3.5 M9.5 -19 v4 M11.5 -19 v3.5 M13 -19 v3" stroke="#b8406f" strokeWidth="1" strokeLinecap="round" />
      </>
    ),
    head: (
      <>
        <path d="M-9 -48 a9 9 0 0 1 18 0 l-1 1.5 h-16z" fill="#6b6460" />
        <path d="M0 -56 v5" stroke="#8a827c" strokeWidth="1" />
        {/* Sus dos trenzas, con listones de colores. */}
        <path d="M-8.5 -45 q-3 6 -1.5 14 M8.5 -45 q3 6 1.5 14" stroke="#6b6460" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M-8.5 -45 q-3 6 -1.5 14 M8.5 -45 q3 6 1.5 14" stroke="#8a827c" strokeWidth="1.4" strokeDasharray="1.6 2.2" fill="none" />
        <circle cx="-10" cy="-30" r="2" fill="#f2c14e" />
        <circle cx="10" cy="-30" r="2" fill="#6fae7d" />
      </>
    ),
  },
}

export function Neighbor({ id }: { id: NeighborId }) {
  return <Person {...NEIGHBOR_LOOK[id]} />
}

/** Rosa en su banca: la banca y ella van juntas. */
export function Banca({ children }: { children?: ReactNode }) {
  return (
    <>
      <path d="M-16 -4 v-8 M14 10 v-8 M-6 -10 v-6" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-22 -14 L18 6 L18 1 L-22 -19z" fill="var(--b-wood)" />
      {children}
      <path d="M-22 -19 L18 1 L18 -12 L-22 -32z" fill="var(--b-wood)" opacity=".55" />
    </>
  )
}

const BULBS = 8

/** El kiosco: ocupa nueve cuadritos. Sus foquitos se prenden de uno en uno con la respiración. */
export function Kiosco({ lit }: { lit: number }) {
  const on = Math.round(lit * BULBS)
  return (
    <>
      <path d="M-78 0 v9 a78 38 0 0 0 156 0 v-9" fill="var(--b-wall-2)" />
      <ellipse rx="78" ry="38" fill="var(--b-wall)" stroke="var(--b-tile-edge)" />
      <g stroke="var(--b-iron)" strokeWidth="3">
        <path d="M-54 -8 V-60 M54 -8 V-60 M-20 -24 V-52 M20 -24 V-52" />
      </g>
      <path d="M-74 -66 Q0 -40 74 -66 L0 -114Z" fill="#2f6b5b" />
      <path d="M-74 -66 Q0 -40 74 -66" stroke="var(--b-iron)" strokeWidth="1.2" fill="none" />
      <circle cy="-117" r="4" fill="var(--accent)" />
      {Array.from({ length: BULBS }, (_, i) => {
        const t = (i + 0.5) / BULBS
        const x = -74 + 148 * t
        const y = (1 - t) * (1 - t) * -66 + 2 * (1 - t) * t * -40 + t * t * -66
        const glow = i < on
        return (
          <circle
            key={i}
            className={glow ? 'b-bulb on' : 'b-bulb'}
            cx={x.toFixed(1)}
            cy={(y + 4).toFixed(1)}
            r="4"
            fill={glow ? 'var(--b-bulb-on)' : 'var(--b-bulb-off)'}
          />
        )
      })}
      <g stroke="var(--b-iron)" strokeWidth="3">
        <path d="M-30 22 V-44 M30 22 V-44" />
      </g>
    </>
  )
}

/** El tablero de misiones: un papelito por cada una de hoy. */
export function Tablero({ notes }: { notes: number }) {
  const papers = ['#fdfcfa', '#fbefe4', '#e2ebe5']
  return (
    <>
      <rect x="-16" y="-34" width="4" height="34" fill="var(--b-wood-2)" />
      <rect x="12" y="-34" width="4" height="34" fill="var(--b-wood-2)" />
      <rect x="-22" y="-62" width="44" height="30" rx="3" fill="var(--b-wood)" />
      {papers.slice(0, Math.max(1, notes)).map((p, i) => (
        <rect key={p} x={-17 + i * 13} y={-57 - (i % 2)} width="10" height="13" fill={p} transform={`rotate(${i * 4 - 4} ${-12 + i * 13} -50)`} />
      ))}
    </>
  )
}

export function Puesto() {
  return (
    <>
      <path d="M-24 -46 V-14 M24 -46 V-14" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-30 -48 h60 l-5 10 h-50z" fill="#e8a462" />
      <path d="M-25 -38 l5 -10 M-10 -38 l3 -10 M5 -38 l2 -10 M20 -38 l2 -10" stroke="#fdfcfa" strokeWidth="2" opacity=".5" />
      <rect x="-26" y="-18" width="52" height="18" fill="var(--b-wood)" />
      <rect x="-21" y="-32" width="11" height="14" rx="3" fill="#b2324a" opacity=".9" />
      <rect x="-6" y="-32" width="11" height="14" rx="3" fill="#efe9dd" />
      <rect x="9" y="-32" width="11" height="14" rx="3" fill="#8fbf5a" opacity=".9" />
    </>
  )
}

/** El puesto del mercado de Don Beto: toldo de rayas y huacales con fruta. */
export function Mercado() {
  return (
    <>
      <path d="M-26 -50 V-12 M26 -50 V-12" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-32 -52 h64 l-4 11 h-56z" fill="#4c6fb5" />
      <path d="M-24 -41 l3 -11 M-8 -41 l1 -11 M8 -41 l-1 -11 M24 -41 l-3 -11" stroke="#fdfcfa" strokeWidth="4" />
      <rect x="-28" y="-16" width="56" height="16" fill="var(--b-wood)" />
      <path d="M-28 -8 h56" stroke="var(--b-wood-2)" />
      <g fill="#f29d1f">
        <circle cx="-20" cy="-19" r="4" />
        <circle cx="-13" cy="-19" r="4" />
        <circle cx="-16.5" cy="-24" r="4" />
      </g>
      <g fill="#7fb365">
        <circle cx="-1" cy="-19" r="3.5" />
        <circle cx="5" cy="-19" r="3.5" />
        <circle cx="2" cy="-23.5" r="3.5" />
      </g>
      <g fill="#c0504a">
        <circle cx="15" cy="-19" r="4" />
        <circle cx="22" cy="-19" r="4" />
      </g>
    </>
  )
}

/** El taller de Don Ramiro: un tejabán de madera con su serrucho. */
export function Taller() {
  return (
    <>
      <path d="M-30 0 V-48 L30 -48 V0Z" fill="#b88a5c" />
      <path d="M-30 -36 h60 M-30 -24 h60 M-30 -12 h60" stroke="#9a7048" />
      <path d="M-36 -46 L0 -66 L36 -46" stroke="#6e4c33" strokeWidth="6" fill="none" strokeLinejoin="round" />
      <rect x="-12" y="-30" width="24" height="30" fill="#5a3e2b" />
      <path d="M8 -44 l14 0 l0 6 l-14 4z" fill="#c8beb0" />
      <rect x="4" y="-46" width="6" height="8" rx="2" fill="#6e4c33" />
      <path d="M-26 0 l6 -18 h4 l-6 18z" fill="#d9b26a" />
    </>
  )
}

/** Un rebozo colgado del mecate, con sus rayas y sus flecos. */
function Rebozo({ x, fill, stripe }: { x: number; fill: string; stripe: string }) {
  return (
    <g>
      <rect x={x} y="-43" width="10" height="16" rx="1" fill={fill} />
      <path d={`M${x} -38 h10 M${x} -33 h10`} stroke={stripe} strokeWidth="1.2" />
      <path d={`M${x + 1.5} -27 v3 M${x + 4} -27 v3.5 M${x + 6.5} -27 v3 M${x + 9} -27 v3.5`} stroke={fill} strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

/**
 * El puesto de rebozos de Doña Chayo: toldo morado, rebozos colgados, madejas y rebozos
 * doblados en el mostrador. Si la persona ya tejió algo en «Hilos sueltos», su bordado más
 * nuevo cuelga en medio, como un rebozo más; si no, ahí va uno amarillo.
 */
export function Telar({ patch }: { patch?: Patch | null }) {
  return (
    <>
      <path d="M-26 -54 V-14 M26 -54 V-14" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-32 -58 h64 v10 h-64z" fill="#7a5aa6" />
      <path d="M-32 -48 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0z" fill="#7a5aa6" />
      <text y="-50.5" textAnchor="middle" fontSize="6.5" fontWeight="700" textLength="36" lengthAdjust="spacingAndGlyphs" fill="#fdfcfa" className="b-label-plain">
        REBOZOS
      </text>
      <path d="M-25 -44 Q0 -41 25 -44" stroke="var(--b-iron)" strokeWidth=".8" fill="none" />
      <Rebozo x={-22} fill="#c0504a" stripe="#f2c14e" />
      <Rebozo x={12} fill="#4c6fb5" stripe="#fdfcfa" />
      {patch ? (
        <g>
          <rect x="-8" y="-43" width="16" height="16" rx="1.5" fill="#fdfcfa" stroke="var(--b-wood-2)" strokeWidth=".8" />
          <svg x="-7" y="-42" width="14" height="14" overflow="hidden">
            <PatchArt patch={patch} className="b-patch" />
          </svg>
        </g>
      ) : (
        <Rebozo x={-5} fill="#f2c14e" stripe="#e46a8f" />
      )}
      <rect x="-28" y="-16" width="56" height="16" fill="var(--b-wood)" />
      <path d="M-28 -8 h56" stroke="var(--b-wood-2)" />
      <circle cx="-19" cy="-20" r="4" fill="#e46a8f" />
      <circle cx="-10" cy="-20" r="4" fill="#6fae7d" />
      <path d="M-21 -21 q2 -2 4 0 M-12 -21 q2 -2 4 0 M-6 -18 q4 4 8 0" stroke="#fdfcfa" strokeWidth=".8" fill="none" opacity=".7" />
      <rect x="6" y="-20" width="18" height="4" rx="1" fill="#c0504a" />
      <rect x="7" y="-24" width="16" height="4" rx="1" fill="#4c6fb5" />
      <rect x="8" y="-27.5" width="14" height="3.5" rx="1" fill="#f2c14e" />
    </>
  )
}

export function Tiendita() {
  return (
    <>
      <rect x="-26" y="-50" width="52" height="50" fill="#f2c14e" />
      <path d="M-30 -50 h60 l-4 -10 h-52z" fill="#c0504a" />
      <rect x="-20" y="-40" width="40" height="18" fill="#fdfcfa" />
      <text y="-27.5" textAnchor="middle" fontSize="7.5" fontWeight="700" textLength="36" lengthAdjust="spacingAndGlyphs" fill="#8a5f3d" className="b-label-plain">
        ABARROTES
      </text>
      <rect x="-8" y="-20" width="16" height="20" fill="#8a5f3d" />
    </>
  )
}

/** El buzón de Memo, el cartero. */
export function Buzon() {
  return (
    <>
      <rect x="-2" y="-22" width="4" height="22" fill="var(--b-iron)" />
      <path d="M-12 -22 V-40 a12 8 0 0 1 24 0 V-22Z" fill="#3f8a69" />
      <rect x="-8" y="-36" width="16" height="3" rx="1.5" fill="#1f4a39" />
      <path d="M-6 -30 h12 v8 h-12z" fill="#fdfcfa" />
      <path d="M-6 -30 l6 4 l6 -4" stroke="#c0504a" fill="none" />
    </>
  )
}

/** El letrero de Salir del hueco: una flecha y el hueco con su cuerda. */
export function LetreroHueco() {
  return (
    <>
      <rect x="-2" y="-46" width="4" height="46" fill="var(--b-wood-2)" />
      <path d="M-20 -58 h34 l8 8 l-8 8 h-34z" fill="var(--b-wood)" />
      <ellipse cx="-4" cy="-47" rx="10" ry="4" fill="#3b2f2a" />
      <path d="M2 -56 q4 6 -1 10" stroke="#e9c79b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cy="-2" rx="16" ry="6" fill="#3b2f2a" opacity=".85" />
      <path d="M-10 -3 q2 -3 6 -2" stroke="#7fb365" strokeWidth="2" fill="none" />
    </>
  )
}

/** La casita de juegos tranquilos: lleva a Distraer. */
export function CasitaJuegos() {
  return (
    <>
      <path d="M-20 0 V-30 L20 -30 V0Z" fill="#9fc7e0" />
      <path d="M-25 -28 L0 -48 L25 -28" fill="#4c6fb5" />
      <rect x="-7" y="-18" width="14" height="18" rx="6" fill="#fdfcfa" />
      <g transform="translate(0 -38)">
        <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#f2c14e" />
        <circle cx="-2" cy="-2" r="1.2" fill={INK} />
        <circle cx="2" cy="2" r="1.2" fill={INK} />
      </g>
    </>
  )
}

/** El poste de los rumbos: tres flechas hacia sus calles. */
export function PosteRumbos({ chosen }: { chosen: number }) {
  const boards = ['#e46a8f', '#f2c14e', '#6fae7d']
  return (
    <>
      <rect x="-2" y="-62" width="4" height="62" fill="var(--b-iron)" />
      {boards.map((b, i) => {
        const y = -58 + i * 13
        const left = i % 2 === 1
        return (
          <path
            key={b}
            d={left ? `M2 ${y} h-22 l-6 5 l6 5 h22z` : `M-2 ${y} h22 l6 5 l-6 5 h-22z`}
            fill={b}
            opacity={i < Math.max(1, chosen) ? 1 : 0.5}
          />
        )
      })}
    </>
  )
}

/** La casa de la persona en la plaza, con su color y su nombre. */
export function Casa({ facade, name }: { facade: string; name: string }) {
  return (
    <>
      <path d="M-30 0 V-56 L0 -78 L30 -56 V0Z" fill={facade} />
      <path d="M-34 -54 L0 -82 L34 -54" stroke="#8a5f3d" strokeWidth="5" fill="none" strokeLinejoin="round" />
      <rect x="-10" y="-34" width="20" height="34" rx="9" fill="#3f6fb0" />
      <circle cx="5" cy="-16" r="1.8" fill="#ffd36b" />
      <rect x="-25" y="-48" width="11" height="11" rx="2" fill="#fdfcfa" opacity=".9" />
      <rect x="14" y="-48" width="11" height="11" rx="2" fill="#fdfcfa" opacity=".9" />
      <text y="-92" textAnchor="middle" fontSize="14" fontWeight="650" className="b-label">
        {name}
      </text>
    </>
  )
}

export function Gato() {
  return (
    <>
      <ellipse cy="-6" rx="13" ry="7" fill="#e9a35a" />
      <path d="M-12 -4 q-8 2 -4 -7" stroke="#e9a35a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="-9" r="6.5" fill="#e9a35a" />
      <path d="M5 -14 l2 -6 l3 4z M10 -14 l3 -6 l2 6z" fill="#e9a35a" />
      <path d="M7 -9 q1.5 1 3 0 M11 -9 q1.5 1 3 0" stroke="#5a3a22" fill="none" />
      <text x="16" y="-22" fontSize="10" className="b-zz">
        z
      </text>
    </>
  )
}

export function Paloma() {
  return (
    <>
      <ellipse cy="-6" rx="8" ry="5.5" fill="#9aa3ad" />
      <path d="M-7 -6 l-6 -2 l2 4z" fill="#7d868f" />
      <circle cx="6" cy="-12" r="4" fill="#9aa3ad" />
      <circle cx="7.5" cy="-12.5" r=".9" fill={INK} />
      <path d="M10 -12 l3 1 l-3 1z" fill="#e8a462" />
    </>
  )
}

export function Globo() {
  return (
    <>
      <rect x="-2" y="-10" width="4" height="10" fill="var(--b-wood-2)" />
      <path d="M0 -10 C-5 -30 6 -46 0 -62" stroke="var(--muted)" fill="none" />
      <g className="b-sway">
        <ellipse cy="-76" rx="11" ry="13" fill="#e2574c" />
        <path d="M-2 -63 h4 l-2 3z" fill="#e2574c" />
        <ellipse cx="-4" cy="-80" rx="3" ry="4" fill="#fff" opacity=".35" />
      </g>
    </>
  )
}

export function Flores() {
  return (
    <>
      <path d="M-13 -15 h26 l-3 15 h-20z" fill="#b86b45" />
      <g fill="#f29d1f">
        <circle cx="-7" cy="-20" r="5" />
        <circle cx="3" cy="-23" r="5.5" />
        <circle cx="9" cy="-17" r="4.5" />
        <circle cx="-2" cy="-16" r="4" />
      </g>
      <g fill="#d9731b">
        <circle cx="-7" cy="-20" r="1.8" />
        <circle cx="3" cy="-23" r="2" />
      </g>
    </>
  )
}

export function Farol() {
  return (
    <>
      <ellipse rx="7" ry="3" fill="#000" opacity=".12" />
      <rect x="-2" y="-62" width="4" height="62" fill="var(--b-iron)" />
      <path d="M-8 -62 h16 l-3 -13 h-10z" fill="#ffe39a" stroke="var(--b-iron)" strokeWidth="1.5" />
      <path d="M-9 -75 h18 l-9 -6z" fill="var(--b-iron)" />
    </>
  )
}

/** El circulito sobre quien tiene misión hoy: «!» si espera, «…» si ya están platicando. */
export function Marker({ y, talking }: { y: number; talking: boolean }) {
  return (
    <g className="b-mark" aria-hidden="true">
      <circle cy={y} r="9" fill={talking ? 'var(--surface)' : 'var(--accent)'} stroke="var(--accent)" strokeWidth="2" />
      <text y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={talking ? 'var(--text)' : '#1d2422'}>
        {talking ? '…' : '!'}
      </text>
    </g>
  )
}

// ---------- Lo nuevo del barrio grande ----------

const NEIGHBOR_FACADES = ['#f2c14e', '#6fae7d', '#9fc7e0', '#c8714a']
const NEIGHBOR_DOORS = ['#8a5f3d', '#3f6fb0', '#c0504a', '#5a3e2b']

/** La casa de un vecino de Mi calle: más bajita que la de la persona, de otro color. */
export function CasaVecina({ v = 0 }: { v?: number }) {
  const facade = NEIGHBOR_FACADES[v % NEIGHBOR_FACADES.length]
  const door = NEIGHBOR_DOORS[v % NEIGHBOR_DOORS.length]
  const flat = v % 2 === 1
  return (
    <>
      <ellipse rx="30" ry="9" fill="#000" opacity=".1" />
      {flat ? (
        <>
          <rect x="-28" y="-50" width="56" height="50" fill={facade} />
          <rect x="-31" y="-54" width="62" height="6" rx="2" fill="#efe9dd" />
          <path d="M-22 -54 v-6 h8 v6" fill="#bfb6a8" />
        </>
      ) : (
        <>
          <path d="M-28 0 V-46 L0 -64 L28 -46 V0Z" fill={facade} />
          <path d="M-32 -44 L0 -68 L32 -44" stroke="#9a5a3c" strokeWidth="5" fill="none" strokeLinejoin="round" />
        </>
      )}
      <rect x="-8" y="-28" width="16" height="28" rx="2" fill={door} />
      <rect x="-23" y="-40" width="10" height="10" rx="1.5" fill="#fdfcfa" opacity=".85" />
      <rect x="13" y="-40" width="10" height="10" rx="1.5" fill="#fdfcfa" opacity=".85" />
      <path d="M-24 -29 h12 M12 -29 h12" stroke="#7fb365" strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

/** La panadería: toldo café, charola de conchas en el aparador. */
export function Panaderia() {
  return (
    <>
      <rect x="-28" y="-54" width="56" height="54" fill="#f6d9b8" />
      <path d="M-32 -54 h64 l-4 -10 h-56z" fill="#8a5f3d" />
      <path d="M-32 -54 h64 l-4 9 h-56z" fill="#c98f63" />
      <path d="M-22 -45 l2 -9 M-6 -45 l1 -9 M10 -45 l-1 -9 M24 -45 l-2 -9" stroke="#fdfcfa" strokeWidth="3" opacity=".6" />
      <rect x="-22" y="-36" width="20" height="16" rx="2" fill="#fdfcfa" />
      <g fill="#e9a35a">
        <ellipse cx="-17" cy="-25" rx="4" ry="3" />
        <ellipse cx="-8" cy="-25" rx="4" ry="3" fill="#e46a8f" />
        <ellipse cx="-12.5" cy="-30" rx="4" ry="3" fill="#f3e3b5" />
      </g>
      <rect x="4" y="-30" width="16" height="30" rx="2" fill="#8a5f3d" />
      <text y="-57" textAnchor="middle" fontSize="7" fontWeight="700" textLength="40" lengthAdjust="spacingAndGlyphs" fill="#fdfcfa" className="b-label-plain">
        PANADERÍA
      </text>
    </>
  )
}

/** La papelería: azulita, con cuadernos y un rollo de papel de china. */
export function Papeleria() {
  return (
    <>
      <rect x="-26" y="-50" width="52" height="50" fill="#dfe3f1" />
      <rect x="-30" y="-58" width="60" height="9" rx="2" fill="#4c6fb5" />
      <text y="-51.5" textAnchor="middle" fontSize="6.5" fontWeight="700" textLength="40" lengthAdjust="spacingAndGlyphs" fill="#fdfcfa" className="b-label-plain">
        PAPELERÍA
      </text>
      <rect x="-20" y="-40" width="22" height="18" rx="2" fill="#fdfcfa" />
      <rect x="-17" y="-36" width="5" height="12" fill="#e46a8f" />
      <rect x="-11" y="-36" width="5" height="12" fill="#f2c14e" />
      <rect x="-5" y="-36" width="5" height="12" fill="#6fae7d" />
      <rect x="6" y="-28" width="14" height="28" rx="2" fill="#3f6fb0" />
      <path d="M-26 -14 h18 v14 h-18z" fill="#c7b5ee" opacity=".8" />
    </>
  )
}

const STALLS = [
  { toldo: '#c0504a', goods: 'tortillas' },
  { toldo: '#e46a8f', goods: 'flores' },
  { toldo: '#6fae7d', goods: 'ollas' },
  { toldo: '#f2c14e', goods: 'dulces' },
] as const

/** Un puesto de adorno del mercado: tortillería, flores, ollas de barro o dulces. */
export function Toldo({ v = 0 }: { v?: number }) {
  const { toldo, goods } = STALLS[v % STALLS.length]
  return (
    <>
      <path d="M-24 -48 V-14 M24 -48 V-14" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-30 -50 h60 l-4 10 h-52z" fill={toldo} />
      <path d="M-22 -40 l3 -10 M-7 -40 l1 -10 M8 -40 l-1 -10 M22 -40 l-3 -10" stroke="#fdfcfa" strokeWidth="3" opacity=".7" />
      <rect x="-26" y="-16" width="52" height="16" fill="var(--b-wood)" />
      {goods === 'tortillas' && (
        <g>
          <ellipse cx="-8" cy="-19" rx="14" ry="4" fill="#f3e3b5" />
          <ellipse cx="-8" cy="-22" rx="13" ry="3.6" fill="#efd9a0" />
          <ellipse cx="-8" cy="-25" rx="12" ry="3.4" fill="#f3e3b5" />
          <rect x="10" y="-30" width="12" height="14" rx="3" fill="#e9c79b" />
          <path d="M10 -30 h12" stroke="#c0504a" strokeWidth="2" />
        </g>
      )}
      {goods === 'flores' && (
        <g>
          {[-16, -4, 8, 18].map((x, i) => (
            <g key={x}>
              <path d={`M${x} -16 v-10`} stroke="#5f9e56" strokeWidth="2" />
              <circle cx={x} cy="-28" r="5" fill={['#f29d1f', '#e46a8f', '#fdfcfa', '#9b7fd1'][i]} />
            </g>
          ))}
        </g>
      )}
      {goods === 'ollas' && (
        <g fill="#b86b45">
          <ellipse cx="-14" cy="-24" rx="9" ry="8" />
          <rect x="-18" y="-34" width="8" height="4" rx="1" />
          <ellipse cx="4" cy="-23" rx="7" ry="7" fill="#c8714a" />
          <ellipse cx="17" cy="-22" rx="6" ry="6" />
          <path d="M-20 -24 h12 M-2 -23 h12" stroke="#f3e3b5" strokeWidth="1.2" opacity=".8" />
        </g>
      )}
      {goods === 'dulces' && (
        <g>
          {[-16, -6, 4, 14].map((x, i) => (
            <rect key={x} x={x} y="-26" width="8" height="10" rx="2" fill={['#e46a8f', '#9fc7e0', '#f29d1f', '#fdfcfa'][i]} />
          ))}
          <circle cx="-10" cy="-30" r="3" fill="#c0504a" />
          <circle cx="10" cy="-30" r="3" fill="#6fae7d" />
        </g>
      )}
    </>
  )
}

/** La oficina de correos de Memo, chiquita y de puerta verde. */
export function Correo() {
  return (
    <>
      <rect x="-26" y="-46" width="52" height="46" fill="#efe6da" />
      <path d="M-30 -46 h60 l-6 -10 h-48z" fill="#3f8a69" />
      <rect x="-20" y="-40" width="40" height="9" rx="1.5" fill="#fdfcfa" />
      <text y="-33" textAnchor="middle" fontSize="7" fontWeight="700" textLength="32" lengthAdjust="spacingAndGlyphs" fill="#1f4a39" className="b-label-plain">
        CORREOS
      </text>
      <rect x="-8" y="-26" width="16" height="26" rx="2" fill="#3f8a69" />
      <path d="M-22 -24 h10 v8 h-10z M12 -24 h10 v8 h-10z" fill="#fdfcfa" opacity=".85" />
    </>
  )
}

/** El señor de los globos, con su ramo de colores. */
export function Globero() {
  const balloons: [number, number, string][] = [
    [-12, -92, '#f2c14e'],
    [2, -100, '#4c6fb5'],
    [14, -90, '#e46a8f'],
    [-2, -84, '#6fae7d'],
    [10, -78, '#9b7fd1'],
  ]
  return (
    <>
      <Person legs="#4a3b55" shirt="#e8a462" skin="#a8775a" head={<path d="M-12 -52 h24 l-4 -6 h-16z M-7 -58 a7 6 0 0 1 14 0z" fill="#d9b26a" />} />
      <g stroke="var(--muted)" strokeWidth=".8" fill="none">
        {balloons.map(([x, y]) => (
          <path key={x} d={`M8 -34 L${x} ${y + 10}`} />
        ))}
      </g>
      <g className="b-sway">
        {balloons.map(([x, y, f]) => (
          <ellipse key={x} cx={x} cy={y} rx="7" ry="9" fill={f} />
        ))}
      </g>
    </>
  )
}

/** El perrito del barrio, echado y moviendo la cola. */
export function Perrito() {
  return (
    <>
      <ellipse rx="14" ry="4.5" fill="#000" opacity=".12" />
      <ellipse cy="-8" rx="13" ry="7" fill="#c99a6b" />
      <path className="b-wag" d="M-12 -10 q-8 -6 -6 -14" stroke="#c99a6b" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="10" cy="-14" r="7" fill="#c99a6b" />
      <path d="M6 -19 q-4 2 -3 9 l3 -2z" fill="#8a5f3d" />
      <ellipse cx="16" cy="-12" rx="3.2" ry="2.4" fill="#e8c9a3" />
      <circle cx="17.5" cy="-13" r="1.2" fill={INK} />
      <circle cx="11" cy="-16" r="1.1" fill={INK} />
      <path d="M-2 -1 h4 M6 -1 h4" stroke="#c99a6b" strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

const FOLKS: [string, string, string][] = [
  ['#c98a5a', '#5f9e82', '#3d4f74'],
  ['#a8775a', '#e8a462', '#4a3b55'],
  ['#b98563', '#8fb0de', '#5b4a3a'],
  ['#c68f6b', '#e46a8f', '#3b3f3e'],
  ['#9c6b4f', '#f2c14e', '#46566e'],
  ['#b07a58', '#c7b5ee', '#3d4f74'],
]

/** Gente del barrio, de lejos: chiquita, sin cara ni plática, para que el barrio se sienta vivo. */
export function Gente({ v = 0 }: { v?: number }) {
  const [skin, shirt, legs] = FOLKS[v % FOLKS.length]
  return (
    <>
      <ellipse rx="10" ry="3.5" fill="#000" opacity=".12" />
      <g transform="scale(.78)">
        <rect x="-6" y="-14" width="5" height="14" rx="2.4" fill={legs} />
        <rect x="1" y="-14" width="5" height="14" rx="2.4" fill={legs} />
        <rect x="-9" y="-37" width="18" height="26" rx="7.5" fill={shirt} />
        <circle cy="-44" r="8" fill={skin} />
        {v % 3 === 0 ? <path d="M-13 -48 h26 l-5 -4 h-16z M-7 -52 a7 6 0 0 1 14 0z" fill="#d9b26a" /> : <path d="M-8 -46 a8 8 0 0 1 16 0 l-1 -4 a7 6 0 0 0 -14 0z" fill="#3a2b22" />}
      </g>
    </>
  )
}

/** Un farolito de papel en su poste, como los del juego de Salir del hueco. */
export function Farolito() {
  return (
    <>
      <ellipse rx="6" ry="2.6" fill="#000" opacity=".12" />
      <rect x="-1.5" y="-44" width="3" height="44" fill="var(--b-wood-2)" />
      <path d="M-1.5 -44 h10 v3" stroke="var(--b-wood-2)" strokeWidth="2" fill="none" />
      <g className="b-flame">
        <ellipse cx="8.5" cy="-32" rx="7" ry="9" fill="#f29d1f" />
        <ellipse cx="8.5" cy="-32" rx="3.5" ry="6" fill="#ffe39a" opacity=".8" />
      </g>
      <path d="M2 -32 h13" stroke="#00000022" />
    </>
  )
}
