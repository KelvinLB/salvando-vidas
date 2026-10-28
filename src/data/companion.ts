// Una mascota que represente a la persona. A veces es más fácil contar cómo
// está alguien más que cómo está uno: la mascota presta esa distancia.
// Todos los textos evitan el género, porque la mascota es de quien la crea.

import { VIDEO_TOPICS, youtubeSearch } from './content'

export const SPECIES = [
  { id: 'nube', label: 'Nube' },
  { id: 'gota', label: 'Gota' },
  { id: 'brote', label: 'Brote' },
  { id: 'michi', label: 'Michi' },
  { id: 'osito', label: 'Osito' },
  { id: 'conejito', label: 'Conejito' },
  { id: 'perrito', label: 'Perrito' },
  { id: 'xolo', label: 'Xolo' },
  { id: 'ajolote', label: 'Ajolote' },
  { id: 'colibri', label: 'Colibrí' },
] as const
export type SpeciesId = (typeof SPECIES)[number]['id']

export const COLORS = [
  { id: '#9ad7c8', label: 'Menta' },
  { id: '#a9c8f0', label: 'Cielo' },
  { id: '#f5b7c5', label: 'Rosa' },
  { id: '#f7d08a', label: 'Miel' },
  { id: '#c7b5ee', label: 'Lavanda' },
  { id: '#f3a683', label: 'Durazno' },
  { id: '#b9dd8f', label: 'Pistache' },
  { id: '#dcd6cc', label: 'Arena' },
]

export const HEADS = [
  { id: 'nada', label: 'Nada' },
  { id: 'gorro', label: 'Gorrito' },
  { id: 'mono', label: 'Moño' },
  { id: 'flor', label: 'Flor' },
  { id: 'audifonos', label: 'Audífonos' },
  { id: 'hojas', label: 'Corona de hojas' },
  { id: 'boina', label: 'Boina' },
  { id: 'corona', label: 'Corona' },
  { id: 'sombrero', label: 'Sombrero' },
  { id: 'trenzas', label: 'Trenzas con listones' },
] as const
export type HeadId = (typeof HEADS)[number]['id']

export const FACES = [
  { id: 'nada', label: 'Nada' },
  { id: 'lentes', label: 'Lentes' },
  { id: 'pecas', label: 'Pecas' },
  { id: 'sol', label: 'Lentes de sol' },
  { id: 'bigote', label: 'Bigote' },
] as const
export type FaceId = (typeof FACES)[number]['id']

export const NECKS = [
  { id: 'nada', label: 'Nada' },
  { id: 'bufanda', label: 'Bufanda' },
  { id: 'collar', label: 'Collar' },
  { id: 'paliacate', label: 'Paliacate' },
  { id: 'corbatin', label: 'Corbatín' },
  { id: 'rebozo', label: 'Rebozo' },
] as const
export type NeckId = (typeof NECKS)[number]['id']

// El estilo alebrije pinta el cuerpo con figuras de colores, como los alebrijes.
export const PATTERN_OPTIONS = [
  { id: 'liso', label: 'Liso' },
  { id: 'alebrije', label: 'Alebrije' },
] as const
export type PatternId = (typeof PATTERN_OPTIONS)[number]['id']

export type CompanionLook = {
  species: SpeciesId
  color: string
  head: HeadId
  face: FaceId
  neck: NeckId
  /** Sin valor es «liso»: las mascotas que ya estaban guardadas se ven igual. */
  pattern?: PatternId
}

export type Companion = CompanionLook & {
  name: string
  traits: string[]
  likes: string[]
}

export const DEFAULT_COMPANION: Companion = {
  species: 'nube',
  color: COLORS[0].id,
  head: 'nada',
  face: 'nada',
  neck: 'nada',
  name: '',
  traits: [],
  likes: [],
}

/** Lo que dice la mascota cuando se le hace cariño. */
export const PET_PHRASES = ['¡Aquí estoy!', 'Me da gusto verte', 'Vamos poquito a poquito', 'Hoy también cuenta', 'Gracias por volver']

export const NAME_IDEAS = ['Nubi', 'Lumi', 'Coco', 'Brisa', 'Miel', 'Pipo']
export const companionName = (c: Companion) => c.name.trim() || 'Nubi'

// Sustantivos y no adjetivos: «ternura» sirve para cualquiera, «tierno» no.
export const TRAITS = [
  { id: 'ternura', emoji: '🧸', label: 'Ternura' },
  { id: 'curiosidad', emoji: '🔍', label: 'Curiosidad' },
  { id: 'imaginacion', emoji: '🌈', label: 'Imaginación' },
  { id: 'humor', emoji: '😄', label: 'Humor' },
  { id: 'calma', emoji: '🍃', label: 'Calma' },
  { id: 'creatividad', emoji: '🎨', label: 'Creatividad' },
  { id: 'valentia', emoji: '🦁', label: 'Valentía' },
  { id: 'sensibilidad', emoji: '💗', label: 'Sensibilidad' },
  { id: 'empatia', emoji: '🤲', label: 'Empatía' },
  { id: 'lealtad', emoji: '🤝', label: 'Lealtad' },
  { id: 'paciencia', emoji: '🐢', label: 'Paciencia' },
  { id: 'terquedad', emoji: '🐐', label: 'Terquedad' },
  { id: 'timidez', emoji: '🙈', label: 'Timidez' },
  { id: 'intensidad', emoji: '🔥', label: 'Intensidad' },
  { id: 'nobleza', emoji: '🤍', label: 'Nobleza' },
  { id: 'fe', emoji: '🙏', label: 'Fe' },
]
export const MAX_TRAITS = 6

const video = (title: string) => youtubeSearch(VIDEO_TOPICS.find((v) => v.title === title)!.query)

// Lo que le gusta a la mascota es lo que le gusta (o le gustaba) a la persona.
// Cuando nada entretiene, volver a algo conocido cuesta menos que buscar algo nuevo.
export const LIKES: { id: string; emoji: string; label: string; plural?: boolean; to?: string; href?: string }[] = [
  { id: 'musica', emoji: '🎵', label: 'la música', to: '/musica' },
  { id: 'naturaleza', emoji: '🌳', label: 'la naturaleza', to: '/musica' },
  { id: 'animales', emoji: '🐶', label: 'los animales', plural: true, href: video('Animales tiernos') },
  { id: 'peliculas', emoji: '🎬', label: 'las películas', plural: true, to: '/videos' },
  { id: 'dibujar', emoji: '🎨', label: 'dibujar', to: '/juegos/pizarra' },
  { id: 'acertijos', emoji: '🧩', label: 'los acertijos', plural: true, to: '/juegos/deslizante' },
  { id: 'juegos', emoji: '🎲', label: 'los juegos', plural: true, to: '/distraer' },
  { id: 'escribir', emoji: '✍️', label: 'escribir', to: '/diario' },
  { id: 'cocinar', emoji: '🍳', label: 'cocinar', href: video('Recetas fáciles') },
  { id: 'universo', emoji: '🪐', label: 'el universo', href: video('El universo') },
  { id: 'reir', emoji: '😂', label: 'reírse', href: video('Para reír') },
  { id: 'moverse', emoji: '🧘', label: 'moverse y estirarse', href: video('Yoga suave') },
]

export const likePhrase = (name: string, like: (typeof LIKES)[number]) =>
  `A ${name} le ${like.plural ? 'gustan' : 'gusta'} ${like.label}`

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const MOOD_STATES = [
  { id: 'feliz', emoji: '😊', label: 'Con alegría' },
  { id: 'calma', emoji: '😌', label: 'En calma' },
  { id: 'triste', emoji: '😢', label: 'Con tristeza' },
  { id: 'cansado', emoji: '🥱', label: 'Con cansancio' },
  { id: 'nervios', emoji: '😰', label: 'Con nervios' },
  { id: 'apagado', emoji: '😶', label: 'Sin ganas de nada' },
] as const
export type CompanionMood = (typeof MOOD_STATES)[number]['id']

export const MOOD_TIPS: Partial<Record<CompanionMood, { text: string; to: string; action: string }>> = {
  triste: {
    text: 'La tristeza pesa menos cuando sale. Puedes escribirla o decirla en voz alta.',
    to: '/diario',
    action: 'Sacar lo que traigo',
  },
  cansado: {
    text: 'El cansancio también es parte de la depresión y no es flojera. Hoy basta con lo mínimo.',
    to: '/mi-dia',
    action: 'Lo mínimo de hoy',
  },
  nervios: {
    text: 'Los nervios bajan cuando el cuerpo respira más lento. Un minuto puede cambiar mucho.',
    to: '/calma',
    action: 'Respirar juntos',
  },
  apagado: {
    text: 'Cuando nada emociona no es que no te esfuerces: se llama anhedonia y tiene tratamiento. A veces ayuda volver a algo que antes te gustaba, aunque hoy no sientas nada.',
    to: '/distraer',
    action: 'Probar algo pequeño',
  },
}

// Preguntas del PHQ-9 (depresión) y del GAD-7 (ansiedad), de Spitzer, Kroenke y
// Williams: de uso libre, sin permiso. Se adaptaron a la tercera persona para
// preguntarle a la mascota, sin cambiar lo que mide cada una. La pregunta 9 del
// PHQ-9 va al final: cualquier respuesta distinta de «ningún día» abre la ayuda.
export const QUESTIONS = [
  { id: 'interes', scale: 'phq', text: 'ha tenido poco interés o gusto por hacer las cosas' },
  { id: 'animo', scale: 'phq', text: 'se ha sentido triste, sin ánimo o sin esperanza' },
  { id: 'sueno', scale: 'phq', text: 'ha tenido problemas para dormir, se despierta seguido o duerme de más' },
  { id: 'energia', scale: 'phq', text: 'ha sentido cansancio o poca energía' },
  { id: 'apetito', scale: 'phq', text: 'ha tenido poco apetito o ha comido de más' },
  { id: 'valor', scale: 'phq', text: 'se ha sentido mal consigo, como un fracaso, o como si le hubiera fallado a su familia' },
  { id: 'concentrar', scale: 'phq', text: 'ha tenido dificultad para concentrarse, por ejemplo al leer o ver la tele' },
  { id: 'lento', scale: 'phq', text: 'se ha movido o hablado tan despacio que otros lo notan, o al revés: con tanta inquietud que se mueve mucho más de lo normal' },
  { id: 'nervios', scale: 'gad', text: 'se ha sentido con nervios, con ansiedad o con los nervios de punta' },
  { id: 'no-parar', scale: 'gad', text: 'no ha podido dejar de preocuparse o controlar la preocupación' },
  { id: 'todo', scale: 'gad', text: 'se ha preocupado demasiado por muchas cosas distintas' },
  { id: 'relajar', scale: 'gad', text: 'ha tenido dificultad para relajarse' },
  { id: 'inquietud', scale: 'gad', text: 'ha tenido tanta inquietud que le cuesta quedarse sin moverse' },
  { id: 'irritable', scale: 'gad', text: 'se ha molestado o irritado con facilidad' },
  { id: 'miedo', scale: 'gad', text: 'ha sentido miedo, como si algo terrible fuera a pasar' },
  { id: 'dano', scale: 'phq', text: 'ha pensado que sería mejor morir o desaparecer, o en hacerse daño de alguna forma' },
] as const

export const ANSWERS = [
  { value: 0, label: 'Ningún día' },
  { value: 1, label: 'Varios días' },
  { value: 2, label: 'Más de la mitad de los días' },
  { value: 3, label: 'Casi todos los días' },
]
