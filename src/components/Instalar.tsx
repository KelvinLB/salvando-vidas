import { useState } from 'react'
import { Check, Download, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { instalar, recienInstalo, useDonde } from '../lib/instalar'
import { today, useStored } from '../lib/storage'
import './instalar.css'

const DIAS_DE_ESPERA = 14

function diasDesde(fecha: string) {
  return (Date.parse(today()) - Date.parse(fecha)) / 86_400_000
}

/** La invitación a tenerla como app, en Inicio: sola, sin tapar nada, y se puede dejar para después. */
export default function InvitarInstalar() {
  const donde = useDonde()
  const [despues, setDespues] = useStored<{ fecha: string; veces: number } | null>('instalar-despues', null)
  const [abriendo, setAbriendo] = useState(false)

  if (donde === 'instalada') {
    // Justo al instalarla, un «listo»; después ya no se vuelve a mostrar.
    return recienInstalo() ? (
      <p className="instalar-listo" role="status">
        <Check size={18} strokeWidth={2.5} aria-hidden="true" /> Listo: ya la tienes en tu pantalla de inicio.
      </p>
    ) : null
  }
  // Si ya dijo «ahora no» dos veces, se queda solo en Mi espacio; si fue una, se espera un poco.
  if (despues && (despues.veces >= 2 || diasDesde(despues.fecha) < DIAS_DE_ESPERA)) return null

  const ahoraNo = () => setDespues({ fecha: today(), veces: (despues?.veces ?? 0) + 1 })

  return (
    <section className="card instalar-tarjeta" aria-labelledby="instalar-titulo">
      <button type="button" className="icon-btn instalar-cerrar" onClick={ahoraNo} aria-label="Ahora no">
        <X size={20} aria-hidden="true" />
      </button>
      <span className="instalar-icono" aria-hidden="true">
        <img src="/logo.svg" alt="" width={40} height={40} />
      </span>
      <div className="instalar-texto">
        <h2 id="instalar-titulo">Tenla como app</h2>
        <p className="muted">
          {donde === 'dentro-de-app'
            ? 'Estás dentro de otra app. Ábrela en tu navegador para guardarla en tu pantalla.'
            : 'Se abre con un toque, funciona sin internet y casi no ocupa espacio. Lo tuyo se sigue quedando aquí.'}
        </p>
        <div className="row">
          {donde === 'listo' ? (
            <button
              type="button"
              className="btn small"
              disabled={abriendo}
              onClick={async () => {
                setAbriendo(true)
                await instalar()
                setAbriendo(false)
              }}
            >
              <Download size={16} aria-hidden="true" /> Instalar
            </button>
          ) : (
            <Link to="/instalar" className="btn small">
              {donde === 'dentro-de-app' ? 'Cómo abrirla' : 'Ver cómo'}
            </Link>
          )}
          <button type="button" className="btn small ghost" onClick={ahoraNo}>
            Ahora no
          </button>
        </div>
      </div>
    </section>
  )
}
