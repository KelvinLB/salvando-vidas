import { useState } from 'react'
import { Link } from 'react-router-dom'
import CompanionView from '../components/Companion'
import PageHeader from '../components/PageHeader'
import { DEFAULT_COMPANION, companionName } from '../data/companion'
import { WHAT_HELPED } from '../data/content'
import { useCompanion } from '../lib/companion'

// Distraer: primero se elige cómo estás y cuánto tiempo tienes, y arriba salen las tres o cuatro
// cosas que mejor encajan, cada una con por qué. Abajo sigue todo, agrupado por lo que ocupa (las
// manos, la cabeza, la ola, los oídos). Elegir es opcional y no se guarda: es solo para no tener
// que decidir entre once cosas en un mal momento.

type Estado = 'nervios' | 'cabeza' | 'animo' | 'noche' | 'enojo' | 'rato'
type Tiempo = 1 | 5 | 15

const ESTADOS: { id: Estado; label: string }[] = [
  { id: 'nervios', label: 'Con nervios' },
  { id: 'cabeza', label: 'Con la cabeza a mil' },
  { id: 'animo', label: 'Con el ánimo bajo' },
  { id: 'noche', label: 'Sin poder dormir' },
  { id: 'enojo', label: 'Con enojo' },
  { id: 'rato', label: 'Solo quiero pasar el rato' },
]

const TIEMPOS: { id: Tiempo; label: string }[] = [
  { id: 1, label: '1 minuto' },
  { id: 5, label: '5 minutos' },
  { id: 15, label: 'Un buen rato' },
]

type Grupo = 'manos' | 'cabeza' | 'ola' | 'escuchar'

type Opcion = {
  to: string
  emoji: string
  title: string
  text: string
  /** Lo mínimo que pide: 1 sirve hasta con un minuto; 15, mejor con calma. */
  min: Tiempo
  grupo?: Grupo
  /** Para qué estados sirve, y por qué, en el orden en que conviene sugerirla. */
  para: Partial<Record<Estado, string>>
}

const OPCIONES: Opcion[] = [
  {
    to: '/juegos/burbujas',
    emoji: '🫧',
    title: 'Burbujas',
    text: 'Revienta burbujas, una por una',
    min: 1,
    grupo: 'manos',
    para: {
      nervios: 'Algo sencillo para los dedos mientras el cuerpo se acomoda.',
      enojo: 'Reventar algo sin lastimar a nadie.',
    },
  },
  {
    to: '/juegos/pizarra',
    emoji: '🖌️',
    title: 'Pizarra zen',
    text: 'Dibuja trazos que se desvanecen',
    min: 1,
    grupo: 'manos',
    para: {
      nervios: 'Trazos lentos que se borran solos: no hay nada que hacer bien.',
      enojo: 'Rayar fuerte y ver cómo se desvanece.',
      noche: 'Algo quieto para las manos, sin nada que ganar.',
    },
  },
  {
    to: '/juegos/acomodar',
    emoji: '🧱',
    title: 'Despeja la mente',
    text: 'Acomoda piezas, una pausa para la cabeza',
    min: 1,
    grupo: 'cabeza',
    para: {
      cabeza: 'Acomodar piezas deja poco espacio para darle vueltas a lo mismo.',
      nervios: 'Ocupa los ojos y las manos, y se deja cuando quieras.',
    },
  },
  {
    to: '/juegos/hilos',
    emoji: '🧵',
    title: 'Hilos sueltos',
    text: 'Junta los hilos, sin prisa',
    min: 5,
    grupo: 'cabeza',
    para: {
      cabeza: 'Desenredar algo de afuera, en vez de lo de adentro.',
      rato: 'Un acertijo tranquilo, sin prisa.',
    },
  },
  {
    to: '/juegos/memorama',
    emoji: '🧩',
    title: 'Memorama',
    text: 'Encuentra las parejas, sin reloj',
    min: 5,
    grupo: 'cabeza',
    para: {
      cabeza: 'Recordar dónde estaba cada carta ocupa la memoria de corto plazo.',
      rato: 'El de siempre, sin reloj.',
    },
  },
  {
    to: '/juegos/deslizante',
    emoji: '🔢',
    title: 'Deslizante',
    text: 'Ordena las piezas a tu ritmo',
    min: 5,
    grupo: 'cabeza',
    para: { rato: 'Un rompecabezas para ordenar a tu ritmo.', cabeza: 'Pide atención, paso por paso.' },
  },
  {
    to: '/juegos/desde-afuera',
    emoji: '🌊',
    title: 'Desde afuera',
    text: 'Ayúdate a atravesar la ola, desde afuera',
    min: 5,
    grupo: 'ola',
    para: { nervios: 'Practicar con un muñequito cómo pasa la ola, para cuando llegue de verdad.' },
  },
  {
    to: '/musica',
    emoji: '🎵',
    title: 'Música y sonidos',
    text: 'Lluvia, mar y listas para relajarte',
    min: 1,
    grupo: 'escuchar',
    para: {
      noche: 'Lluvia o mar bajito, con la pantalla apagada.',
      nervios: 'Un sonido parejo para que la cabeza tenga algo que seguir.',
      animo: 'Tu música de siempre, aunque hoy no se sienta igual.',
    },
  },
  {
    to: '/escuchar',
    emoji: '🎧',
    title: 'Para escuchar',
    text: 'Reflexiones cortas con voz',
    min: 5,
    grupo: 'escuchar',
    para: {
      noche: 'Una voz tranquila para no quedarte a solas con los pensamientos.',
      animo: 'Unos minutos de compañía, sin tener que hacer nada.',
    },
  },
  {
    to: '/videos',
    emoji: '🎬',
    title: 'Videos y películas',
    text: 'Cosas que hacen bien al corazón',
    min: 15,
    grupo: 'escuchar',
    para: { rato: 'Algo ligero para ver.', animo: 'Cosas ligeras que no piden nada a cambio.' },
  },
  // De otras secciones: para cuando lo que pasa tiene su propio lugar en la app.
  {
    to: '/noche',
    emoji: '🌙',
    title: '¿No puedes dormir?',
    text: 'Para las noches que pesan',
    min: 5,
    para: { noche: 'Lo que ayuda cuando el sueño no llega, paso por paso.' },
  },
  {
    to: '/enojo',
    emoji: '🔥',
    title: 'Cuando el enojo no se va',
    text: 'Sacarlo sin lastimar',
    min: 5,
    para: { enojo: 'Formas de sacarlo del cuerpo sin lastimar a nadie.' },
  },
  {
    to: '/mi-dia',
    emoji: '👣',
    title: 'Un día a la vez',
    text: 'Poquitas cosas y un premio',
    min: 5,
    para: { animo: 'Una cosa pequeña con un premio al final: el ánimo suele llegar después de hacer, no antes.' },
  },
]

const GRUPOS: { id: Grupo; title: string }[] = [
  { id: 'manos', title: 'Para las manos' },
  { id: 'cabeza', title: 'Para la cabeza' },
  { id: 'ola', title: 'Para cuando llega la ola' },
  { id: 'escuchar', title: 'Escuchar y ver' },
]

// Si empatan, primero la página que es justo para eso (la de la noche, la del enojo).
const rango = (o: Opcion, e: Estado) => Object.keys(o.para).indexOf(e) * 2 + (o.grupo ? 1 : 0)

/** Las que mejor encajan: primero las que sirven para cómo estás, en su orden, y que quepan en tu tiempo. */
function sugerir(estado: Estado | null, tiempo: Tiempo | null, cuantas: number) {
  const cabe = (o: Opcion) => !tiempo || o.min <= tiempo
  if (!estado) return OPCIONES.filter((o) => o.grupo && cabe(o)).slice(0, cuantas)
  return OPCIONES.filter((o) => o.para[estado] && cabe(o))
    .sort((a, b) => rango(a, estado) - rango(b, estado))
    .slice(0, cuantas)
}

function Tile({ o }: { o: Opcion }) {
  return (
    <Link to={o.to} className="tile">
      <span className="tile-emoji" aria-hidden="true">
        {o.emoji}
      </span>
      <strong>{o.title}</strong>
      <small>{o.text}</small>
    </Link>
  )
}

export default function Distraer() {
  const { companion, mood } = useCompanion()
  const [estado, setEstado] = useState<Estado | null>(null)
  const [tiempo, setTiempo] = useState<Tiempo | null>(null)
  const [verTodo, setVerTodo] = useState(false)
  // Con poco tiempo no se sugieren el barrio ni el hueco: son para quedarse un rato. Si van, se
  // sugieren dos cosas más y no cuatro, para no volver a tener que escoger entre muchas.
  const conMascota = (!tiempo || tiempo === 15) && (!estado || estado === 'animo' || estado === 'rato')
  const sugeridas = estado || tiempo ? sugerir(estado, tiempo, conMascota ? 2 : 4) : []

  const anhedonia = (
    <div className="callout info">
      <strong>¿Sientes que ya nada te entretiene?</strong>
      <p>
        Es un síntoma de la depresión, no un defecto tuyo. No esperes disfrutarlo: elige cualquier cosa y hazla solo 2
        minutos. A veces el ánimo llega después, no antes.
      </p>
    </div>
  )

  const mascota = (
    <>
      {/* El barrio va primero: su mascota pasea por la plaza, con vecinos y su propia casa. */}
      <Link to="/barrio" className="tile hole-tile">
        <span className="hole-tile-pet" aria-hidden="true">
          <CompanionView look={companion ?? DEFAULT_COMPANION} mood={mood} size={72} />
        </span>
        <span className="hole-tile-text">
          <strong>El barrio</strong>
          <small>
            {companion ? `${companionName(companion)} te espera` : 'Tu mascota te espera'} en la plaza: vecinos con
            cositas chiquitas que ayudan, y una casa que puedes hacer tuya.
          </small>
        </span>
      </Link>
      {/* Salir del hueco: su mascota es quien juega, y el lugar se parece a su día. */}
      <Link to="/juegos/hueco" className="tile hole-tile">
        <span className="hole-tile-pet" aria-hidden="true">
          <CompanionView look={companion ?? DEFAULT_COMPANION} mood={mood} size={64} />
        </span>
        <span className="hole-tile-text">
          <strong>Salir del hueco</strong>
          <small>
            {companion ? `${companionName(companion)} y tú salen` : 'Tu mascota y tú salen'} adelante, un paso a la vez, en
            un lugar que se parece a tu día.
          </small>
        </span>
      </Link>
    </>
  )

  // En computadora: a la izquierda se elige y salen las sugerencias; a la derecha está todo.
  return (
    <div className="pagina-ancha distraer">
      <PageHeader
        title="Distraer la mente"
        subtitle="A veces lo mejor es darle a la cabeza algo pequeño en qué ocuparse."
      />
      <div className="columna">

        <section className="card distraer-elegir" aria-labelledby="distraer-elegir-title">
          <h2 id="distraer-elegir-title">¿Cómo estás ahorita?</h2>
          <div className="chips" role="group" aria-label="Cómo estás">
            {ESTADOS.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`chip${estado === e.id ? ' selected' : ''}`}
                aria-pressed={estado === e.id}
                onClick={() => setEstado((cur) => (cur === e.id ? null : e.id))}
              >
                {e.label}
              </button>
            ))}
          </div>
          <h3 className="eyebrow">¿Cuánto tiempo tienes?</h3>
          <div className="chips" role="group" aria-label="Cuánto tiempo tienes">
            {TIEMPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip${tiempo === t.id ? ' selected' : ''}`}
                aria-pressed={tiempo === t.id}
                onClick={() => setTiempo((cur) => (cur === t.id ? null : t.id))}
              >
                {t.label}
              </button>
            ))}
          </div>
          {!estado && !tiempo && <p className="muted small">Elegir es opcional. Abajo está todo.</p>}
        </section>

        {(estado || tiempo) && (
          <section className="stack distraer-sugeridas" aria-labelledby="distraer-para-ti" aria-live="polite">
            <h2 id="distraer-para-ti" className="section-title">
              Para ti, ahorita
            </h2>
            {estado === 'animo' && anhedonia}
            {conMascota && mascota}
            {sugeridas.map((o) => (
              <Link key={o.to} to={o.to} className="tile distraer-sugerida">
                <span className="tile-emoji" aria-hidden="true">
                  {o.emoji}
                </span>
                <span className="distraer-sugerida-texto">
                  <strong>{o.title}</strong>
                  <small>{(estado && o.para[estado]) || o.text}</small>
                </span>
              </Link>
            ))}
            {!sugeridas.length && !conMascota && (
              <p className="muted">Con tan poquito tiempo, prueba soltar el aire despacio un par de veces en Calma.</p>
            )}
            <button
              type="button"
              className="btn ghost small distraer-limpiar"
              onClick={() => {
                setEstado(null)
                setTiempo(null)
              }}
            >
              Quitar lo que elegí
            </button>
          </section>
        )}
        <div className="distraer-pie">
          {estado !== 'animo' && anhedonia}

          <section className="card">
            <h2>Lo que a otras personas les ha ayudado</h2>
            <p className="muted small">Ideas de quienes viven con depresión y ansiedad.</p>
            <ul className="helped">
              {(verTodo ? WHAT_HELPED : WHAT_HELPED.slice(0, 4)).map((h) => (
                <li key={h.text}>
                  <span aria-hidden="true">{h.emoji}</span>
                  {h.text}
                </li>
              ))}
            </ul>
            {!verTodo && (
              <button type="button" className="btn ghost small distraer-ver" onClick={() => setVerTodo(true)}>
                Ver {WHAT_HELPED.length - 4} ideas más
              </button>
            )}
            <div className="row">
              <Link to="/opinion" className="btn small ghost">
                ¿A ti qué te ha ayudado? Cuéntanos
              </Link>
              <Link to="/redes" className="btn small ghost">
                ¿Y lo que se dice en redes?
              </Link>
            </div>
          </section>
        </div>
      </div>
      <div className="columna">
        <h2 className="section-title">{estado || tiempo ? 'Todo lo que hay' : 'Con tu mascota'}</h2>
        {mascota}
        {GRUPOS.map((g) => (
          <section key={g.id} className="stack tight" aria-labelledby={`distraer-${g.id}`}>
            <h2 id={`distraer-${g.id}`} className="section-title">
              {g.title}
            </h2>
            <div className="grid">
              {OPCIONES.filter((o) => o.grupo === g.id).map((o) => (
                <Tile key={o.to} o={o} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
