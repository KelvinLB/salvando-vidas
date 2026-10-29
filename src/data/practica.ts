// «Practicar con el cuerpo»: ejercicios cortos que provocan a propósito, poco a poco y con
// cuidado, sensaciones parecidas a las del pánico (exposición interoceptiva), para que dejen de
// dar miedo. Antes del primero hay un filtro de salud: con cualquier «sí», no se ofrece ninguno
// y se invita a platicarlo con el médico. Pendiente de revisar con un psicólogo y un médico.

export type HealthId =
  | 'embarazo'
  | 'respiratoria'
  | 'corazon'
  | 'epilepsia'
  | 'presion'
  | 'desmayos'
  | 'cuello'
  | 'mareos'
  | 'otra'

export const HEALTH_QUESTIONS: { id: HealthId; label: string }[] = [
  { id: 'embarazo', label: 'Embarazo, o que pueda haberlo' },
  { id: 'respiratoria', label: 'Asma u otra enfermedad de los pulmones o la respiración' },
  { id: 'corazon', label: 'Algún problema del corazón' },
  { id: 'epilepsia', label: 'Epilepsia o convulsiones' },
  { id: 'presion', label: 'Presión alta' },
  { id: 'desmayos', label: 'Desmayos (te has desmayado antes)' },
  { id: 'cuello', label: 'Lesiones o dolor fuerte de cuello o espalda' },
  { id: 'mareos', label: 'Mareos o vértigo por otra causa, como el oído' },
  { id: 'otra', label: 'Tu médico te pidió no hacer esfuerzo por alguna razón' },
]

export type ExerciseId = 'cabeza' | 'aguantar' | 'correr' | 'popote' | 'girar'

export type Exercise = {
  id: ExerciseId
  name: string
  /** Cuánto dura, en segundos. El anillo lo muestra; no es una carrera. */
  seconds: number
  /** Lo que suele provocar, dicho como sensación del pánico. */
  feels: string
  how: string[]
  /** Lo que dice la mascota mientras dura. */
  during: string
  /** Un cuidado de ese ejercicio en particular. */
  care?: string
}

/** Del más suave al más intenso: se sugiere empezar por el primero. */
export const EXERCISES: Exercise[] = [
  {
    id: 'cabeza',
    name: 'Mover la cabeza de lado a lado',
    seconds: 30,
    feels: 'un mareo leve',
    how: [
      'Siéntate en una silla firme.',
      'Con los ojos abiertos, mueve la cabeza de lado a lado, como diciendo que no, a un ritmo cómodo.',
    ],
    during: 'Deja que llegue el mareo. Es tu cuerpo, nada más.',
    care: 'Al terminar, quédate un momento en la silla antes de pararte.',
  },
  {
    id: 'aguantar',
    name: 'Aguantar la respiración',
    seconds: 30,
    feels: 'la sensación de que falta el aire',
    how: [
      'Siéntate en un lugar cómodo.',
      'Toma aire normal, sin llenarte de más, y aguántalo.',
      'Si necesitas respirar antes, respira: no es una prueba.',
    ],
    during: 'Nota las ganas de respirar. Son incómodas, y vas a poder soltarlas.',
  },
  {
    id: 'correr',
    name: 'Correr en tu lugar',
    seconds: 60,
    feels: 'el corazón rápido y calor',
    how: [
      'Ponte de pie en un lugar despejado.',
      'Corre en tu lugar, subiendo un poco las rodillas, a un ritmo que puedas sostener.',
    ],
    during: 'El corazón se acelera porque te estás moviendo. Igual que en el pánico, y no pasa nada.',
  },
  {
    id: 'popote',
    name: 'Respirar por un popote',
    seconds: 60,
    feels: 'la sensación de que no entra suficiente aire',
    how: [
      'Siéntate y ponte un popote delgado en la boca.',
      'Respira solo por el popote; si puedes, tápate la nariz.',
      'Si no tienes popote, respira por la boca con los labios casi cerrados.',
    ],
    during: 'Entra aire, aunque se sienta que no. Sigue a tu ritmo.',
  },
  {
    id: 'girar',
    name: 'Girar despacio de pie',
    seconds: 30,
    feels: 'mareo y que todo se mueve',
    how: [
      'Ponte de pie junto a una pared o un mueble firme, sin nada con qué tropezar.',
      'Da vueltas despacio en tu lugar. Si te mareas mucho, detente y apóyate.',
    ],
    during: 'Todo da vueltas porque tú diste vueltas. Ya va a quedarse quieto.',
    care: 'Al terminar, siéntate un momento antes de caminar.',
  },
]

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id)

/** ¿Se pareció a su pánico? Se pregunta al terminar. */
export const ALIKE = [
  { id: 'mucho', label: 'Sí, mucho' },
  { id: 'poco', label: 'Un poco' },
  { id: 'nada', label: 'No se pareció' },
] as const
export type Alike = (typeof ALIKE)[number]['id']

/** Lo que vale para todos, antes de empezar. */
export const SAFETY = [
  'Hazlo en un lugar seguro y despejado, con algo firme cerca para apoyarte.',
  'Para si sientes dolor en el pecho, si de verdad no puedes respirar o si algo se siente distinto a tu pánico de siempre.',
  'Si un día te sientes mal del cuerpo, hoy no. Otro día.',
]
