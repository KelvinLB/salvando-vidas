import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CAPTION_REST,
  SENAL_LAYERS,
  SENAL_PARTS,
  type SenalCaption,
  type SenalLayer,
  type SenalPartId,
} from '../../data/senal'
import { createSenal, type SenalEngine, type SenalMode } from './engine'
import SenalFigure from './SenalFigure'
import './senal.css'

// «Sigue la señal»: la alarma del cuerpo como un circuito de luz. Del cerebro baja a las
// glándulas y de ahí al corazón, los pulmones, los brazos y la panza; con «Respirar lento»
// el nervio vago se ilumina de azul al soltar el aire y todo vuelve a la calma. Las capas se
// prenden y se apagan, y al tocar una parte la vista se acerca y aparece su ficha pegada:
// qué es, por qué se siente así y qué ayuda.
//
// React lleva los botones, la leyenda y la ficha; el dibujo lo mueve engine.ts.
// Textos pendientes de revisión con psicóloga y médico (fuentes en src/data/senal.ts).

/** Qué capas están apagadas: al empezar, ninguna. */
const ALL_ON: Record<SenalLayer, boolean> = { alarma: false, respiracion: false, sangre: false, musculos: false, panza: false }

export default function Senal({ still }: { still: boolean }) {
  const root = useRef<HTMLElement>(null)
  const engine = useRef<SenalEngine | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const cardTitle = useRef<HTMLHeadingElement>(null)
  const ids = useId()

  const [mode, setMode] = useState<SenalMode>('rest')
  const [caption, setCaption] = useState<SenalCaption>(CAPTION_REST)
  const [breath, setBreath] = useState({ word: 'Inhala', k: 0 })
  const [brain, setBrain] = useState({ amy: false, hypo: false })
  const [paused, setPaused] = useState(false)
  const [off, setOff] = useState(ALL_ON)
  const [zoom, setZoom] = useState<SenalPartId | null>(null)
  const part = SENAL_PARTS.find((p) => p.id === zoom)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const e = createSenal(el, { caption: setCaption, mode: setMode, breath: setBreath, brain: setBrain }, still)
    engine.current = e
    // Fuera de la pantalla se queda quieto.
    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => e.setVisible(entry.isIntersecting), { rootMargin: '80px 0px' })
      io.observe(el)
    }
    return () => {
      io?.disconnect()
      e.destroy()
      engine.current = null
    }
    // El motor se arma una vez; `still` le llega aparte.
  }, [])

  useEffect(() => engine.current?.setStill(still), [still])

  const closeZoom = useCallback((refocus: boolean) => {
    setZoom(null)
    engine.current?.zoom(null)
    if (refocus) trigger.current?.focus({ preventScroll: true })
    trigger.current = null
  }, [])

  const openZoom = useCallback((id: SenalPartId, from: HTMLButtonElement | null) => {
    const p = SENAL_PARTS.find((x) => x.id === id)
    if (!p) return
    // Si su capa estaba apagada, se prende para verla.
    setOff((o) => (o[p.layer] ? { ...o, [p.layer]: false } : o))
    setZoom(id)
    engine.current?.zoom(p.box)
    trigger.current = from
  }, [])

  // Al abrir la ficha desde la fila de partes, el foco pasa a su título.
  useEffect(() => {
    if (zoom && trigger.current) cardTitle.current?.focus({ preventScroll: true })
  }, [zoom])

  const onFigurePart = useCallback((id: SenalPartId) => openZoom(id, null), [openZoom])

  const start = (what: 'alarm' | 'breathe') => {
    if (zoom) closeZoom(false)
    setPaused(false)
    engine.current?.setPaused(false)
    if (what === 'alarm') engine.current?.alarm()
    else engine.current?.breathe()
  }

  const togglePause = () => {
    setPaused(!paused)
    engine.current?.setPaused(!paused)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && zoom) {
      e.preventDefault()
      closeZoom(true)
    }
  }

  // Cuando la alarma ya pidió el freno, el botón principal es «Respirar lento».
  const inviting = !!caption.invite
  const cardId = `${ids}-ficha`

  return (
    <section
      ref={root}
      id="senal"
      className={`card sg${still ? ' sg-still' : ''}`}
      aria-labelledby={`${ids}-t`}
      onKeyDown={onKey}
    >
      <div className="sg-top">
        <h2 id={`${ids}-t`}>Sigue la señal</h2>
        <p className="muted">
          Mira cómo viaja la alarma por el cuerpo y cómo la frena el aire que sueltas despacio. Toca
          cualquier parte para acercarte.
        </p>
      </div>

      <div className="sg-grid">
        <div className="sg-acts">
          <button type="button" className={`btn${inviting ? ' ghost' : ''}`} onClick={() => start('alarm')}>
            Sonó la alarma
          </button>
          <button type="button" className={`btn${inviting ? '' : ' ghost'}`} onClick={() => start('breathe')}>
            Respirar lento
          </button>
          <button type="button" className="btn ghost sg-pause" aria-pressed={paused} onClick={togglePause}>
            {paused ? 'Seguir' : 'Pausa'}
          </button>
        </div>

        <div className="sg-stage">
          <SenalFigure
            off={off}
            near={part?.layer ?? null}
            ring={part?.ring ?? null}
            amy={brain.amy}
            hypo={brain.hypo}
            onPart={onFigurePart}
          />

          <div className="sg-breath" hidden={mode !== 'breathe'} aria-hidden="true">
            <div className="sg-breath-ring">
              <i data-sg="breath-ring" />
              <b>{breath.word}</b>
            </div>
            <div className="sg-bdots">
              {[0, 1, 2].map((i) => (
                <i key={i} className={i <= breath.k ? 'on' : ''} />
              ))}
            </div>
          </div>

          {part && (
            <div key={part.id} className="sg-card" id={cardId} role="region" aria-labelledby={`${ids}-ft`}>
              <div className="sg-card-top">
                <h3 id={`${ids}-ft`} ref={cardTitle} tabIndex={-1}>
                  {part.name}
                </h3>
                <button type="button" className="btn ghost small" onClick={() => closeZoom(true)}>
                  Volver
                </button>
              </div>
              <dl>
                <dt>Qué es</dt>
                <dd>{part.what}</dd>
                <dt>Por qué se siente así</dt>
                <dd>{part.why}</dd>
                <dt>Qué ayuda</dt>
                <dd>{part.helps}</dd>
              </dl>
              {part.warn && <p className="sg-warn">{part.warn}</p>}
              <Link to={part.link.to} className="btn small sg-go">
                {part.link.label}
              </Link>
            </div>
          )}
        </div>

        <div className={`sg-cap${caption.tone ? ` ${caption.tone}` : ''}`} aria-live="polite">
          <span className="sg-kick">{caption.kick}</span>
          <h3>{caption.title}</h3>
          <p>{caption.text}</p>
          {caption.dots && (
            <div className="sg-dots" aria-hidden="true">
              {Array.from({ length: caption.dots.n }, (_, i) => (
                <i key={i} className={i <= caption.dots!.i ? 'on' : ''} />
              ))}
            </div>
          )}
          {caption.invite && (
            <button type="button" className="btn small" onClick={() => start('breathe')}>
              Respirar lento
            </button>
          )}
        </div>

        <div className="sg-layers">
          <p className="sg-lbl" id={`${ids}-capas`}>
            Capas
          </p>
          <div className="sg-chips" role="group" aria-labelledby={`${ids}-capas`}>
            {SENAL_LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                className="btn ghost small"
                aria-pressed={!off[l.id]}
                onClick={() => setOff((o) => ({ ...o, [l.id]: !o[l.id] }))}
              >
                <i style={{ background: l.color }} aria-hidden="true" />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sg-parts">
          <p className="sg-lbl" id={`${ids}-partes`}>
            Acércate a una parte
          </p>
          <div className="sg-chips" role="group" aria-labelledby={`${ids}-partes`}>
            {SENAL_PARTS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn ghost small"
                aria-expanded={zoom === p.id}
                aria-controls={zoom === p.id ? cardId : undefined}
                onClick={(e) => (zoom === p.id ? closeZoom(true) : openZoom(p.id, e.currentTarget))}
              >
                {p.chip}
              </button>
            ))}
          </div>
        </div>

        <div className="sg-note">
          <p className="muted small">El corazón del dibujo no es el tuyo: no mide nada ni lleva la cuenta.</p>
          <p className="muted small">Si fijarte en el cuerpo te pone peor, está bien parar y solo soltar el aire.</p>
        </div>
      </div>
    </section>
  )
}
