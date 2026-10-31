// Lo fijo del barrio: misiones, vecinos, rumbos y las cosas que se ganan para la casa.
// Los textos quedan pendientes de revisión de un psicólogo antes del lanzamiento.

export const VALUES = [
  { id: 'familia', label: 'Familia y amistades', street: 'Calle de los Abrazos' },
  { id: 'cuerpo', label: 'Mi cuerpo', street: 'Calle del Sol' },
  { id: 'aprender', label: 'Aprender', street: 'Calle de los Libros' },
  { id: 'comunidad', label: 'Ayudar a otros', street: 'Calle de la Mano' },
  { id: 'disfrutar', label: 'Disfrutar', street: 'Calle de la Fiesta' },
] as const
export type ValueId = (typeof VALUES)[number]['id']

/** La técnica de cada misión, dicha para el psicólogo que revisa (no se le muestra así a la persona). */
export type Technique =
  | 'activacion'
  | 'respiracion'
  | 'anclaje'
  | 'autocuidado'
  | 'exposicion'
  | 'reestructuracion'
  | 'autocompasion'
  | 'bondad'
  | 'hueco'
  /** Una actividad tranquila que ocupa los ojos y las manos (el juego «Hilos sueltos»): un
   * descanso para la cabeza, sin reloj ni puntos. No es una técnica para «resolver» nada. */
  | 'calma'
  /** Practicar con el cuerpo con Don Chema: sentir a propósito, poquito y con cuidado, algo
   * parecido a las sensaciones del pánico (mareo, corazón rápido, falta de aire) para que dejen
   * de asustar. Pasa antes por el filtro de salud y nunca sale con riesgo, de noche ni en un
   * día pesado. Pendiente de revisar con un psicólogo y un médico. */
  | 'exposicion-interoceptiva'
  /** Derreflexión (Viktor Frankl): llevar la atención hacia afuera, a algo o a alguien más,
   * en vez de darle vueltas a uno mismo. Aquí, ayudar a Don Fermín a recordar su receta. No se
   * ofrece con señales de riesgo. Pendiente de revisión con psicóloga. Fuente: Frankl, «Teoría
   * y terapia de las neurosis» (Herder) y «El hombre en busca de sentido» (Herder). */
  | 'derreflexion'

export const MISSIONS = [
  { id: 'mandado', npc: 'tere', title: 'Un mandado de verdad', technique: 'activacion', values: ['disfrutar', 'cuerpo', 'familia'], small: true, real: true, reward: 'papel' },
  { id: 'kiosco', npc: 'chema', title: 'Prender el kiosco', technique: 'respiracion', values: ['cuerpo'], small: true, real: false, reward: 'foquitos' },
  { id: 'cinco', npc: 'nico', title: 'Cinco cosas en la plaza', technique: 'anclaje', values: ['disfrutar'], small: true, real: false, reward: 'maceta' },
  { id: 'agua', npc: 'lupe', title: 'Un vaso de agua', technique: 'autocuidado', values: ['cuerpo'], small: true, real: true, reward: 'jarra' },
  { id: 'mercado', npc: 'beto', title: 'La ruta del mercado', technique: 'exposicion', values: ['comunidad', 'aprender'], small: false, real: true, reward: 'talavera' },
  { id: 'taller', npc: 'ramiro', title: 'El taller del carpintero', technique: 'reestructuracion', values: ['aprender'], small: false, real: false, reward: 'banquito' },
  { id: 'banca', npc: 'rosa', title: 'La banca de la plaza', technique: 'autocompasion', values: ['familia'], small: true, real: false, reward: 'cojin' },
  { id: 'carta', npc: 'memo', title: 'Una carta de bondad', technique: 'bondad', values: ['comunidad', 'familia'], small: true, real: false, reward: 'jarro' },
  { id: 'hueco', npc: 'lumi', title: 'Salir del hueco', technique: 'hueco', values: ['cuerpo', 'familia'], small: false, real: false, reward: 'cuerda' },
  { id: 'desenredar', npc: 'chayo', title: 'Desenredar', technique: 'calma', values: ['disfrutar'], small: true, real: false, reward: 'rebozo' },
  { id: 'practicar', npc: 'chema', title: 'Practicar en el kiosco', technique: 'exposicion-interoceptiva', values: ['cuerpo'], small: false, real: false, reward: 'trompo' },
  { id: 'receta', npc: 'fermin', title: 'La receta de Don Fermín', technique: 'derreflexion', values: ['comunidad', 'disfrutar'], small: true, real: false, reward: 'canasta' },
] as const satisfies readonly {
  id: string
  npc: string
  title: string
  technique: Technique
  values: readonly ValueId[]
  /** Cabe en un día pesado. */
  small: boolean
  /** Se hace fuera del teléfono: «Ya lo hice» o «Hoy no». */
  real: boolean
  reward: string
}[]
export type MissionId = (typeof MISSIONS)[number]['id']
export const missionById = (id: MissionId) => MISSIONS.find((m) => m.id === id)!

/** Los vecinos son personajes escritos, no personas ni un chat. */
export const NEIGHBORS = [
  { id: 'tere', name: 'Tere', role: 'la de la tiendita' },
  { id: 'chema', name: 'Don Chema', role: 'el del kiosco' },
  { id: 'nico', name: 'Nico', role: 'el niño de la plaza' },
  { id: 'lupe', name: 'Doña Lupe', role: 'la de las aguas frescas' },
  { id: 'beto', name: 'Don Beto', role: 'el marchante del mercado' },
  { id: 'ramiro', name: 'Don Ramiro', role: 'el carpintero' },
  { id: 'rosa', name: 'Rosa', role: 'la vecina de la banca' },
  { id: 'memo', name: 'Memo', role: 'el cartero' },
  { id: 'chayo', name: 'Doña Chayo', role: 'la tejedora del mercado' },
  { id: 'fermin', name: 'Don Fermín', role: 'el panadero' },
] as const
export type NeighborId = (typeof NEIGHBORS)[number]['id']

/**
 * Las cosas para la casa. `from`: de qué misión salen, de qué momento del álbum (las que ya
 * se ganaban en Salir del hueco) o de una temporada. Nada se compra.
 */
export const ITEMS = [
  { id: 'petate', label: 'Petate', from: { always: true } },
  { id: 'cuerda', label: 'Cuerda tejida', from: { moment: 'hueco' } },
  { id: 'faro', label: 'Faro chiquito', from: { moment: 'faro' } },
  { id: 'farol', label: 'Farol de papel', from: { moment: 'faroles' } },
  { id: 'papel', label: 'Papel picado', from: { mission: 'mandado' } },
  { id: 'foquitos', label: 'Foquitos', from: { mission: 'kiosco' } },
  { id: 'maceta', label: 'Maceta de cempasúchil', from: { mission: 'cinco' } },
  { id: 'jarra', label: 'Jarra de jamaica', from: { mission: 'agua' } },
  { id: 'talavera', label: 'Plato de talavera', from: { mission: 'mercado' } },
  { id: 'banquito', label: 'Banquito de madera', from: { mission: 'taller' } },
  { id: 'cojin', label: 'Cojín bordado', from: { mission: 'banca' } },
  { id: 'jarro', label: 'Jarro de barro', from: { mission: 'carta' } },
  { id: 'rebozo', label: 'Rebozo', from: { mission: 'desenredar' } },
  { id: 'trompo', label: 'Trompo', from: { mission: 'practicar' } },
  { id: 'canasta', label: 'Canasta de pan dulce', from: { mission: 'receta' } },
  { id: 'bugambilia', label: 'Bugambilia', from: { values: 1 } },
  { id: 'nopal', label: 'Nopal en maceta', from: { values: 3 } },
  { id: 'comal', label: 'Comal', from: { missions: 4 } },
  { id: 'nacimiento', label: 'Nacimiento chiquito', from: { season: 'posadas' } },
  { id: 'pinata', label: 'Piñata de estrella', from: { season: 'posadas' } },
  { id: 'banderitas', label: 'Banderitas', from: { season: 'patrias' } },
  { id: 'ofrenda', label: 'Ofrenda', from: { season: 'muertos' } },
  { id: 'paraguas', label: 'Paraguas', from: { season: 'lluvias' } },
] as const
export type ItemId = (typeof ITEMS)[number]['id']

export const FACADES = [
  ['#e46a8f', 'rosa mexicano'],
  ['#4c6fb5', 'añil'],
  ['#f2c14e', 'amarillo'],
  ['#6fae7d', 'verde'],
  ['#c8714a', 'terracota'],
  ['#f3efe6', 'cal'],
] as const

export const WALLS = [
  ['', 'como está'],
  ['#f6d9d0', 'rosa'],
  ['#dbe8dc', 'menta'],
  ['#dfe3f1', 'cielo'],
  ['#f3e3b5', 'maíz'],
] as const

export const FLOORS = [
  ['', 'loseta'],
  ['#c98f63', 'barro'],
  ['#b9a58a', 'madera'],
  ['#9fb3a3', 'mosaico'],
] as const

export const VIEWS = [
  ['cerro', 'El cerro'],
  ['mar', 'El mar'],
  ['ciudad', 'La ciudad'],
  ['milpa', 'La milpa'],
] as const
