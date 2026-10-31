import { useId, useState } from 'react'
import { EMOTIONS, type EmotionId, type EmotionZone, type Feel, type Heat } from '../../data/bodyCheck'
import type { Region } from '../../data/bodyStories'
import type { Spot } from '../../lib/bodyCheck'
import { ARM, FOOT, HAND, HEAD, LEG, NECK, TORSO, both } from './figura'

// «Así lo pintaron 700 personas»: junto a lo que la persona marcó, el mapa de una emoción
// según el estudio de Nummenmaa y colegas (2014), dibujado por nosotros y aproximado (los
// datos y las fuentes están en src/data/bodyCheck.ts). Cálido es «se siente más» y frío
// «se siente menos», igual que en la figura grande. Sirve para decir «a mucha gente le pasa
// igual», nunca para decir qué tiene. Pendiente de revisión con psicóloga.

/** Dónde cae cada parte en la silueta de frente: [cx, cy, rx, ry]. */
const ZONES: Record<EmotionZone, [number, number, number, number][]> = {
  cabeza: [[100, 64, 22, 16]],
  cara: [[100, 84, 17, 15]],
  garganta: [[100, 108, 11, 9]],
  pecho: [[100, 150, 36, 28]],
  panza: [[100, 214, 32, 28]],
  brazos: [
    [52, 178, 11, 44],
    [148, 178, 11, 44],
  ],
  manos: [
    [45, 254, 9, 14],
    [155, 254, 9, 14],
  ],
  piernas: [
    [80, 314, 18, 70],
    [120, 314, 18, 70],
  ],
}

/** Qué partes del mapa toca cada zona de la figura. */
const FROM_REGION: Record<Region, EmotionZone[]> = {
  cabeza: ['cabeza', 'cara'],
  cuello: ['garganta'],
  pecho: ['pecho'],
  estomago: ['panza'],
  brazos: ['brazos', 'manos'],
  piernas: ['piernas'],
}

const SILHOUETTE = [HEAD, NECK, TORSO, ...both(ARM), ...both(HAND), ...both(LEG), ...both(FOOT)]

function MiniBody({ map, label }: { map: Partial<Record<EmotionZone, number>>; label: string }) {
  const id = useId()
  return (
    <svg viewBox="26 40 148 350" className="emo-body" role="img" aria-label={label}>
      <defs>
        <clipPath id={`${id}-clip`}>
          {SILHOUETTE.map((d) => (
            <path key={d} d={d} />
          ))}
        </clipPath>
        {(['mas', 'menos'] as const).map((k) => (
          <radialGradient key={k} id={`${id}-${k}`}>
            <stop offset="0%" className={`emo-stop ${k}`} stopOpacity="1" />
            <stop offset="100%" className={`emo-stop ${k}`} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {SILHOUETTE.map((d) => (
        <path key={d} className="emo-skin" d={d} />
      ))}
      <g clipPath={`url(#${id}-clip)`}>
        {(Object.keys(map) as EmotionZone[]).map((z) => {
          const v = map[z] ?? 0
          if (Math.abs(v) < 0.05) return null
          return ZONES[z].map(([cx, cy, rx, ry]) => (
            <ellipse
              key={`${z}-${cx}`}
              cx={cx}
              cy={cy}
              rx={rx * 1.35}
              ry={ry * 1.35}
              fill={`url(#${id}-${v > 0 ? 'mas' : 'menos'})`}
              opacity={Math.min(1, Math.abs(v) * 1.05)}
            />
          ))
        })}
      </g>
    </svg>
  )
}

/** Lo que la persona marcó, en las mismas partes del mapa. */
function mapOf(heat: Heat, spots: Spot[]) {
  const map: Partial<Record<EmotionZone, number>> = {}
  const put = (r: Region, feel: Feel, k = 0.8) => {
    for (const z of FROM_REGION[r]) map[z] = Math.max(Math.abs(map[z] ?? 0), k) * (feel === 'alerta' ? 1 : -1)
  }
  if (heat.todo) (Object.keys(FROM_REGION) as Region[]).forEach((r) => put(r, heat.todo!, 0.45))
  for (const [r, feel] of Object.entries(heat) as [Region | 'todo', Feel][]) if (r !== 'todo') put(r, feel)
  // Las marcas sin algo elegido en esa parte cuentan como «se siente más».
  for (const s of spots) if (s.region && !heat[s.region]) put(s.region, 'alerta', 0.7)
  return map
}

export default function MapaEmociones({ heat, spots, feel }: { heat: Heat; spots: Spot[]; feel: Feel }) {
  const [emotion, setEmotion] = useState<EmotionId>(feel === 'apagado' ? 'tristeza' : 'miedo')
  const e = EMOTIONS[emotion]
  const marked = new Set<Region>([
    ...(Object.keys(heat).filter((r) => r !== 'todo') as Region[]),
    ...spots.flatMap((s) => (s.region ? [s.region] : [])),
  ])
  const together = heat.todo || e.where.some((r) => marked.has(r))

  return (
    <section className="card stack tight emo-card">
      <p className="eyebrow">Así lo pintaron 700 personas</p>
      <h2>No eres la única persona que lo siente ahí</h2>
      <div className="chips" role="group" aria-label="Emoción">
        {(Object.keys(EMOTIONS) as EmotionId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip${emotion === id ? ' selected' : ''}`}
            aria-pressed={emotion === id}
            onClick={() => setEmotion(id)}
          >
            {EMOTIONS[id].label}
          </button>
        ))}
      </div>
      <div className="emo-maps">
        <figure>
          <MiniBody map={mapOf(heat, spots)} label="Lo que marcaste, en cálido y frío" />
          <figcaption>Lo que marcaste</figcaption>
        </figure>
        <figure>
          <MiniBody key={emotion} map={e.map} label={`${e.label}: dónde la siente mucha gente`} />
          <figcaption>{e.label}, según mucha gente</figcaption>
        </figure>
      </div>
      <p className="emo-legend small" aria-hidden="true">
        <span className="emo-key mas" /> se siente más <span className="emo-key menos" /> se siente menos
      </p>
      <p aria-live="polite">
        {e.says}{' '}
        {together
          ? 'Tú también lo sientes por ahí: lo que sientes tiene sentido.'
          : 'Cada cuerpo lo vive a su manera, y lo que tú sientes también cuenta.'}
      </p>
      <p className="muted small">
        Dibujado por nosotros, aproximado, a partir del estudio de Nummenmaa, Glerean, Hari y Hietanen (PNAS, 2014): 701
        personas de Finlandia, Suecia y Taiwán pintaron dónde sentían cada emoción. Son sensaciones que la gente
        describe, no órganos, y no sirve para saber qué te pasa.
      </p>
    </section>
  )
}
