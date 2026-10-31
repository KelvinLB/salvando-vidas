import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import RiskNotice from '../../components/RiskNotice'
import type { Senal } from '../../components/cuerpo3d/organos'
import { FICHAS, buscarFicha, type Ficha } from '../../data/diccionario'
import { soundsLikeRisk } from '../../lib/risk'
import { Definicion, Texto } from './Palabras'

// «Lo que siento»: eliges lo que te pasa (o lo escribes con tus palabras) y la explicación avanza
// paso a paso mientras la señal corre por el cuerpo. Tú decides cuándo seguir: no hay reloj. Si lo
// que escribes suena a riesgo, primero sale la ayuda. Lo que escribes no se guarda.
// En 3D, la explicación va encima del cuerpo (en `encima`) para leer y ver la señal a la vez; sin
// 3D, va debajo del buscador.

/** -1: la pregunta de antes; -2: su respuesta; 0 en adelante: los pasos. */
type Paso = number

export default function LoQueSiento({
  onSenal,
  onAbierta,
  encima,
  still,
}: {
  onSenal(s: Senal | null): void
  /** Si hay una explicación abierta (la escena le deja espacio). */
  onAbierta(abierta: boolean): void
  encima: HTMLElement | null
  still: boolean
}) {
  const [q, setQ] = useState('')
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [paso, setPaso] = useState<Paso>(0)
  const [palabra, setPalabra] = useState<string | null>(null)
  const panel = useRef<HTMLElement>(null)
  const riesgo = soundsLikeRisk(q)
  const hallada = !riesgo ? buscarFicha(q) : undefined

  // La escena muestra el paso actual; en la pregunta de antes, el cuerpo en reposo.
  useEffect(() => {
    onSenal(!riesgo && ficha && paso >= 0 ? ficha.pasos[paso] : null)
  }, [ficha, paso, riesgo, onSenal])
  useEffect(() => onAbierta(!!ficha && !riesgo), [ficha, riesgo, onAbierta])

  const abrir = (f: Ficha) => {
    setFicha(f)
    setPaso(f.adivina ? -1 : 0)
    setPalabra(null)
    // Que se vea la explicación, y en 3D el cuerpo entero con ella.
    requestAnimationFrame(() => {
      const p = panel.current
      ;(p?.closest('.ex-stage') ?? p)?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
    })
  }
  const ir = (n: Paso) => {
    setPaso(n)
    setPalabra(null)
  }
  const ultimo = ficha ? paso === ficha.pasos.length - 1 : false
  const portal = (n: ReactNode) => (encima ? createPortal(n, encima) : n)

  return (
    <>
      <section className="card dic-buscar" aria-labelledby="dic-buscar-title">
        <h2 id="dic-buscar-title">¿Qué te pasa?</h2>
        <label className="field">
          <span className="muted">Escríbelo con tus palabras o elige una de abajo.</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Por ejemplo: desperté y no me podía mover"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        {riesgo && <RiskNotice />}
        {!riesgo && hallada && hallada.id !== ficha?.id && (
          <button type="button" className="btn small dic-hallada" onClick={() => abrir(hallada)}>
            Ver: {hallada.title}
          </button>
        )}
        {!riesgo && !hallada && q.trim().length >= 3 && (
          <p className="muted">No encontré una explicación con esas palabras. Prueba con otras o elige una de abajo.</p>
        )}
        <div className="chips" role="group" aria-label="Lo que siento">
          {FICHAS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip${ficha?.id === f.id ? ' selected' : ''}`}
              aria-pressed={ficha?.id === f.id}
              onClick={() => abrir(f)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {ficha && !riesgo && portal(
        <article
          ref={panel}
          className={`${encima ? 'ex-card' : 'card'} dic-ficha`}
          aria-labelledby="dic-ficha-title"
          aria-live={encima ? undefined : 'polite'}
        >
          <div className="ex-card-head">
            <p className="eyebrow">Una explicación posible</p>
            <button type="button" className="icon-btn" onClick={() => setFicha(null)} aria-label="Cerrar la explicación">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <h2 id="dic-ficha-title">{ficha.title}</h2>
          {ficha.aviso && <p className="callout warm">{ficha.aviso}</p>}

          {paso === -1 && ficha.adivina && (
            <div className="dic-adivina">
              <p>{ficha.adivina.q}</p>
              <div className="chips">
                {ficha.adivina.opts.map((o) => (
                  <button key={o} type="button" className="chip" onClick={() => ir(-2)}>
                    {o}
                  </button>
                ))}
              </div>
              <button type="button" className="btn ghost small" onClick={() => ir(0)}>
                Mejor enséñamelo
              </button>
            </div>
          )}
          {paso === -2 && ficha.adivina && (
            <>
              <p>{ficha.adivina.a}</p>
              <button type="button" className="btn" onClick={() => ir(0)}>
                Ver paso a paso
              </button>
            </>
          )}

          {paso >= 0 && (
            <>
              <p className="dic-texto">
                <Texto texto={ficha.pasos[paso].t} abierta={palabra} onPalabra={(id) => setPalabra((p) => (p === id ? null : id))} />
              </p>
              {palabra && <Definicion id={palabra} onCerrar={() => setPalabra(null)} />}
              {ultimo && ficha.medico && <p className="callout warm">{ficha.medico}</p>}
              {ultimo && ficha.riesgo && (
                <div className="callout warm">
                  <p>{ficha.riesgo}</p>
                </div>
              )}
              {ultimo && ficha.cierre && <p className="muted">{ficha.cierre}</p>}
              {ultimo && ficha.ir && (
                <Link to={ficha.ir.to} className="btn ghost small dic-ir">
                  {ficha.ir.label}
                </Link>
              )}
              <div className="dic-pasos">
                <button type="button" className="btn ghost small" disabled={paso === 0} onClick={() => ir(paso - 1)}>
                  Atrás
                </button>
                <span className="muted">
                  Paso {paso + 1} de {ficha.pasos.length}
                </span>
                <button type="button" className="btn small" disabled={ultimo} onClick={() => ir(paso + 1)}>
                  Sigue
                </button>
              </div>
            </>
          )}
        </article>,
      )}
    </>
  )
}
