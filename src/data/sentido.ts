// «Lo que no sale»: para cuando se necesita llorar y no se puede, o todo se siente sin
// sentido. Primero da permiso (no hay que forzar nada) y luego ofrece pasos chiquitos:
// ponerle palabras, guardar un momento, una carta con una sola pregunta y lo que importa.
//
// Fuentes (detalle en el README):
// - «Sentimiento de falta de sentimiento» o anestesia afectiva (psiquiatria.com, glosario).
// - Los tres caminos al sentido de Viktor Frankl: lo que haces, lo que recibes y la postura
//   ante lo que no se puede cambiar (El hombre en busca de sentido, Herder).
// - Ponerle nombre a lo que se siente baja su intensidad (Lieberman y colegas, 2007).
// - Saborear lo pequeño (Positive Affect Treatment, Craske y colegas, 2019).
// Pendiente de revisión con psicóloga.

/** Palabras finas para lo que no se nombra fácil. Se eligen hasta tres; nadie las interpreta. */
export const WORDS = [
  { id: 'pausa', label: 'En pausa' },
  { id: 'vacio', label: 'Un vacío' },
  { id: 'vidrio', label: 'Como tras un vidrio' },
  { id: 'lejos', label: 'Lejos de todo' },
  { id: 'nudo', label: 'Un nudo' },
  { id: 'cansancio', label: 'Cansancio de sentir' },
  { id: 'sin-lagrimas', label: 'Ganas de llorar sin lágrimas' },
  { id: 'nada', label: 'Nada' },
  { id: 'extrano', label: 'Extraño sentir' },
  { id: 'gris', label: 'Todo gris' },
  { id: 'calma', label: 'Un poquito de calma' },
] as const
export type WordId = (typeof WORDS)[number]['id']
export const MAX_WORDS = 3

/** Los tres caminos de Frankl, cada uno con su carta de lotería. */
export type PathId = 'hacer' | 'recibir' | 'postura'

export type SenseCard = {
  path: PathId
  number: number
  name: string
  /** Una pregunta por día, rotando; siempre chiquita. */
  questions: { q: string; hint: string }[]
  /** Respuestas para tocar. La última siempre deja pasar el día sin culpa. */
  answers: string[]
  /** La que no cuenta como «tuvo sentido»: se respeta igual. */
  pass: string
}

export const SENSE_CARDS: SenseCard[] = [
  {
    path: 'hacer',
    number: 61,
    name: 'El Hacer',
    questions: [
      {
        q: '¿Qué cosa chiquita puedes hacer hoy que nadie hace igual que tú?',
        hint: 'Regar una planta, mandar un mensaje, hacer la comida como solo te sale a ti.',
      },
      { q: '¿A quién le haría bien algo pequeño de tu parte hoy?', hint: 'Un mensaje, una pregunta, una ayuda de cinco minutos.' },
      { q: '¿Qué podrías arreglar o acomodar hoy, aunque sea un cajón?', hint: 'Lo pequeño también deja huella.' },
    ],
    answers: ['Mandarle un mensaje a alguien', 'Cocinar algo', 'Ayudar en algo pequeño', 'Arreglar o acomodar algo'],
    pass: 'Hoy no',
  },
  {
    path: 'recibir',
    number: 62,
    name: 'El Recibir',
    questions: [
      {
        q: '¿Qué te tocó hoy, aunque sea poquito?',
        hint: 'Un sabor, una voz, el sol en la cara, una canción. No tiene que haberse sentido bonito.',
      },
      { q: '¿Qué escuchaste, viste o probaste hoy que valga la pena guardar?', hint: 'Aunque haya durado un segundo.' },
      { q: '¿Quién estuvo contigo hoy, aunque sea un rato?', hint: 'En persona, por mensaje o en una canción.' },
    ],
    answers: ['Un sabor', 'Una voz', 'Algo que vi', 'Una canción'],
    pass: 'Hoy no lo encontré',
  },
  {
    path: 'postura',
    number: 63,
    name: 'La Postura',
    questions: [
      {
        q: 'De lo que hoy no puedes cambiar, ¿cómo elegiste estar ahí?',
        hint: 'No se trata de estar bien. A veces la respuesta es «aguantando», y eso ya es una forma de estar.',
      },
      { q: '¿Qué te ayudó hoy a seguir, aunque fuera un poco?', hint: 'Una persona, un descanso, una costumbre.' },
      { q: 'Si hoy pesó, ¿cómo te trataste mientras pesaba?', hint: 'Tratarte con paciencia también es una forma de estar.' },
    ],
    answers: ['Hoy solo aguanté, y eso también cuenta', 'Pedí ayuda', 'Me di un descanso', 'Fui con calma'],
    pass: 'Hoy no quiero contestar',
  },
]

/** Lo que dice la mascota antes de todo: permiso, no tareas. */
export const PERMISSION = [
  'Que no salgan las lágrimas no quiere decir que no te importe. A veces el cuerpo guarda todo bajo llave por un tiempo.',
  'Aquí no hay que forzar nada. No se trata de llorar: se trata de que no cargues sin palabras.',
]

