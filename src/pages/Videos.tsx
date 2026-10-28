import PageHeader from '../components/PageHeader'
import { FAITH_VIDEOS, MOVIES, VIDEO_TOPICS, youtubeSearch } from '../data/content'
import { useStored } from '../lib/storage'

export default function Videos() {
  const [faith] = useStored('fe', false)
  const topics = faith ? [...VIDEO_TOPICS, ...FAITH_VIDEOS] : VIDEO_TOPICS
  return (
    <div className="stack">
      <PageHeader
        title="Videos y películas"
        subtitle="Cosas ligeras que hacen bien. Elige lo que te llame."
      />

      <section>
        <h2 className="section-title">Videos cortos</h2>
        <div className="grid">
          {topics.map((v) => (
            <a
              key={v.title}
              className="tile"
              href={youtubeSearch(v.query)}
              target="_blank"
              rel="noreferrer"
            >
              <span className="tile-emoji" aria-hidden="true">{v.emoji}</span>
              <strong>{v.title}</strong>
              <small>Abrir en YouTube</small>
            </a>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Películas que reconfortan</h2>
        <ul className="movies">
          {MOVIES.map((m) => (
            <li key={m.title}>
              <strong>
                {m.title} <small className="muted">({m.year})</small>
              </strong>
              <span className="muted">{m.why}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
