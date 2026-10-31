import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import Capitulos from '../components/Capitulos'
import PageHeader from '../components/PageHeader'
import { type Reflexion, SERIES, VOZ } from '../data/escuchar'
import { minutos, useEscucha, useTiempo } from '../lib/escucha'
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

// Cada serie es una puerta: se abre un tema y adentro quedan solo sus reflexiones, para escoger
// una sin tener las veinte enfrente.
const PUERTAS: Record<string, { id: string; emoji: string }> = {
  'Para un día pesado': { id: 'dia-pesado', emoji: '🌧️' },
  'Para la noche': { id: 'noche', emoji: '🌙' },
  'Cuando todo se siente sin sentido': { id: 'sin-sentido', emoji: '🕳️' },
  'Cuando llega el pánico': { id: 'panico', emoji: '🌊' },
  'Para tratarte con cariño': { id: 'carino', emoji: '🤍' },
  'Duelo y pedir ayuda': { id: 'duelo', emoji: '🕯️' },
  Fe: { id: 'fe', emoji: '🙏' },
}

// Suena en el reproductor de la app (lib/escucha), así que sigue si la persona se va a otra
// pantalla y solo suena una a la vez.
function Reproductor({ r, serie }: { r: Reflexion; serie: string }) {
  const { pista, sonando, cargando, tocar, mover, ir } = useEscucha()
  const { t, d } = useTiempo()
  const esta = pista?.id === r.id
  const suena = esta && sonando

  return (
    <div className="escucha-reproductor">
      <div className="row">
        <button
          type="button"
          className={`btn small${esta ? '' : ' ghost'}`}
          onClick={() => tocar({ id: r.id, title: r.title, serie })}
          aria-label={`${suena ? 'Pausar' : esta ? 'Seguir escuchando' : 'Escuchar'} «${r.title}»`}
        >
          {suena ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          {esta && cargando ? 'Abriendo…' : suena ? 'Pausar' : esta ? 'Seguir' : 'Escuchar'}
        </button>
        {esta && (
          <>
            <button type="button" className="icon-btn" onClick={() => mover(-15)} aria-label="Regresar 15 segundos">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" onClick={() => mover(15)} aria-label="Adelantar 15 segundos">
              <RotateCw size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {esta && d > 0 && (
        <label className="escucha-avance">
          <span className="visually-hidden">Parte de la reflexión</span>
          <input
            type="range"
            min={0}
            max={Math.ceil(d)}
            step={1}
            value={Math.floor(t)}
            onChange={(e) => ir(Number(e.target.value))}
            aria-valuetext={`${minutos(t)} de ${minutos(d)}`}
          />
          <span className="muted small" aria-hidden="true">
            {minutos(t)} / {minutos(d)}
          </span>
        </label>
      )}
    </div>
  )
}

export default function Escuchar() {
  const [faith] = useStored('fe', false)
  const { fallidas, reintentar } = useEscucha()

  return (
    <div className="stack">
      <Capitulos
        label="Temas"
        antes={
          <>
            <PageHeader
              title="Para escuchar"
              subtitle="Reflexiones cortas para ponerte audífonos y quedarte un momento contigo."
            />
            <p className="muted small">Estas reflexiones acompañan. No sustituyen la atención de un profesional.</p>
          </>
        }
        capitulos={SERIES.filter((s) => !s.fe || faith).map((serie) => {
          const id = PUERTAS[serie.title]?.id ?? serie.title
          return {
            id,
            emoji: PUERTAS[serie.title]?.emoji,
            title: serie.title,
            // En el índice, qué reflexiones hay adentro.
            text: serie.items.map((r) => r.title).join(' · '),
            content: (
              <section className="card stack" aria-label={serie.title}>
                {serie.items.map((r) => (
                  <div key={r.id} className="stack">
                    <div>
                      <h3>{r.title}</h3>
                      <p className="muted">{r.about}</p>
                    </div>
                    {fallidas.includes(r.id) ? (
                      <p className="small">
                        No se pudo abrir. Si no tienes internet, se guarda en tu teléfono la primera vez que la
                        escuchas conectado.{' '}
                        <button className="btn small" onClick={() => reintentar(r.id)}>
                          Intentar otra vez
                        </button>
                      </p>
                    ) : (
                      <Reproductor r={r} serie={id} />
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
            ),
          }
        })}
      />

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
