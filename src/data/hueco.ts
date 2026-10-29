import type { CompanionMood } from './companion'

// Salir del hueco: la mascota está en un hueco que se parece a lo que la persona trae hoy, y
// salen un escalón a la vez. Cada escalón es una herramienta de verdad: respirar, ponerle
// nombre a lo que se siente, una razón para seguir y pedir una mano. Nunca se nombra un
// diagnóstico: se habla de «lo que traes hoy». Los textos están pendientes de revisar con un
// psicólogo, como los demás textos clínicos.

export type HoleState = 'animo' | 'nervios' | 'soledad' | 'mezcla'
export type Step = 'respirar' | 'nombrar' | 'razon' | 'mano'

/** Lo que hay dentro del hueco, de 0 a 1 cada cosa. `dark` es cuánta luz falta. */
export type Weather = { rain: number; fog: number; wind: number; thoughts: number; dark: number; echo: number }

export type Sky = 'gris' | 'bruma' | 'noche' | 'alba' | 'dia'

export type Place = {
  id: HoleState
  label: string
  /** La cara de la mascota al empezar a subir. */
  mood: CompanionMood
  sky: Sky
  weather: Weather
  hello: string
  /** Para ponerle nombre a lo que se siente: lo que elija se escribe en su escalón. */
  feelings: string[]
  /** Cómo se ve, para quien usa lector de pantalla. */
  seen: string
}

export const PLACES: Place[] = [
  {
    id: 'animo',
    label: 'Ánimo bajo',
    mood: 'triste',
    sky: 'gris',
    weather: { rain: 1, fog: 0, wind: 0, thoughts: 0, dark: 0.5, echo: 0 },
    hello: 'Hoy todo pesa. No tenemos que salir corriendo: un escalón a la vez, aunque sea chiquito.',
    feelings: ['Tristeza', 'Cansancio', 'Vacío', 'Culpa'],
    seen: 'Llueve y entra poca luz.',
  },
  {
    id: 'nervios',
    label: 'Nervios',
    mood: 'nervios',
    sky: 'bruma',
    weather: { rain: 0, fog: 1, wind: 1, thoughts: 1, dark: 0.3, echo: 0 },
    hello: 'Hay mucho ruido aquí abajo. Primero respiramos, y la niebla baja.',
    feelings: ['Miedo', 'Preocupación', 'Prisa', 'Nervios'],
    seen: 'Hay niebla, viento y pensamientos que dan vueltas.',
  },
  {
    id: 'soledad',
    label: 'Soledad',
    mood: 'apagado',
    sky: 'noche',
    weather: { rain: 0, fog: 0, wind: 0, thoughts: 0, dark: 0.78, echo: 1 },
    hello: 'Aquí abajo se siente muy callado. Vamos a prender una luz para que nos encuentren.',
    feelings: ['Soledad', 'Nadie me entiende', 'Extraño a alguien', 'Vacío'],
    seen: 'Es de noche, está oscuro y solo se oye el eco.',
  },
  {
    id: 'mezcla',
    label: 'Mezcla',
    mood: 'nervios',
    sky: 'gris',
    weather: { rain: 0.8, fog: 0.8, wind: 0.4, thoughts: 1, dark: 0.5, echo: 0 },
    hello: 'Hoy hay lluvia y niebla al mismo tiempo. Las dos se pueden aligerar.',
    feelings: ['Tristeza', 'Miedo', 'Cansancio', 'Preocupación'],
    seen: 'Llueve, hay niebla y pensamientos que dan vueltas.',
  },
]

export const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<HoleState, Place>

export const STEPS: { id: Step; label: string }[] = [
  { id: 'respirar', label: 'Respirar conmigo' },
  { id: 'nombrar', label: 'Ponerle nombre' },
  { id: 'razon', label: 'Una razón' },
  { id: 'mano', label: 'Pedir una mano' },
]

/** Los pensamientos que dan vueltas cuando hay nervios; ponerle nombre a lo que se siente los calla. */
export const THOUGHTS = ['¿y si…?', 'no voy a poder', 'algo malo va a pasar']

/** En un día pesado basta con una respiración; en uno más ligero, tres. Cuentan igual. */
export const BREATHS = { heavy: 1, light: 3 }

export const HEAVY_HINT = 'Hoy con pasos chiquitos basta: cada uno cuenta igual.'
export const RISK_HELLO = 'Antes de trepar, hablemos con alguien. No tienes que hacer esto sin ayuda.'
export const NAME_ASK = '¿Qué traes hoy? Tócalo y se vuelve un escalón.'
export const OUT_SAYS = '¡Salimos! Los escalones se quedan: la próxima vez ya conoces el camino.'

export const namedSays = (feeling: string) => `«${feeling}». Ponerle nombre le baja un poco. Ya es un escalón.`
export const reasonSays = (has: boolean) =>
  has ? 'Esta razón es tuya. Brilla aunque hoy no la sientas.' : 'Hoy la estrella eres tú: aquí sigues, y eso ya cuenta.'
export const handSays = (who: string) => `${who} bajó una cuerda. Nadie tiene que salir de aquí sin ayuda.`

/** Al volver a la pantalla a media subida: lo que construyó sigue ahí. */
export const stillHere = (n: number) =>
  n === 1 ? 'Aquí seguimos: el escalón que hiciste se quedó.' : `Aquí seguimos: los ${n} escalones que hiciste se quedaron.`

/** Lo que cambió al respirar, según lo que había en el hueco. */
export function afterBreath(w: Weather) {
  if (w.rain && w.fog) return 'Bajó la niebla y ya llueve menos. Eso lo hiciste tú.'
  if (w.fog) return 'Mira: la niebla bajó. Eso lo hiciste tú.'
  if (w.rain) return 'Ya llueve menos. Eso lo hiciste tú.'
  return 'Tu respiración se oye. Ya no está tan callado aquí.'
}
