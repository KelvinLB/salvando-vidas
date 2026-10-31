import type { ReactNode } from 'react'

// Caras de línea para elegir cómo te sientes (de 1, muy mal, a 5, muy bien) o cómo está la
// mascota: un círculo, los ojos y la boca, del color del texto. Se ven parejas y tranquilas, sin
// los colores de un emoji.

type Cara = 1 | 2 | 3 | 4 | 5 | 'feliz' | 'calma' | 'triste' | 'cansado' | 'nervios' | 'apagado'

const OJOS = <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={2.4} />
const OJOS_CERRADOS = <path d="M7.8 10q1.2-1 2.4 0M13.8 10q1.2-1 2.4 0" />

const CARAS: Record<string, { ojos: ReactNode; boca: string }> = {
  1: { ojos: OJOS, boca: 'M8 17q4-4 8 0' },
  2: { ojos: OJOS, boca: 'M8.5 16q3.5-2 7 0' },
  3: { ojos: OJOS, boca: 'M8.5 15.5h7' },
  4: { ojos: OJOS, boca: 'M8.5 14q3.5 2.5 7 0' },
  5: { ojos: OJOS, boca: 'M8 13.5q4 4.5 8 0' },
  feliz: { ojos: OJOS, boca: 'M8 13.5q4 4.5 8 0' },
  calma: { ojos: OJOS_CERRADOS, boca: 'M9 14.5q3 2 6 0' },
  triste: { ojos: OJOS, boca: 'M8.5 16.5q3.5-2.5 7 0' },
  cansado: { ojos: <path d="M7.8 10h2.4M13.8 10h2.4" />, boca: 'M10.5 15.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0' },
  nervios: { ojos: OJOS, boca: 'M8 15.5q1-1 2 0t2 0t2 0t2 0' },
  apagado: { ojos: OJOS, boca: 'M10 15.5h4' },
}

export default function CaraAnimo({ cara, size = 28 }: { cara: Cara; size?: number }) {
  const { ojos, boca } = CARAS[cara] ?? CARAS[3]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d={boca} />
      {ojos}
    </svg>
  )
}
