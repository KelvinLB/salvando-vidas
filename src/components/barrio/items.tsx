import type { ReactNode } from 'react'
import type { ItemId } from '../../data/barrio'
import type { House } from '../../lib/barrio'
import { Flores } from './drawings'

// Las cosas de la casa, del catálogo mexicano, con la base en 0,0 del cuadrito donde se ponen.
// Todas se ganan cuidándose, nunca se compran. La ofrenda es sencilla y respetuosa: velas,
// flores, papel picado y pan; sin calaveras.

export const ITEM_ART: Record<ItemId, ReactNode> = {
  petate: (
    <>
      <path d="M0 -14 L26 -1 L0 12 L-26 -1Z" fill="#d9b98e" stroke="#b8935f" />
      <path d="M-13 -7.5 L13 5.5 M-6.5 -10.7 L19.5 2.2 M-19.5 -4.2 L6.5 8.8 M13 -7.5 L-13 5.5 M19.5 -4.2 L-6.5 8.8 M6.5 -10.7 L-19.5 2.2" stroke="#b8935f" strokeWidth="1" />
    </>
  ),
  cuerda: (
    <>
      <ellipse cy="-5" rx="14" ry="7" fill="#a7764f" />
      <ellipse cy="-7" rx="9" ry="4.5" fill="none" stroke="#e9c79b" strokeWidth="2" />
      <ellipse cy="-7" rx="4" ry="2" fill="#8a5f3d" />
    </>
  ),
  faro: (
    <>
      <path d="M-8 0 L-5 -38 H5 L8 0Z" fill="#fdfcfa" stroke="#c8beb0" />
      <path d="M-7 -10 H7 L6.5 -18 H-6.5Z M-6 -26 H6 L5.5 -33 H-5.5Z" fill="#c0504a" />
      <rect x="-6" y="-46" width="12" height="8" fill="#ffe39a" />
      <path d="M-8 -46 h16 l-8 -7z" fill="#c0504a" />
    </>
  ),
  farol: (
    <>
      <path d="M0 0 V-8" stroke="var(--b-iron)" />
      <rect x="-6" y="-2" width="12" height="3" rx="1.5" fill="var(--b-wood-2)" />
      <ellipse cy="-20" rx="11" ry="13" fill="#ff9b86" />
      <path d="M-11 -20 h22 M-9 -27 h18 M-9 -13 h18" stroke="#d6453d" strokeWidth="1" opacity=".6" />
      <rect x="-5" y="-35" width="10" height="3" fill="#d6453d" />
    </>
  ),
  papel: (
    <>
      <path d="M-20 -6 V-44 M20 -6 V-44" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-20 -42 Q0 -36 20 -42" stroke="var(--b-iron)" fill="none" />
      <rect x="-17" y="-41" width="7" height="10" fill="#e46a8f" />
      <rect x="-8" y="-39.5" width="7" height="10" fill="#f2c14e" />
      <rect x="1" y="-39.5" width="7" height="10" fill="#4c6fb5" />
      <rect x="10" y="-41" width="7" height="10" fill="#6fae7d" />
    </>
  ),
  foquitos: (
    <>
      <rect x="-2" y="-40" width="4" height="40" fill="var(--b-iron)" />
      <path d="M-14 -38 Q0 -28 14 -38" stroke="var(--b-iron)" fill="none" />
      <g fill="#ffd36b" className="b-bulb on">
        <circle cx="-10" cy="-33" r="3" />
        <circle cx="0" cy="-30" r="3" />
        <circle cx="10" cy="-33" r="3" />
      </g>
    </>
  ),
  maceta: <Flores />,
  jarra: (
    <>
      <path d="M-8 0 h16 l2 -22 h-20z" fill="#b2324a" opacity=".85" />
      <path d="M-10 -22 h20 v-4 h-20z" fill="#e6dfd5" />
      <path d="M10 -18 q7 2 0 10" stroke="#e6dfd5" strokeWidth="2.5" fill="none" />
    </>
  ),
  talavera: (
    <>
      <path d="M-8 0 L0 -6 L8 0" stroke="var(--b-wood-2)" strokeWidth="3" fill="none" />
      <circle cy="-20" r="15" fill="#f7f4ec" stroke="#2f55a4" strokeWidth="2.5" />
      <circle cy="-20" r="10" fill="none" stroke="#2f55a4" strokeWidth="1" strokeDasharray="2.5 2" />
      <g fill="#2f55a4">
        <circle cx="0" cy="-25" r="2.6" />
        <circle cx="5" cy="-20" r="2.6" />
        <circle cx="0" cy="-15" r="2.6" />
        <circle cx="-5" cy="-20" r="2.6" />
      </g>
      <circle cy="-20" r="2" fill="#f2c14e" />
    </>
  ),
  banquito: (
    <>
      <path d="M-10 -2 L-8 -16 M10 -2 L8 -16 M0 4 L0 -14" stroke="#8a5f3d" strokeWidth="3" strokeLinecap="round" />
      <ellipse cy="-17" rx="14" ry="6" fill="#a7764f" />
      <ellipse cy="-18" rx="14" ry="6" fill="#c08a5c" />
    </>
  ),
  cojin: (
    <>
      <path d="M-16 -4 Q-18 -20 -10 -22 Q0 -26 10 -22 Q18 -20 16 -4 Q0 2 -16 -4Z" fill="#e46a8f" />
      <g fill="#f2c14e">
        <circle cx="0" cy="-12" r="3" />
      </g>
      <g fill="#6fae7d">
        <ellipse cx="-6" cy="-12" rx="3" ry="1.6" />
        <ellipse cx="6" cy="-12" rx="3" ry="1.6" />
      </g>
      <g fill="#4c6fb5">
        <circle cx="0" cy="-18" r="1.6" />
        <circle cx="0" cy="-6" r="1.6" />
      </g>
    </>
  ),
  jarro: (
    <>
      <path d="M-9 0 Q-13 -12 -8 -20 h16 Q13 -12 9 0Z" fill="#b8663f" />
      <path d="M-9 -20 h18 v-3 h-18z" fill="#9a5232" />
      <path d="M9 -17 q8 4 0 11" stroke="#9a5232" strokeWidth="2.5" fill="none" />
      <g fill="#f3e3b5">
        <circle cx="-4" cy="-11" r="1.3" />
        <circle cx="0" cy="-13" r="1.3" />
        <circle cx="4" cy="-11" r="1.3" />
      </g>
    </>
  ),
  // El rebozo de Doña Chayo, colgado en su perchero de madera, con rayas y flecos.
  rebozo: (
    <>
      <path d="M-14 0 V-40 M14 0 V-40" stroke="#8a5f3d" strokeWidth="3" strokeLinecap="round" />
      <path d="M-17 0 h7 M10 0 h7" stroke="#6e4c33" strokeWidth="3" strokeLinecap="round" />
      <path d="M-17 -40 h34" stroke="#6e4c33" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M-11 -40 Q-13 -24 -10 -12 L10 -12 Q13 -24 11 -40Z" fill="#b8406f" />
      <path d="M-12 -33 h24 M-12.4 -27 h24.8 M-11.8 -19 h23.6" stroke="#f2c14e" strokeWidth="1.4" />
      <path d="M-12 -30 h24 M-11.6 -22 h23.2" stroke="#fdfcfa" strokeWidth=".8" opacity=".8" />
      <path d="M-9 -12 v5 M-5.5 -12 v6 M-2 -12 v5 M1.5 -12 v6 M5 -12 v5 M8.5 -12 v6" stroke="#b8406f" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  bugambilia: (
    <>
      <path d="M-10 -12 h20 l-3 12 h-14z" fill="#b86b45" />
      <path d="M0 -12 V-30" stroke="#6e4c33" strokeWidth="2" />
      <g fill="#c2378a">
        <circle cx="-8" cy="-30" r="6" />
        <circle cx="4" cy="-36" r="7" />
        <circle cx="9" cy="-26" r="5.5" />
        <circle cx="-3" cy="-22" r="5" />
      </g>
      <g fill="#e46aa8">
        <circle cx="-6" cy="-32" r="2.4" />
        <circle cx="5" cy="-38" r="2.6" />
      </g>
    </>
  ),
  nopal: (
    <>
      <path d="M-10 -10 h20 l-3 10 h-14z" fill="#b86b45" />
      <g fill="#5f9a4e">
        <ellipse cy="-22" rx="7" ry="11" />
        <ellipse cx="-9" cy="-34" rx="5" ry="8" transform="rotate(-25 -9 -34)" />
        <ellipse cx="8" cy="-36" rx="5" ry="7.5" transform="rotate(25 8 -36)" />
      </g>
      <g fill="#e2574c">
        <ellipse cx="-11" cy="-43" rx="2" ry="2.6" />
        <ellipse cx="10" cy="-44" rx="2" ry="2.6" />
      </g>
      <g fill="#cfe6b8">
        <circle cx="-2" cy="-24" r=".9" />
        <circle cx="3" cy="-19" r=".9" />
        <circle cx="1" cy="-28" r=".9" />
      </g>
    </>
  ),
  comal: (
    <>
      <g fill="#8d8494">
        <ellipse cx="-12" cy="-2" rx="5" ry="4" />
        <ellipse cx="12" cy="-2" rx="5" ry="4" />
        <ellipse cx="0" cy="4" rx="5" ry="4" />
      </g>
      <ellipse cy="-8" rx="18" ry="9" fill="#3b3f3e" />
      <ellipse cy="-9" rx="16" ry="7.5" fill="#4a4f4e" />
      <ellipse cx="-2" cy="-9" rx="8" ry="4" fill="#f1dfae" />
      <circle cx="-4" cy="-9" r="1" fill="#c9a55a" />
      <circle cx="1" cy="-10" r="1" fill="#c9a55a" />
    </>
  ),
  nacimiento: (
    <>
      <path d="M-18 0 V-22 M18 0 V-22" stroke="#8a5f3d" strokeWidth="3" />
      <path d="M-22 -20 L0 -34 L22 -20" stroke="#6e4c33" strokeWidth="4" fill="none" strokeLinejoin="round" />
      <path d="M-20 0 h40" stroke="#d9b98e" strokeWidth="4" />
      <path d="M-11 -2 q0 -12 5 -13 q5 1 5 13z" fill="#4c6fb5" />
      <circle cx="-6" cy="-17" r="3.2" fill="#c08a66" />
      <path d="M2 -2 q0 -11 5 -12 q5 1 5 12z" fill="#a7764f" />
      <circle cx="7" cy="-16" r="3.2" fill="#c08a66" />
      <ellipse cx="0" cy="-3" rx="4" ry="2.4" fill="#f3e3b5" />
      <path d="M0 -44 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4z" fill="#f2c14e" />
    </>
  ),
  pinata: (
    <>
      <path d="M-14 0 V-56 h28 V0" stroke="var(--b-wood-2)" strokeWidth="2.5" fill="none" />
      <path d="M0 -56 V-48" stroke="var(--b-iron)" />
      <g transform="translate(0 -32)">
        <path d="M0 -16 L4 -5 L16 -6 L6 2 L10 14 L0 6 L-10 14 L-6 2 L-16 -6 L-4 -5Z" fill="#e46a8f" />
        <circle r="7" fill="#f2c14e" />
        <path d="M-6 13 l-2 9 M0 8 l0 11 M6 13 l2 9" stroke="#4c6fb5" strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  ),
  banderitas: (
    <>
      <path d="M-22 -2 V-42 M22 -2 V-42" stroke="var(--b-wood-2)" strokeWidth="3" />
      <path d="M-22 -40 Q0 -32 22 -40" stroke="var(--b-iron)" fill="none" />
      <path d="M-19 -39 l6 2 l-3 9z" fill="#2f8a57" />
      <path d="M-10 -36 l6 1 l-3 9z" fill="#fdfcfa" stroke="#d9d0c3" strokeWidth=".6" />
      <path d="M-1 -35 l6 0 l-3 9z" fill="#c0392b" />
      <path d="M8 -36 l6 -1 l-3 9z" fill="#2f8a57" />
    </>
  ),
  ofrenda: (
    <>
      <path d="M-22 0 V-12 h44 V0Z" fill="#f3efe6" />
      <path d="M-15 -12 V-24 h30 V-12Z" fill="#ece4d6" />
      <path d="M-22 -3 h44 M-15 -15 h30" stroke="#e46a8f" strokeWidth="1.5" strokeDasharray="3 2" />
      <g fill="#f29d1f">
        <circle cx="-17" cy="-15" r="4" />
        <circle cx="17" cy="-15" r="4" />
        <circle cx="-12" cy="-27" r="3.4" />
        <circle cx="12" cy="-27" r="3.4" />
      </g>
      <rect x="-5" y="-34" width="10" height="10" rx="1.5" fill="#c8beb0" stroke="#8a5f3d" />
      <ellipse cx="-8" cy="-14" rx="4" ry="2.6" fill="#d9a35a" />
      {[-4, 4].map((x) => (
        <g key={x}>
          <rect x={x - 1.5} y="-22" width="3" height="8" fill="#fdfcfa" />
          <path d={`M${x} -26 q2 2 0 4 q-2 -2 0 -4z`} fill="#ffb347" className="b-flame" />
        </g>
      ))}
      <path d="M-20 -40 Q0 -36 20 -40" stroke="var(--b-iron)" fill="none" strokeWidth=".8" />
      <rect x="-17" y="-40" width="6" height="7" fill="#7a5aa6" />
      <rect x="-8" y="-38.5" width="6" height="7" fill="#f29d1f" />
      <rect x="2" y="-38.5" width="6" height="7" fill="#e46a8f" />
      <rect x="11" y="-40" width="6" height="7" fill="#f2c14e" />
    </>
  ),
  paraguas: (
    <>
      <path d="M0 0 V-26 q0 6 5 4" stroke="#3b3f3e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M-18 -26 Q-16 -44 0 -46 Q16 -44 18 -26 q-4.5 -4 -9 0 q-4.5 -4 -9 0 q-4.5 -4 -9 0 q-4.5 -4 -9 0z" fill="#4c6fb5" />
      <path d="M0 -46 Q-6 -36 -9 -26 M0 -46 Q6 -36 9 -26" stroke="#f2c14e" strokeWidth="1.5" fill="none" />
    </>
  ),
}

/** Lo que se ve por la ventana de su cuarto, en una caja de 100×100. */
export const VIEW_ART: Record<House['view'], ReactNode> = {
  cerro: (
    <>
      <rect width="100" height="100" fill="#bcd6e8" />
      <path d="M0 70 Q30 30 60 60 T100 55 V100 H0Z" fill="#7fae7a" />
      <circle cx="78" cy="22" r="9" fill="#ffd36b" />
    </>
  ),
  mar: (
    <>
      <rect width="100" height="100" fill="#bcd6e8" />
      <rect y="58" width="100" height="42" fill="#4c86b5" />
      <path d="M0 64 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0" stroke="#dbeaf5" fill="none" strokeWidth="2" />
      <circle cx="25" cy="25" r="8" fill="#ffd36b" />
    </>
  ),
  ciudad: (
    <>
      <rect width="100" height="100" fill="#bcd6e8" />
      <g fill="#8d8494">
        <rect x="4" y="50" width="16" height="50" />
        <rect x="24" y="35" width="14" height="65" />
        <rect x="42" y="55" width="18" height="45" />
        <rect x="64" y="42" width="12" height="58" />
        <rect x="80" y="58" width="18" height="42" />
      </g>
      <g fill="#ffd36b">
        <rect x="28" y="42" width="3" height="4" />
        <rect x="46" y="62" width="3" height="4" />
        <rect x="67" y="50" width="3" height="4" />
      </g>
    </>
  ),
  milpa: (
    <>
      <rect width="100" height="100" fill="#bcd6e8" />
      <circle cx="80" cy="20" r="8" fill="#ffd36b" />
      <path d="M0 58 Q50 50 100 58 V100 H0Z" fill="#a8845a" />
      {[8, 24, 40, 56, 72, 88].map((x, i) => (
        <g key={x} transform={`translate(${x} ${66 + (i % 2) * 4})`}>
          <path d="M0 30 V-22" stroke="#5f9a4e" strokeWidth="2.4" />
          <path d="M0 4 q-9 -4 -11 -12 M0 -4 q9 -4 11 -12 M0 -12 q-7 -3 -9 -10" stroke="#7fb365" strokeWidth="2" fill="none" />
          <path d="M0 -22 l-3 -6 M0 -22 l3 -6 M0 -22 v-7" stroke="#e0b84a" strokeWidth="1.6" />
          <ellipse cx="3" cy="-2" rx="2" ry="4.5" fill="#f2c14e" />
        </g>
      ))}
    </>
  ),
}

/** Un chiquito del dibujo para los botones del inventario. */
export function ItemThumb({ id }: { id: ItemId }) {
  return (
    <svg className="b-thumb" viewBox="-28 -52 56 60" aria-hidden="true">
      {ITEM_ART[id]}
    </svg>
  )
}
