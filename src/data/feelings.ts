// Ayuda a ponerle nombre a lo que se siente. Muchas personas con depresión o
// ansiedad "no saben qué tienen": elegir palabras de una lista es más fácil
// que encontrarlas solas, y le da al especialista un mejor contexto.

export type Feeling = { id: string; label: string }
export type FeelingGroup = { title: string; feelings: Feeling[] }

export const FEELING_GROUPS: FeelingGroup[] = [
  {
    title: 'Apagado o vacío',
    feelings: [
      { id: 'vacio', label: 'Un vacío' },
      { id: 'no-siento', label: 'No siento nada' },
      { id: 'nada-entretiene', label: 'Nada me entretiene' },
      { id: 'sin-energia', label: 'Sin energía' },
      { id: 'no-puedo-llorar', label: 'Quiero llorar y no puedo' },
      { id: 'mucho-sueno', label: 'Solo quiero dormir' },
      { id: 'solo-existo', label: 'Siento que solo existo, no vivo' },
    ],
  },
  {
    title: 'Ansiedad',
    feelings: [
      { id: 'ansiedad', label: 'Ansiedad' },
      { id: 'paralisis', label: 'Sé lo que tengo que hacer, pero no puedo' },
      { id: 'pensamientos', label: 'Pensamientos que no paran' },
      { id: 'cuerpo', label: 'Nervios en el cuerpo' },
      { id: 'miedo', label: 'Miedo sin saber a qué' },
      { id: 'panico', label: 'Ataques de pánico' },
      { id: 'corazon', label: 'El corazón acelerado' },
      { id: 'irreal', label: 'Todo se siente extraño, como fuera de mí' },
    ],
  },
  {
    title: 'Tristeza',
    feelings: [
      { id: 'tristeza', label: 'Tristeza' },
      { id: 'llorar', label: 'Ganas de llorar' },
      { id: 'soledad', label: 'Soledad' },
      { id: 'culpa', label: 'Culpa' },
      { id: 'carga', label: 'Siento que soy una carga' },
      { id: 'nadie', label: 'Siento que no tengo a nadie' },
      { id: 'duelo', label: 'Extraño a alguien que perdí' },
      { id: 'ruptura', label: 'Me rompieron el corazón' },
    ],
  },
  {
    title: 'Otras',
    feelings: [
      { id: 'irritable', label: 'Irritabilidad' },
      { id: 'cansancio', label: 'Cansancio aunque duerma' },
      { id: 'sin-sueno', label: 'No puedo dormir' },
      { id: 'calma', label: 'Un poco de calma' },
      { id: 'esperanza', label: 'Algo de esperanza' },
    ],
  },
]

export const FEELINGS = FEELING_GROUPS.flatMap((g) => g.feelings)

export function feelingLabel(id: string): string {
  return FEELINGS.find((f) => f.id === id)?.label ?? id
}

// Explicaciones breves para cuando una sensación confunde o asusta.
// Están revisadas para no diagnosticar: nombran, normalizan y remiten al especialista.
export const FEELING_NOTES: Record<string, string> = {
  'no-puedo-llorar':
    'Algunos medicamentos para la depresión o la ansiedad pueden hacer que las emociones se sientan "planas" o que cueste llorar. Se llama aplanamiento emocional, es común y tiene solución: coméntalo con quien te los recetó. No dejes ni cambies el medicamento por tu cuenta.',
  'nada-entretiene':
    'Que nada te entretenga ni te dé gusto tiene nombre: anhedonia. Es un síntoma de la depresión, no un defecto tuyo. Ayuda hacer algo de 2 minutos sin esperar disfrutarlo: a veces el ánimo llega después de la acción, no antes.',
  cuerpo:
    'La ansiedad se siente en el cuerpo: el corazón rápido, el nudo en el estómago, los hombros tensos. No es que algo esté mal en ti: es la alarma del cuerpo encendida de más.',
  paralisis:
    'Saber qué hay que hacer y no poder empezar es parte de la ansiedad, no falta de voluntad. Divide la tarea en el paso más pequeño posible, tan pequeño que parezca ridículo, y empieza solo por ese.',
  vacio:
    'El vacío es una de las formas más comunes, y más difíciles de explicar, en que se siente la depresión. Ponerle nombre ya es un paso: llévalo a tu consulta tal cual lo sientes.',
  'no-siento':
    'Sentirse desconectado de las emociones puede ser parte de la depresión o un efecto de algún medicamento. Vale la pena contárselo a tu especialista.',
  carga:
    'Ese pensamiento lo dice la depresión, no la realidad. Las personas que te quieren prefieren mil veces escucharte a perderte.',
  panico:
    'Un ataque de pánico se siente terrible (falta de aire, corazón acelerado, miedo intenso), pero no es peligroso y suele bajar en 10 a 20 minutos. Tenemos una guía para atravesarlo paso a paso.',
  corazon:
    'La ansiedad acelera el corazón y eso asusta. Si es la primera vez, si hay dolor en el pecho que se extiende al brazo o a la mandíbula, o tienes dudas, busca atención médica. Si ya te dijeron que es ansiedad, la guía de pánico puede ayudarte.',
  irreal:
    'Sentir que todo es extraño, o que te ves desde fuera, se llama despersonalización. Asusta mucho, pero es un síntoma común de la ansiedad: no es peligroso y no significa que estés perdiendo la razón. Pasa. Ayuda tocar algo frío y nombrar lo que ves alrededor.',
  nadie:
    'Cuando sientes que no tienes a nadie, las líneas de apoyo están justo para eso: alguien te escucha aunque no te conozca, gratis y a cualquier hora.',
  duelo:
    'Perder a alguien puede despertar o empeorar la ansiedad y la depresión, sobre todo de noche. El duelo no tiene un tiempo correcto, y hablarlo con un especialista ayuda mucho.',
  ruptura:
    'Una ruptura puede doler como un duelo, sobre todo cuando hubo años, hijos y planes juntos. Lo que te hicieron sentir sobre tu valor no es la verdad sobre ti.',
  'sin-sueno':
    'Las noches suelen ser lo más difícil: el silencio deja más espacio a los pensamientos. Tenemos una sección para cuando no puedes dormir.',
  'mucho-sueno':
    'Querer dormir todo el día es un síntoma frecuente de la depresión, no flojera. Si además te quedas dormida o dormido sin querer, incluso platicando, díselo a tu médico: puede ser el medicamento, la tiroides, anemia o apnea del sueño, y se revisa con estudios sencillos.',
  'solo-existo':
    'Cuando llevas meses o años así, puede parecer tu forma de ser, pero no lo es. La depresión que dura mucho tiempo (se llama depresión persistente o distimia) también tiene tratamiento. Que lleve tiempo no quiere decir que sea para siempre.',
  irritable:
    'La irritabilidad es muy común en la depresión y la ansiedad, sobre todo en los hombres: a veces la tristeza sale como enojo. No es «mal carácter», y se puede trabajar.',
  cansancio:
    'El cansancio que no se quita durmiendo es parte de la depresión. Si no mejora, pídele al médico que descarte causas físicas como anemia o tiroides. Mientras, hoy basta con lo mínimo.',
}

// A dónde llevar a la persona cuando elige una sensación que tiene una herramienta propia.
export const FEELING_LINKS: Record<string, { to: string; label: string }> = {
  panico: { to: '/panico', label: 'Abrir la guía de pánico' },
  corazon: { to: '/panico', label: 'Abrir la guía de pánico' },
  irreal: { to: '/panico', label: 'Abrir la guía de pánico' },
  nadie: { to: '/ayuda', label: 'Hablar con alguien' },
  carga: { to: '/responder', label: 'Responderle a ese pensamiento' },
  'sin-sueno': { to: '/noche', label: 'Ir a «No puedo dormir»' },
  'mucho-sueno': { to: '/mi-dia', label: 'Lo mínimo de hoy' },
  cansancio: { to: '/mi-dia', label: 'Lo mínimo de hoy' },
  'solo-existo': { to: '/especialista', label: 'Dar el primer paso' },
  irritable: { to: '/enojo', label: 'Soltar el enojo' },
  cuerpo: { to: '/cuerpo', label: 'Marcar dónde lo siento' },
  'nada-entretiene': { to: '/cuerpo?ver=depresion', label: 'Por qué nada da gusto' },
}
