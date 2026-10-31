// «Sigue la señal»: la alarma del cuerpo como un circuito de luz que siempre regresa a la
// calma. Del cerebro baja a las glándulas, de ahí al corazón, los pulmones, los brazos y la
// panza; y al soltar el aire despacio, el nervio vago la frena. Se explica, no se diagnostica.
// Pendiente de revisión con psicóloga y médico.
// Fuentes: Harvard Health, «Understanding the stress response»; Breit et al. 2018, Front
// Psychiatry (nervio vago y eje intestino-cerebro); Quirk y Beer 2006, Curr Opin Neurobiol
// (corteza prefrontal y amígdala); Meuret y Ritz 2010 y Callaham 1989 (hiperventilación y la
// bolsa de papel); Laborde et al. 2022 (respiración lenta); Harvard Health, «The gut-brain
// connection». Detalle en la investigación «Tu cuerpo, versión 2».

/** Las cinco capas que se prenden y se apagan. */
export type SenalLayer = 'alarma' | 'respiracion' | 'sangre' | 'musculos' | 'panza'

export const SENAL_LAYERS: { id: SenalLayer; label: string; color: string }[] = [
  { id: 'alarma', label: 'La alarma', color: 'var(--sg-sig)' },
  { id: 'respiracion', label: 'La respiración', color: 'var(--sg-lung-2)' },
  { id: 'sangre', label: 'Corazón y sangre', color: 'var(--sg-heart)' },
  { id: 'musculos', label: 'Músculos tensos', color: 'var(--sg-fiber)' },
  { id: 'panza', label: 'Estómago', color: 'var(--sg-gut-2)' },
]

export type SenalPartId =
  | 'amigdala'
  | 'pfc'
  | 'hipotalamo'
  | 'suprarrenales'
  | 'vago'
  | 'mandibula'
  | 'hombros'
  | 'pulmones'
  | 'corazon'
  | 'estomago'
  | 'intestino'

export type SenalPart = {
  id: SenalPartId
  /** Nombre corto para la fila de partes. */
  chip: string
  name: string
  layer: SenalLayer
  /** A dónde se acerca la vista: centro x, centro y y tamaño (en unidades del dibujo). */
  box: [number, number, number]
  /** El anillo punteado que marca la parte: centro x, centro y, radio x y radio y. */
  ring: [number, number, number, number]
  /** Qué es. */
  what: string
  /** Por qué se siente así. */
  why: string
  /** Qué ayuda. */
  helps: string
  /** Algo que hacer ahora, en otra pantalla de la app. */
  link: { to: string; label: string }
  /** Cuándo vale la pena revisarse con un médico. */
  warn?: string
}

const CALMA = { to: '/calma', label: 'Respirar con el círculo' }
const PRACTICAR = { to: '/nervios/practicar', label: 'Practicar con el cuerpo' }

export const SENAL_PARTS: SenalPart[] = [
  {
    id: 'amigdala',
    chip: 'Amígdala',
    name: 'Amígdala',
    layer: 'alarma',
    box: [110, 47, 46],
    ring: [110, 48, 14, 5],
    what: 'Dos almendritas en el centro del cerebro. Son la alarma: vigilan si hay peligro.',
    why: 'Se encienden muy rápido, antes de pensar. A veces basta un recuerdo o un pensamiento, aunque no haya peligro.',
    helps: 'Ponerle nombre («es la alarma») y soltar el aire despacio.',
    link: CALMA,
  },
  {
    id: 'pfc',
    chip: 'Corteza prefrontal',
    name: 'Corteza prefrontal',
    layer: 'alarma',
    box: [110, 33, 52],
    ring: [110, 26, 21, 8],
    what: 'La parte de enfrente del cerebro, detrás de la frente. Es como la persona adulta que calma a la alarma.',
    why: 'Con mucho cansancio o mucho miedo se oye menos. Por eso cuesta pensar claro en plena crisis, y no es tu culpa.',
    helps: 'Respirar lento, y dormir a horas regulares, le devuelven la voz.',
    link: CALMA,
  },
  {
    id: 'hipotalamo',
    chip: 'Hipotálamo',
    name: 'Hipotálamo e hipófisis',
    layer: 'alarma',
    box: [110, 50, 40],
    ring: [110, 51, 6, 6],
    what: 'Un centro de mando pequeño en la base del cerebro. La hipófisis cuelga debajo, como una gota.',
    why: 'Recibe el aviso de la amígdala y pisa el acelerador. Si el peligro sigue, pide cortisol, la alarma lenta.',
    helps: 'El cortisol no es malo: te ayuda a despertar. Moverte y descansar le ayudan a volver a su ritmo.',
    link: CALMA,
  },
  {
    id: 'suprarrenales',
    chip: 'Suprarrenales',
    name: 'Glándulas suprarrenales',
    layer: 'alarma',
    box: [110, 204, 80],
    ring: [110, 200, 34, 13],
    what: 'Dos glándulas pequeñas, encima de los riñones.',
    why: 'Sueltan adrenalina: un chispazo que llega en segundos y se gasta en minutos. Por eso el pánico sube y luego baja.',
    helps: 'No pelear con la sensación: pasa sola, y soltar el aire despacio la acompaña.',
    link: PRACTICAR,
  },
  {
    id: 'vago',
    chip: 'Nervio vago',
    name: 'Nervio vago',
    layer: 'alarma',
    box: [111, 128, 140],
    ring: [111, 145, 20, 92],
    what: 'El cable principal del freno del cuerpo. Baja del cerebro al corazón, los pulmones y la panza.',
    why: 'El freno siempre está ahí, aunque en plena alarma casi no se note.',
    helps: 'Cada vez que sueltas el aire despacio, le avisa al corazón que baje el ritmo.',
    link: CALMA,
  },
  {
    id: 'mandibula',
    chip: 'Mandíbula',
    name: 'Mandíbula',
    layer: 'musculos',
    box: [110, 60, 54],
    ring: [110, 62, 24, 11],
    what: 'Los músculos que aprietan los dientes, a los lados de la cara.',
    why: 'La alarma prepara al cuerpo para actuar y se aprietan solos. Horas así cansan y duelen.',
    helps: 'Separa un poco los dientes, deja la lengua floja y afloja al soltar el aire.',
    link: CALMA,
  },
  {
    id: 'hombros',
    chip: 'Hombros y cuello',
    name: 'Hombros y cuello',
    layer: 'musculos',
    box: [110, 84, 96],
    ring: [110, 86, 42, 14],
    what: 'Los músculos que van del cuello a los hombros (los trapecios).',
    why: 'Suben con la alarma. Si se quedan así por horas, pueden dar dolor de cabeza «como una banda».',
    helps: 'Súbelos al inhalar y déjalos caer al soltar el aire.',
    link: CALMA,
  },
  {
    id: 'pulmones',
    chip: 'Pulmones',
    name: 'Pulmones',
    layer: 'respiracion',
    box: [110, 142, 96],
    ring: [110, 143, 44, 45],
    what: 'Meten y sacan el aire. Abajo, el diafragma hace casi todo el trabajo.',
    why: 'Al respirar rápido no te falta oxígeno: sacas de más dióxido de carbono. Eso da hormigueo y mareo.',
    helps: 'Soltar el aire despacio, no jalar más. Nada de bolsa de papel.',
    link: CALMA,
  },
  {
    id: 'corazon',
    chip: 'Corazón',
    name: 'Corazón',
    layer: 'sangre',
    box: [115, 153, 60],
    ring: [115, 155, 20, 25],
    what: 'Un músculo que bombea sangre a todo el cuerpo, todo el día.',
    why: 'La adrenalina lo acelera para mandar sangre a los músculos. Sentirlo no quiere decir que esté fallando.',
    helps: 'Exhalar largo lo frena un poco, en cada respiración.',
    link: PRACTICAR,
    warn: 'Si lo que sientes es nuevo, distinto a otras veces o viene con desmayo, ve a revisarte.',
  },
  {
    id: 'estomago',
    chip: 'Estómago',
    name: 'Estómago',
    layer: 'panza',
    box: [126, 197, 58],
    ring: [127, 197, 22, 22],
    what: 'Donde empieza la digestión, debajo de las costillas.',
    why: 'Con la alarma se frena. De ahí la náusea, la llenura o el nudo.',
    helps: 'Respirar con la panza y calmar la mente: el estómago lo nota.',
    link: CALMA,
  },
  {
    id: 'intestino',
    chip: 'Intestino',
    name: 'Intestino',
    layer: 'panza',
    box: [110, 238, 74],
    ring: [110, 238, 34, 26],
    what: 'Un tubo largo que platica con el cerebro todo el tiempo, en las dos direcciones.',
    why: 'Con los nervios se acelera: por eso a veces dan ganas de ir al baño.',
    helps: 'Si te pasa seguido, es real y se trata. La terapia también ayuda a la panza.',
    link: { to: '/especialista', label: 'Camino al especialista' },
  },
]

/** Lo que dice la leyenda: un rótulo chico, un título y el texto. */
export type SenalCaption = {
  kick: string
  title: string
  text: string
  /** Puntos de avance: cuántos hay y en cuál va. */
  dots?: { n: number; i: number }
  /** Invita a respirar lento con un botón en la leyenda. */
  invite?: boolean
  tone?: 'calm' | 'warm'
}

export const CAPTION_REST: SenalCaption = {
  kick: 'En calma',
  title: 'Así se ve un cuerpo tranquilo',
  text: 'Respira sin prisa y el corazón late tranquilo. Toca una parte para acercarte, o mira qué pasa cuando suena la alarma.',
}

/** «Sonó la alarma», paso a paso. El último invita a frenarla. */
export const ALARM_STEPS: [string, string][] = [
  ['La amígdala ve peligro', 'Es la alarma del cerebro. A veces se enciende con solo un pensamiento, aunque no haya peligro de verdad.'],
  ['Avisa al hipotálamo', 'El hipotálamo, en la base del cerebro, pisa el acelerador del cuerpo.'],
  ['La señal baja por los nervios', 'Viaja por la médula hasta las glándulas suprarrenales, encima de los riñones.'],
  ['Un chispazo de adrenalina', 'Llega a la sangre en segundos y se gasta en minutos. Por eso el pánico sube y luego baja.'],
  ['El corazón y el aire se aceleran', 'El corazón late más rápido y respiras más corto. Es incómodo, no peligroso.'],
  ['La sangre se va a brazos y piernas', 'Como para correr. Y el estómago se frena: de ahí el nudo o las mariposas.'],
  ['Hombros y mandíbula se tensan', 'El cuerpo se prepara para actuar. Por eso a veces aprietas los dientes sin darte cuenta.'],
  ['Es una alarma, no un daño', 'Y tiene freno. Prueba a soltar el aire despacio y mira qué pasa.'],
]

/** Si nadie respira lento, la alarma igual se gasta sola. */
export const ALARM_FADING: SenalCaption = {
  kick: 'Sonó la alarma · ya va bajando',
  title: 'La alarma se gasta sola',
  text: 'La adrenalina dura poco: en unos minutos el cuerpo regresa a la calma, aunque no hagas nada. Soltar el aire despacio ayuda a que sea antes.',
  invite: true,
}

export const ALARM_DONE: SenalCaption = {
  kick: 'En calma',
  title: 'De vuelta a la calma',
  text: 'Pasó la alarma y el cuerpo regresó solo a su ritmo. Así pasa casi siempre: sube, llega arriba y baja.',
  tone: 'calm',
}

/** «Respirar lento»: una frase por cada una de las tres respiraciones. */
export const BREATH_STEPS: [string, string][] = [
  ['Inhala… y suelta despacio', 'Cuando sueltes el aire, mira la línea azul: es el nervio vago, el cable del freno.'],
  ['El corazón baja el ritmo', 'En cada exhalación larga el corazón va un poco más lento. Es el freno funcionando.'],
  ['El cuerpo se afloja', 'Hombros y mandíbula se enfrían, y el estómago vuelve a moverse.'],
]

export const BREATH_DONE: SenalCaption = {
  kick: 'Listo · tres respiraciones',
  title: 'El freno del cuerpo',
  text: 'Al soltar el aire despacio, el nervio vago le avisa al corazón que baje el ritmo. Puedes hacerlo cuando quieras, sin ver nada.',
  tone: 'calm',
}
