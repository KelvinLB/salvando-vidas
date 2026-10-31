import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Capitulos from '../../../components/Capitulos'
import Filas from '../../../components/Filas'
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

/** El contorno del cuerpo de vidrio (sin la cabeza), en una caja de 200 × 250. */
export const CUERPO_VIDRIO =
  'M92 58 Q92 66 86 69 L66 75 Q55 78 53 90 L47 140 L42 176 Q41 183 45 182 L51 176 L58 140 L64 104 L66 132 Q66 160 64 180 L68 250 L94 250 L98 214 L102 214 L106 250 L132 250 L136 180 Q134 160 134 132 L136 104 L142 140 L149 176 L155 182 Q159 183 158 176 L153 140 L147 90 Q145 78 134 75 L114 69 Q108 66 108 58 Z'

/** El cuerpo de vidrio para elegir dónde lo sientes. */
function CuerpoZonas({ zona, onZona }: { zona: Zona | null; onZona(z: Zona): void }) {
  return (
    <svg className="bib-cuerpo" viewBox="0 0 200 250" role="group" aria-label="¿Dónde lo sientes?">
      <g fill="#8fd6cb" fillOpacity="0.08" stroke="#8fd6cb" strokeWidth="1.3" strokeOpacity="0.85">
        <ellipse cx="100" cy="38" rx="19" ry="23" />
        <path d={CUERPO_VIDRIO} />
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
      <h2 id="bib-conf-title" className="bib-apartado">
        Dos que se confunden
      </h2>
      <p className="muted">El mismo objeto con dos ajustes: lo que tienen en común y lo que los distingue.</p>
      <Capitulos
        label="Dos que se confunden"
        capitulos={CONFUNDEN.map((c) => ({
          id: c.id,
          title: `${c.a} y ${c.b.toLowerCase()}`,
          content: (
            <article className="card bib-par">
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
              <p>{c.comparacion}</p>
              <p className="callout info">{c.senal}</p>
              <Fuentes fuentes={c.fuentes} />
            </article>
          ),
        }))}
      />
    </section>
  )
}

// Cada tema en su pantalla; lo urgente queda arriba de todos, siempre a la vista.
function Acudir() {
  return (
    <section className="stack" aria-labelledby="bib-acudir-title">
      <h2 id="bib-acudir-title" className="bib-apartado">
        ¿Psicología o psiquiatría?
      </h2>
      <div className="callout warm">
        <p>{GUIA.urgente}</p>
        <Link to="/ayuda" className="btn small">
          Hablar con alguien ahora
        </Link>
      </div>
      <Capitulos
        label="A quién acudir"
        capitulos={[
          {
            id: 'quien',
            emoji: '🧭',
            title: 'Quién hace qué',
            text: GUIA.quien.map((q) => q.titulo).join(', '),
            content: GUIA.quien.map((q) => (
              <article key={q.id} className="card bib-quien">
                <h3>{q.titulo}</h3>
                <p>{q.que}</p>
                <p className="muted">{q.cuando}</p>
                <Fuentes fuentes={q.fuentes} />
              </article>
            )),
          },
          {
            id: 'cita',
            emoji: '🗓️',
            title: 'La primera cita',
            text: 'Qué suele pasar y qué llevar',
            content: (
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
            ),
          },
          {
            id: 'opciones',
            emoji: '🏥',
            title: 'Opciones públicas o de bajo costo en México',
            text: `${GUIA.opciones.length} lugares y cuánto suele costar`,
            content: (
              <>
                {/* Una línea por lugar; se abre el que interesa. */}
                <div className="card bib-opciones">
                  {GUIA.opciones.map((o) => (
                    <details key={o.nombre} className="bib-opcion">
                      <summary>{o.nombre}</summary>
                      <p>{o.como}</p>
                      <p className="muted">{o.costo}</p>
                      {o.url && (
                        <a href={o.url} target="_blank" rel="noreferrer">
                          Ver la página oficial
                        </a>
                      )}
                    </details>
                  ))}
                </div>
                <p className="muted">{GUIA.costos}</p>
                <Fuentes fuentes={GUIA.fuentes} />
              </>
            ),
          },
        ]}
      />
    </section>
  )
}

function Nombres() {
  return (
    <section className="stack" aria-labelledby="bib-nombres-title">
      <h2 id="bib-nombres-title" className="bib-apartado">
        Así cambió el nombre
      </h2>
      <p className="muted">Los nombres cambian cuando se entiende mejor lo que pasa, y para dejar de lastimar.</p>
      <Capitulos
        label="Así cambió el nombre"
        capitulos={GUIA.nombres.map((n, i) => ({
          id: String(i + 1),
          title: `${n.antes} → ${n.ahora}`,
          text: n.cuando,
          content: (
            <article className="card bib-nombre">
              <p className="bib-nombre-par">
                <s>{n.antes}</s> <span aria-hidden="true">→</span> <b>{n.ahora}</b>
              </p>
              <p className="muted">{n.cuando}</p>
              <p>{n.porque}</p>
              <Fuentes fuentes={n.fuentes} />
            </article>
          ),
        }))}
      />
    </section>
  )
}

const EMOJI: Record<FamiliaId, string> = {
  ansiedad: '⚡',
  animo: '🌧️',
  trauma: '🩹',
  obsesivo: '🔁',
  neuro: '🧩',
  comida: '🍽️',
  sueno: '🌙',
  psicosis: '📻',
  personalidad: '🪞',
  adicciones: '🔗',
  salud: '🩺',
  nodx: '🍂',
}

const cuantos = (n: number) => (n === 1 ? '1 objeto' : `${n} objetos`)

// Un apartado por pantalla: la portada tiene el cuerpo para elegir dónde lo sientes, las familias y
// los otros apartados como puertas; cada familia o apartado se abre aparte (?f=… o ?v=…), así el
// botón de atrás regresa a la portada y nunca se ven los 45 objetos juntos.
export default function Biblioteca({
  onSenal,
  onOla,
  onVerCuerpo,
  en3d,
  still,
}: {
  onSenal(s: Senal | null): void
  onOla(id: string): void
  onVerCuerpo(): void
  en3d: boolean
  still: boolean
}) {
  const [params] = useSearchParams()
  const vista = (VISTAS.find((v) => v.id === params.get('v'))?.id ?? 'coleccion') as Vista
  const fParam = params.get('f')
  const familia = fParam === 'nuevo' ? 'nuevo' : FAMILIAS.find((x) => x.id === fParam)?.id
  const [zona, setZona] = useState<Zona | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [mias] = useStored<string[]>('biblioteca', [])
  const ficha = abierta ? FICHAS_BIB.find((f) => f.id === abierta) : undefined
  const fichaRef = useRef<HTMLDivElement>(null)

  // Al cambiar de apartado, la ficha abierta se cierra.
  useEffect(() => setAbierta(null), [vista, familia])

  // El cuerpo de vidrio muestra la ficha abierta; si no, la zona elegida.
  useEffect(() => {
    if (ficha) onSenal(senalDe(ficha))
    else onSenal(zona ? { zonas: { [zona]: 'tension' } } : null)
  }, [ficha, zona, onSenal])

  const abrir = (id: string) => {
    setAbierta((a) => (a === id ? null : id))
    requestAnimationFrame(() => fichaRef.current?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' }))
  }

  const fichaVista = ficha && (
    <div ref={fichaRef} className="bib-ficha-wrap">
      <Ficha ficha={ficha} onCerrar={() => setAbierta(null)} onVerCuerpo={onVerCuerpo} onOla={onOla} en3d={en3d} />
    </div>
  )

  /** Los objetos en mosaicos, con la ficha abierta justo debajo. */
  const mosaicos = (items: FichaBib[]) => (
    <>
      <div className="bib-tiles">
        {items.map((f) => (
          <Tile key={f.id} f={f} abierta={f.id === abierta} onAbrir={() => abrir(f.id)} />
        ))}
      </div>
      {ficha && items.includes(ficha) && fichaVista}
    </>
  )

  if (familia) {
    const items = FICHAS_BIB.filter((f) => (familia === 'nuevo' ? !!f.nuevo : f.familia === familia))
    const nombre = familia === 'nuevo' ? 'Lo nuevo' : FAMILIAS.find((x) => x.id === familia)?.nombre
    return (
      <section className="stack bib" aria-labelledby="bib-fam-title">
        <div>
          <h2 id="bib-fam-title" className="bib-apartado">
            {nombre}
          </h2>
          <p className="muted">
            {familia === 'nuevo' ? 'Lo que cambió o se agregó en las clasificaciones más recientes. ' : ''}
            {cuantos(items.length)}. Toca uno para ver cómo funciona.
          </p>
        </div>
        {mosaicos(items)}
      </section>
    )
  }

  if (vista === 'mia') {
    const items = FICHAS_BIB.filter((f) => mias.includes(f.id))
    return (
      <section className="stack bib" aria-labelledby="bib-mia-title">
        <div>
          <h2 id="bib-mia-title" className="bib-apartado">
            Mi colección
          </h2>
          <p className="muted">Los objetos que te sirvieron, para volver a ellos. Se quedan solo en este teléfono.</p>
        </div>
        {items.length ? (
          mosaicos(items)
        ) : (
          <p>Todavía no guardas ninguno. Cuando un objeto te sirva, toca «Guardar en mi colección» en su ficha.</p>
        )}
      </section>
    )
  }
  if (vista === 'confunden') return <Confunden />
  if (vista === 'acudir') return <Acudir />
  if (vista === 'nombres') return <Nombres />

  const enZona = zona ? FICHAS_BIB.filter((f) => zona in f.zonas) : []
  return (
    <div className="stack bib">
      <section className="card bib-donde" aria-labelledby="bib-donde-title">
        <div>
          <h2 id="bib-donde-title">¿Dónde lo sientes?</h2>
          <p className="muted">Toca una parte del cuerpo y verás lo que suele sentirse ahí.</p>
          {zona && (
            <button type="button" className="btn ghost small" onClick={() => setZona(null)}>
              Quitar «{ZONAS.find((z) => z.id === zona)?.label}»
            </button>
          )}
        </div>
        <CuerpoZonas zona={zona} onZona={(z) => setZona((cur) => (cur === z ? null : z))} />
      </section>

      {zona ? (
        <section className="stack tight" aria-labelledby="bib-zona-title">
          <h2 id="bib-zona-title" className="section-title">
            En {ZONAS.find((z) => z.id === zona)?.label.toLowerCase()}: {cuantos(enZona.length)}
          </h2>
          {mosaicos(enZona)}
        </section>
      ) : (
        <>
          <section className="stack tight" aria-labelledby="bib-familias-title">
            <h2 id="bib-familias-title" className="section-title">
              Por familia
            </h2>
            <ul className="bib-familias" aria-label="Familias">
              {[
                ...FAMILIAS.map((x) => ({
                  id: x.id as string,
                  emoji: EMOJI[x.id],
                  nombre: x.nombre,
                  n: FICHAS_BIB.filter((f) => f.familia === x.id).length,
                })),
                { id: 'nuevo', emoji: '✨', nombre: 'Lo nuevo', n: FICHAS_BIB.filter((f) => f.nuevo).length },
              ].map((x) => (
                <li key={x.id}>
                  <Link to={{ search: `?f=${x.id}` }} className="bib-familia-link">
                    <span className="bib-familia-emoji" aria-hidden="true">
                      {x.emoji}
                    </span>
                    <span className="bib-familia-nombre">{x.nombre}</span>
                    <span className="bib-familia-n">{cuantos(x.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="stack tight" aria-labelledby="bib-mas-title">
            <h2 id="bib-mas-title" className="section-title">
              Para entender mejor
            </h2>
            <Filas
              label="Para entender mejor"
              filas={[
                { to: { search: '?v=confunden' }, emoji: '⚖️', title: 'Dos que se confunden', text: 'Lo que tienen en común y lo que los distingue' },
                { to: { search: '?v=acudir' }, emoji: '🧭', title: '¿Psicología o psiquiatría?', text: 'A quién acudir, qué llevar y opciones de bajo costo' },
                { to: { search: '?v=nombres' }, emoji: '🏷️', title: 'Así cambió el nombre', text: 'Por qué hoy se dicen distinto' },
                {
                  to: { search: '?v=mia' },
                  emoji: '🔖',
                  title: 'Mi colección',
                  text: mias.length ? cuantos(mias.length) + ' guardados aquí' : 'Lo que te sirvió, para volver a ello',
                },
              ]}
            />
          </section>
        </>
      )}
    </div>
  )
}
