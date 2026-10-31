import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { SENSACIONES, type Senal, type Zona } from '../../components/cuerpo3d/organos'
import { SITUACIONES, type Momento, type Situacion } from '../../data/ansiedad'
import { Definicion, Texto } from './Palabras'

// «Cómo se mueve la ansiedad»: eliges una situación y la recorres punto por punto sobre su ola,
// mientras el cuerpo muestra qué se enciende y dónde se siente. Tú decides cuándo seguir (no hay
// reloj) y puedes tocar cualquier punto de la ola. Igual que en «Lo que siento», en 3D la
// explicación va encima del cuerpo (en `encima`); sin 3D, va debajo de las situaciones.

const ZONAS: Record<Zona, string> = {
  cara: 'la cara',
  cuello: 'el cuello y los hombros',
  pecho: 'el pecho',
  panza: 'la panza',
  manos: 'las manos',
}

/** La ola de una situación: una línea suave que pasa por sus puntos, y cada punto se puede tocar. */
function Ola({ momentos, paso, onIr }: { momentos: Momento[]; paso: number; onIr(i: number): void }) {
  const W = 300
  const H = 52
  const y = (nivel: number) => H - 8 - nivel * (H - 18)
  const pts = momentos.map((m, i) => [24 + (i * (W - 48)) / (momentos.length - 1), y(m.nivel)] as const)
  // La línea sale y llega a la altura de un día cualquiera, para que se vea la forma de la ola.
  const todos = [[0, y(0.3)] as const, ...pts, [W, y(0.3)] as const]
  let d = `M${todos[0][0]},${todos[0][1]}`
  for (let i = 0; i < todos.length - 1; i++) {
    const [p0, p1, p2, p3] = [todos[i - 1] ?? todos[i], todos[i], todos[i + 1], todos[i + 2] ?? todos[i + 1]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return (
    <div className="ola">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <line className="ola-base" x1="0" x2={W} y1={y(0.3)} y2={y(0.3)} vectorEffect="non-scaling-stroke" />
        <path className="ola-linea" d={d} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="ola-puntos" role="group" aria-label="Puntos de la ola">
        {pts.map(([px, py], i) => (
          <button
            key={momentos[i].nombre}
            type="button"
            className={`ola-punto${i === paso ? ' actual' : i < paso ? ' visto' : ''}`}
            style={{ left: `${(px / W) * 100}%`, top: `${(py / H) * 100}%` }}
            aria-label={`${i + 1}. ${momentos[i].nombre}`}
            aria-current={i === paso ? 'step' : undefined}
            onClick={() => onIr(i)}
          >
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}

/** Qué se siente y dónde, con el mismo color que en el cuerpo: el color nunca va solo. */
function Leyenda({ senal }: { senal: Senal }) {
  const zonas = Object.entries(senal.zonas ?? {}) as [Zona, keyof typeof SENSACIONES][]
  if (!zonas.length) return null
  return (
    <ul className="ola-leyenda" aria-label="Dónde se siente">
      {zonas.map(([z, s]) => (
        <li key={z}>
          <i aria-hidden="true" style={{ background: SENSACIONES[s].color }} />
          {SENSACIONES[s].nombre} en {ZONAS[z]}
        </li>
      ))}
    </ul>
  )
}

export default function ComoSeMueve({
  onSenal,
  onAbierta,
  encima,
  still,
  inicial,
}: {
  onSenal(s: Senal | null): void
  /** Si hay una situación abierta (la escena le deja espacio). */
  onAbierta(abierta: boolean): void
  encima: HTMLElement | null
  still: boolean
  /** Una situación para abrir de entrada (viene de la Biblioteca). */
  inicial?: string
}) {
  const [sit, setSit] = useState<Situacion | null>(() => SITUACIONES.find((s) => s.id === inicial) ?? null)
  const [paso, setPaso] = useState(0)
  const [palabra, setPalabra] = useState<string | null>(null)
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    onSenal(sit ? sit.momentos[paso].senal : null)
  }, [sit, paso, onSenal])
  useEffect(() => onAbierta(!!sit), [sit, onAbierta])

  const abrir = (s: Situacion) => {
    setSit(s)
    setPaso(0)
    setPalabra(null)
    requestAnimationFrame(() => {
      const p = panel.current
      ;(p?.closest('.ex-stage') ?? p)?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
    })
  }
  const ir = (n: number) => {
    setPaso(n)
    setPalabra(null)
  }
  const portal = (n: ReactNode) => (encima ? createPortal(n, encima) : n)
  const m = sit?.momentos[paso]
  const ultimo = sit ? paso === sit.momentos.length - 1 : false

  return (
    <>
      <section className="card dic-buscar" aria-labelledby="ola-title">
        <h2 id="ola-title">¿Cómo se mueve la ansiedad?</h2>
        <p className="muted">Elige una situación y recórrela punto por punto, a tu paso. Cada una tiene su propia ola.</p>
        <div className="chips" role="group" aria-label="Situaciones">
          {SITUACIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip${sit?.id === s.id ? ' selected' : ''}`}
              aria-pressed={sit?.id === s.id}
              onClick={() => abrir(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {sit &&
        m &&
        portal(
          <article
            ref={panel}
            className={`${encima ? 'ex-card' : 'card'} dic-ficha ola-ficha`}
            aria-labelledby="ola-ficha-title"
            aria-live={encima ? undefined : 'polite'}
          >
            <div className="ex-card-head">
              <p className="eyebrow">Punto por punto</p>
              <button type="button" className="icon-btn" onClick={() => setSit(null)} aria-label="Cerrar">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <h2 id="ola-ficha-title">{sit.title}</h2>
            {paso === 0 && <p className="muted">{sit.intro}</p>}
            <Ola momentos={sit.momentos} paso={paso} onIr={ir} />
            <h3 className="ola-nombre">{m.nombre}</h3>
            <p className="dic-texto">
              <Texto texto={m.t} abierta={palabra} onPalabra={(id) => setPalabra((p) => (p === id ? null : id))} />
            </p>
            {palabra && <Definicion id={palabra} onCerrar={() => setPalabra(null)} />}
            <Leyenda senal={m.senal} />
            {ultimo && sit.medico && <p className="callout warm">{sit.medico}</p>}
            {ultimo && sit.riesgo && (
              <div className="callout warm">
                <p>{sit.riesgo}</p>
                <Link to="/ayuda" className="btn small">
                  Hablar con alguien
                </Link>
              </div>
            )}
            {ultimo && sit.cierre && <p className="muted">{sit.cierre}</p>}
            {ultimo && sit.ir && (
              <Link to={sit.ir.to} className="btn ghost small dic-ir">
                {sit.ir.label}
              </Link>
            )}
            <div className="dic-pasos">
              <button type="button" className="btn ghost small" disabled={paso === 0} onClick={() => ir(paso - 1)}>
                Atrás
              </button>
              <span className="muted">
                {paso + 1} de {sit.momentos.length}
              </span>
              <button type="button" className="btn small" disabled={ultimo} onClick={() => ir(paso + 1)}>
                Sigue
              </button>
            </div>
          </article>,
        )}
    </>
  )
}
