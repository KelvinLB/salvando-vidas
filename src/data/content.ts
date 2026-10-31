// Mensajes y recomendaciones. Todo el texto está pensado para acompañar sin
// juzgar: frases cortas, sin promesas falsas y siempre con una salida hacia ayuda.

export const GENTLE_MESSAGES = [
  'Hoy no tienes que resolverlo todo. Solo este momento.',
  'Lo que sientes es real, y no tienes que cargarlo sin ayuda.',
  'Tus pensamientos más oscuros no siempre cuentan toda la verdad.',
  'A veces basta una pequeña razón para quedarse hoy.',
  'No necesitas estar bien para merecer cariño y un lugar en este mundo.',
  'Seguir aquí ya es un acto de valentía.',
  'Está bien ir despacio. Despacio también es avanzar.',
  'Este dolor es fuerte, pero no es permanente. Los sentimientos cambian.',
  'Mereces cuidado, incluso el que te das tú.',
  'No eres una carga. Hay personas que quieren escucharte.',
  'Un respiro a la vez. Eso es suficiente por ahora.',
  'Pedir ayuda no es debilidad: es una forma de cuidarte.',
  'Tu historia todavía tiene páginas por escribir.',
  'Hay días grises. No definen quién eres.',
  'Gracias por quedarte un rato más.',
  'Un día a la vez. Hoy, solo hoy.',
  'Hay días en que levantarte ya es un logro. Ese también cuenta.',
  'La depresión cansa de verdad. No es flojera.',
]

// Solo se muestran si la persona activa «contenido de fe» en Ajustes.
export const FAITH_MESSAGES = [
  'La fe y la ayuda profesional pueden ir de la mano: cuidarte también es un acto de fe.',
  'Puedes poner en oración lo que hoy pesa, y también apoyarte en quienes están cerca.',
  'No tienes que tener fuerzas para todo. Descansa en lo que crees.',
  'Pedir ayuda no es falta de fe. A veces la ayuda llega a través de otras personas.',
]

export const MICRO_MISSIONS = [
  'Sal 5 minutos a tomar el sol.',
  'Pon tu canción favorita y cántala, aunque sea bajito.',
  'Toma un vaso de agua, despacio.',
  'Abre una ventana y mira el cielo por un minuto.',
  'Estira los brazos hacia arriba y suelta los hombros.',
  'Escríbele "hola" a alguien que te caiga bien.',
  'Ponte una canción que te guste.',
  'Lávate la cara con agua fresca.',
  'Busca algo de color azul a tu alrededor.',
  'Come algo pequeño, aunque no tengas mucha hambre.',
  'Sal a la puerta y respira aire de afuera.',
  'Acaricia a una mascota o abraza una almohada.',
  'Ordena una sola cosa pequeña: un cajón, la mesa.',
  'Date una ducha tibia.',
  'Prepárate un té calientito y tómalo despacio, sin pantalla.',
]

export const MOODS = [
  { value: 1, emoji: '😞', label: 'Muy mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😊', label: 'Muy bien' },
] as const

export type VideoTopic = { emoji: string; title: string; query: string }

// Enlaces a búsquedas y no a videos concretos: no se rompen si un video se borra.
export const VIDEO_TOPICS: VideoTopic[] = [
  { emoji: '🐶', title: 'Animales tiernos', query: 'cachorros y gatitos tiernos' },
  { emoji: '😂', title: 'Para reír', query: 'videos graciosos para toda la familia' },
  { emoji: '🌊', title: 'Naturaleza relajante', query: 'naturaleza relajante 4k sin música' },
  { emoji: '🪐', title: 'El universo', query: 'documental del universo en español' },
  { emoji: '🎨', title: 'Aprender a dibujar', query: 'aprender a dibujar fácil paso a paso' },
  { emoji: '🍳', title: 'Recetas fáciles', query: 'recetas fáciles y rápidas' },
  { emoji: '🧘', title: 'Yoga suave', query: 'yoga suave para principiantes 10 minutos' },
  { emoji: '🐠', title: 'Acuario en vivo', query: 'acuario en vivo relajante' },
]

export const FAITH_VIDEOS: VideoTopic[] = [
  { emoji: '🙏', title: 'Reflexiones de fe', query: 'reflexión cristiana para la ansiedad y la depresión' },
]

export type Playlist = { emoji: string; title: string; query: string }

export const PLAYLISTS: Playlist[] = [
  { emoji: '🎹', title: 'Piano tranquilo', query: 'piano relajante para calmar la ansiedad' },
  { emoji: '🎧', title: 'Lo-fi', query: 'lofi hip hop para relajarse' },
  { emoji: '🌧️', title: 'Lluvia para dormir', query: 'sonido de lluvia para dormir' },
  { emoji: '🎸', title: 'Acústico en español', query: 'música acústica en español tranquila' },
  { emoji: '☀️', title: 'Para levantar el ánimo', query: 'canciones alegres para levantar el ánimo' },
]

export const FAITH_PLAYLISTS: Playlist[] = [
  { emoji: '🕊️', title: 'Alabanzas para la paz', query: 'alabanzas para la paz y la ansiedad' },
]

// Lo que personas que viven con depresión y ansiedad cuentan que les ayuda.
// Recogido de testimonios en grupos de apoyo (sin datos de nadie).
export const WHAT_HELPED = [
  { emoji: '🧸', text: 'Cuidar o jugar con alguien (niños, una mascota): recordar que tu presencia hace falta.' },
  { emoji: '🎶', text: 'Poner tu música favorita y cantar mientras limpias.' },
  { emoji: '☀️', text: 'Salir a tomar el sol un rato, aunque sea en la puerta.' },
  { emoji: '🌳', text: 'Caminar, de preferencia entre árboles o sin zapatos sobre el pasto.' },
  { emoji: '💧', text: 'En plena crisis, agua fría en la cara, las muñecas y el cuello.' },
  { emoji: '💬', text: 'Hablar con alguien de cualquier otra cosa.' },
  { emoji: '📝', text: 'Planear la noche anterior una o dos cosas pequeñas, con un premio al final.' },
  { emoji: '📅', text: 'Tener actividades para el fin de semana, que es cuando más pesa.' },
  { emoji: '👣', text: 'Un día a la vez: levantarse, sacudirse y seguir, sin exigirse todo.' },
  { emoji: '🙏', text: 'Para quien la tiene, la fe y la oración, junto con su tratamiento.' },
]

// «Un día a la vez»: planear poco, de preferencia la noche anterior, y darse un
// premio al final. Es la activación conductual que se usa en terapia, en chiquito.
export const MAX_DAY_TASKS = 3

export const DAY_TASK_IDEAS = [
  { title: 'Lo mínimo', tasks: ['Tomar agua', 'Comer algo', 'Tomar mi medicina', 'Lavarme la cara o bañarme'] },
  {
    title: 'Algo pequeño para mí',
    tasks: ['Salir 5 minutos al sol', 'Caminar 10 minutos', 'Poner una canción que me guste', 'Escribirle a alguien', 'Prepararme un té'],
  },
  { title: 'Un pendiente', tasks: ['Ordenar una sola cosa', 'Hacer una llamada pendiente', 'Avanzar 10 minutos en algo'] },
]

export const REWARD_IDEAS = [
  'Un café o un té calientito',
  'Un capítulo de mi serie',
  'Un baño largo',
  'Algo rico',
  'Descansar sin culpa',
  'Mi música favorita',
]

export function youtubeSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export type Movie = { title: string; year: number; why: string }

export const MOVIES: Movie[] = [
  { title: 'Intensamente', year: 2015, why: 'Muestra que la tristeza también tiene un lugar y un propósito.' },
  { title: 'Soul', year: 2020, why: 'Sobre encontrar sentido en las cosas pequeñas de cada día.' },
  { title: 'Paddington 2', year: 2017, why: 'Pura ternura. Imposible no sonreír.' },
  { title: 'Mi vecino Totoro', year: 1988, why: 'Calma, naturaleza y una sensación de hogar.' },
  { title: 'Coco', year: 2017, why: 'Familia, música y recuerdos que nos sostienen.' },
  { title: 'Up', year: 2009, why: 'Nunca es tarde para una nueva aventura.' },
  { title: 'En busca de la felicidad', year: 2006, why: 'Sobre resistir cuando todo parece en contra.' },
  { title: 'Amélie', year: 2001, why: 'Colores cálidos y pequeños actos de bondad.' },
  { title: 'La vida secreta de Walter Mitty', year: 2013, why: 'Paisajes enormes y el valor de dar un paso.' },
  { title: 'Wall-E', year: 2008, why: 'Sobre la conexión y no rendirse.' },
]
