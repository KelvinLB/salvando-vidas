import type { MissionId } from './barrio'
import { type PathId, SENSE_CARDS } from './sentido'

// La lotería de dichos: cada misión terminada deja su carta, con un dicho conocido y una idea
// en palabras sencillas que lo une con la técnica. Se eligieron dichos que acompañan; se
// dejaron fuera los que regañan o minimizan («al mal tiempo, buena cara», «no hay mal que dure
// cien años»). Los números recuerdan a la lotería de siempre, pero las cartas son del barrio.
// Los textos quedan pendientes de revisión de un psicólogo.

type CardText = {
  number: number
  name: string
  saying: string
  /** La idea del dicho, ligada a lo que se practica en la misión (o en el camino). */
  idea: string
}

/** La carta que deja una misión del barrio. */
export type MissionCard = CardText & { mission: MissionId }
/** La carta de uno de los tres caminos de «Lo que no sale» (61 a 63): sale al contestarlo una vez. */
export type PathCard = CardText & { path: PathId }
export type LoteriaCard = MissionCard | PathCard

export const isPathCard = (card: LoteriaCard): card is PathCard => 'path' in card

export const LOTERIA: MissionCard[] = [
  {
    mission: 'mandado',
    number: 1,
    name: 'La Tiendita',
    saying: 'Poco a poco se anda lejos.',
    idea: 'Los pasos chiquitos también cuentan: hacer algo, aunque sea poquito, ayuda a mover el ánimo.',
  },
  {
    mission: 'kiosco',
    number: 2,
    name: 'El Kiosco',
    saying: 'Vísteme despacio, que tengo prisa.',
    idea: 'Ir más lento y respirar hondo le avisa al cuerpo que puede calmarse.',
  },
  {
    mission: 'mercado',
    number: 7,
    name: 'La Escalera',
    saying: 'Más vale paso que dure y no trote que canse.',
    idea: 'Subir un escalón a la vez, sin forzarte, hace que lo que da miedo se vuelva más llevadero con la práctica.',
  },
  {
    mission: 'taller',
    number: 12,
    name: 'El Taller',
    saying: 'Las apariencias engañan.',
    idea: 'Lo que la mente te dice no siempre es como pasó: vale la pena revisarlo, como se revisa una tabla antes de usarla.',
  },
  {
    mission: 'cinco',
    number: 20,
    name: 'El Pájaro',
    saying: 'Más vale pájaro en mano que cien volando.',
    idea: 'Fijarte en lo que tienes cerca, aquí y ahora, te ayuda a aterrizar cuando la mente se va volando.',
  },
  {
    mission: 'carta',
    number: 21,
    name: 'La Carta',
    saying: 'Haz el bien sin mirar a quién.',
    idea: 'Un gesto amable, aunque sea chiquito, también le hace bien a quien lo da.',
  },
  {
    mission: 'banca',
    number: 27,
    name: 'La Banca',
    saying: 'Al mejor cazador se le va la liebre.',
    idea: 'Equivocarse le pasa a todo el mundo: hablarte con cariño, como a alguien que quieres, ayuda más que regañarte.',
  },
  {
    mission: 'hueco',
    number: 35,
    name: 'La Cuerda',
    saying: 'Más ven cuatro ojos que dos.',
    idea: 'Pedir una mano no es debilidad: con alguien más, la salida se ve más fácil.',
  },
  {
    mission: 'agua',
    number: 44,
    name: 'El Cantarito',
    saying: 'Gota a gota se llena el cántaro.',
    idea: 'Lo básico (un vaso de agua, comer algo, descansar) se junta poquito a poquito, y también cuida cómo te sientes.',
  },
  {
    mission: 'desenredar',
    number: 48,
    name: 'El Rebozo',
    saying: 'Más vale maña que fuerza.',
    idea: 'Los hilos no se desenredan a jalones: con calma y una pieza a la vez. Algo tranquilo para los ojos y las manos también le da un respiro a la cabeza.',
  },
  {
    mission: 'practicar',
    number: 30,
    name: 'El Trompo',
    saying: 'No es tan fiero el león como lo pintan.',
    idea: 'El mareo, el corazón rápido o la falta de aire asustan mucho. Sentirlos a propósito, poquito y con cuidado, le enseña al cuerpo que son incómodos y que se van solos.',
  },
  // Pendiente de revisión con psicóloga. Fuente: la derreflexión de Frankl («Teoría y terapia
  // de las neurosis», Herder): poner la atención en algo o alguien afuera de uno.
  {
    mission: 'receta',
    number: 52,
    name: 'La Concha',
    saying: 'Hoy por ti, mañana por mí.',
    idea: 'Echarle la mano a alguien, aunque sea con algo chiquito, saca a la cabeza de sus vueltas por un rato: la atención se va hacia afuera, y a veces ahí aparece un poquito de sentido.',
  },
]

export const cardOf = (mission: MissionId) => LOTERIA.find((c) => c.mission === mission)!

// Las cartas de «Lo que no sale»: una por cada camino al sentido de Frankl (lo que haces, lo que
// recibes y cómo te paras ante lo que no puedes cambiar). El número y el nombre vienen de
// SENSE_CARDS; aquí van su dicho y su idea. Entran a la lotería cuando la persona contesta ese
// camino al menos una vez (pathsAnswered en src/lib/sentido.ts; «hoy no» no cuenta) y no se
// vuelven a ir. Se eligieron dichos que acompañan, sin «échale ganas».
// Pendiente de revisión con psicóloga. Fuente: Frankl, «El hombre en busca de sentido» (Herder).
const PATH_SAYINGS: Record<PathId, Pick<CardText, 'saying' | 'idea'>> = {
  hacer: {
    saying: 'Obras son amores.',
    idea: 'Uno de los caminos al sentido es lo que haces o le das a alguien. No tiene que ser grande: regar una planta o mandar un mensaje, hecho a tu manera, también cuenta.',
  },
  recibir: {
    saying: 'A nadie le amarga un dulce.',
    idea: 'Otro camino es lo que recibes: un sabor, una voz, una canción. No hay que ganárselo; basta con notarlo, aunque dure un segundo y aunque no se haya sentido bonito.',
  },
  postura: {
    saying: 'Cada quien sabe dónde le aprieta el zapato.',
    idea: 'El tercer camino es cómo estás ante lo que no puedes cambiar. No se trata de estar bien: aguantar, pedir ayuda o tratarte con paciencia también es una forma de estar, y solo tú sabes cuánto pesa.',
  },
}

export const PATH_CARDS: PathCard[] = SENSE_CARDS.map((c) => ({ path: c.path, number: c.number, name: c.name, ...PATH_SAYINGS[c.path] }))

export const pathCardOf = (path: PathId) => PATH_CARDS.find((c) => c.path === path)!
