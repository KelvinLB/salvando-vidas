import type { ReactNode } from 'react'
import CompanionView from './Companion'
import { type CompanionMood, companionName } from '../data/companion'
import { useCompanion } from '../lib/companion'

// Lo que la app explica, dicho por la mascota de la persona: su carita acompaña lo que se
// siente y el texto sale en un globo, como un mensaje suyo. Si todavía no tiene mascota,
// queda solo el texto. «compact» la pone al lado del texto, para frases cortas.

type Props = { mood?: CompanionMood; compact?: boolean; children: ReactNode }

export default function PetSays({ mood = 'calma', compact, children }: Props) {
  const { companion } = useCompanion()
  if (!companion) return <div className="pet-says plain">{children}</div>

  const name = companionName(companion)
  return (
    <div className={`pet-says${compact ? ' compact' : ''}`}>
      <div className="pet-says-who">
        <span className="pet-says-pet" aria-hidden="true">
          <CompanionView look={companion} mood={mood} size={compact ? 52 : 56} />
        </span>
        {!compact && <span className="pet-says-name">{name}</span>}
      </div>
      <div className="pet-says-bubble">
        {compact && <span className="visually-hidden">{name}: </span>}
        {children}
      </div>
    </div>
  )
}
