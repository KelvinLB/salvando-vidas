import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Check, Focus, RotateCcw, RotateCw, X } from 'lucide-react'
import Filas from '../../components/Filas'
import PageHeader from '../../components/PageHeader'
import { CAPAS, PARTES, parteById, type Capa, type Parte, type ParteId, type Senal } from '../../components/cuerpo3d/organos'
import type { Escena } from '../../components/cuerpo3d/escena'
import { MODELO_3D, PESO_3D, prefersStill, revisar3d, type Motivo } from '../../components/cuerpo3d/soporte'
import Biblioteca, { CUERPO_VIDRIO } from './biblioteca/Biblioteca'
import ComoSeMueve from './ComoSeMueve'
import LoQueSiento from './LoQueSiento'
import { useStored } from '../../lib/storage'
import { Definicion, MiDiccionario, Texto } from './Palabras'
import './explorar.css'

// «Explorar»: el cuerpo en 3D con anatomía real (BodyParts3D), para mirar con calma
// qué hace cada parte con los nervios o el ánimo. Es un modo aparte y opcional: three.js y el
// modelo solo se bajan al abrir esta pantalla, y nada de la ruta de crisis depende de ella.
// Si el teléfono no tiene WebGL, es muy sencillo o falla la carga, se queda en 2D (la lista de
// partes con sus tarjetas, y las mismas explicaciones en texto) y se ofrece «Tu cuerpo por dentro».
//
// Cinco módulos, cada uno en su pantalla: tocar una parte y que te la explique, la «Biblioteca» (un
// objeto que funciona por cada cosa que hoy se conoce, con dónde se siente en el cuerpo), «Lo que
// siento» (una explicación paso a paso con la señal corriendo por el cuerpo), «Cómo se mueve la
// ansiedad» (una situación recorrida punto por punto sobre su ola) y «Mi diccionario» (las palabras
// guardadas). La portada no carga el 3D: se baja al abrir el primer módulo que lo usa.

type Fase = { es: 'cargando' } | { es: 'listo' } | { es: '2d'; motivo: Motivo }
type Modulo = 'cuerpo' | 'biblioteca' | 'siento' | 'ansiedad' | 'diccionario'

// Cada módulo es su propia pantalla (/explorar/<id>), con una sola cosa que hacer. La portada solo
// los presenta. `cuerpo`: si el módulo usa el cuerpo de vidrio en 3D.
const MODULOS: { id: Modulo; titulo: string; emoji: string; texto: string; subtitulo: string; cuerpo: boolean }[] = [
  {
    id: 'cuerpo',
    titulo: 'Tocar el cuerpo',
    emoji: '🫀',
    texto: 'Gíralo con el dedo y toca una parte para saber qué hace.',
    subtitulo: 'Gíralo con el dedo y toca una parte: te decimos qué hace con los nervios o el ánimo bajo.',
    cuerpo: true,
  },
  {
    id: 'biblioteca',
    titulo: 'Biblioteca',
    emoji: '📚',
    texto: 'Un objeto que funciona por cada cosa que hoy se conoce, y dónde se siente.',
    subtitulo: 'Un objeto que funciona por cada cosa que hoy se conoce. Busca por familia o por dónde lo sientes.',
    cuerpo: true,
  },
  {
    id: 'siento',
    titulo: 'Lo que siento',
    emoji: '🌡️',
    texto: 'Cuéntale qué sientes y mira, paso a paso, qué pasa por dentro.',
    subtitulo: 'Elige lo que sientes y mira, paso a paso, qué pasa por dentro.',
    cuerpo: true,
  },
  {
    id: 'ansiedad',
    titulo: 'Cómo se mueve la ansiedad',
    emoji: '🌊',
    texto: 'Una situación recorrida punto por punto, sobre su ola.',
    subtitulo: 'Elige una situación y recórrela punto por punto: sube, llega arriba y baja sola.',
    cuerpo: true,
  },
  {
    id: 'diccionario',
    titulo: 'Mi diccionario',
    emoji: '📖',
    texto: 'Las palabras que guardaste, para entenderlas cuando quieras.',
    subtitulo: 'Las palabras que guardaste mientras explorabas. Se quedan solo en este teléfono.',
    cuerpo: false,
  },
]

/** La silueta de vidrio de la portada (la misma figura que la Biblioteca usa para elegir zona). */
function Silueta() {
  return (
    <svg className="ex-portada-svg" viewBox="30 0 140 250" aria-hidden="true">
      <g fill="#8fd6cb" fillOpacity="0.1" stroke="#8fd6cb" strokeWidth="1.4" strokeOpacity="0.9">
        <ellipse cx="100" cy="38" rx="19" ry="23" />
        <path d={CUERPO_VIDRIO} />
      </g>
      <circle cx="100" cy="34" r="9" fill="#d9a0b7" opacity="0.55" />
      <ellipse cx="104" cy="104" rx="16" ry="20" fill="#e2725b" opacity="0.6" />
      <ellipse cx="102" cy="146" rx="18" ry="14" fill="#e3c27a" opacity="0.45" />
      <path d="M100 52 L100 200" stroke="#5fe0c8" strokeWidth="1.6" opacity="0.7" />
    </svg>
  )
}

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

/** Lo que va al pie de cada pantalla de Explorar: que no es un diagnóstico y los créditos. */
function Pie({ en3d }: { en3d: boolean }) {
  return (
    <div className="ex-pie">
      <p className="disclaimer">
        Es una explicación sencilla, no un diagnóstico. Este cuerpo no es el tuyo: no mide nada. Si fijarte en el
        cuerpo te pone peor, está bien parar y <Link to="/calma">solo soltar el aire</Link>.
      </p>
      {/* Crédito que pide la licencia de los modelos (ver public/models/cuerpo/LICENSE-models.txt). */}
      <details className="ex-creditos">
        <summary>Créditos de los modelos 3D</summary>
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
      </details>
    </div>
  )
}

/** La portada: el módulo principal (tocar el cuerpo) en grande y los otros cuatro como puertas. */
function Portada() {
  const [palabras] = useStored<string[]>('diccionario', [])
  const [cuerpo, ...otros] = MODULOS
  return (
    <div className="pagina-ancha explorar ex-inicio">
      <PageHeader title="Explorar" subtitle="Mira por dentro qué pasa en el cuerpo con los nervios o el ánimo bajo." />
      <div className="columna">
        <Link to={`/explorar/${cuerpo.id}`} className="ex-portada">
          <Silueta />
          <span className="ex-portada-texto">
            <span className="eyebrow">Empieza aquí</span>
            <strong>{cuerpo.titulo}</strong>
            <small>{cuerpo.texto}</small>
            <span className="btn small ex-portada-btn">Abrir el cuerpo</span>
          </span>
        </Link>
      </div>
      <div className="columna">
        <section className="stack tight" aria-labelledby="ex-mas-title">
          <h2 id="ex-mas-title" className="section-title">
            Para entender más
          </h2>
          <Filas
            label="Para entender más"
            filas={otros.map((m) => ({
              to: `/explorar/${m.id}`,
              emoji: m.emoji,
              title: m.titulo,
              text: m.id === 'diccionario' && palabras.length ? `${palabras.length} ${palabras.length === 1 ? 'palabra guardada' : 'palabras guardadas'}` : m.texto,
            }))}
          />
        </section>
      </div>
      <Pie en3d />
    </div>
  )
}

export default function Explorar() {
  const { modulo: id } = useParams()
  const navigate = useNavigate()
  const modulo = MODULOS.find((m) => m.id === id)
  const conCuerpo = !!modulo?.cuerpo
  const [still] = useState(prefersStill)
  const [fase, setFase] = useState<Fase>(() => {
    const motivo = revisar3d()
    return motivo ? { es: '2d', motivo } : { es: 'cargando' }
  })
  const [capas, setCapas] = useState<Record<Capa, boolean>>({ piel: true, esqueleto: true, organos: true, nervios: true })
  const [sel, setSel] = useState<ParteId | null>(null)
  // Con el cuerpo en 3D, lo principal es tocarlo; la lista de partes queda a un toque.
  const [verPartes, setVerPartes] = useState(false)
  // En la Biblioteca, en el teléfono, el cuerpo sale solo cuando se pide («Verlo en el cuerpo»).
  const [cuerpoBib, setCuerpoBib] = useState(false)
  const [senal, setSenal] = useState<Senal | null>(null)
  const onSenal = useCallback((s: Senal | null) => setSenal(s), [])
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const onAbierta = useCallback((a: boolean) => setFichaAbierta(a), [])
  // Desde la Biblioteca se puede ir a recorrer la ola de una situación.
  const [olaInicial, setOlaInicial] = useState<string | undefined>()
  const onOla = useCallback(
    (ola: string) => {
      setOlaInicial(ola)
      navigate('/explorar/ansiedad')
    },
    [navigate],
  )
  const [encima, setEncima] = useState<HTMLDivElement | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const escena = useRef<Escena | null>(null)
  const en3d = fase.es !== '2d'
  // Tocar el cuerpo desde otro módulo lleva a «Tocar el cuerpo» con esa parte abierta.
  const enCuerpo = useRef(id === 'cuerpo')
  enCuerpo.current = id === 'cuerpo'

  // Al cambiar de módulo, cada uno empieza limpio.
  useEffect(() => {
    setSenal(null)
    setFichaAbierta(false)
    setCuerpoBib(false)
    if (id !== 'ansiedad') setOlaInicial(undefined)
  }, [id])

  // Cargar three y el modelo solo cuando un módulo lo usa, y liberar todo al salir. El lienzo se crea
  // aquí mismo para que cada intento (o el doble montaje de StrictMode) estrene uno sin usar.
  useEffect(() => {
    if (!en3d || !conCuerpo || !host.current) return
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
              onPick: (parte) => {
                if (!vivo) return
                setSel(parte)
                if (!enCuerpo.current) navigate('/explorar/cuerpo')
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
      setFase((f) => (f.es === 'listo' ? { es: 'cargando' } : f))
    }
  }, [en3d, conCuerpo, still, navigate])

  // Las capas, la parte elegida y el espacio para la tarjeta se le pasan a la escena.
  useEffect(() => {
    const e = escena.current
    if (!e) return
    for (const c of CAPAS) e.setCapa(c.id, capas[c.id])
  }, [capas, fase.es])
  useEffect(() => {
    const e = escena.current
    if (!e) return
    if (id === 'siento' || id === 'ansiedad' || id === 'biblioteca') {
      e.senal(senal)
      e.setHueco(id !== 'biblioteca' && fichaAbierta ? 0.25 : 0)
      return
    }
    e.senal(null)
    const parte = id === 'cuerpo' ? sel : null
    e.enfocar(parte)
    e.setHueco(parte ? 0.2 : 0)
  }, [id, sel, senal, fichaAbierta, fase.es])

  // En 2D la tarjeta sale debajo de la lista: se acerca para que se vea sin buscarla.
  const tarjeta2d = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!en3d && sel) tarjeta2d.current?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
  }, [sel, en3d, still])

  const verCuerpo = useCallback(() => {
    setCuerpoBib(true)
    requestAnimationFrame(() =>
      host.current?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' }),
    )
  }, [still])

  if (!id) return <Portada />
  if (!modulo) return <Navigate to="/explorar" replace />

  const elegir = (parteId: ParteId) => {
    const p = parteById(parteId)
    // Si la parte está en una capa apagada, se prende para que se vea.
    if (p && !capas[p.capa]) setCapas((c) => ({ ...c, [p.capa]: true }))
    setSel((cur) => (cur === parteId ? null : parteId))
  }
  const parte = id === 'cuerpo' && sel ? parteById(sel) : undefined

  if (!conCuerpo) {
    return (
      <div className="stack explorar ex-solo">
        <PageHeader title={modulo.titulo} subtitle={modulo.subtitulo} />
        {id === 'diccionario' && <MiDiccionario />}
        <Pie en3d={en3d} />
      </div>
    )
  }

  return (
    <div className={`pagina-ancha explorar ex-${id}${cuerpoBib ? ' ver-cuerpo' : ''}`}>
      <PageHeader title={modulo.titulo} subtitle={modulo.subtitulo} />

      {/* En computadora, el cuerpo se queda a la izquierda, a la vista, y el módulo va a la derecha.
          En el teléfono, el cuerpo va primero (salvo en la Biblioteca, donde sale cuando se pide). */}
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
            {id === 'biblioteca' && (
              <button type="button" className="icon-btn ex-ocultar" onClick={() => setCuerpoBib(false)} aria-label="Ocultar el cuerpo">
                <X size={20} aria-hidden="true" />
              </button>
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
        {en3d && id === 'cuerpo' && (
          <div className="ex-capas" role="group" aria-label="Capas que se ven">
            <span className="ex-capas-titulo">Capas</span>
            {CAPAS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`ex-capa${capas[c.id] ? ' on' : ''}`}
                aria-pressed={capas[c.id]}
                onClick={() => setCapas((s) => ({ ...s, [c.id]: !s[c.id] }))}
              >
                {capas[c.id] && <Check size={15} strokeWidth={2.5} aria-hidden="true" />}
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="columna ex-col-lado">
        {id === 'siento' && (
          <LoQueSiento onSenal={onSenal} onAbierta={onAbierta} encima={en3d ? encima : null} still={still} />
        )}
        {id === 'ansiedad' && (
          <ComoSeMueve
            onSenal={onSenal}
            onAbierta={onAbierta}
            encima={en3d ? encima : null}
            still={still}
            inicial={olaInicial}
          />
        )}
        {id === 'biblioteca' && (
          <Biblioteca onSenal={onSenal} onOla={onOla} onVerCuerpo={verCuerpo} en3d={en3d} still={still} />
        )}

        {id === 'cuerpo' && (
          <section className="ex-partes" aria-labelledby="ex-partes-title">
            <h2 id="ex-partes-title" className="section-title">
              {en3d ? 'O elige una parte de la lista' : 'Elige una parte'}
            </h2>
            {en3d && !verPartes ? (
              <button type="button" className="btn ghost small ex-ver-partes" onClick={() => setVerPartes(true)}>
                Ver las {PARTES.length} partes
              </button>
            ) : (
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
            )}
            {!en3d && parte && (
              <div ref={tarjeta2d}>
                <Tarjeta parte={parte} onClose={() => setSel(null)} />
              </div>
            )}
          </section>
        )}

        <Pie en3d={en3d} />
      </div>
    </div>
  )
}
