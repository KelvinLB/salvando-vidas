import { useId } from 'react'
import { AREAS } from '../../data/bodyCheck'
import type { Region } from '../../data/bodyStories'
import type { Spot } from '../../lib/bodyCheck'
import type { View } from './figura'

// «Marca dónde y qué tan grande»: con el dedo se pone una marca donde se siente y, al
// arrastrar, se hace del tamaño de lo que se siente (como la herramienta de dolor de
// Complete Anatomy, pero quieta: no late). Con teclado, se elige la parte y se agranda o
// achica con botones. Después de respirar, la línea punteada es como estaba antes.

export const SPOT_MIN = 7
export const SPOT_MAX = 42
export const SPOT_START = 15
export const MAX_SPOTS = 3

export const clampR = (r: number) => Math.min(SPOT_MAX, Math.max(SPOT_MIN, r))

/** Las marcas de la vista que se está viendo, dentro del dibujo. */
export function SpotLayer({
  spots,
  view,
  sel,
  compare = false,
}: {
  spots: Spot[]
  view: View
  sel?: string | null
  /** Después de respirar: la línea punteada enseña cómo estaba antes. */
  compare?: boolean
}) {
  const id = useId()
  const shown = spots.filter((s) => s.view === view)
  if (!shown.length) return null
  return (
    <g className="b-spots" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-spot`}>
          <stop offset="0%" style={{ stopColor: 'var(--spot)' }} stopOpacity="0.62" />
          <stop offset="70%" style={{ stopColor: 'var(--spot)' }} stopOpacity="0.36" />
          <stop offset="100%" style={{ stopColor: 'var(--spot)' }} stopOpacity="0.18" />
        </radialGradient>
      </defs>
      {shown.map((s) => (
        <g key={s.id} className={`b-spot${s.id === sel ? ' sel' : ''}`}>
          <circle
            className="b-spot-fill"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={`url(#${id}-spot)`}
            style={{ transform: `scale(${(s.after ?? s.r) / s.r})` }}
          />
          {compare && s.after !== undefined && <circle className="b-spot-before" cx={s.x} cy={s.y} r={s.r} />}
        </g>
      ))}
    </g>
  )
}

/** Cómo se llama cada parte en la vista que se ve (de espalda, el pecho es la espalda alta). */
export function partName(region: Region, view: View) {
  if (view === 'espalda' && region === 'pecho') return 'Espalda alta'
  if (view === 'espalda' && region === 'estomago') return 'Espalda baja'
  if (view === 'espalda' && region === 'cuello') return 'Nuca y hombros'
  return AREAS.find((a) => a.id === region)?.label ?? region
}

const PARTS: Region[] = ['cabeza', 'cuello', 'pecho', 'estomago', 'brazos', 'piernas']

/** Los botones para marcar sin arrastrar: elegir la parte y ajustar el tamaño. */
export function SpotTools({
  view,
  spots,
  sel,
  onPlace,
  onResize,
  onRemove,
  onDone,
}: {
  view: View
  spots: Spot[]
  sel: Spot | null
  onPlace: (region: Region) => void
  onResize: (delta: number) => void
  onRemove: () => void
  onDone: () => void
}) {
  const full = spots.length >= MAX_SPOTS
  return (
    <div className="spot-tools">
      <p className="small">
        <strong>Pon el dedo donde lo sientes y arrastra:</strong> lo que arrastras es qué tan grande. Puedes poner hasta
        tres.
      </p>
      <div className="chips" role="group" aria-label="Poner una marca en">
        {PARTS.map((r) => (
          <button key={r} type="button" className="chip small" onClick={() => onPlace(r)}>
            {partName(r, view)}
          </button>
        ))}
      </div>
      {full && <p className="muted small">Ya tienes tres marcas: la siguiente cambia la más vieja.</p>}
      {sel && (
        <div className="row spot-size" role="group" aria-label="La marca elegida">
          <button type="button" className="btn small ghost" onClick={() => onResize(-5)} disabled={sel.r <= SPOT_MIN}>
            Más chica
          </button>
          <button type="button" className="btn small ghost" onClick={() => onResize(5)} disabled={sel.r >= SPOT_MAX}>
            Más grande
          </button>
          <button type="button" className="btn small ghost" onClick={onRemove}>
            Quitar
          </button>
        </div>
      )}
      <button type="button" className="btn small" onClick={onDone}>
        Listo
      </button>
    </div>
  )
}
