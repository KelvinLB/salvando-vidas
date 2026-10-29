import { useEffect, useState } from 'react'
import { MISSIONS, NEIGHBORS, type NeighborId } from '../data/barrio'
import { STORIES, type Unlock } from '../data/vecinos'
import { type Barrio, advanceChapter, useBarrio } from '../lib/barrio'
import { daysSince } from '../lib/companion'
import './insights.css'

// La historia de cada vecino: se abre un capítulo a la vez con lo que la persona hace en el
// barrio, y lo que ya se abrió se queda abierto aunque pase el tiempo (advanceChapter solo sube).

const missionOf = (npc: NeighborId) => MISSIONS.find((m) => m.npc === npc)?.id

function met(unlock: Unlock, npc: NeighborId, barrio: Barrio) {
  const done = barrio.done ?? {}
  if ('always' in unlock) return true
  if ('own' in unlock) {
    const id = missionOf(npc)
    return !!id && !!done[id]
  }
  if ('missions' in unlock) return Object.keys(done).length >= unlock.missions
  return daysSince(barrio.since) >= unlock.weeks * 7
}

/** Cuántos capítulos ya se abrieron: los que se cumplen en orden, y nunca menos que los guardados. */
export function chapterOf(npc: NeighborId, barrio: Barrio) {
  const chapters = STORIES[npc]
  let reached = 0
  while (reached < chapters.length && met(chapters[reached].unlock, npc, barrio)) reached++
  return Math.min(chapters.length, Math.max(reached, barrio.chapters?.[npc] ?? 0, 1))
}

export function NeighborStory({ npc }: { npc: NeighborId }) {
  const { barrio } = useBarrio()
  const neighbor = NEIGHBORS.find((n) => n.id === npc)!
  const chapters = STORIES[npc]
  const reached = chapterOf(npc, barrio)
  const stored = barrio.chapters?.[npc] ?? 0
  // Lo que había al abrir la historia: si ahora hay un capítulo más, se marca como nuevo.
  const [seen] = useState(stored)
  const fresh = reached > Math.max(seen, 1)

  useEffect(() => {
    if (reached > stored) advanceChapter(npc, reached)
  }, [npc, reached, stored])

  const earlier = chapters.slice(0, reached - 1)
  const latest = chapters[reached - 1]
  const next = chapters[reached]
  const waitFor = next && 'own' in next.unlock ? `Sigue cuando hagas la misión de ${neighbor.name}.` : 'Su historia sigue otro día, con lo que vayas haciendo en el barrio.'

  return (
    <section className="bi-story" aria-labelledby={`bi-story-${npc}`}>
      <h3 id={`bi-story-${npc}`} className="bi-story-title">
        La historia de {neighbor.name}
        {fresh && <span className="tag bi-new">Nuevo</span>}
      </h3>
      {earlier.length > 0 && (
        <details className="bi-story-before">
          <summary>Lo que ya te contó</summary>
          {earlier.map((c, i) => (
            <p key={i}>{c.text}</p>
          ))}
        </details>
      )}
      <p className="bi-story-now">{latest.text}</p>
      <p className="muted small">{next ? waitFor : `Así va la historia de ${neighbor.name}, por ahora.`}</p>
    </section>
  )
}
