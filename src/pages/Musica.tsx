import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { FAITH_PLAYLISTS, PLAYLISTS, youtubeSearch } from '../data/content'
import { type Player, type SoundId, SOUNDS, play } from '../lib/audio'
import { useStored } from '../lib/storage'

const TIMERS = [0, 10, 20, 30, 60]

export default function Musica() {
  const [active, setActive] = useState<SoundId | null>(null)
  const [volume, setVolume] = useStored('volume', 0.5)
  const [minutes, setMinutes] = useState(0)
  const [faith] = useStored('fe', false)
  const playlists = faith ? [...PLAYLISTS, ...FAITH_PLAYLISTS] : PLAYLISTS
  const player = useRef<Player | null>(null)

  const stop = () => {
    player.current?.stop()
    player.current = null
    setActive(null)
  }

  const toggle = (id: SoundId) => {
    const wasActive = active === id
    stop()
    if (!wasActive) {
      player.current = play(id, volume)
      setActive(id)
    }
  }

  useEffect(() => {
    player.current?.setVolume(volume)
  }, [volume])
  useEffect(() => () => {
    player.current?.stop()
  }, [])

  useEffect(() => {
    if (!active || !minutes) return
    const timer = setTimeout(stop, minutes * 60_000)
    return () => clearTimeout(timer)
  }, [active, minutes])

  return (
    <div className="stack">
      <PageHeader
        title="Música y sonidos"
        subtitle="Los sonidos se crean en tu teléfono: funcionan sin internet."
      />

      <section className="card">
        <div className="grid">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              className={`tile ${active === s.id ? 'selected' : ''}`}
              aria-pressed={active === s.id}
              onClick={() => toggle(s.id)}
            >
              <span className="tile-emoji" aria-hidden="true">{s.emoji}</span>
              <strong>{s.title}</strong>
              <small>{active === s.id ? 'Sonando · toca para parar' : 'Toca para escuchar'}</small>
            </button>
          ))}
        </div>

        <label className="field">
          <span>Volumen</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>

        <div className="field">
          <span>Apagar después de</span>
          <div className="chips">
            {TIMERS.map((t) => (
              <button
                key={t}
                className={`chip ${minutes === t ? 'selected' : ''}`}
                aria-pressed={minutes === t}
                onClick={() => setMinutes(t)}
              >
                {t ? `${t} min` : 'Nunca'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Listas para escuchar</h2>
        <p className="muted">Se abren en YouTube.</p>
        <ul className="links">
          {playlists.map((p) => (
            <li key={p.title}>
              <a href={youtubeSearch(p.query)} target="_blank" rel="noreferrer">
                <span aria-hidden="true">{p.emoji}</span> {p.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
