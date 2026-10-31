import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Aire, Respiracion } from './cuerpo3d/escena'
import { MODELO_3D, prefersStill } from './cuerpo3d/soporte'
import './respirar.css'

// «Respirar por dentro»: en vez del círculo, el pecho en 3D siguiendo la misma respiración. three
// y el modelo se bajan solo al elegir esta vista (y quedan guardados para usarse sin internet). Si
// algo falla, avisa con onFalla y Calma regresa al círculo, que nunca deja de funcionar.

export default function RespirarPorDentro({
  aire,
  paso,
  onFalla,
  children,
}: {
  aire: Aire
  /** Cambia en cada fase, aunque se repita el tipo (para reiniciar el movimiento). */
  paso: string
  onFalla: () => void
  /** Lo que va encima del cuerpo: la fase y los segundos. */
  children?: ReactNode
}) {
  const host = useRef<HTMLDivElement>(null)
  const escena = useRef<Respiracion | null>(null)
  const [listo, setListo] = useState(false)
  // La escena se crea una vez; lo que cambia se le pasa por estas referencias.
  const aireRef = useRef(aire)
  const fallaRef = useRef(onFalla)
  useEffect(() => {
    aireRef.current = aire
    fallaRef.current = onFalla
  })

  useEffect(() => {
    if (!host.current) return
    let vivo = true
    let creada: Respiracion | null = null
    const canvas = document.createElement('canvas')
    canvas.className = 'breath-3d-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.current.prepend(canvas)
    import('./cuerpo3d/escena')
      .then(({ crearRespiracion }) =>
        vivo ? crearRespiracion(canvas, { url: MODELO_3D, still: prefersStill(), onLost: () => vivo && fallaRef.current() }) : null,
      )
      .then((e) => {
        if (!e) return
        creada = e
        if (!vivo) return e.dispose()
        escena.current = e
        e.aire(aireRef.current)
        setListo(true)
      })
      .catch(() => vivo && fallaRef.current())
    return () => {
      vivo = false
      creada?.dispose()
      escena.current = null
      canvas.remove()
    }
  }, [])

  useEffect(() => {
    escena.current?.aire(aire)
    // Solo al cambiar de fase: `aire` es un objeto nuevo en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, listo])

  return (
    <div ref={host} className="breath-3d">
      {!listo && (
        <p className="breath-3d-cargando" role="status">
          Preparando tus pulmones…
        </p>
      )}
      {children}
    </div>
  )
}
