import type { JSX } from 'react'
import type { PathId } from '../../data/sentido'

// El dibujo de cada carta, como en la lotería: figuras planas con contorno de tinta.
// 61 El Hacer: una cazuela de barro con su cuchara, que alguien está cocinando.
// 62 El Recibir: dos manos abiertas que reciben un solecito.
// 63 La Postura: un nopal que sigue de pie con viento y lluvia.
// Los colores son de la carta (papel y tinta), iguales en claro y en oscuro.

const INK = '#2a2420'

function Hacer() {
  return (
    <>
      <circle cx="50" cy="52" r="44" fill="#f6dcc0" />
      <path d="M38 22q-5 6 0 11t0 11M50 18q-5 7 0 13t0 12M62 22q-5 6 0 11t0 11" fill="none" stroke="#b9a99a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M72 30l-14 26" stroke="#8a5a36" strokeWidth="5" strokeLinecap="round" />
      <path d="M72 30l-14 26" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
      <path d="M24 52h52c0 20-11 32-26 32S24 72 24 52z" fill="#c8693c" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 52h60" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M24 58q-9 0-9 6t9 4M76 58q9 0 9 6t-9 4" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 64q18 7 36 0" fill="none" stroke="#f0c25a" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 72l4 3 4-3 4 3 4-3 4 3 4-3" fill="none" stroke="#f6dcc0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 92h72" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  )
}

function Recibir() {
  return (
    <>
      <circle cx="50" cy="52" r="44" fill="#d9e8f2" />
      <circle cx="50" cy="40" r="12" fill="#f0c25a" stroke={INK} strokeWidth="2.5" />
      <path
        d="M50 18v6M50 56v4M30 40h5M65 40h5M36 26l4 4M60 26l-4 4M36 54l3-3M64 54l-3-3"
        stroke={INK}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14 62q6-4 12 2l10 10q6 6 14 6v12H30q-10 0-16-10z"
        fill="#e7b48f"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M86 62q-6-4-12 2L64 74q-6 6-14 6v12h20q10 0 16-10z"
        fill="#e7b48f"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M22 66l8 8M78 66l-8 8" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      <path d="M40 92h20" stroke="#5f9e82" strokeWidth="4" strokeLinecap="round" />
    </>
  )
}

function Postura() {
  return (
    <>
      <circle cx="50" cy="52" r="44" fill="#e7e0f0" />
      <path d="M26 16q6-6 14-2 6-6 14 0 8-2 10 6H26z" fill="#b8bfd6" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M32 28l-3 7M44 28l-3 7M56 28l-3 7" stroke="#6d8cc7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 44q8-4 14 0M70 34q8-4 16 0M74 46q6-3 12 0" fill="none" stroke="#6d8cc7" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="50" cy="68" rx="11" ry="16" fill="#5f9e82" stroke={INK} strokeWidth="2.5" />
      <ellipse cx="37" cy="50" rx="8" ry="11" fill="#6fae90" stroke={INK} strokeWidth="2.5" transform="rotate(-24 37 50)" />
      <ellipse cx="62" cy="47" rx="8" ry="12" fill="#6fae90" stroke={INK} strokeWidth="2.5" transform="rotate(20 62 47)" />
      <circle cx="62" cy="34" r="3.4" fill="#e46a8f" stroke={INK} strokeWidth="1.6" />
      <path d="M46 62h1M54 70h1M47 78h1M35 48h1M62 44h1M64 52h1" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 86q32-8 64 0" fill="none" stroke="#8a6a4a" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 86l-4 6M50 86v7M56 86l4 6" stroke="#8a6a4a" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

const ART: Record<PathId, () => JSX.Element> = { hacer: Hacer, recibir: Recibir, postura: Postura }

export default function CartaArte({ path }: { path: PathId }) {
  const Art = ART[path]
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <Art />
    </svg>
  )
}
