// Claro u oscuro: la persona lo elige en Ajustes («Automático» sigue al teléfono). El script de
// index.html pone en <html> el tema que toca (data-tema="claro" | "oscuro") antes de pintar, y lo
// vuelve a poner cuando cambia el ajuste o el del teléfono. Aquí se lee ese mismo atributo, para
// que lo que se dibuja con código siga al tema elegido y no solo al del teléfono.

export type Tema = 'auto' | 'claro' | 'oscuro'

/** Dónde se guarda la preferencia (con el prefijo sv: de storage.ts, como lo lee index.html). */
export const TEMA_KEY = 'tema'

export const TEMAS: { value: Tema; label: string }[] = [
  { value: 'auto', label: 'Automático' },
  { value: 'claro', label: 'Claro' },
  { value: 'oscuro', label: 'Oscuro' },
]

/** Avisa cada vez que la app cambia de claro a oscuro o al revés; devuelve cómo dejar de escuchar. */
export function alCambiarTema(listener: () => void) {
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
  return () => observer.disconnect()
}
