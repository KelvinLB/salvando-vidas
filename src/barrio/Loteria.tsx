import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { type MissionId, missionById } from '../data/barrio'
import { LOTERIA, type LoteriaCard, PATH_CARDS, cardOf, isPathCard } from '../data/loteria'
import type { PathId } from '../data/sentido'
import { useBarrio } from '../lib/barrio'
import { pathsAnswered, useCardAnswers } from '../lib/sentido'
import { today } from '../lib/storage'
import './insights.css'

// La lotería de dichos: cada misión terminada deja su carta para siempre. No se cuentan ni se
// comparan: las que faltan se ven de espaldas, con lo que hay que hacer para ganarlas.
// Las cartas de «Lo que no sale» (61 a 63, los tres caminos de Frankl) se suman solas cuando la
// persona contesta ese camino una vez («hoy no» no cuenta); las que no ha contestado no se
// muestran ni de espaldas, para no empujar a nadie a ese tema. Al tocarlas llevan a su pantalla.

/** Los dibujos de cada carta: trazos sencillos que se ven bien de día y de noche. */
const ART: Record<MissionId, ReactNode> = {
  mandado: (
    <>
      <rect className="bi-f-soft" x="14" y="28" width="36" height="24" rx="2" />
      <path className="bi-f-warm" d="M11 28 L15 18 H49 L53 28 Z" />
      <path className="bi-f-accent" d="M15 18 L19 28 H11 Z M27 18 L31 28 H23 Z M39 18 L43 28 H35 Z M49 18 L53 28 H47 Z" />
      <rect className="bi-f-calma" x="28" y="36" width="9" height="16" rx="1.5" />
      <rect className="bi-f-sky" x="17" y="34" width="8" height="7" rx="1" />
      <path className="bi-ink" d="M11 28 H53 M14 52 H50" />
    </>
  ),
  kiosco: (
    <>
      <path className="bi-f-calma" d="M12 26 L32 12 L52 26 Z" />
      <path className="bi-ink" d="M18 26 V46 M27 26 V46 M37 26 V46 M46 26 V46" />
      <rect className="bi-f-warm" x="12" y="46" width="40" height="6" rx="1.5" />
      <g className="bi-f-accent">
        <circle cx="16" cy="29" r="2" />
        <circle cx="24" cy="30" r="2" />
        <circle cx="32" cy="30.5" r="2" />
        <circle cx="40" cy="30" r="2" />
        <circle cx="48" cy="29" r="2" />
      </g>
      <path className="bi-ink" d="M14 28 Q32 33 50 28" />
    </>
  ),
  cinco: (
    <>
      <path className="bi-ink" d="M10 50 H54" />
      <ellipse className="bi-f-sky" cx="30" cy="34" rx="14" ry="10" />
      <path className="bi-f-calma" d="M24 32 Q32 20 40 30 Q33 33 24 32 Z" />
      <circle className="bi-f-sky" cx="43" cy="25" r="7" />
      <path className="bi-f-accent" d="M49 24 L56 26 L49 28 Z" />
      <circle className="bi-dot" cx="45" cy="24" r="1.3" />
      <path className="bi-ink" d="M17 37 L8 40 M26 44 V50 M33 44 V50" />
    </>
  ),
  agua: (
    <>
      <path className="bi-f-warm" d="M24 18 H40 V22 Q50 28 48 40 Q46 52 32 52 Q18 52 16 40 Q14 28 24 22 Z" />
      <path className="bi-ink" d="M40 26 Q52 26 50 36 Q48 42 44 42" />
      <path className="bi-f-accent" d="M18 36 Q32 40 46 36 Q45 44 32 46 Q19 44 18 36 Z" />
      <path className="bi-f-sky" d="M30 6 Q34 12 30 14 Q26 12 30 6 Z" />
    </>
  ),
  mercado: (
    <>
      <path className="bi-ink bi-thick" d="M22 8 L18 56 M44 8 L48 56" />
      <path className="bi-ink bi-thick" d="M21.4 16 H44.6 M20.6 26 H45.4 M19.8 36 H46.2 M19 46 H47" />
      <circle className="bi-f-accent" cx="33" cy="12" r="3" />
    </>
  ),
  taller: (
    <>
      <rect className="bi-f-warm" x="10" y="40" width="44" height="8" rx="1.5" />
      <path className="bi-ink" d="M14 48 V56 M50 48 V56 M18 44 H30" />
      <rect className="bi-f-soft" x="27" y="12" width="7" height="26" rx="2" transform="rotate(35 30 25)" />
      <rect className="bi-f-calma" x="18" y="8" width="20" height="8" rx="2" transform="rotate(35 30 25)" />
    </>
  ),
  banca: (
    <>
      <path className="bi-f-accent" d="M32 26 C24 20 22 12 28 10 C31 9 32 12 32 13 C32 12 33 9 36 10 C42 12 40 20 32 26 Z" />
      <rect className="bi-f-warm" x="10" y="38" width="44" height="5" rx="1.5" />
      <rect className="bi-f-warm" x="12" y="30" width="40" height="4" rx="1.5" />
      <path className="bi-ink" d="M15 43 V54 M49 43 V54 M16 34 V38 M48 34 V38" />
    </>
  ),
  carta: (
    <>
      <rect className="bi-f-soft" x="10" y="18" width="44" height="30" rx="3" />
      <path className="bi-ink" d="M10 20 L32 36 L54 20" />
      <path className="bi-f-accent" d="M32 46 C27 43 26 39 29 38 C31 37.5 32 39 32 39.5 C32 39 33 37.5 35 38 C38 39 37 43 32 46 Z" />
    </>
  ),
  hueco: (
    <>
      <ellipse className="bi-f-soft" cx="32" cy="50" rx="20" ry="6" />
      <path className="bi-ink bi-thick" d="M30 50 Q26 40 32 32 Q38 24 32 16 Q28 11 32 8" />
      <path className="bi-ink" d="M27 44 L33 42 M29 36 L35 34 M31 26 L36 24 M30 18 L35 17" />
      <path className="bi-f-accent" d="M46 10 L47.6 14 L52 14.4 L48.6 17 L49.8 21.4 L46 19 L42.2 21.4 L43.4 17 L40 14.4 L44.4 14 Z" />
    </>
  ),
  desenredar: (
    <>
      <path className="bi-ink" d="M10 12 Q32 16 54 12" />
      <path className="bi-f-warm" d="M20 13.5 H44 V38 H20 Z" />
      <path className="bi-ink" d="M20 21 H44 M20 29 H44 M22 38 V43 M27 38 V44 M32 38 V43 M37 38 V44 M42 38 V43" />
      <circle className="bi-f-accent" cx="18" cy="50" r="6" />
      <path className="bi-ink" d="M14 48 Q18 46 22 49 M15 53 Q19 51 22 53 M24 50 Q34 46 38 52 Q42 58 50 54" />
    </>
  ),
  practicar: (
    <>
      <path className="bi-ink" d="M9 38 Q11 46 18 49 M55 38 Q53 46 46 49 M22 55 Q32 60 42 55" />
      <rect className="bi-f-calma" x="29" y="8" width="6" height="9" rx="2" />
      <path className="bi-f-warm" d="M32 16 C46 16 50 24 48 30 L34 50 H30 L16 30 C14 24 18 16 32 16 Z" />
      <path className="bi-f-accent" d="M16.5 26 Q32 30 47.5 26 L46 31 Q32 35 18 31 Z" />
      <path className="bi-ink" d="M22 38 Q32 41 42 38 M30 50 L32 55 L34 50" />
    </>
  ),
  receta: (
    <>
      <path className="bi-ink" d="M8 52 H56" />
      <path className="bi-f-warm" d="M12 46 Q12 18 32 18 Q52 18 52 46 Q32 51 12 46 Z" />
      <path className="bi-f-soft" d="M14 40 Q14 20 32 20 Q50 20 50 40 Q32 45 14 40 Z" />
      <path className="bi-ink" d="M32 44 V21 M32 44 Q24 32 20 24 M32 44 Q18 38 15 32 M32 44 Q40 32 44 24 M32 44 Q46 38 49 32" />
      <path className="bi-ink" d="M44 12 q-3 -3 0 -6 M50 14 q-3 -3 0 -6" />
    </>
  ),
}

/** Los dibujos de las cartas de «Lo que no sale»: lo que haces, lo que recibes y cómo estás. */
const PATH_ART: Record<PathId, ReactNode> = {
  // El Hacer: una regadera que riega una plantita.
  hacer: (
    <>
      <path className="bi-ink" d="M8 54 H56" />
      <path className="bi-f-warm" d="M38 54 L40 42 H52 L54 54 Z" />
      <path className="bi-ink" d="M46 42 V32 M46 36 Q40 32 40 28 Q45 28 46 34 M46 34 Q52 30 54 26 Q48 26 46 32" />
      <path className="bi-f-sky" d="M10 22 H28 V36 Q28 38 26 38 H12 Q10 38 10 36 Z" />
      <path className="bi-ink" d="M28 26 L38 20 M10 26 Q4 26 4 31 Q4 35 10 34 M14 22 Q19 14 24 22" />
      <path className="bi-ink" d="M40 22 L42 26 M38 24 L39 29 M42 20 L45 23" />
    </>
  ),
  // El Recibir: un jarrito calientito y el sol de la mañana.
  recibir: (
    <>
      <circle className="bi-f-accent" cx="46" cy="16" r="7" />
      <path className="bi-ink" d="M46 4 V6 M56 16 H58 M53 8 L55 6 M37 8 L39 10" />
      <path className="bi-f-warm" d="M14 30 H42 Q42 52 28 52 Q14 52 14 30 Z" />
      <path className="bi-ink" d="M42 34 Q50 34 50 40 Q50 46 42 45" />
      <path className="bi-ink" d="M22 24 Q19 20 22 16 M30 24 Q27 20 30 16" />
      <path className="bi-ink" d="M10 56 H46" />
    </>
  ),
  // La Postura: un arbolito firme bajo la lluvia.
  postura: (
    <>
      <path className="bi-f-soft" d="M8 22 Q8 12 18 13 Q22 6 31 9 Q40 6 42 15 Q50 15 49 22 Z" />
      <path className="bi-ink" d="M14 28 L12 33 M22 28 L20 33 M30 28 L28 33 M38 28 L36 33" />
      <path className="bi-f-calma" d="M40 44 Q30 44 32 36 Q30 28 40 28 Q50 28 48 36 Q50 44 40 44 Z" />
      <path className="bi-ink bi-thick" d="M40 44 V54" />
      <path className="bi-ink" d="M12 56 H54 M40 54 Q34 56 32 58 M40 54 Q46 56 48 58" />
    </>
  ),
}

/** El frente de una carta: número, dibujo, nombre y, si cabe, su dicho. */
export function CardFace({ card, saying = true }: { card: LoteriaCard; saying?: boolean }) {
  return (
    <div className="bi-card bi-card-front">
      <span className="bi-card-num" aria-hidden="true">
        {card.number}
      </span>
      <svg className="bi-card-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        {isPathCard(card) ? PATH_ART[card.path] : ART[card.mission]}
      </svg>
      <span className="bi-card-name">{card.name}</span>
      {saying && <span className="bi-card-saying">{card.saying}</span>}
    </div>
  )
}

/** La carta de espaldas: el rosetón de la lotería y con qué se gana. */
function CardBack({ mission, hint = true }: { mission: MissionId; hint?: boolean }) {
  return (
    <div className="bi-card bi-card-back">
      <svg className="bi-card-rosette" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="22" />
        <path d="M32 10 L38 32 L32 54 L26 32 Z M10 32 L32 26 L54 32 L32 38 Z" />
        <circle cx="32" cy="32" r="5" />
      </svg>
      {hint && <span className="bi-card-hint">Se gana con «{missionById(mission).title}»</span>}
    </div>
  )
}

const wonOn = (date: string) =>
  date === today() ? 'La ganaste hoy.' : `La ganaste el ${new Date(date + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}.`

/** El álbum: las cartas ganadas de frente y las demás de espaldas. */
export default function Loteria() {
  const { barrio } = useBarrio()
  const [answers] = useCardAnswers()
  const [open, setOpen] = useState<MissionId | null>(null)
  const done = barrio.done ?? {}
  const shown = open && done[open] ? cardOf(open) : null
  const answered = pathsAnswered(answers)
  const paths = PATH_CARDS.filter((c) => answered.includes(c.path))

  return (
    <section className="card bi-loteria" aria-labelledby="bi-loteria-title">
      <h2 id="bi-loteria-title">Tu lotería de dichos</h2>
      <p className="muted small">
        Cada misión que terminas deja su carta, con un dicho de los de siempre. No hay que llenarla: lo que ganas aquí se queda.
      </p>
      <ul className="bi-album">
        {LOTERIA.map((card) => {
          const won = done[card.mission]
          return (
            <li key={card.mission}>
              {won ? (
                <button
                  type="button"
                  className="bi-card-btn"
                  aria-expanded={open === card.mission}
                  aria-controls="bi-loteria-detail"
                  aria-label={`${card.name}: ${card.saying}`}
                  onClick={() => setOpen((o) => (o === card.mission ? null : card.mission))}
                >
                  <CardFace card={card} />
                </button>
              ) : (
                <div aria-label={`Carta de espaldas. Se gana con «${missionById(card.mission).title}».`} role="img">
                  <CardBack mission={card.mission} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <div id="bi-loteria-detail" aria-live="polite">
        {shown && (
          <div className="callout warm bi-detail">
            <p className="bi-detail-saying">«{shown.saying}»</p>
            <p>{shown.idea}</p>
            <p className="muted small">{wonOn(done[shown.mission]!)}</p>
          </div>
        )}
      </div>

      {paths.length > 0 && (
        <>
          <h3 className="bi-paths-title">De «Lo que no sale»</h3>
          <p className="muted small">Cada camino que contestas en la carta de hoy deja aquí su carta.</p>
          <ul className="bi-paths">
            {paths.map((card) => (
              <li key={card.path}>
                <Link to="/lo-que-no-sale" className="bi-path" aria-label={`${card.name}: ${card.saying} ${card.idea} Abrir Lo que no sale.`}>
                  <span className="bi-path-card">
                    <CardFace card={card} saying={false} />
                  </span>
                  <span className="bi-path-text">
                    <span className="bi-detail-saying">«{card.saying}»</span>
                    <span>{card.idea}</span>
                    <span className="bi-path-go">Abrir Lo que no sale</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** Al terminar una misión: la carta se voltea y se guarda en su lotería. */
export function CardReveal({ mission, onClose }: { mission: MissionId; onClose: () => void }) {
  const card = cardOf(mission)
  return (
    <section className="card bi-reveal" aria-labelledby="bi-reveal-title">
      <div className="bi-flip">
        <div className="bi-flip-inner">
          <div className="bi-flip-side bi-flip-back" aria-hidden="true">
            <CardBack mission={mission} hint={false} />
          </div>
          <div className="bi-flip-side">
            <CardFace card={card} saying={false} />
          </div>
        </div>
      </div>
      <h2 id="bi-reveal-title" className="bi-reveal-title">
        {card.name}
      </h2>
      <p className="bi-detail-saying">«{card.saying}»</p>
      <p>{card.idea}</p>
      <p className="muted small">Se guarda en tu lotería.</p>
      <div className="row bi-reveal-row">
        <button type="button" className="btn" onClick={onClose}>
          Seguir
        </button>
      </div>
    </section>
  )
}
