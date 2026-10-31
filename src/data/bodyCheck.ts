import type { Fx, Region } from './bodyStories'

// «Lo que siento»: la persona marca dónde lo siente (en una o en varias partes a la vez)
// y la app le explica qué puede estar pasando, cómo está reaccionando su cuerpo y cómo
// bajarle. No diagnostica: orienta, invita a calmarse y abre la puerta a pedir ayuda.
//
// Revisado contra fuentes publicadas el 27-oct-2026 (detalle en el README):
// pánico (NHS), evento cerebrovascular (CDC, IMSS), infarto (CDC, NHS), falta de aire
// (NHS), desmayo (NHS), dolor de cabeza (NHS), hiperventilación (MedlinePlus), manía
// (NHS), insomnio (NHS y terapia cognitivo-conductual), respiración (Balban et al., 2023).
// Antes de cambiar una señal de alarma, que la revise un médico.
// Pendientes de revisar (agregadas el 28-oct-2026): llorar, no sentir nada, espalda baja y
// dolor en todo el cuerpo.

export type Area = Region | 'mente' | 'todo'
/** Cómo se ve la figura: de frente, de espalda (para la tensión y la espalda baja) o de lado. */
export type BodyView = 'frente' | 'espalda' | 'lado'
export type Pattern = 'ansiedad' | 'panico' | 'estres' | 'depresion' | 'bipolar'
/** Si la sensación acelera el cuerpo (alerta) o lo apaga. Pinta el cuerpo de cálido o de frío. */
export type Feel = 'alerta' | 'apagado'
export type RedFlag = 'cerebro' | 'corazon' | 'aire' | 'desmayo' | 'crisis'
/** Qué partes del cuerpo se pintan, y si de cálido (alerta) o de frío (apagado). */
export type Heat = Partial<Record<Region | 'todo', Feel>>
export type HelpId =
  | 'soltar-aire'
  | 'suspiro'
  | 'frio'
  | 'tierra'
  | 'aflojar'
  | 'panza'
  | 'moverse'
  | 'escribir'
  | 'dormir'
  | 'nombrarlo'
  | 'mano-pecho'

export type Sensation = {
  id: string
  area: Area
  label: string
  /** Por qué pasa, sin tecnicismos. */
  why?: string
  fx: Fx[]
  feel: Feel
  weights?: Partial<Record<Pattern, number>>
  /** Lo que más ayuda, de más a menos. */
  helps?: HelpId[]
  red?: RedFlag
}

export const AREAS: { id: Area; label: string }[] = [
  { id: 'cabeza', label: 'Cabeza y cara' },
  { id: 'mente', label: 'Pensamientos' },
  { id: 'cuello', label: 'Cuello y hombros' },
  { id: 'pecho', label: 'Pecho' },
  { id: 'estomago', label: 'Estómago y espalda' },
  { id: 'brazos', label: 'Brazos y manos' },
  { id: 'piernas', label: 'Piernas' },
  { id: 'todo', label: 'Todo el cuerpo' },
]

export const SENSATIONS: Sensation[] = [
  // Cabeza y cara
  {
    id: 'dolor-cabeza',
    area: 'cabeza',
    label: 'Dolor o presión en la cabeza',
    why: 'La tensión del cuello, la frente y la mandíbula aprieta la cabeza como una banda. Es de lo más común con el estrés.',
    fx: ['stress-brain'],
    feel: 'alerta',
    weights: { estres: 2, ansiedad: 1 },
    helps: ['aflojar', 'suspiro'],
  },
  {
    id: 'mareo',
    area: 'cabeza',
    label: 'Mareo o la cabeza ligera',
    why: 'Al respirar rápido cambia el aire de la sangre y da mareo. Sentarte y soltar el aire despacio lo baja.',
    fx: ['dizzy'],
    feel: 'alerta',
    weights: { panico: 2, ansiedad: 1 },
    helps: ['tierra', 'soltar-aire'],
  },
  {
    id: 'mandibula',
    area: 'cabeza',
    label: 'Mandíbula o dientes apretados',
    why: 'Apretar la mandíbula es parte de prepararse para defenderse. Mucha gente lo hace sin darse cuenta, incluso dormida.',
    fx: ['tension'],
    feel: 'alerta',
    weights: { estres: 2, ansiedad: 1 },
    helps: ['aflojar'],
  },
  {
    id: 'llorar',
    area: 'cabeza',
    label: 'Ganas de llorar, o lloro sin saber por qué',
    why: 'Cuando cargas mucho, las lágrimas salen solas: es una forma en que el cuerpo suelta lo que ya no le cabe. Llorar no te hace débil.',
    fx: ['throat', 'dim'],
    feel: 'apagado',
    weights: { depresion: 2, estres: 1 },
    helps: ['nombrarlo', 'mano-pecho', 'escribir'],
  },
  {
    id: 'cabeza-golpe',
    area: 'cabeza',
    label: 'Un dolor de cabeza muy fuerte que llegó de golpe',
    fx: ['stress-brain'],
    feel: 'alerta',
    red: 'cerebro',
  },
  {
    id: 'vista-equilibrio',
    area: 'cabeza',
    label: 'De golpe dejé de ver bien, veo doble o no puedo caminar ni mantener el equilibrio',
    fx: ['dizzy'],
    feel: 'alerta',
    red: 'cerebro',
  },

  // Pensamientos
  {
    id: 'pensamientos',
    area: 'mente',
    label: 'Pensamientos que no paran',
    why: 'La mente busca el peligro para resolverlo y no encuentra cuándo parar. No eres tú: es la alarma.',
    fx: ['alarm-brain'],
    feel: 'alerta',
    weights: { ansiedad: 2, estres: 1 },
    helps: ['escribir', 'tierra'],
  },
  {
    id: 'miedo',
    area: 'mente',
    label: 'Miedo a que me pase algo o a perder el control',
    why: 'En un pico de ansiedad, la mente lee lo que siente el cuerpo como peligro. Ese miedo es parte del pánico, no un aviso de que algo vaya a pasar.',
    fx: ['alarm-brain', 'cycle'],
    feel: 'alerta',
    weights: { panico: 3, ansiedad: 1 },
    helps: ['nombrarlo', 'soltar-aire'],
  },
  {
    id: 'irreal',
    area: 'mente',
    label: 'Todo se siente irreal, como fuera de mí',
    why: 'Se llama desrealización: la mente le baja el volumen a todo cuando la alarma está muy alta. Asusta, pero pasa.',
    fx: ['dizzy'],
    feel: 'alerta',
    weights: { panico: 2, ansiedad: 1 },
    helps: ['tierra', 'frio'],
  },
  {
    id: 'sin-gusto',
    area: 'mente',
    label: 'Nada me da gusto',
    why: 'Se llama anhedonia y es uno de los síntomas principales de la depresión. No es un defecto tuyo ni falta de ganas, y mejora con tratamiento.',
    fx: ['sparkles-fade', 'dim'],
    feel: 'apagado',
    weights: { depresion: 3 },
    helps: ['moverse', 'mano-pecho'],
  },
  {
    id: 'no-siento',
    area: 'mente',
    label: 'No siento nada, como si me hubieran apagado por dentro',
    why: 'Cuando el dolor es mucho, la mente a veces le baja el volumen a todas las emociones para protegerte. No es que no te importe: es cansancio, y se va descongelando poco a poco.',
    fx: ['dim', 'sparkles-fade'],
    feel: 'apagado',
    weights: { depresion: 3 },
    helps: ['nombrarlo', 'tierra', 'moverse'],
  },
  {
    id: 'concentrar',
    area: 'mente',
    label: 'No me puedo concentrar, la cabeza nublada',
    why: 'Cuando la mente está cansada o en alerta todo el día, cuesta poner atención. Mejora al descansar y al bajar la carga.',
    fx: ['dim'],
    feel: 'apagado',
    weights: { depresion: 2, estres: 1, ansiedad: 1 },
    helps: ['escribir', 'moverse'],
  },
  {
    id: 'acelerada',
    area: 'mente',
    label: 'Mucha energía e ideas a mil; duermo poco y no me canso',
    why: 'Puede ser una subida de energía (hipomanía o manía). Se siente bien, pero conviene contárselo a un médico, sobre todo si tomas antidepresivos. Si ya llevas varios días casi sin dormir, haces cosas muy arriesgadas u oyes o crees cosas que otros no, busca ayuda pronto, sin esperar a la siguiente cita.',
    fx: ['mania', 'no-sleep'],
    feel: 'alerta',
    weights: { bipolar: 4 },
    helps: ['dormir'],
  },
  {
    id: 'dano',
    area: 'mente',
    label: 'Pienso en hacerme daño o en morir',
    fx: ['dim'],
    feel: 'apagado',
    red: 'crisis',
  },

  // Cuello y hombros
  {
    id: 'garganta',
    area: 'cuello',
    label: 'Nudo en la garganta o sensación de ahogo',
    why: 'Los músculos de la garganta se aprietan con la ansiedad o con las ganas de llorar, y se siente un nudo aunque no hay nada atorado. Si la comida se te atora o de verdad te cuesta tragar, eso no es ansiedad: que te revise un médico.',
    fx: ['throat'],
    feel: 'alerta',
    weights: { ansiedad: 2, depresion: 1 },
    helps: ['soltar-aire', 'panza'],
  },
  // «El nudo» de «Lo que no sale»: el llanto que se atora. Distinto del nudo de arriba (la
  // alarma de la ansiedad): este es el apagado, y no promete que llorar cure ni lo empuja.
  // Fuentes: Gračanin, Bylsma y Vingerhoets, 2014 (llorar alivia a muchos, menos en la
  // depresión); Lieberman y colegas, 2007 (ponerle nombre baja la intensidad).
  // Pendiente de revisión con psicóloga y médico.
  {
    id: 'llanto-atorado',
    area: 'cuello',
    label: 'Se me atora el llanto: lo que no sale se me queda en la garganta o el pecho',
    why: 'Cuando hay ganas de llorar y las lágrimas no salen, el cuerpo aprieta la garganta y el pecho y se queda con el nudo. No es que no te importe: a veces el cuerpo guarda todo bajo llave por un tiempo. No hay que forzar el llanto; soltar el aire despacio y ponerle palabras ayuda a no cargarlo a solas.',
    fx: ['throat', 'chest-weight'],
    feel: 'apagado',
    weights: { depresion: 2, estres: 1 },
    helps: ['soltar-aire', 'mano-pecho', 'escribir'],
  },
  {
    id: 'hombros',
    area: 'cuello',
    label: 'Cuello y hombros tensos o adoloridos',
    why: 'El cuerpo sube los hombros para protegerse. Si dura días, duelen y dan dolor de cabeza.',
    fx: ['tension'],
    feel: 'alerta',
    weights: { estres: 2, ansiedad: 1 },
    helps: ['aflojar'],
  },

  // Pecho
  {
    id: 'corazon',
    area: 'pecho',
    label: 'El corazón late muy rápido o muy fuerte',
    why: 'La adrenalina acelera el corazón para mandar sangre a los músculos. Es la alarma preparando al cuerpo, y baja cuando la alarma se apaga. Si late irregular, a saltos, y te desmayas o casi, que te revisen.',
    fx: ['heart-fast'],
    feel: 'alerta',
    weights: { panico: 2, ansiedad: 2 },
    helps: ['soltar-aire', 'frio'],
  },
  {
    id: 'aire',
    area: 'pecho',
    label: 'Siento que me falta el aire',
    why: 'Con la alarma respiras rápido y por arriba, y parece que no entra el aire aunque sí entra. Soltar despacio ayuda más que jalar aire.',
    fx: ['breath-fast'],
    feel: 'alerta',
    weights: { panico: 2, ansiedad: 2 },
    helps: ['soltar-aire', 'panza'],
  },
  {
    id: 'opresion',
    area: 'pecho',
    label: 'Pecho apretado o punzadas',
    why: 'Los músculos del pecho se tensan con la ansiedad y pueden dar punzadas o sentirse apretados.',
    fx: ['breath-fast'],
    feel: 'alerta',
    weights: { ansiedad: 2, panico: 1 },
    helps: ['soltar-aire', 'aflojar'],
  },
  {
    id: 'peso-pecho',
    area: 'pecho',
    label: 'Un peso o un vacío en el pecho',
    why: 'La tristeza también se siente en el cuerpo, muchas veces en el pecho.',
    fx: ['chest-weight'],
    feel: 'apagado',
    weights: { depresion: 2 },
    helps: ['mano-pecho', 'soltar-aire'],
  },
  {
    id: 'pecho-irradia',
    area: 'pecho',
    label: 'Dolor, presión o apretón en el pecho que dura más de unos minutos, o que se va al brazo, la mandíbula, el cuello o la espalda',
    fx: ['heart-fast'],
    feel: 'alerta',
    red: 'corazon',
  },
  {
    id: 'aire-no-mejora',
    area: 'pecho',
    label: 'Me falta tanto el aire que no puedo hablar, o tengo los labios morados o grises',
    fx: ['breath-fast'],
    feel: 'alerta',
    red: 'aire',
  },

  // Estómago y espalda
  {
    id: 'nudo',
    area: 'estomago',
    label: 'Nudo o mariposas en el estómago',
    why: 'Con la alarma, el cuerpo frena la digestión para ahorrar energía. Por eso se siente el nudo.',
    fx: ['stomach-knot'],
    feel: 'alerta',
    weights: { ansiedad: 2 },
    helps: ['panza', 'soltar-aire'],
  },
  {
    id: 'nausea',
    area: 'estomago',
    label: 'Náuseas o ganas de vomitar',
    why: 'El estómago y el cerebro están conectados por nervios: la ansiedad revuelve el estómago.',
    fx: ['stomach-knot'],
    feel: 'alerta',
    weights: { ansiedad: 1, panico: 1 },
    helps: ['panza', 'frio'],
  },
  {
    id: 'acidez',
    area: 'estomago',
    label: 'Acidez, colitis o dolor de estómago',
    why: 'El estrés no causa úlceras, pero sí empeora la acidez y la colitis. Si hay sangre en el vómito o en el baño, si bajas de peso sin querer o el dolor no se quita, que te revise un médico.',
    fx: ['gut'],
    feel: 'alerta',
    weights: { estres: 2, ansiedad: 1 },
    helps: ['panza'],
  },
  {
    id: 'apetito',
    area: 'estomago',
    label: 'Se me quitó el hambre, o como de más',
    why: 'El ánimo y el estrés cambian el apetito. Comer algo pequeño a sus horas le da al cuerpo un poco de orden. Si bajas de peso sin querer, coméntalo con tu médico.',
    fx: ['gut'],
    feel: 'apagado',
    weights: { depresion: 2, estres: 1 },
    helps: ['moverse'],
  },
  {
    id: 'espalda-baja',
    area: 'estomago',
    label: 'Dolor o tensión en la espalda baja',
    why: 'Con el estrés, los músculos de la espalda se quedan apretados por horas, como si cargaran algo. Aflojarlos y moverte un poco ayuda. Si el dolor baja por una pierna, viene con fiebre o no te deja caminar, que te revise un médico.',
    fx: ['tension'],
    feel: 'alerta',
    weights: { estres: 2, ansiedad: 1 },
    helps: ['aflojar', 'moverse'],
  },

  // Brazos y manos
  {
    id: 'hormigueo',
    area: 'brazos',
    label: 'Hormigueo en las manos o alrededor de la boca',
    why: 'Respirar rápido baja el dióxido de carbono de la sangre, y eso da hormigueo en los dedos y los labios. Se quita al soltar el aire despacio. Si es de un solo lado o viene con debilidad, es otra cosa: márcalo abajo.',
    fx: ['tingle'],
    feel: 'alerta',
    weights: { panico: 2, ansiedad: 1 },
    helps: ['soltar-aire'],
  },
  {
    id: 'temblor',
    area: 'brazos',
    label: 'Manos que tiemblan o sudan',
    why: 'La adrenalina prepara los músculos para moverse rápido; por eso tiemblan y sudan.',
    fx: ['tremble'],
    feel: 'alerta',
    weights: { ansiedad: 2, panico: 1 },
    helps: ['frio', 'soltar-aire'],
  },
  {
    id: 'brazos-pesados',
    area: 'brazos',
    label: 'Brazos pesados, sin fuerza',
    why: 'Con la depresión el cuerpo entra en modo ahorro y todo se siente pesado.',
    fx: ['heavy'],
    feel: 'apagado',
    weights: { depresion: 2 },
    helps: ['moverse'],
  },
  {
    id: 'un-lado',
    area: 'brazos',
    label: 'Debilidad o adormecimiento de un solo lado, la boca chueca o me cuesta hablar',
    fx: ['nerves'],
    feel: 'alerta',
    red: 'cerebro',
  },

  // Piernas
  {
    id: 'piernas-pesadas',
    area: 'piernas',
    label: 'Piernas pesadas, como de plomo',
    why: 'Es el mismo modo ahorro: moverse cuesta el doble. No es flojera.',
    fx: ['heavy'],
    feel: 'apagado',
    weights: { depresion: 2 },
    helps: ['moverse'],
  },
  {
    id: 'inquietud',
    area: 'piernas',
    label: 'Inquietud: necesito moverme',
    why: 'La energía de la alarma busca salir, muchas veces por las piernas. Si empezó al iniciar o cambiar un medicamento, coméntalo con quien te lo recetó, sin dejarlo por tu cuenta.',
    fx: ['restless'],
    feel: 'alerta',
    weights: { ansiedad: 2, bipolar: 1 },
    helps: ['moverse', 'soltar-aire'],
  },
  {
    id: 'piernas-flojas',
    area: 'piernas',
    label: 'Piernas flojas o temblorosas',
    why: 'Después de un pico de adrenalina las piernas se sienten como gelatina. Siéntate un momento: pasa.',
    fx: ['restless'],
    feel: 'alerta',
    weights: { panico: 2 },
    helps: ['tierra'],
  },

  // Todo el cuerpo
  {
    id: 'cansancio',
    area: 'todo',
    label: 'Cansancio que no se quita durmiendo',
    why: 'El cansancio de la depresión o del estrés largo no es flojera: el cuerpo está gastado. Si dura semanas, vale la pena revisar también la tiroides, la anemia o si roncas fuerte (apnea del sueño).',
    fx: ['heavy', 'dim'],
    feel: 'apagado',
    weights: { depresion: 2, estres: 1 },
    helps: ['moverse'],
  },
  {
    id: 'dolor-todo',
    area: 'todo',
    label: 'Me duele todo el cuerpo, sin saber de qué',
    why: 'La tristeza larga y el estrés hacen que el cuerpo aguante menos el dolor: duele de verdad, no te lo imaginas. Si viene con fiebre, empezó de golpe o no se quita, que te revise un médico.',
    fx: ['heavy', 'tension'],
    feel: 'apagado',
    weights: { depresion: 2, estres: 2 },
    helps: ['moverse', 'aflojar', 'dormir'],
  },
  {
    id: 'mucho-sueno',
    area: 'todo',
    label: 'Solo quiero dormir',
    why: 'Dormir de más es un síntoma frecuente de la depresión. También puede venir de un medicamento, de la tiroides o de la apnea del sueño: coméntalo en tu consulta.',
    fx: ['heavy'],
    feel: 'apagado',
    weights: { depresion: 2 },
    helps: ['moverse'],
  },
  {
    id: 'mal-sueno',
    area: 'todo',
    label: 'Duermo mal o despierto sin descansar',
    why: 'Con la alarma encendida, el cuerpo no termina de bajar la guardia ni dormido.',
    fx: ['sleep-bad'],
    feel: 'alerta',
    weights: { estres: 2, ansiedad: 1, depresion: 1 },
    helps: ['dormir'],
  },
  {
    id: 'calor-frio',
    area: 'todo',
    label: 'Calor, sudor o escalofríos',
    why: 'La adrenalina cambia cómo circula la sangre: da bochornos o escalofríos.',
    fx: ['tremble'],
    feel: 'alerta',
    weights: { panico: 1, ansiedad: 1 },
    helps: ['frio', 'soltar-aire'],
  },
  {
    id: 'en-alerta',
    area: 'todo',
    label: 'Todo el cuerpo tenso, en alerta',
    why: 'Es el cuerpo listo para defenderse: los nervios mandan la señal a todos los músculos a la vez.',
    fx: ['tension', 'nerves'],
    feel: 'alerta',
    weights: { ansiedad: 2, estres: 2 },
    helps: ['aflojar', 'suspiro'],
  },
  {
    id: 'desmayo',
    area: 'todo',
    label: 'Me desmayé (perdí el conocimiento)',
    fx: ['dizzy'],
    feel: 'apagado',
    red: 'desmayo',
  },
]

// Cada explicación va en tres tiempos, corta: primero reconoce lo que se siente, luego
// explica en sencillo y al final da ánimo. La dice la mascota de la persona, si tiene.
// Antes de cambiarlas, que las revise un psicólogo.
export const PATTERNS: Record<Pattern, { label: string; title: string; feel: string; text: string; cheer: string }> = {
  ansiedad: {
    label: 'ansiedad',
    title: 'La alarma de la ansiedad',
    feel: 'Vivir con esa sensación de que algo malo va a pasar cansa muchísimo. No lo estás inventando.',
    text: 'Tu cuerpo encendió su alarma para protegerte de un peligro que no está. Por eso se aceleran el corazón, la respiración y los músculos.',
    cheer: 'Tu cuerpo no está en tu contra: te está cuidando de más. Y esa alarma se puede bajar.',
  },
  panico: {
    label: 'pánico',
    title: 'Un pico de pánico',
    feel: 'Sé que da muchísimo miedo. No estás exagerando y no es locura: tu alarma se encendió con toda su fuerza.',
    text: 'Asusta, pero no es peligroso: sube, llega a lo más alto y casi siempre baja sola en 5 a 20 minutos.',
    cheer: 'No tienes que pelear con ella. Vamos a bajarle, paso a paso.',
  },
  estres: {
    label: 'estrés',
    title: 'Estrés acumulado',
    feel: 'Llevas tiempo cargando mucho, y tiene sentido que ya lo sientas en el cuerpo.',
    text: 'Cuando la presión no para, el cuerpo se queda en alerta: se tensa, el estómago lo resiente y dormir deja de descansar.',
    cheer: 'No es debilidad: es una señal de que necesitas un respiro. Dártelo también es avanzar.',
  },
  depresion: {
    label: 'ánimo bajo',
    title: 'El cansancio del ánimo bajo',
    feel: 'Si hoy hasta levantarte costó, no es flojera ni falta de ganas.',
    text: 'Tu cuerpo entró en modo ahorro: todo pesa y cuesta más. Así se siente la depresión en el cuerpo.',
    cheer: 'No es tu culpa y no se queda así: la depresión se trata, y cada paso pequeño cuenta, aunque hoy no lo parezca.',
  },
  bipolar: {
    label: 'energía muy alta',
    title: 'Energía muy alta',
    feel: 'Tanta energía puede sentirse bien, y por eso cuesta darse cuenta.',
    text: 'Mucha energía, ideas a mil y dormir poco sin cansarse pueden ser una subida (hipomanía o manía).',
    cheer: 'Contárselo a un médico es cuidarte, sobre todo si tomas antidepresivos: el tratamiento es distinto, y con él muchas personas viven estables.',
  },
}

export const HELPS: Record<HelpId, { title: string; text: string; to?: string; action?: string }> = {
  'soltar-aire': {
    title: 'Suelta el aire más largo',
    text: 'Toma aire por la nariz y suéltalo despacio por la boca, como si apagaras una vela lejos. Que soltar dure más que tomar: eso le avisa al cuerpo que no hay peligro.',
  },
  suspiro: {
    title: 'El suspiro doble',
    text: 'Dos tomas de aire cortas por la nariz, una tras otra, y una salida larga por la boca. Repítelo de tres a cinco veces.',
  },
  frio: {
    title: 'Algo frío',
    text: 'Agua fría en la cara y las muñecas, o algo frío en las manos. Ayuda a bajar el ritmo del corazón. Si tienes un problema del corazón o tomas medicamento para el corazón, mejor quédate con la respiración.',
  },
  tierra: {
    title: 'Pies en el suelo',
    text: 'Si hay mareo, siéntate. Siente el piso bajo tus pies y nombra cinco cosas que ves, cuatro que oyes y tres que puedes tocar.',
    to: '/calma',
    action: 'Ejercicio 5-4-3-2-1',
  },
  aflojar: {
    title: 'Afloja donde está la tensión',
    text: 'Aprieta esa zona cinco segundos, sin lastimarte, y suéltala despacio. El músculo nota la diferencia y se queda más suelto.',
    to: '/cuerpo#aflojar',
    action: 'Aflojar juntos',
  },
  panza: {
    title: 'Respira con la panza',
    text: 'Una mano en el pecho y otra en la panza: que se mueva la de la panza, despacio. Unos sorbos de agua tibia o de un té sin cafeína, como manzanilla, también ayudan.',
  },
  moverse: {
    title: 'Un movimiento pequeño',
    text: 'Párate, estírate, abre la ventana o camina dos minutos. No hace falta tener ganas: muchas veces las ganas llegan después.',
    to: '/mi-dia',
    action: 'Un día a la vez',
  },
  escribir: {
    title: 'Sácalo de la cabeza',
    text: 'Escribe o di en voz alta lo que da vueltas. Fuera de la cabeza, pesa menos.',
    to: '/diario',
    action: 'Escribirlo',
  },
  dormir: {
    title: 'Preparar el descanso',
    text: 'Acuéstate cuando tengas sueño y levántate a la misma hora todos los días. Si en unos 20 minutos no te duermes, levántate a hacer algo tranquilo con luz baja y regresa cuando te dé sueño. Nada de café ni té en las 6 horas antes.',
    to: '/noche',
    action: 'No puedo dormir',
  },
  nombrarlo: {
    title: 'Ponle nombre',
    text: 'Dite: «Esto es ansiedad. Es incómodo, pero no es peligroso, y va a pasar». Nombrarlo le quita fuerza al miedo.',
    to: '/panico',
    action: 'Guía de pánico',
  },
  'mano-pecho': {
    title: 'Una mano en el pecho',
    text: 'Pon una mano en el pecho, siente el calor y respira despacio. Dite algo amable, como se lo dirías a alguien que quieres.',
  },
}

/** Señales que no conviene atender solo con la app. El tono es calmado, pero claro. */
export const RED_FLAGS: Record<Exclude<RedFlag, 'crisis'>, { title: string; text: string; urgent: boolean }> = {
  cerebro: {
    title: 'Esto necesita atención ahora',
    text: 'Debilidad de un lado, la boca chueca, dificultad para hablar, perder la vista o el equilibrio de golpe, o un dolor de cabeza de golpe pueden venir del cerebro. Cada minuto cuenta: llama a emergencias o pide a alguien que llame por ti, y no manejes. Fíjate a qué hora empezó. Aunque se quite en unos minutos, avisa a un médico ese mismo día.',
    urgent: true,
  },
  corazon: {
    title: 'Llama a emergencias ahora',
    text: 'Puede ser ansiedad, pero también puede venir del corazón, y eso no se puede saber desde aquí. Lo más seguro es llamar ya, sin esperar a que se quite, y no manejar.',
    urgent: true,
  },
  aire: {
    title: 'Llama a emergencias ahora',
    text: 'Cuando falta tanto el aire que no puedes hablar, o los labios se ven morados o grises, el cuerpo necesita atención de inmediato.',
    urgent: true,
  },
  desmayo: {
    title: 'Que te revise un médico hoy',
    text: 'En el pánico es común sentir que te vas a desmayar, pero desmayarse de verdad es raro y puede tener otras causas. Que te revisen, aunque ya te sientas bien. Llama a emergencias si te golpeaste fuerte, si pasó haciendo ejercicio o en la cama, o si tuviste dolor de pecho o el corazón irregular.',
    urgent: false,
  },
}

export const INTENSITY = [
  { value: 1, label: 'Poquito' },
  { value: 2, label: 'Algo' },
  { value: 3, label: 'Bastante' },
  { value: 4, label: 'Mucho' },
  { value: 5, label: 'Casi no lo aguanto' },
] as const

export type Duration = 'ahora' | 'hoy' | 'dias' | 'semanas'
export const DURATIONS: { id: Duration; label: string }[] = [
  { id: 'ahora', label: 'Ahorita' },
  { id: 'hoy', label: 'Desde hoy' },
  { id: 'dias', label: 'Varios días' },
  { id: 'semanas', label: 'Semanas o más' },
]

export type Band = 'suave' | 'medio' | 'fuerte'
export const BANDS: Record<Band, { label: string; text: Record<Feel, string> }> = {
  suave: {
    label: 'Suave',
    text: {
      alerta: 'Tu cuerpo está un poco alerta. Se puede bajar aquí mismo.',
      apagado: 'Tu cuerpo está un poco apagado. Algo pequeño puede ayudar.',
    },
  },
  medio: {
    label: 'Medio',
    text: {
      alerta: 'Tu cuerpo está alerta. Vamos a bajarle juntos, poco a poco.',
      apagado: 'Tu cuerpo está cargando bastante. Vamos despacio, sin exigirte.',
    },
  },
  fuerte: {
    label: 'Fuerte',
    text: {
      alerta: 'Tu cuerpo está muy alerta. Primero respira conmigo; después, si quieres, buscamos a alguien que te acompañe.',
      apagado: 'Está pesando mucho. No tienes que poder con todo hoy: primero un respiro, y después, si quieres, buscamos a alguien que te acompañe.',
    },
  },
}

// ---------- Marca dónde y qué tan grande ----------
// Pendiente de revisión con psicóloga. Después de respirar se le pregunta a la persona
// cómo siente lo que marcó: la marca solo se achica si ella lo dice (nunca se da por hecho).

/** Qué tan grande se siente ahora lo que marcó, comparado con antes. */
export const SPOT_AFTER = [
  { id: 'casi-nada', label: 'Ya casi no lo siento', scale: 0.35 },
  { id: 'chica', label: 'Más chico', scale: 0.65 },
  { id: 'igual', label: 'Igual', scale: 1 },
  { id: 'grande', label: 'Más grande', scale: 1.25 },
] as const

/** El tamaño de una marca, dicho en palabras (para el resumen de la consulta). */
export const spotSize = (r: number) => (r < 12 ? 'chico' : r < 22 ? 'mediano' : 'grande')

// ---------- Así lo pintaron 700 personas ----------
// Mapas aproximados, dibujados por nosotros, a partir de la figura 2 de Nummenmaa, Glerean,
// Hari y Hietanen (2014), «Bodily maps of emotions», PNAS 111(2):646-651,
// https://pmc.ncbi.nlm.nih.gov/articles/PMC3896150/ . 701 personas de Finlandia, Suecia y
// Taiwán pintaron dónde sentían más actividad (cálido) o menos (frío) con cada emoción.
// Lo que dice el artículo: casi todas se sienten en la parte alta del pecho y en la cabeza; el
// enojo se suma en brazos y manos; la tristeza se define por menos actividad en brazos y
// piernas (la depresión se agrupó con ella); la ansiedad se parece al miedo y se agrupó con
// la vergüenza. Son sensaciones que la gente reporta, no órganos: sirve para validar, nunca
// para diagnosticar. Pendiente de revisión con psicóloga.

export type EmotionId = 'miedo' | 'tristeza' | 'enojo' | 'verguenza'
/** De −1 (mucho menos) a 1 (mucho más), por parte del cuerpo. */
export type EmotionZone = 'cara' | 'cabeza' | 'garganta' | 'pecho' | 'panza' | 'brazos' | 'manos' | 'piernas'

export const EMOTIONS: Record<EmotionId, { label: string; map: Record<EmotionZone, number>; says: string; where: Region[] }> = {
  miedo: {
    label: 'Miedo y ansiedad',
    map: { cara: 0.5, cabeza: 0.55, garganta: 0.35, pecho: 0.95, panza: 0.45, brazos: 0.2, manos: 0.15, piernas: 0 },
    says: 'Mucha gente siente el miedo y la ansiedad sobre todo en el pecho y en la cabeza, y a veces en la panza.',
    where: ['pecho', 'cabeza', 'estomago'],
  },
  tristeza: {
    label: 'Tristeza',
    map: { cara: 0.45, cabeza: 0.25, garganta: 0.3, pecho: 0.45, panza: 0, brazos: -0.65, manos: -0.55, piernas: -0.8 },
    says: 'Mucha gente siente la tristeza como brazos y piernas sin fuerza, con algo apretado en el pecho y los ojos.',
    where: ['brazos', 'piernas', 'pecho'],
  },
  enojo: {
    label: 'Enojo',
    map: { cara: 0.85, cabeza: 0.8, garganta: 0.45, pecho: 0.8, panza: 0.3, brazos: 0.75, manos: 0.95, piernas: 0.1 },
    says: 'Mucha gente siente el enojo en la cabeza, el pecho, los brazos y las manos.',
    where: ['cabeza', 'pecho', 'brazos'],
  },
  verguenza: {
    label: 'Vergüenza',
    map: { cara: 0.95, cabeza: 0.55, garganta: 0.3, pecho: 0.5, panza: 0.25, brazos: -0.1, manos: 0, piernas: -0.15 },
    says: 'Mucha gente siente la vergüenza como calor en la cara, y algo en el pecho.',
    where: ['cabeza', 'pecho'],
  },
}
