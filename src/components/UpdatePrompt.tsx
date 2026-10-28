import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="toast" role="status">
      <span>
        {needRefresh
          ? 'Hay una versión nueva de la app.'
          : 'Listo: la app ya funciona sin internet.'}
      </span>
      {needRefresh && (
        <button className="btn small" onClick={() => updateServiceWorker(true)}>
          Actualizar
        </button>
      )}
      <button
        className="btn small ghost"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
      >
        Cerrar
      </button>
    </div>
  )
}
