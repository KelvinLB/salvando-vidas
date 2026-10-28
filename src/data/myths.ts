// Lo que circula en grupos y redes sobre la depresión y la ansiedad. Se comparte
// con cariño, así que se responde sin burla, sin nombrar marcas ni personas, y
// siempre con un paso concreto. Antes de publicar cambios, que lo revise un médico.

export type Myth = { id: string; said: string; known: string; to?: string; action?: string }

export const MYTHS: Myth[] = [
  {
    id: 'cortisol',
    said: '«Seguro es el cortisol alto»',
    known:
      'El cansancio, el insomnio, la ansiedad, la irritabilidad y la falta de concentración también son síntomas de la depresión y la ansiedad. Los problemas reales de cortisol son poco comunes y se confirman con estudios específicos. Si te preocupa, pídele al médico que lo revise antes de comprar productos para «bajar el cortisol».',
  },
  {
    id: 'vitaminas',
    said: '«Te faltan vitaminas, chécate»',
    known:
      'Este consejo tiene algo de razón: la anemia, la tiroides o la falta de vitamina D o B12 pueden causar cansancio y ánimo bajo. Se revisa con un análisis de sangre sencillo. Lo seguro es hacerse los estudios con un médico, no tomar vitaminas a ciegas.',
    to: '/especialista',
    action: 'Preparar mi consulta',
  },
  {
    id: 'parasitos',
    said: '«Desparasítate»',
    known:
      'No hay pruebas de que desparasitarse quite la depresión o la ansiedad. Tomar desparasitantes sin que un médico lo indique no ayuda con lo que sientes.',
  },
  {
    id: 'suplementos',
    said: '«Con este suplemento ando como pirinola»',
    known:
      'Lo que a otra persona le funcionó puede no servirte a ti, y algunos productos «naturales» se mezclan mal con los antidepresivos. La hierba de San Juan, por ejemplo, puede ser peligrosa junto con ellos. Si tomas tratamiento, pregunta antes de tomar cualquier suplemento o producto por catálogo.',
  },
  {
    id: 'te',
    said: '«Tómate un té de manzanilla»',
    known:
      'Un té calientito puede ser un buen ritual para calmarte, y está bien disfrutarlo. Acompaña, pero no sustituye el tratamiento. Si tomas medicamentos, pregunta antes de tomar cápsulas o extractos de hierbas, que son mucho más fuertes que un té.',
  },
  {
    id: 'ejercicio',
    said: '«Haz ejercicio y se te quita»',
    known:
      'Moverse sí ayuda, y hay buena evidencia de ello, sobre todo como parte del tratamiento. Empieza con algo muy pequeño, como caminar 10 minutos. Pero si no puedes ni levantarte, no es pereza: es la depresión, y merece atención.',
    to: '/mi-dia',
    action: 'Un plan pequeño para mañana',
  },
  {
    id: 'obligarse',
    said: '«Oblígate. Échale ganas.»',
    known:
      'La depresión no es falta de voluntad. Exigirse todo de golpe agota más. Lo que sí funciona son pasos pequeños, planeados con anticipación y con un premio al final.',
    to: '/mi-dia',
    action: 'Un día a la vez',
  },
  {
    id: 'fe',
    said: '«Si tuvieras fe no estarías así»',
    known:
      'La depresión le pasa a personas de mucha fe. Para muchas, la fe es un gran apoyo, y puede ir de la mano de la terapia y del medicamento. Pedir ayuda no es falta de fe.',
  },
  {
    id: 'hormonas',
    said: '«La terapia hormonal me cambió la vida»',
    known:
      'Los cambios hormonales (después del parto, antes de la menopausia, problemas de tiroides) sí pueden causar o empeorar la depresión y la ansiedad. Si crees que es tu caso, coméntalo con tu médico o ginecóloga. No tomes hormonas por tu cuenta.',
    to: '/especialista',
    action: 'Preparar mi consulta',
  },
  {
    id: 'sueno',
    said: '«Me duermo hasta platicando, voy a tomar más café»',
    known:
      'Quedarse dormido sin querer durante el día no es normal ni flojera. Puede ser un efecto del medicamento, apnea del sueño, la tiroides o anemia. Díselo al médico antes de taparlo con café.',
    to: '/especialista',
    action: 'Preparar mi consulta',
  },
  {
    id: 'ira',
    said: '«El enojo te encoge el cerebro»',
    known:
      'El estrés y el enojo que duran mucho sí desgastan al cuerpo y a la mente, pero no es para asustarse: con descanso y tratamiento, el cuerpo y el cerebro se recuperan. Lo importante es no cargarlo sin ayuda.',
    to: '/enojo',
    action: 'Soltar el enojo',
  },
  {
    id: 'musculos',
    said: '«Cada músculo guarda una emoción»',
    known:
      'Las emociones sí se sienten en el cuerpo, como tensión en la mandíbula, los hombros o el pecho. Pero no hay un músculo para cada emoción. Lo que ayuda es aflojar donde notes la tensión.',
    to: '/cuerpo#aflojar',
    action: 'Aflojar el cuerpo',
  },
  {
    id: 'infarto',
    said: '«Si ya te revisaron el corazón, es pura ansiedad»',
    known:
      'Es cierto que un ataque de pánico se siente como un infarto: el corazón a mil, el brazo dormido, mareo. Si ya te revisaron y salió bien, recordarlo ayuda mucho en la crisis. Pero si es la primera vez o los síntomas son distintos, ir a urgencias no es exagerar.',
    to: '/panico',
    action: 'Guía de pánico',
  },
]
