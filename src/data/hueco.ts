import type { CompanionMood } from './companion'

// Salir del hueco: la mascota está en un lugar que se parece a lo que la persona trae hoy, y
// salen adelante un paso a la vez. Con el ánimo bajo es un hueco del que se sube; con nervios,
// la niebla que se cruza en lancha hasta el faro; con soledad, una calle de pueblo cuyos
// faroles se prenden uno por uno hasta que se arma la verbena. Cada paso es una herramienta de
// verdad: respirar, ponerle nombre a lo que se siente (o acomodar los «¿y si…?», o acordarse de
// alguien), una razón para seguir y pedir una mano. Nunca se nombra un diagnóstico: se habla de
// «lo que traes hoy». Los textos están pendientes de revisar con un psicólogo, como los demás
// textos clínicos.

export type HoleState = 'animo' | 'nervios' | 'soledad' | 'mezcla'
export type Step = 'respirar' | 'nombrar' | 'razon' | 'mano'
/** El lugar que se dibuja. Cada uno tiene su camino y sus palabras, con los mismos cuatro pasos. */
export type SceneId = 'hueco' | 'faro' | 'faroles'

/** Lo que hay en el lugar, de 0 a 1 cada cosa. `dark` es cuánta luz falta. */
export type Weather = { rain: number; fog: number; wind: number; thoughts: number; dark: number; echo: number }

export type Sky = 'gris' | 'bruma' | 'noche' | 'alba' | 'dia'

export type Place = {
  id: HoleState
  label: string
  scene: SceneId
  /** La cara de la mascota al empezar. */
  mood: CompanionMood
  sky: Sky
  weather: Weather
  hello: string
  /** Para ponerle nombre a lo que se siente, en el hueco: lo que elija se escribe en su escalón. */
  feelings?: string[]
  /** Cómo se ve, para quien usa lector de pantalla. */
  seen: string
}

export const PLACES: Place[] = [
  {
    id: 'animo',
    label: 'Ánimo bajo',
    scene: 'hueco',
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
    scene: 'faro',
    mood: 'nervios',
    sky: 'bruma',
    weather: { rain: 0, fog: 1, wind: 0.6, thoughts: 1, dark: 0.3, echo: 0 },
    hello: 'Hay mucha niebla y los «¿y si…?» no paran. Primero respiramos: con calma, poco a poco se ve el faro.',
    seen: 'Hay niebla sobre el mar y pensamientos que dan vueltas. A lo lejos, el faro está apagado.',
  },
  {
    id: 'soledad',
    label: 'Soledad',
    scene: 'faroles',
    mood: 'apagado',
    sky: 'noche',
    weather: { rain: 0, fog: 0, wind: 0, thoughts: 0, dark: 0.78, echo: 1 },
    hello: 'Esta calle está muy callada. Vamos a prender los faroles, uno por uno: con cada luz llega alguien.',
    seen: 'Es de noche en una calle de pueblo, con los faroles apagados y nadie afuera. Solo se oye el eco.',
  },
  {
    id: 'mezcla',
    label: 'Mezcla',
    scene: 'hueco',
    mood: 'nervios',
    sky: 'gris',
    weather: { rain: 0.8, fog: 0.8, wind: 0.4, thoughts: 1, dark: 0.5, echo: 0 },
    hello: 'Hoy hay lluvia y niebla al mismo tiempo. Las dos se pueden aligerar.',
    feelings: ['Tristeza', 'Miedo', 'Cansancio', 'Preocupación'],
    seen: 'Llueve, hay niebla y pensamientos que dan vueltas.',
  },
]

export const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<HoleState, Place>

export const STEP_ORDER: Step[] = ['respirar', 'nombrar', 'razon', 'mano']

/** Lo que cambia de un lugar a otro: cómo se llama cada paso y lo que dice la mascota. */
export type Scene = {
  id: SceneId
  steps: Record<Step, string>
  /** Para el pie: dónde van al empezar, qué se cuenta y a dónde llegan. */
  start: string
  unit: string
  end: string
  riskHello: string
  riskHint: string
  outSays: string
  /** Lo que gana su rincón la primera vez que llegan. */
  keepsake: string
  stillHere: (n: number) => string
  handSays: (who: string) => string
  reasonSays: (has: boolean) => string
  /** Lo que cambió al respirar; en el hueco depende del clima. */
  afterBreath: (w: Weather) => string
}

export const SCENES: Record<SceneId, Scene> = {
  hueco: {
    id: 'hueco',
    steps: { respirar: 'Respirar conmigo', nombrar: 'Ponerle nombre', razon: 'Una razón', mano: 'Pedir una mano' },
    start: 'En el fondo',
    unit: 'escalones',
    end: 'Afuera',
    riskHello: 'Antes de trepar, hablemos con alguien. No tienes que hacer esto sin ayuda.',
    riskHint: 'La cuerda ya está aquí. Cuando quieras, también respiro contigo.',
    outSays: '¡Salimos! Los escalones se quedan: la próxima vez ya conoces el camino.',
    keepsake: 'una cuerda tejida',
    stillHere: (n) =>
      n === 1 ? 'Aquí seguimos: el escalón que hiciste se quedó.' : `Aquí seguimos: los ${n} escalones que hiciste se quedaron.`,
    handSays: (who) => `${who} bajó una cuerda. Nadie tiene que salir de aquí sin ayuda.`,
    reasonSays: (has) =>
      has ? 'Esta razón es tuya. Brilla aunque hoy no la sientas.' : 'Hoy la estrella eres tú: aquí sigues, y eso ya cuenta.',
    afterBreath: (w) =>
      w.rain && w.fog
        ? 'Bajó la niebla y ya llueve menos. Eso lo hiciste tú.'
        : w.fog
          ? 'Mira: la niebla bajó. Eso lo hiciste tú.'
          : w.rain
            ? 'Ya llueve menos. Eso lo hiciste tú.'
            : 'Tu respiración se oye. Ya no está tan callado aquí.',
  },
  faro: {
    id: 'faro',
    steps: { respirar: 'Respirar conmigo', nombrar: 'Acomodar los «¿y si…?»', razon: 'Una razón', mano: 'Pedir una mano' },
    start: 'En la niebla',
    unit: 'tramos',
    end: 'En el faro',
    riskHello: 'Antes de remar, hablemos con alguien. No tienes que hacer esto sin ayuda.',
    riskHint: 'La cuerda del muelle ya está aquí. Cuando quieras, también respiro contigo.',
    outSays: '¡Llegamos al faro! La niebla se fue y el faro se queda prendido: la próxima vez ya sabes hacia dónde ir.',
    keepsake: 'un faro chiquito',
    stillHere: (n) =>
      n === 1 ? 'Aquí seguimos: el tramo que avanzamos se quedó.' : `Aquí seguimos: los ${n} tramos que avanzamos se quedaron.`,
    handSays: (who) => `${who} te lanzó una cuerda desde el muelle. Nadie tiene que cruzar la niebla sin ayuda.`,
    reasonSays: (has) =>
      has ? 'Tu razón prendió el faro. Alumbra aunque hoy no la sientas.' : 'Hoy el faro lo prendes tú: aquí sigues, y eso ya cuenta.',
    afterBreath: () => 'Mira: la niebla bajó y ya se ve el faro. Eso lo hiciste tú.',
  },
  faroles: {
    id: 'faroles',
    steps: { respirar: 'Respirar conmigo', nombrar: 'Acordarte de alguien', razon: 'Una razón', mano: 'Pedir compañía' },
    start: 'En la calle oscura',
    unit: 'faroles',
    end: 'En la verbena',
    riskHello: 'Antes de prender los faroles, hablemos con alguien. No tienes que hacer esto sin ayuda.',
    riskHint: 'Alguien ya viene con su farol. Cuando quieras, también respiro contigo.',
    outSays: '¡Se armó la verbena! Los faroles se quedan prendidos: la próxima vez ya sabes cómo llenar la calle de gente.',
    keepsake: 'un farol de papel',
    stillHere: (n) =>
      n === 1
        ? 'Aquí seguimos: el farol que prendiste sigue prendido.'
        : `Aquí seguimos: los ${n} faroles que prendiste siguen prendidos.`,
    handSays: (who) => `${who} viene en camino con su farol. Nadie tiene que pasar la noche sin compañía.`,
    reasonSays: (has) =>
      has ? 'Tu razón prendió un farol. Alumbra aunque hoy no la sientas.' : 'Este farol es por ti: aquí sigues, y eso ya cuenta.',
    afterBreath: () => 'Tu respiración prendió un farol. Eso lo hiciste tú.',
  },
}

/** Los pensamientos que dan vueltas en el hueco cuando hay nervios; ponerle nombre a lo que se siente los calla. */
export const THOUGHTS = ['¿y si…?', 'no voy a poder', 'algo malo va a pasar']

/** En un día pesado basta con una respiración; en uno más ligero, tres. Cuentan igual. */
export const BREATHS = { heavy: 1, light: 3 }

export const HEAVY_HINT = 'Hoy con pasos chiquitos basta: cada uno cuenta igual.'
export const NAME_ASK = '¿Qué traes hoy? Tócalo y se vuelve un escalón.'

export const namedSays = (feeling: string) => `«${feeling}». Ponerle nombre le baja un poco. Ya es un escalón.`

// En el faro, los «¿y si…?» se acomodan en dos frascos: lo que sí depende de la persona y lo
// que no. Ella decide en cuál va cada uno; no hay respuesta equivocada.
export const WORRIES = [
  '¿Y si me sale mal?',
  '¿Y si no puedo con todo?',
  '¿Y si le pasa algo a alguien que quiero?',
  '¿Y si piensan mal de mí?',
  '¿Y si me vuelve a pasar?',
  '¿Y si no me alcanza?',
]
/** Para el «¿y si…?» que no está en la lista: se acomoda sin tener que escribirlo. */
export const OWN_WORRY = 'Uno mío, que no está aquí'
export const WORRY_ASK = '¿Qué «¿y si…?» te está dando vueltas? Tócalo.'
export const jarAsk = (worry: string) =>
  worry === OWN_WORRY ? 'Piensa en el tuyo, sin decirlo. ¿Algo de eso depende de ti?' : `«${worry}» ¿Algo de esto depende de ti?`
export const JAR_MINE = 'Sí, algo puedo hacer'
export const JAR_NOT_MINE = 'No depende de mí'
export const sortedSays = (mine: boolean) =>
  mine
    ? 'Va al frasco de lo que sí depende de ti. No tienes que resolverlo hoy: con un pasito chiquito basta.'
    : 'Va al frasco de lo que no depende de ti. Ahí se queda: no tienes que cargarlo ahorita.'

// En los faroles, el segundo farol se prende acordándose de alguien: una de sus personas o
// alguien más, sin tener que escribir su nombre.
export const REMEMBER_ASK = '¿De quién te acuerdas con cariño? Tócalo y prendemos su farol.'
export const REMEMBER: { id: string; label: string; tag: string; says: string }[] = [
  {
    id: 'familia',
    label: 'Alguien de mi familia',
    tag: 'mi familia',
    says: 'Prendimos un farol por tu familia. Acordarte de alguien también es compañía.',
  },
  {
    id: 'amistad',
    label: 'Una amistad',
    tag: 'una amistad',
    says: 'Prendimos un farol por esa amistad. Acordarte de alguien también es compañía.',
  },
  {
    id: 'ya-no-esta',
    label: 'Alguien que ya no está',
    tag: 'quien ya no está',
    says: 'Este farol es para quien ya no está. Su cariño sigue alumbrando aquí.',
  },
  {
    id: 'alguien',
    label: 'Alguien más',
    tag: 'alguien',
    says: 'Prendimos un farol por esa persona. Acordarte de alguien también es compañía.',
  },
]
export const rememberSays = (name: string) => `Prendimos un farol por ${name}. Acordarte de alguien también es compañía.`
/** El mensaje para alguien de quien se acordó: ligero, sin tener que explicar nada. */
export const MISS_YOU = 'Me acordé de ti. ¿Cómo estás?'
