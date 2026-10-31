import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Capitulos, { useCapitulo } from '../components/Capitulos'
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
// Primero la mascota da permiso (no hay que forzar nada); luego, LA cosa de esta pantalla: una
// ventana empañada que se limpia con el dedo. Los pasos chiquitos (que despejan un pedazo cada
// uno), la brújula de lo que importa y sus canciones son opciones y no tareas: cada uno abre su
// propia pantalla, para no tener todo encima a la vez. Sin reloj, sin puntos y con «Ya fue
// suficiente por hoy» siempre a la vista. Todo se queda en el teléfono.
//
// Fuentes: «sentimiento de falta de sentimiento» (psiquiatria.com, glosario); Frankl, «El
// hombre en busca de sentido» (Herder); Wood y colegas, 2009 (cuando las frases positivas pesan).
// Textos pendientes de revisión con psicóloga.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const JUST_BE = 'Va. Me quedo aquí contigo, sin hacer nada. Eso también cuenta.'
const ENOUGH = 'Está bien. Lo que limpiaste hoy se queda. Aquí estoy cuando quieras volver.'

// Si esto pesa demasiado: se ve en el índice y en cada paso, nunca detrás de un toque.
function PideAyuda() {
  return (
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
  )
}

export default function NoSale() {
  const [still] = useState(reduced)
  const { mood } = useCompanion()
  const ventana = useRef<VentanaHandle>(null)
  const capitulo = useCapitulo()
  const navigate = useNavigate()
  const { state } = useLocation()
  // Pedazos ganados en un paso mientras la ventana no está en pantalla: se limpian al volver.
  const debe = useRef(0)
  const [top, setTop] = useState<string | null>(null)
  const [enough, setEnough] = useState(false)
  const [say, setSay] = useState(() =>
    readWindow().length
      ? 'Lo que limpiaste hoy sigue limpio. Si quieres, seguimos; si no, también.'
      : 'Limpia donde quieras, con el dedo. Aquí no hay nada que lograr.',
  )

  const onStep: OnStep = useCallback((text, clears) => {
    setSay(text)
    if (!clears) return
    if (ventana.current) ventana.current.patch()
    else debe.current++
  }, [])

  useEffect(() => {
    if (capitulo || !ventana.current) return
    for (; debe.current > 0; debe.current--) ventana.current.patch()
  }, [capitulo])

  const stop = () => {
    setEnough(true)
    setSay(ENOUGH)
    // Desde un paso se vuelve al principio, donde la mascota se despide.
    if (capitulo) {
      if (state?.desdeIndice) navigate(-1)
      else navigate({ search: '' }, { replace: true })
    }
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }

  const antes = (
    <>
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
            {!top && (
              <button type="button" className="chip ns-solo" onClick={() => setTop(JUST_BE)}>
                Solo estar aquí un rato
              </button>
            )}
          </>
        )}
      </section>

      <section className="card ns-win-card" id="ns-ventana" aria-labelledby="ns-ventana-t">
        <h2 id="ns-ventana-t">La ventana empañada</h2>
        <p className="muted small">
          A veces se siente como ver la vida tras un vidrio con vaho. Limpia donde quieras; cada paso también despeja un
          pedazo, y lo limpio se queda limpio todo el día.
        </p>
        <Ventana ref={ventana} still={still} onTalk={setSay} />
        <div aria-live="polite">
          <PetSays compact mood={mood}>
            <p>{say}</p>
          </PetSays>
        </div>
      </section>

      <PideAyuda />

      <div className="stack tight">
        <h2 className="section-title">Pasos chiquitos</h2>
        <p className="muted small">Si quieres, escoge algo. Puedes hacer una, varias o ninguna.</p>
      </div>
    </>
  )

  return (
    <div className="stack ns-page">
      <Capitulos
        label="Pasos chiquitos"
        antes={antes}
        capitulos={[
          {
            id: 'palabras',
            emoji: '🏷️',
            title: 'Ponerle palabras',
            text: 'Hasta tres palabras para lo que sientes.',
            content: <Palabras onStep={onStep} />,
          },
          {
            id: 'frasco',
            emoji: '🫙',
            title: 'Guardar un momento',
            text: 'Algo de hoy en el frasco, aunque sea muy chiquito.',
            content: <Frasco onStep={onStep} still={still} />,
          },
          {
            id: 'carta',
            emoji: '🃏',
            title: 'La carta de hoy',
            text: 'Una sola pregunta, chiquita.',
            content: <Carta onStep={onStep} />,
          },
          {
            id: 'brujula',
            emoji: '🧭',
            title: 'Lo que me importa',
            text: 'Tu brújula y una acción mínima para hoy.',
            content: (
              <Brujula
                onAction={() => onStep('Esa es. Chiquita está bien: lo que cuenta es que va hacia algo que te importa.', true)}
              />
            ),
          },
          {
            id: 'canciones',
            emoji: '🎵',
            title: 'Una canción',
            text: 'Las que alguna vez te movieron algo por dentro.',
            content: <Canciones />,
          },
          {
            id: 'otro-lado',
            emoji: '🌿',
            title: 'Seguir por otro lado',
            text: 'El nudo en tu cuerpo, o una carta que no se manda.',
            content: (
              <>
                <Link to="/cuerpo?zona=cuello" className="card link-card">
                  <h2>El nudo en tu cuerpo</h2>
                  <p className="muted">Marca dónde se atora lo que no sale y aflójalo respirando.</p>
                </Link>
                <Link to="/diario?escribir=carta" className="card link-card">
                  <h2>Escribir lo que no se manda</h2>
                  <p className="muted">Una carta que nadie más va a leer, en tu diario.</p>
                </Link>
              </>
            ),
          },
        ]}
      />

      {capitulo && <PideAyuda />}

      {!enough && (
        <button type="button" className="ns-enough" onClick={stop}>
          Ya fue suficiente por hoy
        </button>
      )}
    </div>
  )
}
