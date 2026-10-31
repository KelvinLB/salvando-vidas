import { type FormEvent, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import RiskNotice from '../RiskNotice'
import { soundsLikeRisk } from '../../lib/risk'
import { useSongs } from '../../lib/sentido'
import { newId } from '../../lib/storage'

// Canciones que me mueven: su propia lista de canciones que alguna vez le movieron algo, que se
// abren en su app de música. Nunca música para provocar el llanto: lo que abre las emociones
// es que algo te conmueva, no ponerse triste a propósito, y eso no se fuerza.
//
// Fuente: Vingerhoets y colegas sobre el llanto y la emoción de sentirse conmovido.
// Textos pendientes de revisión con psicóloga.

/** Solo enlaces web; si escribe «open.spotify.com/…» sin https, se le pone. */
function safeUrl(raw: string): string | undefined {
  const t = raw.trim()
  if (!t) return undefined
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined
  } catch {
    return undefined
  }
}

export default function Canciones() {
  const [songs, setSongs] = useSongs()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const add = (e: FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    const link = safeUrl(url)
    setSongs((list) => [...list, { id: newId(), title: t, ...(link ? { url: link } : {}) }])
    setNote(url.trim() && !link ? 'Ese enlace no se pudo leer; la guardé sin él.' : 'Guardada en tu lista.')
    setTitle('')
    setUrl('')
  }

  return (
    <section className="card ns-songs" id="ns-canciones" aria-labelledby="ns-canciones-t">
      <h2 id="ns-canciones-t">Canciones que me mueven</h2>
      <p className="muted">
        Las que alguna vez te movieron algo por dentro. No son para provocar el llanto: lo que abre es que algo te
        conmueva, y eso llega solo, cuando llega.
      </p>
      {songs.length > 0 && (
        <ul className="ns-song-list">
          {songs.map((s) => (
            <li key={s.id}>
              <span className="ns-song-note" aria-hidden="true">
                ♪
              </span>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="ns-song-title">
                  {s.title}
                  <ExternalLink size={14} aria-hidden="true" />
                  <span className="visually-hidden"> (se abre en tu app de música)</span>
                </a>
              ) : (
                <span className="ns-song-title">{s.title}</span>
              )}
              <button
                type="button"
                className="icon-btn"
                aria-label={`Quitar «${s.title}»`}
                onClick={() => setSongs((list) => list.filter((x) => x.id !== s.id))}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="ns-song-form" onSubmit={add}>
        <label className="visually-hidden" htmlFor="ns-song-title">
          Nombre de la canción
        </label>
        <input
          id="ns-song-title"
          type="text"
          maxLength={90}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setNote('')
          }}
          placeholder="Canción y quién la canta"
          autoComplete="off"
        />
        <label className="visually-hidden" htmlFor="ns-song-url">
          Enlace (opcional)
        </label>
        <input
          id="ns-song-url"
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enlace de tu app de música (opcional)"
          autoComplete="off"
        />
        <button type="submit" className="btn ghost small" disabled={!title.trim()}>
          Guardar canción
        </button>
      </form>
      {soundsLikeRisk(title) && <RiskNotice />}
      {note && (
        <p className="muted small" role="status">
          {note}
        </p>
      )}
    </section>
  )
}
