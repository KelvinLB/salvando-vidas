import { type SyntheticEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { SERIES, VOZ } from '../data/escuchar'
import { useStored } from '../lib/storage'

// El texto de cada reflexión sale de su guion, sin las notas (#) ni las marcas de pausa.
const GUIONES = import.meta.glob<string>('/tools/voces/guiones/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function texto(id: string) {
  const guion = GUIONES[`/tools/voces/guiones/${id}.txt`] ?? ''
  return guion
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('#'))
    .join(' ')
    .replace(/\s*\[(pausa larga|pausa|silencio)\]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Solo suena una a la vez: al darle play a otra, la anterior se pausa.
function soloUna(e: SyntheticEvent<HTMLAudioElement>) {
  document.querySelectorAll('audio').forEach((a) => {
    if (a !== e.currentTarget) a.pause()
  })
}

export default function Escuchar() {
  const [faith] = useStored('fe', false)
  // Audios que no cargaron: casi siempre es que no hay internet y aún no se habían guardado.
  const [sinCargar, setSinCargar] = useState<string[]>([])

  return (
    <div className="stack">
      <PageHeader
        title="Para escuchar"
        subtitle="Reflexiones cortas para ponerte audífonos y quedarte un momento contigo."
      />
      <p className="muted small">Estas reflexiones acompañan. No sustituyen la atención de un profesional.</p>

      {SERIES.filter((s) => !s.fe || faith).map((serie) => (
        <section key={serie.title} className="card stack">
          <h2>{serie.title}</h2>
          {serie.items.map((r) => (
            <div key={r.id} className="stack">
              <div>
                <h3>{r.title}</h3>
                <p className="muted">{r.about}</p>
              </div>
              {sinCargar.includes(r.id) ? (
                <p className="small">
                  No se pudo abrir. Si no tienes internet, se guarda en tu teléfono la primera vez que la
                  escuchas conectado.{' '}
                  <button className="btn small" onClick={() => setSinCargar((l) => l.filter((x) => x !== r.id))}>
                    Intentar otra vez
                  </button>
                </p>
              ) : (
                <audio
                  controls
                  preload="none"
                  src={`/audio/escuchar/${r.id}.m4a`}
                  onPlay={soloUna}
                  onError={() => setSinCargar((l) => [...l, r.id])}
                  style={{ width: '100%' }}
                />
              )}
              {r.ayuda && (
                <Link to="/ayuda" className="btn small">
                  Ver las líneas de ayuda
                </Link>
              )}
              <details>
                <summary className="small">Leer el texto</summary>
                <p className="small">{texto(r.id)}</p>
              </details>
            </div>
          ))}
        </section>
      ))}

      <section className="card soft">
        <p>
          Si algo de lo que escuchaste te movió algo difícil, puedes parar. Mira a tu alrededor y nombra
          tres cosas que ves.
        </p>
        <p>
          <Link to="/calma">Ir a Calma</Link> · <Link to="/ayuda">Hablar con alguien</Link>
        </p>
      </section>
      <p className="muted small">La voz es {VOZ}. Una vez que las escuchas, funcionan sin internet.</p>
    </div>
  )
}
