// ¿Se puede mostrar algo en 3D sin trabar el teléfono? No importa three: lo usan las pantallas
// antes de decidir si bajan la escena.

export type Motivo = 'sin-webgl' | 'debil' | 'falla' | 'datos'

/** El cuerpo en 3D pesa unos 0.3 MB y se baja una sola vez. */
export const PESO_3D = 'unos 0.3 MB'

export const MODELO_3D = `${import.meta.env.BASE_URL}models/cuerpo/cuerpo-v1.glb`

export const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** null si se puede; si no, por qué no. */
export function revisar3d(): Motivo | null {
  try {
    const c = document.createElement('canvas')
    // failIfMajorPerformanceCaveat: si solo hay WebGL «por software», mejor quedarse en 2D.
    const gl =
      c.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
      c.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    if (!gl) return 'sin-webgl'
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    return 'sin-webgl'
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  // Si el navegador no lo dice (Safari), se asume que sí alcanza.
  if ((nav.deviceMemory ?? 8) < 3 || (nav.hardwareConcurrency || 8) < 4) return 'debil'
  if (nav.connection?.saveData) return 'datos'
  return null
}
