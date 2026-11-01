import { type ReactNode, useState } from 'react'
import { Check, Copy, Download, EllipsisVertical, MonitorDown, Share, SquarePlus, WifiOff, Zap, Lock } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { type Donde, enChrome, instalar, useDonde } from '../lib/instalar'
import '../components/instalar.css'

// Cómo tenerla como app en cada teléfono o computadora. Arriba va lo de este aparato; lo demás,
// por si alguien está ayudando a otra persona a instalarla.

type Paso = { icono?: ReactNode; texto: ReactNode }

const PASOS: Record<Exclude<Donde, 'instalada' | 'listo'>, { titulo: string; pasos: Paso[]; nota?: string }> = {
  iphone: {
    titulo: 'En iPhone o iPad',
    pasos: [
      {
        icono: <Share size={20} aria-hidden="true" />,
        texto: (
          <>
            Toca el botón <strong>Compartir</strong>: un cuadro con una flecha hacia arriba. Si no lo ves, toca
            primero <strong>···</strong>.
          </>
        ),
      },
      {
        icono: <SquarePlus size={20} aria-hidden="true" />,
        texto: (
          <>
            Baja y elige <strong>Agregar a inicio</strong> (en algunos teléfonos dice «Agregar a pantalla de
            inicio»).
          </>
        ),
      },
      {
        icono: <Check size={20} aria-hidden="true" />,
        texto: (
          <>
            Si aparece «Abrir como app web», déjalo encendido y toca <strong>Agregar</strong>. Listo: la vas a
            ver con las demás apps.
          </>
        ),
      },
    ],
    nota: 'Funciona desde Safari y también desde Chrome o Edge en el iPhone.',
  },
  android: {
    titulo: 'En Android',
    pasos: [
      {
        icono: <EllipsisVertical size={20} aria-hidden="true" />,
        texto: (
          <>
            Toca el menú del navegador: los <strong>tres puntitos</strong> arriba a la derecha (en Samsung
            Internet son tres rayitas abajo).
          </>
        ),
      },
      {
        icono: <Download size={20} aria-hidden="true" />,
        texto: (
          <>
            Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.
          </>
        ),
      },
      {
        icono: <Check size={20} aria-hidden="true" />,
        texto: (
          <>
            Toca <strong>Instalar</strong>. Listo: la vas a ver con las demás apps.
          </>
        ),
      },
    ],
  },
  'mac-safari': {
    titulo: 'En Safari de Mac',
    pasos: [
      {
        icono: <Share size={20} aria-hidden="true" />,
        texto: (
          <>
            En el menú de arriba, abre <strong>Archivo</strong> (o toca el botón Compartir).
          </>
        ),
      },
      {
        icono: <SquarePlus size={20} aria-hidden="true" />,
        texto: (
          <>
            Elige <strong>Agregar al Dock</strong> y luego <strong>Agregar</strong>.
          </>
        ),
      },
    ],
  },
  computadora: {
    titulo: 'En la computadora',
    pasos: [
      {
        icono: <MonitorDown size={20} aria-hidden="true" />,
        texto: (
          <>
            En Chrome o Edge, busca a la derecha de la dirección el ícono de <strong>instalar</strong> (una
            pantalla con una flecha) y tócalo.
          </>
        ),
      },
      {
        icono: <EllipsisVertical size={20} aria-hidden="true" />,
        texto: (
          <>
            Si no aparece, abre el menú del navegador y busca <strong>Instalar Salvando Vidas</strong> (en Chrome
            está en «Transmitir, guardar y compartir»).
          </>
        ),
      },
    ],
    nota: 'Firefox en computadora no instala apps: ábrela en Chrome o Edge, o guárdala en tus marcadores.',
  },
  'dentro-de-app': {
    titulo: 'Si la abriste desde Facebook, Instagram u otra app',
    pasos: [
      {
        icono: <EllipsisVertical size={20} aria-hidden="true" />,
        texto: (
          <>
            Esa app la abrió en su propio navegador, y desde ahí no se puede guardar. Toca el menú
            (<strong>···</strong> o <strong>⋮</strong>) y elige <strong>Abrir en el navegador</strong>.
          </>
        ),
      },
      {
        icono: <Download size={20} aria-hidden="true" />,
        texto: <>Ya en tu navegador, sigue los pasos de tu teléfono que vienen abajo.</>,
      },
    ],
  },
}

const ORDEN: Exclude<Donde, 'instalada' | 'listo'>[] = ['iphone', 'android', 'computadora', 'mac-safari', 'dentro-de-app']

function Pasos({ cual }: { cual: Exclude<Donde, 'instalada' | 'listo'> }) {
  const { pasos, nota } = PASOS[cual]
  return (
    <>
      <ol className="instalar-pasos">
        {pasos.map((p, i) => (
          <li key={i}>
            <span className="instalar-num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="instalar-paso-icono" aria-hidden="true">
              {p.icono}
            </span>
            <span>{p.texto}</span>
          </li>
        ))}
      </ol>
      {nota && <p className="muted small">{nota}</p>}
    </>
  )
}

export default function Instalar() {
  const donde = useDonde()
  const [copiado, setCopiado] = useState(false)
  const android = /Android/i.test(navigator.userAgent)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="stack instalar-pagina">
      <PageHeader
        title="Instalar la app"
        subtitle="Tenla en tu pantalla de inicio, como cualquier otra app. Es gratis y no pasa por ninguna tienda."
      />

      <ul className="card filas instalar-por-que" aria-label="Por qué tenerla como app">
        <li>
          <span className="instalar-por-que-fila">
            <span className="ico-circulo" aria-hidden="true">
              <Zap size={20} />
            </span>
            <span>
              <strong>Se abre con un toque</strong>
              <small>Sin buscarla en el navegador, justo cuando la necesitas.</small>
            </span>
          </span>
        </li>
        <li>
          <span className="instalar-por-que-fila">
            <span className="ico-circulo" aria-hidden="true">
              <WifiOff size={20} />
            </span>
            <span>
              <strong>Funciona sin internet</strong>
              <small>Respirar, tu diario y la ayuda siguen ahí aunque no tengas datos.</small>
            </span>
          </span>
        </li>
        <li>
          <span className="instalar-por-que-fila">
            <span className="ico-circulo" aria-hidden="true">
              <Lock size={20} />
            </span>
            <span>
              <strong>Lo tuyo sigue siendo tuyo</strong>
              <small>No pide cuenta ni datos. Todo se queda en este teléfono.</small>
            </span>
          </span>
        </li>
      </ul>

      {donde === 'instalada' ? (
        <section className="card instalar-hecho" role="status">
          <h2>
            <Check size={20} strokeWidth={2.5} aria-hidden="true" /> Ya la tienes como app
          </h2>
          <p className="muted">Búscala en tu pantalla de inicio con el ícono del brote.</p>
        </section>
      ) : donde === 'listo' ? (
        <section className="card" aria-labelledby="instalar-aqui">
          <h2 id="instalar-aqui">En este teléfono es un solo paso</h2>
          <p className="muted">Toca el botón y luego «Instalar» en la ventanita que aparece.</p>
          <button type="button" className="btn big" onClick={() => void instalar()}>
            <Download size={20} aria-hidden="true" /> Instalar Salvando Vidas
          </button>
        </section>
      ) : (
        <section className="card" aria-labelledby="instalar-aqui">
          <h2 id="instalar-aqui">{PASOS[donde].titulo}</h2>
          <Pasos cual={donde} />
          {donde === 'dentro-de-app' && (
            <div className="row">
              {android && (
                <a className="btn small" href={enChrome()}>
                  Abrir en Chrome
                </a>
              )}
              <button type="button" className="btn small ghost" onClick={copiar}>
                {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copiado ? 'Enlace copiado' : 'Copiar el enlace'}
              </button>
            </div>
          )}
        </section>
      )}

      <details className="instalar-otros">
        <summary>¿Estás ayudando a alguien con otro teléfono?</summary>
        <div className="stack">
          {ORDEN.filter((c) => c !== donde).map((c) => (
            <section key={c} aria-label={PASOS[c].titulo}>
              <h3>{PASOS[c].titulo}</h3>
              <Pasos cual={c} />
            </section>
          ))}
        </div>
      </details>
    </div>
  )
}
