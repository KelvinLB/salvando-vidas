import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Focus, RotateCcw, RotateCw, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { CAPAS, PARTES, parteById, type Capa, type Parte, type ParteId } from '../../components/cuerpo3d/organos'
import type { Escena } from '../../components/cuerpo3d/escena'
import './explorar.css'

// «Explorar por dentro»: el cuerpo en 3D con anatomía real (BodyParts3D), para mirar con calma
// qué hace cada parte con los nervios o el ánimo. Es un modo aparte y opcional: three.js y el
// modelo solo se bajan al abrir esta pantalla, y nada de la ruta de crisis depende de ella.
// Si el teléfono no tiene WebGL, es muy sencillo o falla la carga, se queda en 2D (la lista de
// partes con sus tarjetas) y se ofrece «Tu cuerpo por dentro».

// El nombre lleva versión: si el modelo cambia, se cambia el nombre y el caché no sirve uno viejo.
const MODELO = `${import.meta.env.BASE_URL}models/cuerpo/cuerpo-v1.glb`
const PESO = 'unos 0.3 MB'

type Motivo = 'sin-webgl' | 'debil' | 'falla' | 'datos'
type Fase = { es: 'cargando' } | { es: 'listo' } | { es: '2d'; motivo: Motivo }

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** ¿Se puede mostrar en 3D sin trabar el teléfono? */
function revisar(): Motivo | null {
  try {
    const c = document.createElement('canvas')
    // failIfMajorPerformanceCaveat: si solo hay WebGL «por software», mejor quedarse en 2D.
    const gl =
      c.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
      c.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    if (!gl) return 'sin-webgl'
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    return 'sin-webgl'
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  // Si el navegador no lo dice (Safari), se asume que sí alcanza.
  if ((nav.deviceMemory ?? 8) < 3 || (nav.hardwareConcurrency || 8) < 4) return 'debil'
  if (nav.connection?.saveData) return 'datos'
  return null
}

const AVISO: Record<Motivo, string> = {
  'sin-webgl':
    'Este teléfono no puede mostrar el cuerpo en 3D, y está bien: aquí abajo puedes leer qué hace cada parte, y en «Tu cuerpo por dentro» está todo lo demás.',
  debil:
    'Para cuidar la batería y la memoria de tu teléfono, aquí te lo mostramos sin 3D. Abajo puedes leer qué hace cada parte.',
  falla:
    'No se pudo abrir el cuerpo en 3D. Puede ser la conexión o la memoria del teléfono. Abajo puedes leer qué hace cada parte.',
  datos: `Tienes prendido el ahorro de datos. El cuerpo en 3D pesa ${PESO} y se baja una sola vez.`,
}

/** La tarjeta corta de una parte: qué es, por qué se siente así y qué ayuda. */
function Tarjeta({ parte, onClose }: { parte: Parte; onClose: () => void }) {
  return (
    <article className="ex-card" aria-labelledby="ex-card-title">
      <div className="ex-card-head">
        <h2 id="ex-card-title">{parte.nombre}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar la explicación">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <p>{parte.que}</p>
      <h3>Con los nervios o el ánimo bajo</h3>
      <p>{parte.porque}</p>
      <h3>Qué ayuda</h3>
      <p>{parte.ayuda}</p>
      {parte.ir && (
        <Link to={parte.ir.to} className="btn ghost small">
          {parte.ir.label}
        </Link>
      )}
    </article>
  )
}

export default function Explorar() {
  const [still] = useState(prefersStill)
  const [fase, setFase] = useState<Fase>(() => {
    const motivo = revisar()
    return motivo ? { es: '2d', motivo } : { es: 'cargando' }
  })
  const [capas, setCapas] = useState<Record<Capa, boolean>>({ piel: true, esqueleto: true, organos: true, nervios: true })
  const [sel, setSel] = useState<ParteId | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const escena = useRef<Escena | null>(null)
  const en3d = fase.es !== '2d'

  // Cargar three y el modelo solo cuando hace falta, y liberar todo al salir. El lienzo se crea
  // aquí mismo para que cada intento (o el doble montaje de StrictMode) estrene uno sin usar.
  useEffect(() => {
    if (!en3d || !host.current) return
    let vivo = true
    let creada: Escena | null = null
    const canvas = document.createElement('canvas')
    canvas.className = 'ex-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.current.prepend(canvas)
    import('../../components/cuerpo3d/escena')
      .then(({ crearEscena }) =>
        vivo
          ? crearEscena(canvas, {
              url: MODELO,
              still,
              onPick: (id) => vivo && setSel(id),
              onLost: () => vivo && setFase({ es: '2d', motivo: 'falla' }),
            })
          : null,
      )
      .then((e) => {
        if (!e) return
        creada = e
        if (!vivo) return e.dispose()
        escena.current = e
        setFase({ es: 'listo' })
      })
      .catch(() => vivo && setFase({ es: '2d', motivo: 'falla' }))
    return () => {
      vivo = false
      creada?.dispose()
      escena.current = null
      canvas.remove()
    }
  }, [en3d, still])

  // Las capas, la parte elegida y el espacio para la tarjeta se le pasan a la escena.
  useEffect(() => {
    const e = escena.current
    if (!e) return
    for (const c of CAPAS) e.setCapa(c.id, capas[c.id])
  }, [capas, fase.es])
  useEffect(() => {
    const e = escena.current
    if (!e) return
    e.enfocar(sel)
    e.setHueco(sel ? 0.2 : 0)
  }, [sel, fase.es])

  // En 2D la tarjeta sale debajo de la lista: se acerca para que se vea sin buscarla.
  const tarjeta2d = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!en3d && sel) tarjeta2d.current?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
  }, [sel, en3d, still])

  const elegir = (id: ParteId) => {
    const p = parteById(id)
    // Si la parte está en una capa apagada, se prende para que se vea.
    if (p && !capas[p.capa]) setCapas((c) => ({ ...c, [p.capa]: true }))
    setSel((cur) => (cur === id ? null : id))
  }
  const parte = sel ? parteById(sel) : undefined

  return (
    <div className="stack explorar">
      <PageHeader
        title="Explorar por dentro"
        subtitle="Gira el cuerpo con el dedo y toca una parte para ver qué le pasa con los nervios y qué ayuda."
      />

      {en3d ? (
        <div ref={host} className={`ex-stage${parte ? ' con-tarjeta' : ''}`}>
          {fase.es === 'cargando' && (
            <p className="ex-loading" role="status">
              Preparando el cuerpo…
            </p>
          )}
          {fase.es === 'listo' && (
            <div className="ex-tools">
              <button type="button" className="icon-btn" onClick={() => escena.current?.girar(-45)} aria-label="Girar a la izquierda">
                <RotateCcw size={20} aria-hidden="true" />
              </button>
              <button type="button" className="icon-btn" onClick={() => setSel(null)} aria-label="Ver todo el cuerpo de frente">
                <Focus size={20} aria-hidden="true" />
              </button>
              <button type="button" className="icon-btn" onClick={() => escena.current?.girar(45)} aria-label="Girar a la derecha">
                <RotateCw size={20} aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="ex-overlay" aria-live="polite">
            {parte && <Tarjeta parte={parte} onClose={() => setSel(null)} />}
          </div>
        </div>
      ) : (
        <div className="callout warm ex-aviso" role="status">
          <p>{AVISO[fase.motivo]}</p>
          <div className="ex-aviso-acciones">
            {fase.motivo !== 'sin-webgl' && (
              <button type="button" className="btn small" onClick={() => setFase({ es: 'cargando' })}>
                {{ datos: 'Bajarlo', debil: 'Intentarlo de todos modos', falla: 'Intentar otra vez' }[fase.motivo]}
              </button>
            )}
            <Link to="/cuerpo" className="btn ghost small">
              Ir a Tu cuerpo por dentro
            </Link>
          </div>
        </div>
      )}

      {en3d && (
        <div className="ex-capas" role="group" aria-label="Capas que se ven">
          {CAPAS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip${capas[c.id] ? ' selected' : ''}`}
              aria-pressed={capas[c.id]}
              onClick={() => setCapas((s) => ({ ...s, [c.id]: !s[c.id] }))}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <section className="ex-partes" aria-labelledby="ex-partes-title">
        <h2 id="ex-partes-title" className="section-title">
          {en3d ? 'O elige una parte' : 'Elige una parte'}
        </h2>
        <div className="chips">
          {PARTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip${sel === p.id ? ' selected' : ''}`}
              aria-pressed={sel === p.id}
              onClick={() => elegir(p.id)}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        {!en3d && parte && (
          <div ref={tarjeta2d}>
            <Tarjeta parte={parte} onClose={() => setSel(null)} />
          </div>
        )}
      </section>

      <p className="disclaimer">
        Es una explicación sencilla, no un diagnóstico. Este cuerpo no es el tuyo: no mide nada. Si fijarte en el
        cuerpo te pone peor, está bien parar y <Link to="/calma">solo soltar el aire</Link>.
      </p>

      {/* Crédito que pide la licencia de los modelos (ver public/models/cuerpo/LICENSE-models.txt). */}
      <p className="ex-creditos">
        Modelos 3D: BodyParts3D, © The Database Center for Life Science, bajo{' '}
        <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.es" target="_blank" rel="noreferrer">
          CC BY-SA 2.1 JP
        </a>
        . Los simplificamos y les cambiamos el color; el pulmón, el corazón y el nervio vago están
        redibujados a partir de ellos. Nuestra versión queda bajo{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noreferrer">
          CC BY-SA 4.0
        </a>
        . {en3d && 'Después de abrirlo una vez, funciona sin internet.'}
      </p>
    </div>
  )
}
