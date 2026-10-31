import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PetSays from '../components/PetSays'
import Brujula from '../components/no-sale/Brujula'
import Canciones from '../components/no-sale/Canciones'
import { Carta, Frasco, type OnStep, Palabras } from '../components/no-sale/Pasos'
import Ventana, { type VentanaHandle } from '../components/no-sale/Ventana'
import '../components/no-sale/no-sale.css'
import { PERMISSION } from '../data/sentido'
import { useCompanion } from '../lib/companion'
import { readWindow } from '../lib/sentido'

// Lo que no sale: para cuando se necesita llorar y no se puede, o todo se siente sin sentido.
// Primero la mascota da permiso (no hay que forzar nada); luego, opciones y no tareas: una
// ventana empañada que se limpia con el dedo, con pasos chiquitos alrededor que despejan un
// pedazo cada uno, la brújula de lo que importa y sus canciones. Sin reloj, sin puntos y con
// «Ya fue suficiente por hoy» siempre a la vista. Todo se queda en el teléfono.
//
// Fuentes: «sentimiento de falta de sentimiento» (psiquiatria.com, glosario); Frankl, «El
// hombre en busca de sentido» (Herder); Wood y colegas, 2009 (cuando las frases positivas pesan).
// Textos pendientes de revisión con psicóloga.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Opciones de arriba: llevan a cada parte, ninguna es obligatoria.
const OPTIONS = [
  { to: 'ns-ventana', label: 'Limpiar la ventana' },
  { to: 'ns-palabras', label: 'Ponerle palabras' },
  { to: 'ns-frasco', label: 'Guardar un momento' },
  { to: 'ns-carta', label: 'La carta de hoy' },
  { to: 'ns-brujula', label: 'Lo que me importa' },
  { to: 'ns-canciones', label: 'Una canción' },
]

const JUST_BE = 'Va. Me quedo aquí contigo, sin hacer nada. Eso también cuenta.'
const ENOUGH = 'Está bien. Lo que limpiaste hoy se queda. Aquí estoy cuando quieras volver.'

export default function NoSale() {
  const [still] = useState(reduced)
  const { mood } = useCompanion()
  const ventana = useRef<VentanaHandle>(null)
  const [top, setTop] = useState<string | null>(null)
  const [enough, setEnough] = useState(false)
  const [say, setSay] = useState(() =>
    readWindow().length
      ? 'Lo que limpiaste hoy sigue limpio. Si quieres, seguimos; si no, también.'
      : 'Limpia donde quieras, con el dedo. Aquí no hay nada que lograr.',
  )

  const onStep: OnStep = useCallback((text, clears) => {
    setSay(text)
    if (clears) ventana.current?.patch()
  }, [])

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
  }

  const stop = () => {
    setEnough(true)
    setSay(ENOUGH)
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }

  return (
    <div className="stack ns-page">
      <PageHeader title="Lo que no sale" subtitle="Para cuando quieres llorar y no puedes, o todo se siente sin sentido." />

      <section className="card ns-permiso" aria-label="Antes de todo">
        {enough ? (
          <>
            <PetSays mood={mood}>
              <p>{ENOUGH}</p>
            </PetSays>
            <div className="row">
              <Link to="/" className="btn small">
                Ir al inicio
              </Link>
              <button type="button" className="ns-link" onClick={() => setEnough(false)}>
                Me quedo un ratito más
              </button>
            </div>
          </>
        ) : (
          <>
            <PetSays mood={mood}>
              {PERMISSION.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {top && <p className="pet-says-lead">{top}</p>}
            </PetSays>
            <p className="muted small">Si quieres, escoge algo. Puedes hacer una, varias o ninguna:</p>
            <div className="chips ns-options">
              {OPTIONS.map((o) => (
                <button key={o.to} type="button" className="chip" onClick={() => go(o.to)}>
                  {o.label}
                </button>
              ))}
              <button type="button" className="chip" onClick={() => setTop(JUST_BE)}>
                Solo estar aquí un rato
              </button>
            </div>
          </>
        )}
      </section>

      <div className="ns-play">
        <section className="card ns-win-card" id="ns-ventana" aria-labelledby="ns-ventana-t">
          <h2 id="ns-ventana-t">La ventana empañada</h2>
          <p className="muted small">
            A veces se siente como ver la vida tras un vidrio con vaho. Limpia donde quieras; cada paso también despeja
            un pedazo, y lo limpio se queda limpio todo el día.
          </p>
          <Ventana ref={ventana} still={still} onTalk={setSay} />
          <div aria-live="polite">
            <PetSays compact mood={mood}>
              <p>{say}</p>
            </PetSays>
          </div>
        </section>
        <div className="ns-side">
          <Palabras onStep={onStep} />
          <Frasco onStep={onStep} still={still} />
          <Carta onStep={onStep} />
        </div>
      </div>

      <Brujula onAction={() => onStep('Esa es. Chiquita está bien: lo que cuenta es que va hacia algo que te importa.', true)} />

      <Canciones />

      <section className="stack tight ns-more" aria-labelledby="ns-more-t">
        <h2 id="ns-more-t" className="section-title">
          Si quieres seguir por otro lado
        </h2>
        <Link to="/cuerpo?zona=cuello" className="card link-card">
          <h2>El nudo en tu cuerpo</h2>
          <p className="muted">Marca dónde se atora lo que no sale y aflójalo respirando.</p>
        </Link>
        <Link to="/diario?escribir=carta" className="card link-card">
          <h2>Escribir lo que no se manda</h2>
          <p className="muted">Una carta que nadie más va a leer, en tu diario.</p>
        </Link>
        <div className="callout warm">
          <p>
            Si esto pesa demasiado, o aparece la idea de que nada vale la pena, no tienes que cargarlo sin compañía: hay
            alguien que puede escucharte ahora mismo.
          </p>
          <div className="row">
            <Link to="/ayuda" className="btn">
              Hablar con alguien ahora
            </Link>
          </div>
        </div>
      </section>

      {!enough && (
        <button type="button" className="ns-enough" onClick={stop}>
          Ya fue suficiente por hoy
        </button>
      )}
    </div>
  )
}
