import { useEffect } from 'react'
import { Pause, Play, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEscucha, useMiniVisible, volverA } from '../lib/escucha'
import './escucha.css'

/** La reflexión que sigue sonando mientras la persona anda en otra pantalla, arriba de las pestañas. */
export default function MiniEscucha() {
  const { pista, sonando, cargando, seguir, pausar, cerrar } = useEscucha()
  const visible = useMiniVisible()

  // La mascota flotante mide de nuevo su espacio para no quedar encima del reproductor.
  useEffect(() => {
    dispatchEvent(new Event('resize'))
  }, [visible])

  if (!visible || !pista) return null

  return (
    <section className="mini-escucha vidrio" aria-label="Reflexión que está sonando">
      <Link to={volverA(pista)} className="mini-escucha-titulo">
        <small>{cargando ? 'Abriendo…' : sonando ? 'Escuchando' : 'En pausa'}</small>
        <strong>{pista.title}</strong>
      </Link>
      <button
        type="button"
        className="mini-escucha-boton principal"
        onClick={sonando ? pausar : seguir}
        aria-label={sonando ? 'Pausar' : 'Seguir escuchando'}
      >
        {sonando ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
      </button>
      <button type="button" className="mini-escucha-boton" onClick={cerrar} aria-label="Dejar de escuchar">
        <X size={20} aria-hidden="true" />
      </button>
    </section>
  )
}
