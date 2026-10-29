import type { MissionId } from './barrio'

// La lotería de dichos: cada misión terminada deja su carta, con un dicho conocido y una idea
// en palabras sencillas que lo une con la técnica. Se eligieron dichos que acompañan; se
// dejaron fuera los que regañan o minimizan («al mal tiempo, buena cara», «no hay mal que dure
// cien años»). Los números recuerdan a la lotería de siempre, pero las cartas son del barrio.
// Los textos quedan pendientes de revisión de un psicólogo.

export type LoteriaCard = {
  mission: MissionId
  number: number
  name: string
  saying: string
  /** La idea del dicho, ligada a lo que se practica en la misión. */
  idea: string
}

export const LOTERIA: LoteriaCard[] = [
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
]

export const cardOf = (mission: MissionId) => LOTERIA.find((c) => c.mission === mission)!
