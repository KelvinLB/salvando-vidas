import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import BodyCheck from '../components/BodyCheck'
import BodyRelease from '../components/BodyRelease'
import BodyStories from '../components/BodyStories'
import Senal from '../components/senal/Senal'
import { AREAS } from '../data/bodyCheck'
import { STORIES } from '../data/bodyStories'

// Tu cuerpo por dentro: «Lo que siento» para marcar dónde se siente y bajarle, y
// «Cómo funciona» para ver paso a paso qué pasa con cada condición y seguir la señal de la
// alarma por el cuerpo hasta que el freno la apaga.

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Mode = 'siento' | 'funciona'

export default function Cuerpo() {
  const { hash } = useLocation()
  // Otras pantallas pueden abrir directo una explicación (/cuerpo?ver=panico), «Sigue la
  // señal» (/cuerpo?ver=senal o /cuerpo#senal) o una parte del cuerpo lista para marcar
  // (/cuerpo?zona=pecho), como la figura de Inicio.
  const [params] = useSearchParams()
  const [zone] = useState(() => AREAS.find((a) => a.id === params.get('zona'))?.id)
  const [still] = useState(prefersStill)
  const [story, setStory] = useState(() => STORIES.find((s) => s.id === params.get('ver'))?.id ?? null)
  const [senal] = useState(() => !zone && (params.get('ver') === 'senal' || hash === '#senal'))
  const [mode, setMode] = useState<Mode>((story || senal) && !zone ? 'funciona' : 'siento')
  // Pide bajar hasta «Sigue la señal» en cuanto esté en la pantalla.
  const [toSenal, setToSenal] = useState(senal ? 1 : 0)

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  useEffect(() => {
    if (!toSenal) return
    // Un cuadro después, para que no le gane el «volver arriba» al cambiar de pantalla.
    const id = requestAnimationFrame(() =>
      document.getElementById('senal')?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' }),
    )
    return () => cancelAnimationFrame(id)
  }, [toSenal, still])

  const openSenal = () => {
    setMode('funciona')
    setToSenal((n) => n + 1)
  }

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
        <>
          <BodyCheck still={still} onStory={openStory} initialArea={zone} />
          {/* Pendiente de revisión con psicóloga (textos de las dos tarjetas nuevas). */}
          <button type="button" className="card link-card sg-go" onClick={openSenal}>
            <span className="sg-go-title">Sigue la señal</span>
            <span className="muted">
              Mira cómo viaja la alarma por el cuerpo, del cerebro al corazón, y cómo la frena el aire
              que sueltas despacio.
            </span>
          </button>
        </>
      ) : (
        <>
          <BodyStories key={story ?? 'ninguna'} initial={story} still={still} />
          <Senal still={still} />
        </>
      )}

      <Link to="/explorar" className="card link-card">
        <h2>Explorar</h2>
        <p className="muted">
          Tu cuerpo por dentro, en 3D: gira el cuerpo y acércate a cada parte. Se descarga al abrirlo.
        </p>
      </Link>

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
