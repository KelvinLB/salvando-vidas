import type { Story } from './bodyStories'

// «Por dentro»: cómo trabaja el cuerpo por sistemas, para quien ya vio qué pasa con la
// ansiedad o la depresión y quiere entender el porqué. Cada tema lleva un dibujo chico que
// muestra el proceso (src/components/cuerpo-info) y termina en algo que hacer.
// Se cuenta con «suele», «puede» y «en algunas personas»: se explica, no se diagnostica.
// Pendiente de revisión con psicóloga y médico: todos los textos de este archivo son de
// salud física. La investigación completa está en la propuesta «Tu cuerpo, versión 2».

const AIR_NOTE =
  'Si la falta de aire es nueva, distinta a otras veces, o viene con dolor de pecho, labios morados o desmayo, ve a urgencias. Ir a revisarte no es exagerar.'

const GUT_NOTE =
  'Si hay sangre en las heces o en el vómito, bajas de peso sin querer, el dolor te despierta de noche o hay fiebre, ve al médico: eso hay que revisarlo.'

const PAIN_NOTE = 'Si un dolor es nuevo, muy fuerte o no se quita, que te revise un médico: no todo dolor viene del ánimo.'

export const TOPICS: Story[] = [
  {
    // Fuentes: Harvard Health, «Understanding the stress response» (adrenalina en segundos,
    // eje HPA y cortisol); Fries et al. 2009, Int J Psychophysiol (ritmo del cortisol: alto al
    // despertar, lo más bajo cerca de la medianoche); NHS, ansiedad y pánico (el pánico llega a
    // lo más alto y baja). No se dice «cortisol alto» como diagnóstico: ya está el mito `cortisol`.
    id: 'alarmas',
    label: 'Dos alarmas',
    group: 'dentro',
    tone: 'estres',
    intro: 'Tu cuerpo tiene dos alarmas: una rápida, que se prende y se apaga en minutos, y una lenta, que acompaña los días de estrés.',
    steps: [
      {
        title: 'La rápida: adrenalina',
        text: 'Llega en segundos: acelera el corazón y la respiración y te pone en alerta. Se gasta en minutos, por eso el pánico sube, llega a lo más alto y baja.',
        tone: 'alarma',
        focus: 'pecho',
        fx: ['alarm-brain', 'nerves', 'heart-fast'],
        viz: { id: 'alarmas', mode: 'chispazo' },
      },
      {
        title: 'La lenta: cortisol',
        text: 'Unas glándulas sobre los riñones sueltan cortisol. No es malo: te ayuda a despertar. Suele estar alto en la mañana y bajar en la noche, para dejarte dormir.',
        focus: 'estomago',
        fx: ['cortisol'],
        viz: { id: 'alarmas', mode: 'dia' },
      },
      {
        title: 'Con semanas de estrés',
        text: 'Si la presión dura semanas, la alarma lenta se queda encendida en bajito y su ritmo se puede desacomodar: en la noche no baja tanto, y cuesta dormir y descansar.',
        focus: 'cabeza',
        fx: ['stress-brain', 'cortisol', 'sleep-bad'],
        viz: { id: 'alarmas', mode: 'semanas' },
        links: [{ to: '/redes', label: '¿Y el cortisol alto?' }],
      },
      {
        // Luz de la mañana: Burns et al. 2023, Nat Ment Health (observacional, secundaria).
        title: 'Cómo se acomodan',
        text: 'A las dos les ayuda lo mismo: soltar el aire despacio, moverte, salir un rato a la luz de la mañana y dormir a la misma hora. Con descanso, el cuerpo se recupera.',
        tone: 'calma',
        fx: ['breath-slow', 'heart-calm'],
        viz: { id: 'alarmas', mode: 'dia' },
        links: [
          { to: '/calma', label: 'Respirar ahora' },
          { to: '/mi-dia', label: 'Un día a la vez' },
        ],
      },
    ],
  },
  {
    // Fuentes: MedlinePlus, hiperventilación; Meuret y Ritz 2010, Int J Psychophysiol (el CO₂
    // bajo tiene un papel en el pánico y subirlo con respiración guiada baja los síntomas);
    // Callaham 1989, Ann Emerg Med (riesgos de la bolsa de papel).
    id: 'aire',
    label: 'La cadena del aire',
    group: 'dentro',
    tone: 'alarma',
    intro: 'Cuando respiras rápido no te falta oxígeno: estás sacando de más otro gas. De ahí salen el mareo y el hormigueo.',
    steps: [
      {
        title: 'Respiras rápido y por arriba',
        text: 'Con los nervios, la respiración se acelera. Cada vez que sueltas el aire se va un gas que el cuerpo necesita guardar un poco: el dióxido de carbono, o CO₂.',
        focus: 'pecho',
        fx: ['alarm-brain', 'breath-fast'],
        viz: { id: 'aire', mode: 'rapido' },
      },
      {
        title: 'Baja el CO₂ y llega el mareo',
        text: 'Con menos CO₂, los vasos del cerebro se estrechan un poco y llega algo menos de sangre: por eso la cabeza se siente ligera. El cambio también toca a los nervios, y hormiguean los dedos y la boca.',
        focus: 'cabeza',
        fx: ['breath-fast', 'dizzy', 'tingle'],
        viz: { id: 'aire', mode: 'cadena' },
      },
      {
        title: '¿Y la bolsa de papel?',
        text: 'Antes se usaba, pero ya no se recomienda: puede bajar demasiado el oxígeno, y si la falta de aire viene en realidad del corazón o de los pulmones, es peligroso. Hay una forma más segura de recuperar el CO₂.',
        tone: 'estres',
        focus: 'pecho',
        fx: ['breath-fast'],
        note: AIR_NOTE,
      },
      {
        title: 'Soltar despacio, no jalar más',
        text: 'Suelta el aire más largo de lo que lo tomas. Así el CO₂ regresa a su nivel, y el mareo y el hormigueo se apagan solos. Asusta, pero no es peligroso.',
        tone: 'calma',
        focus: 'pecho',
        fx: ['breath-slow', 'heart-calm'],
        viz: { id: 'aire', mode: 'lento' },
        links: [{ to: '/calma', label: 'Respirar ahora' }],
      },
    ],
  },
  {
    // Fuentes: Harvard Health, «The gut-brain connection» (las dos direcciones; la terapia
    // mejora los síntomas digestivos); Taché y Bonaz 2007, J Clin Invest (con el estrés, el CRF
    // frena el estómago y acelera el colon); NIDDK, síndrome del intestino irritable (trastorno
    // de la interacción intestino-cerebro; la comida avanza muy rápido o muy lento).
    id: 'panza',
    label: 'Intestino y cerebro',
    group: 'dentro',
    tone: 'estres',
    intro: 'El intestino y el cerebro platican todo el tiempo, en las dos direcciones. Por eso los nervios se sienten en la panza.',
    steps: [
      {
        title: 'De la cabeza a la panza',
        text: 'Con el estrés, el cerebro manda una señal que frena el estómago (náusea, llenura, nudo) y acelera el intestino (ganas de ir al baño). Por eso puedes tener las dos cosas al mismo tiempo.',
        focus: 'estomago',
        fx: ['stress-brain', 'stomach-knot', 'gut'],
        viz: { id: 'panza', mode: 'baja' },
      },
      {
        title: 'Y de regreso',
        text: 'La plática también va hacia arriba: un intestino irritado le manda señales al cerebro, y eso puede subir los nervios o bajar el ánimo.',
        focus: 'cabeza',
        fx: ['gut', 'stress-brain'],
        viz: { id: 'panza', mode: 'sube' },
      },
      {
        title: 'El colon irritable es real',
        text: 'No «está en tu cabeza»: se llama trastorno de la interacción intestino-cerebro. La comida avanza muy rápido o muy lento y el intestino se vuelve más sensible. Tiene tratamiento, y la terapia también ayuda.',
        focus: 'estomago',
        fx: ['gut'],
        viz: { id: 'panza', mode: 'ambas' },
        note: GUT_NOTE,
      },
      {
        title: 'Calmar una ayuda a la otra',
        text: 'Calmar la mente ayuda a la panza, y cuidar la panza ayuda a la mente: soltar el aire despacio, comer a tus horas y, si dura, buscar a alguien que te acompañe.',
        tone: 'calma',
        focus: 'estomago',
        fx: ['breath-slow', 'heart-calm'],
        viz: { id: 'panza', mode: 'calma' },
        links: [
          { to: '/calma', label: 'Respirar ahora' },
          { to: '/especialista', label: 'Ir al especialista' },
        ],
      },
    ],
  },
  {
    // Fuentes: Riemann et al. 2020, Neuropsychopharmacology, y Palagini et al. 2013, Sleep Med
    // Rev (en la depresión: sueño más cortado, menos sueño profundo y REM más temprano; no sirve
    // para diagnosticar); Yoo et al. 2007, Curr Biol (tras una noche sin dormir la amígdala
    // reacciona más; secundaria, por eso no se da la cifra); NIMH, folleto de la depresión.
    id: 'sueno',
    label: 'La escalera del sueño',
    group: 'dentro',
    tone: 'animo',
    intro: 'El sueño no es parejo: cada noche baja y sube por escalones varias veces, y cada escalón hace algo distinto.',
    steps: [
      {
        title: 'Una noche tranquila',
        text: 'El sueño tiene etapas, como escalones: ligero, profundo (el que repara el cuerpo) y el de los sueños, que se llama REM. En una noche tranquila, el profundo llega al principio.',
        tone: 'calma',
        focus: 'cabeza',
        fx: ['breath-slow'],
        viz: { id: 'sueno', mode: 'tranquila' },
      },
      {
        title: 'Una noche con estrés',
        text: 'Con el estrés o la depresión, el sueño suele cortarse más, el profundo se acorta y el de los sueños llega antes. Por eso puedes dormir horas y despertar sin descansar.',
        focus: 'cabeza',
        fx: ['stress-brain', 'sleep-bad'],
        viz: { id: 'sueno', mode: 'estres' },
      },
      {
        title: 'Al otro día, la alarma está más sensible',
        text: 'Después de una mala noche, la alarma del cerebro reacciona más y a la parte que la calma le cuesta más trabajo. No es que seas más débil: es el cansancio.',
        tone: 'alarma',
        focus: 'cabeza',
        fx: ['alarm-brain', 'sleep-bad'],
      },
      {
        title: 'Cómo ayudarle a la escalera',
        text: 'Levantarte siempre a la misma hora, la luz de la mañana y una noche tranquila ayudan a que el sueño profundo regrese. Si dura semanas, el insomnio se trata, y la terapia funciona.',
        tone: 'calma',
        fx: ['breath-slow', 'heart-calm'],
        viz: { id: 'sueno', mode: 'tranquila' },
        links: [{ to: '/noche', label: 'Prepararme para dormir' }],
      },
    ],
  },
  {
    // Fuentes: Bair et al. 2003, Arch Intern Med (depresión y dolor comparten vías nerviosas y
    // neurotransmisores, y cada uno empeora al otro); NIMH, folleto de la depresión (dolores sin
    // causa física clara); Mayo Clinic, «Depression and anxiety: exercise eases symptoms» (10 a
    // 15 minutos cuentan).
    id: 'dolor',
    label: 'El volumen del dolor',
    group: 'dentro',
    tone: 'animo',
    intro: 'Con la tristeza larga, a veces todo duele más. No es imaginación: el dolor y el ánimo comparten caminos.',
    steps: [
      {
        title: 'Un control de volumen',
        text: 'El cerebro tiene algo parecido a una perilla que sube o baja el volumen de lo que duele. Las señales del cuerpo pasan por ahí antes de sentirse.',
        focus: 'cabeza',
        fx: ['nerves'],
        viz: { id: 'dolor', mode: 'medio' },
      },
      {
        title: 'Con el ánimo bajo, el volumen sube',
        text: 'La depresión y el dolor usan caminos parecidos en los nervios. Con la tristeza larga y el estrés, la perilla se queda más alta: duelen la cabeza, la espalda o la panza, y duele de verdad.',
        focus: 'cuello',
        fx: ['dim', 'tension'],
        viz: { id: 'dolor', mode: 'alto' },
      },
      {
        title: 'Y el dolor baja el ánimo',
        text: 'Funciona en los dos sentidos: un dolor que dura también cansa y entristece. Por eso conviene contarle al médico las dos cosas, el dolor y el ánimo.',
        focus: 'piernas',
        fx: ['dim', 'heavy', 'cycle'],
        note: PAIN_NOTE,
      },
      {
        title: 'Lo que le baja el volumen',
        text: 'Moverte un poco, dormir mejor y tratar la depresión suelen bajar la perilla. Caminar, estirarte o bailar cuentan, aunque sean 10 minutos.',
        tone: 'calma',
        focus: 'piernas',
        fx: ['breath-slow', 'heart-calm'],
        viz: { id: 'dolor', mode: 'bajo' },
        links: [
          { to: '/mi-dia', label: 'Un paso pequeño' },
          { to: '/especialista', label: 'Ir al especialista' },
        ],
      },
    ],
  },
  {
    // Fuentes: NIMH, folleto de la depresión («fatiga, falta de energía o sentirse más lento»;
    // el sueño, el apetito y la concentración suelen mejorar antes que el ánimo).
    id: 'lento',
    label: 'En cámara lenta',
    group: 'dentro',
    tone: 'animo',
    intro: 'Con la depresión, moverte, hablar o pensar puede sentirse en cámara lenta. Es un síntoma, no flojera.',
    steps: [
      {
        title: 'Todo va más despacio',
        text: 'Pararte, contestar un mensaje o decidir qué comer puede tardar más y pesar más, como caminar dentro del agua. Le pasa a muchas personas con depresión.',
        focus: 'piernas',
        fx: ['dim', 'heavy'],
        viz: { id: 'lento', mode: 'lento' },
      },
      {
        title: 'No es falta de ganas',
        text: 'Es el modo ahorro del cuerpo: el cerebro baja la energía para todo, y lo pequeño se siente enorme. No tiene que ver con tu voluntad.',
        focus: 'cabeza',
        fx: ['dim', 'heavy', 'sparkles-fade'],
      },
      {
        title: 'El ritmo regresa poco a poco',
        text: 'Con tratamiento, el sueño, la energía y la concentración suelen mejorar antes que el ánimo. Mientras, elige un paso muy pequeño y date permiso de hacerlo a tu ritmo.',
        tone: 'calma',
        focus: 'piernas',
        fx: ['breath-slow', 'heart-calm'],
        viz: { id: 'lento', mode: 'vuelve' },
        links: [
          { to: '/mi-dia', label: 'Un paso pequeño' },
          { to: '/especialista', label: 'Ir al especialista' },
        ],
      },
    ],
  },
]
