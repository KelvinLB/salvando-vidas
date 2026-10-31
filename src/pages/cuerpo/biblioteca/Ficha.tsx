import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Share2, Volume2, VolumeX, X } from 'lucide-react'
import { SENSACIONES, type Zona } from '../../../components/cuerpo3d/organos'
import { FAMILIAS, type FichaBib, sinMarcas } from '../../../data/biblioteca'
import { useStored } from '../../../lib/storage'
import { Definicion, Texto } from '../Palabras'
import Figura from './Figura'

// La ficha de un objeto: primero el objeto que funciona, luego dónde se siente en el cuerpo, qué es,
// qué ayuda y a quién acudir; al final el mito, cómo explicárselo a alguien, de dónde viene el
// nombre y las fuentes. En los temas donde importa, la ayuda inmediata va arriba de todo.

export const ZONA_NOMBRE: Record<Zona, string> = {
  cara: 'la cabeza y la cara',
  cuello: 'el cuello y los hombros',
  pecho: 'el pecho',
  panza: 'la panza',
  manos: 'las manos',
}

const puedeHablar = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Lee la ficha con la voz del teléfono (no se baja nada). */
function useVoz(texto: string) {
  const [hablando, setHablando] = useState(false)
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  const alternar = () => {
    const ss = window.speechSynthesis
    if (hablando) {
      ss.cancel()
      setHablando(false)
      return
    }
    ss.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    const voces = ss.getVoices()
    const voz = voces.find((v) => v.lang === 'es-MX') ?? voces.find((v) => v.lang.startsWith('es-4')) ?? voces.find((v) => v.lang.startsWith('es'))
    if (voz) u.voice = voz
    u.lang = voz?.lang ?? 'es-MX'
    u.rate = 0.95
    u.onend = u.onerror = () => setHablando(false)
    ss.speak(u)
    setHablando(true)
  }
  return [hablando, alternar] as const
}

export default function Ficha({
  ficha: f,
  onCerrar,
  onVerCuerpo,
  onOla,
  en3d,
}: {
  ficha: FichaBib
  onCerrar(): void
  onVerCuerpo(): void
  onOla(id: string): void
  en3d: boolean
}) {
  const [guardadas, setGuardadas] = useStored<string[]>('biblioteca', [])
  const [palabra, setPalabra] = useState<string | null>(null)
  const [volteada, setVolteada] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const guardada = guardadas.includes(f.id)
  const familia = FAMILIAS.find((x) => x.id === f.familia)?.nombre
  const [hablando, hablar] = useVoz(
    [f.objeto, f.condicion, f.comoFunciona, f.que, f.cuerpo, f.ayuda, f.acudir].map(sinMarcas).join('. '),
  )
  const texto = (t: string) => (
    <Texto texto={t} abierta={palabra} onPalabra={(id) => setPalabra((p) => (p === id ? null : id))} />
  )
  const zonas = Object.entries(f.zonas) as [Zona, keyof typeof SENSACIONES][]

  const compartir = async () => {
    const t = `${sinMarcas(f.compartir)}\n\n(${f.condicion}, de la Biblioteca de Salvando Vidas)`
    try {
      if (navigator.share) await navigator.share({ title: f.condicion, text: t })
      else {
        await navigator.clipboard.writeText(t)
        setCopiado(true)
      }
    } catch {
      // Si se cancela el menú de compartir, no pasa nada.
    }
  }

  return (
    <article className="card bib-ficha" aria-labelledby="bib-ficha-title">
      <div className="ex-card-head">
        <p className="eyebrow">{familia}</p>
        <button type="button" className="icon-btn" onClick={onCerrar} aria-label="Cerrar la ficha">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <h2 id="bib-ficha-title">{f.objeto}</h2>
      <p className="bib-condicion">{f.condicion}</p>
      {(f.nuevo || f.riesgo) && (
        <div className="tags">
          {f.nuevo && <span className="tag bib-nuevo">{f.nuevo}</span>}
        </div>
      )}

      {f.riesgo && (
        <div className="callout warm bib-riesgo">
          <p>
            Si hoy sientes que no puedes más o piensas en hacerte daño, no esperes: habla ya con alguien. La Línea de
            la Vida (800 911 2000) es gratis y contesta a toda hora.
          </p>
          <Link to="/ayuda" className="btn small">
            Hablar con alguien
          </Link>
        </div>
      )}

      <Figura key={f.id} objeto={f.figura} pista={f.pista} />
      <p className="dic-texto">{texto(f.comoFunciona)}</p>

      <h3>En tu cuerpo</h3>
      <p>{texto(f.cuerpo)}</p>
      <ul className="ola-leyenda" aria-label="Dónde suele sentirse">
        {zonas.map(([z, s]) => (
          <li key={z}>
            <i aria-hidden="true" style={{ background: SENSACIONES[s].color }} />
            {SENSACIONES[s].nombre} en {ZONA_NOMBRE[z]}
          </li>
        ))}
      </ul>
      <div className="row bib-acciones">
        {en3d && (
          <button type="button" className="btn ghost small" onClick={onVerCuerpo}>
            Verlo en el cuerpo
          </button>
        )}
        {f.ola && (
          <button type="button" className="btn ghost small" onClick={() => onOla(f.ola!)}>
            Recorrer su ola
          </button>
        )}
      </div>

      <h3>Qué es</h3>
      <p>{texto(f.que)}</p>
      <h3>Qué ayuda</h3>
      <p>{texto(f.ayuda)}</p>
      <h3>A quién acudir</h3>
      <p>{texto(f.acudir)}</p>
      {palabra && <Definicion id={palabra} onCerrar={() => setPalabra(null)} />}

      <div className={`bib-mito${volteada ? ' volteada' : ''}`}>
        <p className="eyebrow">{volteada ? 'Lo que sí pasa' : 'Lo que se dice'}</p>
        <p className="bib-mito-texto" aria-live="polite">
          {volteada ? sinMarcas(f.realidad) : f.mito}
        </p>
        <button type="button" className="btn ghost small" aria-pressed={volteada} onClick={() => setVolteada((v) => !v)}>
          {volteada ? 'Ver lo que se dice' : 'Voltear la tarjeta'}
        </button>
      </div>

      <h3>Para explicárselo a alguien</h3>
      <blockquote className="bib-cita">{sinMarcas(f.compartir)}</blockquote>
      <div className="row bib-acciones">
        <button type="button" className="btn ghost small" onClick={compartir}>
          <Share2 size={16} aria-hidden="true" /> {copiado ? 'Copiado' : 'Compartir'}
        </button>
        <Link to="/acompanar" className="btn ghost small">
          Cuando alguien que quieres está mal
        </Link>
      </div>

      {f.antes && (
        <>
          <h3>Así cambió el nombre</h3>
          <p>{texto(f.antes)}</p>
        </>
      )}

      <div className="row bib-acciones">
        <button
          type="button"
          className="btn small"
          aria-pressed={guardada}
          onClick={() => setGuardadas((g) => (g.includes(f.id) ? g.filter((x) => x !== f.id) : [...g, f.id]))}
        >
          {guardada ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}{' '}
          {guardada ? 'Está en mi colección' : 'Guardar en mi colección'}
        </button>
        {puedeHablar && (
          <button type="button" className="btn ghost small" aria-pressed={hablando} onClick={hablar}>
            {hablando ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}{' '}
            {hablando ? 'Detener' : 'Escuchar'}
          </button>
        )}
      </div>

      <details className="bib-fuentes">
        <summary>De dónde sale esto ({f.fuentes.length} fuentes)</summary>
        <ul>
          {f.fuentes.map((x) => (
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
        <p className="muted">Es una explicación para entender, no un diagnóstico. Solo un profesional diagnostica.</p>
      </details>
    </article>
  )
}
