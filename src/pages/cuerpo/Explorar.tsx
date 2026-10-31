import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Focus, RotateCcw, RotateCw, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { CAPAS, PARTES, parteById, type Capa, type Parte, type ParteId, type Senal } from '../../components/cuerpo3d/organos'
import type { Escena } from '../../components/cuerpo3d/escena'
import { MODELO_3D, PESO_3D, prefersStill, revisar3d, type Motivo } from '../../components/cuerpo3d/soporte'
import Biblioteca from './biblioteca/Biblioteca'
import ComoSeMueve from './ComoSeMueve'
import LoQueSiento from './LoQueSiento'
import { Definicion, MiDiccionario, Texto } from './Palabras'
import './explorar.css'

// «Explorar»: el cuerpo en 3D con anatomía real (BodyParts3D), para mirar con calma
// qué hace cada parte con los nervios o el ánimo. Es un modo aparte y opcional: three.js y el
// modelo solo se bajan al abrir esta pantalla, y nada de la ruta de crisis depende de ella.
// Si el teléfono no tiene WebGL, es muy sencillo o falla la carga, se queda en 2D (la lista de
// partes con sus tarjetas, y las mismas explicaciones en texto) y se ofrece «Tu cuerpo por dentro».
//
// Cinco maneras de usarlo: tocar una parte y que te la explique, la «Biblioteca» (un objeto que
// funciona por cada cosa que hoy se conoce, con dónde se siente en el cuerpo), «Lo que siento» (una
// explicación paso a paso con la señal corriendo por el cuerpo), «Cómo se mueve la ansiedad» (una
// situación recorrida punto por punto sobre su ola) y «Mi diccionario» (las palabras guardadas).

type Fase = { es: 'cargando' } | { es: 'listo' } | { es: '2d'; motivo: Motivo }
type Modo = 'tocar' | 'biblioteca' | 'siento' | 'ansiedad' | 'dicc'

const MODOS: { id: Modo; label: string }[] = [
  { id: 'tocar', label: 'Tocar el cuerpo' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'siento', label: 'Lo que siento' },
  { id: 'ansiedad', label: 'Cómo se mueve la ansiedad' },
  { id: 'dicc', label: 'Mi diccionario' },
]

const AVISO: Record<Motivo, string> = {
  'sin-webgl':
    'Este teléfono no puede mostrar el cuerpo en 3D, y está bien: aquí abajo puedes leer qué hace cada parte, y en «Tu cuerpo por dentro» está todo lo demás.',
  debil:
    'Para cuidar la batería y la memoria de tu teléfono, aquí te lo mostramos sin 3D. Abajo puedes leer qué hace cada parte.',
  falla:
    'No se pudo abrir el cuerpo en 3D. Puede ser la conexión o la memoria del teléfono. Abajo puedes leer qué hace cada parte.',
  datos: `Tienes prendido el ahorro de datos. El cuerpo en 3D pesa ${PESO_3D} y se baja una sola vez.`,
}

/** La tarjeta corta de una parte: qué es, por qué se siente así y qué ayuda. */
function Tarjeta({ parte, onClose }: { parte: Parte; onClose: () => void }) {
  const [palabra, setPalabra] = useState<string | null>(null)
  const texto = (t: string) => (
    <Texto texto={t} abierta={palabra} onPalabra={(id) => setPalabra((p) => (p === id ? null : id))} />
  )
  return (
    <article className="ex-card" aria-labelledby="ex-card-title">
      <div className="ex-card-head">
        <h2 id="ex-card-title">{parte.nombre}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar la explicación">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <p>{texto(parte.que)}</p>
      <h3>Con los nervios o el ánimo bajo</h3>
      <p>{texto(parte.porque)}</p>
      <h3>Qué ayuda</h3>
      <p>{texto(parte.ayuda)}</p>
      {palabra && <Definicion id={palabra} onCerrar={() => setPalabra(null)} />}
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
    const motivo = revisar3d()
    return motivo ? { es: '2d', motivo } : { es: 'cargando' }
  })
  const [capas, setCapas] = useState<Record<Capa, boolean>>({ piel: true, esqueleto: true, organos: true, nervios: true })
  const [sel, setSel] = useState<ParteId | null>(null)
  const [modo, setModo] = useState<Modo>('tocar')
  const [senal, setSenal] = useState<Senal | null>(null)
  const onSenal = useCallback((s: Senal | null) => setSenal(s), [])
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const onAbierta = useCallback((a: boolean) => setFichaAbierta(a), [])
  // Desde la Biblioteca se puede ir a recorrer la ola de una situación.
  const [olaInicial, setOlaInicial] = useState<string | undefined>()
  const onOla = useCallback((id: string) => {
    setOlaInicial(id)
    setModo('ansiedad')
  }, [])
  const [encima, setEncima] = useState<HTMLDivElement | null>(null)
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
              url: MODELO_3D,
              still,
              // Tocar el cuerpo desde cualquier modo lleva a su explicación.
              onPick: (id) => {
                if (!vivo) return
                setModo('tocar')
                setSel(id)
              },
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
    if (modo === 'siento' || modo === 'ansiedad' || modo === 'biblioteca') {
      e.senal(senal)
      e.setHueco(modo !== 'biblioteca' && fichaAbierta ? 0.25 : 0)
      return
    }
    e.senal(null)
    const parte = modo === 'tocar' ? sel : null
    e.enfocar(parte)
    e.setHueco(parte ? 0.2 : 0)
  }, [modo, sel, senal, fichaAbierta, fase.es])

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
  const parte = modo === 'tocar' && sel ? parteById(sel) : undefined

  return (
    <div className="pagina-ancha explorar">
      <PageHeader
        title="Explorar"
        subtitle="Gira el cuerpo con el dedo y toca una parte, abre la biblioteca, o cuéntale lo que sientes y mira qué pasa por dentro."
      />

      {/* En computadora, el cuerpo se queda a la izquierda, a la vista, y lo que se elige va a la
          derecha. En el teléfono, los modos van arriba del cuerpo (con `order`). */}
      <div className="columna fija ex-col-cuerpo">
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
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    setSel(null)
                    escena.current?.enfocar(null)
                  }}
                  aria-label="Ver todo el cuerpo de frente"
                >
                  <Focus size={20} aria-hidden="true" />
                </button>
                <button type="button" className="icon-btn" onClick={() => escena.current?.girar(45)} aria-label="Girar a la derecha">
                  <RotateCw size={20} aria-hidden="true" />
                </button>
              </div>
            )}
            <div ref={setEncima} className="ex-overlay" aria-live="polite">
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
        {en3d && modo === 'tocar' && (
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
      </div>
      <div className="columna ex-col-lado">
        <div className="chips ex-modos" role="radiogroup" aria-label="Qué quieres hacer">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={modo === m.id}
              className={`chip${modo === m.id ? ' selected' : ''}`}
              onClick={() => {
                setModo(m.id)
                setOlaInicial(undefined)
              }}
            >
              {m.label}
            </button>
          ))}
        </div>


        {modo === 'siento' && (
          <LoQueSiento onSenal={onSenal} onAbierta={onAbierta} encima={en3d ? encima : null} still={still} />
        )}
        {modo === 'ansiedad' && (
          <ComoSeMueve
            onSenal={onSenal}
            onAbierta={onAbierta}
            encima={en3d ? encima : null}
            still={still}
            inicial={olaInicial}
          />
        )}
        {modo === 'biblioteca' && <Biblioteca onSenal={onSenal} onOla={onOla} en3d={en3d} still={still} />}
        {modo === 'dicc' && <MiDiccionario />}


        {modo === 'tocar' && (
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
        )}

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
    </div>
  )
}
