import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import BodyCheck from '../components/BodyCheck'
import BodyRelease from '../components/BodyRelease'
import BodyStories from '../components/BodyStories'
import { AREAS } from '../data/bodyCheck'
import { STORIES } from '../data/bodyStories'

// Tu cuerpo por dentro: «Lo que siento» para marcar dónde se siente y bajarle, y
// «Cómo funciona» para ver paso a paso qué pasa con cada condición.

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Mode = 'siento' | 'funciona'

export default function Cuerpo() {
  const { hash } = useLocation()
  // Otras pantallas pueden abrir directo una explicación (/cuerpo?ver=panico) o una parte
  // del cuerpo lista para marcar (/cuerpo?zona=pecho), como la figura de Inicio.
  const [params] = useSearchParams()
  const [zone] = useState(() => AREAS.find((a) => a.id === params.get('zona'))?.id)
  const [still] = useState(prefersStill)
  const [story, setStory] = useState(() => STORIES.find((s) => s.id === params.get('ver'))?.id ?? null)
  const [mode, setMode] = useState<Mode>(story && !zone ? 'funciona' : 'siento')

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  const openStory = (id: string) => {
    setStory(id)
    setMode('funciona')
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }

  return (
    <div className="stack">
      <PageHeader
        title="Tu cuerpo por dentro"
        subtitle="Marca dónde lo sientes: te explicamos qué puede estar pasando y cómo bajarle."
      />

      <div className="segmented" role="tablist" aria-label="Qué quieres ver">
        {(
          [
            ['siento', 'Lo que siento'],
            ['funciona', 'Cómo funciona'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'siento' ? (
        <BodyCheck still={still} onStory={openStory} initialArea={zone} />
      ) : (
        <BodyStories key={story ?? 'ninguna'} initial={story} still={still} />
      )}

      <Link to="/mascota" className="card link-card">
        <h2>¿No sabes bien qué es?</h2>
        <p className="muted">Responde unas preguntas con tu mascota y te decimos qué se parece más a lo que vives.</p>
      </Link>

      <BodyRelease />

      <p className="disclaimer">
        Es una explicación sencilla, no un diagnóstico. Si algo de esto te pasa seguido, vale la pena
        contárselo a un médico o a un psicólogo.
      </p>
    </div>
  )
}
