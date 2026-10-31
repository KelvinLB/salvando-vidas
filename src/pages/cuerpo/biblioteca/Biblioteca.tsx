import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Senal, Zona } from '../../../components/cuerpo3d/organos'
import { FAMILIAS, type FamiliaId, type FichaBib, senalDe } from '../../../data/biblioteca'
import { CONFUNDEN, FICHAS_BIB } from '../../../data/bibliotecaFichas'
import { GUIA } from '../../../data/bibliotecaGuia'
import { useStored } from '../../../lib/storage'
import Ficha from './Ficha'
import { Mini } from './Figura'
import './biblioteca.css'

// «Biblioteca» en Explorar: la colección de objetos (uno por cada cosa que hoy se conoce), con el
// cuerpo de vidrio para elegir dónde lo sientes, y cuatro apartados más: dos que se confunden, a quién
// acudir, cómo cambiaron los nombres y la colección propia (solo en este teléfono, sin contar nada).

type Vista = 'coleccion' | 'confunden' | 'acudir' | 'nombres' | 'mia'

const VISTAS: { id: Vista; label: string }[] = [
  { id: 'coleccion', label: 'La colección' },
  { id: 'confunden', label: 'Dos que se confunden' },
  { id: 'acudir', label: '¿Psicología o psiquiatría?' },
  { id: 'nombres', label: 'Así cambió el nombre' },
  { id: 'mia', label: 'Mi colección' },
]

const ZONAS: { id: Zona; label: string; x: number; y: number; lx: number; ly: number }[] = [
  { id: 'cara', label: 'Cabeza', x: 100, y: 34, lx: 126, ly: 24 },
  { id: 'cuello', label: 'Hombros', x: 80, y: 74, lx: 14, ly: 66 },
  { id: 'pecho', label: 'Pecho', x: 104, y: 112, lx: 136, ly: 104 },
  { id: 'panza', label: 'Panza', x: 104, y: 148, lx: 128, ly: 162 },
  { id: 'manos', label: 'Manos', x: 48, y: 180, lx: 14, ly: 206 },
]

/** El cuerpo de vidrio para elegir dónde lo sientes. */
function CuerpoZonas({ zona, onZona }: { zona: Zona | null; onZona(z: Zona): void }) {
  return (
    <svg className="bib-cuerpo" viewBox="0 0 200 250" role="group" aria-label="¿Dónde lo sientes?">
      <g fill="#8fd6cb" fillOpacity="0.08" stroke="#8fd6cb" strokeWidth="1.3" strokeOpacity="0.85">
        <ellipse cx="100" cy="38" rx="19" ry="23" />
        <path d="M92 58 Q92 66 86 69 L66 75 Q55 78 53 90 L47 140 L42 176 Q41 183 45 182 L51 176 L58 140 L64 104 L66 132 Q66 160 64 180 L68 250 L94 250 L98 214 L102 214 L106 250 L132 250 L136 180 Q134 160 134 132 L136 104 L142 140 L149 176 L155 182 Q159 183 158 176 L153 140 L147 90 Q145 78 134 75 L114 69 Q108 66 108 58 Z" />
      </g>
      {ZONAS.map((z) => {
        const on = zona === z.id
        return (
          <g key={z.id}>
            <text x={z.lx} y={z.ly} className="bib-cuerpo-label">
              {z.label}
            </text>
            <circle cx={z.x} cy={z.y} r={on ? 14 : 0} fill="#ff7a45" opacity="0.28" />
            {/* El botón de verdad es un círculo grande e invisible: se toca fácil con el dedo. */}
            <circle
              className="bib-pin"
              cx={z.x}
              cy={z.y}
              r="16"
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={z.label}
              onClick={() => onZona(z.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onZona(z.id)
                }
              }}
            />
            <circle cx={z.x} cy={z.y} r="5" fill={on ? '#ff7a45' : '#0f1c1b'} stroke="#fff1d6" strokeWidth="2" pointerEvents="none" />
          </g>
        )
      })}
    </svg>
  )
}

const PUNTO: Record<Zona, [number, number]> = { cara: [22, 11], cuello: [16, 22], pecho: [24, 29], panza: [22, 40], manos: [8, 50] }

function Cuerpito({ zonas }: { zonas: Zona[] }) {
  return (
    <svg className="bib-cuerpito" viewBox="0 0 44 72" aria-hidden="true">
      <g fill="#8fd6cb" fillOpacity="0.12" stroke="#8fd6cb" strokeOpacity="0.8" strokeWidth="0.9">
        <ellipse cx="22" cy="11" rx="5.5" ry="6.5" />
        <path d="M19 17 L13 19 Q10 20 9.5 24 L7 50 Q8 52 10 50 L13 30 L14 44 L15 68 L21 68 L22 52 L23 68 L29 68 L30 44 L31 30 L34 50 Q36 52 37 50 L34.5 24 Q34 20 31 19 L25 17 Z" />
      </g>
      {zonas.flatMap((z) => {
        const [x, y] = PUNTO[z]
        const c = <circle key={z} cx={x} cy={y} r="3.2" fill="#ff7a45" />
        return z === 'manos' ? [c, <circle key="manos2" cx={44 - x} cy={y} r="3.2" fill="#ff7a45" />] : [c]
      })}
    </svg>
  )
}

function Tile({ f, onAbrir, abierta }: { f: FichaBib; onAbrir(): void; abierta: boolean }) {
  return (
    <button type="button" className={`bib-tile${abierta ? ' abierta' : ''}`} aria-expanded={abierta} onClick={onAbrir}>
      <Cuerpito zonas={Object.keys(f.zonas) as Zona[]} />
      <span>
        <span className="bib-obj">{f.objeto}</span>
        <span className="bib-cond">{f.condicion}</span>
        {f.nuevo && <span className="tag bib-nuevo">{f.nuevo}</span>}
      </span>
    </button>
  )
}

function Fuentes({ fuentes }: { fuentes: { texto: string; url?: string }[] }) {
  return (
    <details className="bib-fuentes">
      <summary>Fuentes</summary>
      <ul>
        {fuentes.map((x) => (
          <li key={x.texto}>
            {x.url ? (
              <a href={x.url} target="_blank" rel="noreferrer">
                {x.texto}
              </a>
            ) : (
              x.texto
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}

function Confunden() {
  return (
    <section className="stack" aria-labelledby="bib-conf-title">
      <h2 id="bib-conf-title" className="section-title">
        Dos que se confunden
      </h2>
      <p className="muted">El mismo objeto con dos ajustes: lo que tienen en común y lo que los distingue.</p>
      {CONFUNDEN.map((c) => (
        <article key={c.id} className="card bib-par">
          <div className="bib-par-objetos" aria-hidden="true">
            <figure>
              <Mini tipo={c.objeto} nivel={0.35} />
              <figcaption>{c.a}</figcaption>
            </figure>
            <figure>
              <Mini tipo={c.objeto} nivel={c.objeto === 'luz' ? 0.05 : 0.9} />
              <figcaption>{c.b}</figcaption>
            </figure>
          </div>
          <h3>
            {c.a} y {c.b.toLowerCase()}
          </h3>
          <p>{c.comparacion}</p>
          <p className="callout info">{c.senal}</p>
          <Fuentes fuentes={c.fuentes} />
        </article>
      ))}
    </section>
  )
}

function Acudir() {
  return (
    <section className="stack" aria-labelledby="bib-acudir-title">
      <h2 id="bib-acudir-title" className="section-title">
        ¿Psicología o psiquiatría?
      </h2>
      <div className="callout warm">
        <p>{GUIA.urgente}</p>
        <Link to="/ayuda" className="btn small">
          Hablar con alguien ahora
        </Link>
      </div>
      {GUIA.quien.map((q) => (
        <article key={q.id} className="card bib-quien">
          <h3>{q.titulo}</h3>
          <p>{q.que}</p>
          <p className="muted">{q.cuando}</p>
          <Fuentes fuentes={q.fuentes} />
        </article>
      ))}
      <article className="card">
        <h3>En la primera cita</h3>
        <ul className="bib-lista">
          {GUIA.primeraCita.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h3>Qué llevar</h3>
        <ul className="bib-lista">
          {GUIA.llevar.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Link to="/especialista" className="btn ghost small">
          Preparar mi consulta
        </Link>
      </article>
      <h3 className="section-title">Opciones públicas o de bajo costo en México</h3>
      {GUIA.opciones.map((o) => (
        <article key={o.nombre} className="card bib-opcion">
          <h3>{o.nombre}</h3>
          <p>{o.como}</p>
          <p className="muted">{o.costo}</p>
          {o.url && (
            <a href={o.url} target="_blank" rel="noreferrer">
              Ver la página oficial
            </a>
          )}
        </article>
      ))}
      <p className="muted">{GUIA.costos}</p>
      <Fuentes fuentes={GUIA.fuentes} />
    </section>
  )
}

function Nombres() {
  return (
    <section className="stack" aria-labelledby="bib-nombres-title">
      <h2 id="bib-nombres-title" className="section-title">
        Así cambió el nombre
      </h2>
      <p className="muted">Los nombres cambian cuando se entiende mejor lo que pasa, y para dejar de lastimar.</p>
      {GUIA.nombres.map((n) => (
        <article key={n.antes} className="card bib-nombre">
          <p className="bib-nombre-par">
            <s>{n.antes}</s> <span aria-hidden="true">→</span> <b>{n.ahora}</b>
          </p>
          <p className="muted">{n.cuando}</p>
          <p>{n.porque}</p>
          <Fuentes fuentes={n.fuentes} />
        </article>
      ))}
    </section>
  )
}

export default function Biblioteca({
  onSenal,
  onOla,
  en3d,
  still,
}: {
  onSenal(s: Senal | null): void
  onOla(id: string): void
  en3d: boolean
  still: boolean
}) {
  const [vista, setVista] = useState<Vista>('coleccion')
  const [familia, setFamilia] = useState<FamiliaId | 'todas' | 'nuevo'>('todas')
  const [zona, setZona] = useState<Zona | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [mias] = useStored<string[]>('biblioteca', [])
  const ficha = abierta ? FICHAS_BIB.find((f) => f.id === abierta) : undefined
  const fichaRef = useRef<HTMLDivElement>(null)

  // El cuerpo de vidrio muestra la ficha abierta; si no, la zona elegida.
  useEffect(() => {
    if (ficha) onSenal(senalDe(ficha))
    else onSenal(zona ? { zonas: { [zona]: 'tension' } } : null)
  }, [ficha, zona, onSenal])

  const lista = useMemo(
    () =>
      FICHAS_BIB.filter(
        (f) =>
          (familia === 'todas' || (familia === 'nuevo' ? !!f.nuevo : f.familia === familia)) && (!zona || zona in f.zonas),
      ),
    [familia, zona],
  )

  const abrir = (id: string) => {
    setAbierta((a) => (a === id ? null : id))
    requestAnimationFrame(() => fichaRef.current?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' }))
  }
  const verCuerpo = () =>
    document.querySelector('.ex-stage')?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })

  const fichaVista = ficha && (
    <div ref={fichaRef} className="bib-ficha-wrap">
      <Ficha ficha={ficha} onCerrar={() => setAbierta(null)} onVerCuerpo={verCuerpo} onOla={onOla} en3d={en3d} />
    </div>
  )

  return (
    <div className="stack bib">
      <div className="chips bib-vistas" role="radiogroup" aria-label="Apartados de la biblioteca">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={vista === v.id}
            className={`chip${vista === v.id ? ' selected' : ''}`}
            onClick={() => {
              setVista(v.id)
              setAbierta(null)
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {vista === 'coleccion' && (
        <>
          <section className="card bib-donde" aria-labelledby="bib-donde-title">
            <div>
              <h2 id="bib-donde-title">¿Dónde lo sientes?</h2>
              <p className="muted">
                Toca una parte del cuerpo y verás lo que suele sentirse ahí. Cada cosa se explica con un objeto que
                puedes mover.
              </p>
              {zona && (
                <button type="button" className="btn ghost small" onClick={() => setZona(null)}>
                  Quitar «{ZONAS.find((z) => z.id === zona)?.label}»
                </button>
              )}
            </div>
            <CuerpoZonas zona={zona} onZona={(z) => setZona((cur) => (cur === z ? null : z))} />
          </section>

          <div className="chips" role="group" aria-label="Filtrar por familia">
            {[{ id: 'todas', nombre: 'Todas' } as const, ...FAMILIAS, { id: 'nuevo', nombre: 'Lo nuevo' } as const].map((x) => (
              <button
                key={x.id}
                type="button"
                className={`chip${familia === x.id ? ' selected' : ''}`}
                aria-pressed={familia === x.id}
                onClick={() => setFamilia(x.id)}
              >
                {x.nombre}
              </button>
            ))}
          </div>

          {FAMILIAS.map((fam) => {
            const items = lista.filter((f) => f.familia === fam.id)
            if (!items.length) return null
            const aqui = items.some((f) => f.id === abierta)
            return (
              <section key={fam.id} className="bib-familia" aria-label={fam.nombre}>
                <h2 className="section-title">{fam.nombre}</h2>
                <div className="bib-tiles">
                  {items.map((f) => (
                    <Tile key={f.id} f={f} abierta={f.id === abierta} onAbrir={() => abrir(f.id)} />
                  ))}
                </div>
                {aqui && fichaVista}
              </section>
            )
          })}
          {!lista.length && <p className="muted">Nada en esta combinación. Prueba otra familia o quita la parte del cuerpo.</p>}
        </>
      )}

      {vista === 'mia' && (
        <section className="stack" aria-labelledby="bib-mia-title">
          <h2 id="bib-mia-title" className="section-title">
            Mi colección
          </h2>
          <p className="muted">Los objetos que te sirvieron, para volver a ellos. Se quedan solo en este teléfono.</p>
          {mias.length ? (
            <div className="bib-tiles">
              {FICHAS_BIB.filter((f) => mias.includes(f.id)).map((f) => (
                <Tile key={f.id} f={f} abierta={f.id === abierta} onAbrir={() => abrir(f.id)} />
              ))}
            </div>
          ) : (
            <p>Todavía no guardas ninguno. Cuando un objeto te sirva, toca «Guardar en mi colección» en su ficha.</p>
          )}
          {ficha && mias.includes(ficha.id) && fichaVista}
        </section>
      )}

      {vista === 'confunden' && <Confunden />}
      {vista === 'acudir' && <Acudir />}
      {vista === 'nombres' && <Nombres />}
    </div>
  )
}
