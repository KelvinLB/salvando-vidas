// Lo que pasa por dentro del cuerpo con cada condición, paso a paso. Se cuenta
// sin tecnicismos y sin diagnosticar; cada historia termina con lo que ayuda.
// Antes de cambiar los textos, que los revise un profesional de la salud.

export type Region = 'cabeza' | 'cuello' | 'pecho' | 'estomago' | 'brazos' | 'piernas'
export type Tone = 'alarma' | 'estres' | 'animo' | 'mania' | 'calma'

/** Efectos que sabe animar el cuerpo (ver src/lib/bodyfx.ts). */
export type Fx =
  | 'alarm-brain'
  | 'stress-brain'
  | 'nerves'
  | 'heart-fast'
  | 'heart-very-fast'
  | 'heart-calm'
  | 'breath-fast'
  | 'breath-slow'
  | 'stomach-knot'
  | 'gut'
  | 'tension'
  | 'tremble'
  | 'dizzy'
  | 'cortisol'
  | 'sleep-bad'
  | 'no-sleep'
  | 'dim'
  | 'heavy'
  | 'chest-weight'
  | 'sparkles-fade'
  | 'cycle'
  | 'mania'
  | 'wave'
  | 'throat'
  | 'tingle'
  | 'restless'

export type StoryStep = {
  title: string
  text: string
  fx: Fx[]
  focus?: Region
  tone?: Tone
  links?: { to: string; label: string }[]
  note?: string
}

export type Story = { id: string; label: string; tone: Tone; intro: string; steps: StoryStep[] }

export const REGION_LABELS: Record<Region, string> = {
  cabeza: 'la cabeza',
  cuello: 'el cuello y los hombros',
  pecho: 'el pecho',
  estomago: 'el estómago',
  brazos: 'los brazos y las manos',
  piernas: 'las piernas',
}

const HEART_NOTE =
  'Si es la primera vez, si el dolor del pecho es fuerte o se va al brazo o la mandíbula, o si te desmayas, ve a urgencias. Ir a revisarte no es exagerar.'

export const STORIES: Story[] = [
  {
    id: 'ansiedad',
    label: 'Ansiedad',
    tone: 'alarma',
    intro: 'Esa sensación de que algo malo va a pasar tiene explicación: tu cuerpo enciende una alarma aunque no haya peligro, y le cuesta apagarla.',
    steps: [
      {
        title: 'Algo enciende la alarma',
        text: 'Un pensamiento («¿y si pasa algo?»), un recuerdo o una sensación. La parte del cerebro que vigila peligros, la amígdala, da el aviso.',
        focus: 'cabeza',
        fx: ['alarm-brain'],
      },
      {
        title: 'El aviso recorre el cuerpo',
        text: 'Los nervios llevan la alarma a todo el cuerpo y se libera adrenalina, la hormona de «prepárate».',
        fx: ['alarm-brain', 'nerves'],
      },
      {
        title: 'El corazón se acelera',
        text: 'Late más rápido y más fuerte para mandar sangre a los músculos, como si tuvieras que correr.',
        focus: 'pecho',
        fx: ['alarm-brain', 'nerves', 'heart-fast'],
      },
      {
        title: 'Respiras rápido y por arriba',
        text: 'Sientes que no entra el aire, aunque sí entra. Querer jalar más aire lo empeora.',
        focus: 'pecho',
        fx: ['alarm-brain', 'nerves', 'heart-fast', 'breath-fast'],
      },
      {
        title: 'Se aprieta el estómago',
        text: 'El cuerpo frena la digestión para ahorrar energía: nudo, mariposas o náusea.',
        focus: 'estomago',
        fx: ['alarm-brain', 'nerves', 'heart-fast', 'breath-fast', 'stomach-knot'],
      },
      {
        title: 'Músculos tensos, manos sudadas',
        text: 'Hombros arriba, mandíbula apretada, manos que tiemblan o sudan: el cuerpo está listo para defenderse.',
        focus: 'brazos',
        fx: ['alarm-brain', 'nerves', 'heart-fast', 'breath-fast', 'stomach-knot', 'tension', 'tremble'],
      },
      {
        title: 'Cómo se apaga',
        text: 'Soltar el aire despacio, más largo de lo que lo tomas, le avisa al cuerpo que no hay peligro. El corazón baja y la alarma se apaga poco a poco.',
        tone: 'calma',
        focus: 'pecho',
        fx: ['breath-slow', 'heart-calm'],
        links: [{ to: '/calma', label: 'Respirar ahora' }],
      },
    ],
  },
  {
    id: 'panico',
    label: 'Pánico',
    tone: 'alarma',
    intro: 'Si alguna vez sentiste que te morías o que perdías el control, no exagerabas: era la alarma del cuerpo al máximo. Asusta muchísimo, pero no es peligrosa y pasa.',
    steps: [
      {
        title: 'Una sensación asusta',
        text: 'Un latido fuerte, un mareo o un pensamiento: «¿y si me pasa algo?».',
        focus: 'pecho',
        fx: ['heart-fast'],
      },
      {
        title: 'La alarma se dispara al máximo',
        text: 'El cerebro lo toma como un peligro y suelta toda la adrenalina de golpe.',
        focus: 'cabeza',
        fx: ['heart-fast', 'alarm-brain', 'nerves'],
      },
      {
        title: 'Todo se acelera',
        text: 'El corazón a mil, falta de aire, hormigueo en las manos, mareo. Por eso tanta gente siente que es un infarto.',
        focus: 'brazos',
        fx: ['heart-very-fast', 'alarm-brain', 'nerves', 'breath-fast', 'tremble', 'dizzy'],
        note: HEART_NOTE,
      },
      {
        title: 'El susto alimenta la alarma',
        text: 'La mente piensa «me va a dar algo» y ese susto vuelve a encender la alarma. Así crece un ataque de pánico.',
        fx: ['heart-very-fast', 'alarm-brain', 'nerves', 'breath-fast', 'cycle'],
      },
      {
        title: 'Cómo se rompe el ciclo',
        text: 'Nombrarlo («es pánico, va a pasar») le quita el susto a la mente, y soltar el aire lento calma al cuerpo. Llega a lo más alto en unos minutos y baja.',
        tone: 'calma',
        focus: 'pecho',
        fx: ['breath-slow', 'heart-calm'],
        links: [{ to: '/panico', label: 'Guía de pánico' }],
      },
    ],
  },
  {
    id: 'estres',
    label: 'Estrés',
    tone: 'estres',
    intro: 'Cuando la presión dura semanas, la alarma se queda encendida en bajito, todo el día. Por eso cansa tanto, aunque no hayas hecho nada «pesado».',
    steps: [
      {
        title: 'Presión que no se acaba',
        text: 'Trabajo, deudas, cuidar a otros, problemas que se juntan. El cerebro no encuentra cuándo descansar.',
        focus: 'cabeza',
        fx: ['stress-brain'],
      },
      {
        title: 'Cortisol todo el día',
        text: 'Unas glándulas sobre los riñones sueltan cortisol, la hormona del estrés, para darte energía extra. Sirve para un rato, no para semanas.',
        focus: 'estomago',
        fx: ['stress-brain', 'cortisol'],
      },
      {
        title: 'Músculos que no se sueltan',
        text: 'Cuello, hombros y espalda cargados, y dolor de cabeza de tensión.',
        focus: 'cuello',
        fx: ['stress-brain', 'cortisol', 'tension'],
      },
      {
        title: 'El estómago lo resiente',
        text: 'Acidez, colitis, comer de más o de menos.',
        focus: 'estomago',
        fx: ['stress-brain', 'cortisol', 'tension', 'gut'],
      },
      {
        title: 'Dormir ya no descansa',
        text: 'Cuesta dormir, o despiertas con cansancio aunque hayas dormido.',
        focus: 'cabeza',
        fx: ['stress-brain', 'cortisol', 'tension', 'gut', 'sleep-bad'],
      },
      {
        title: 'Cómo bajarle',
        text: 'Pausas cortas durante el día, moverte un poco y dormir a la misma hora. Y repartir la carga: pedir ayuda también es cuidarte.',
        tone: 'calma',
        fx: ['breath-slow', 'heart-calm'],
        links: [
          { to: '/mi-dia', label: 'Un día a la vez' },
          { to: '/redes', label: '¿Y el cortisol alto?' },
        ],
      },
    ],
  },
  {
    id: 'depresion',
    label: 'Depresión',
    tone: 'animo',
    intro: 'Si todo te cuesta y nada te da gusto, no es que te falte voluntad: con la depresión, el cuerpo entra en modo ahorro.',
    steps: [
      {
        title: 'El cerebro baja la energía',
        text: 'Cambian las sustancias que regulan el ánimo, el sueño y el gusto por las cosas. A veces hay una causa clara y a veces no.',
        focus: 'cabeza',
        fx: ['dim'],
      },
      {
        title: 'Todo pesa',
        text: 'Cansancio que no se quita durmiendo, cuerpo pesado, moverse lento. No es flojera.',
        focus: 'piernas',
        fx: ['dim', 'heavy'],
      },
      {
        title: 'Un peso o un vacío en el pecho',
        text: 'La tristeza se siente en el pecho, aunque a veces no puedas llorar.',
        focus: 'pecho',
        fx: ['dim', 'heavy', 'chest-weight'],
      },
      {
        title: 'Nada da gusto',
        text: 'Lo que antes te gustaba se apaga. Se llama anhedonia: es parte de la depresión, no un defecto tuyo.',
        focus: 'cabeza',
        fx: ['dim', 'heavy', 'chest-weight', 'sparkles-fade'],
      },
      {
        title: 'Y se alimenta solo',
        text: 'Como todo cuesta, haces menos. Al hacer menos hay menos cosas buenas, y el ánimo baja más.',
        fx: ['dim', 'heavy', 'chest-weight', 'cycle'],
      },
      {
        title: 'Cómo se rompe el ciclo',
        text: 'Con pasos muy pequeños, aunque no haya ganas: las ganas suelen llegar después de moverte, no antes. Y con tratamiento: la depresión se trata.',
        tone: 'calma',
        focus: 'piernas',
        fx: ['breath-slow', 'heart-calm'],
        links: [
          { to: '/mi-dia', label: 'Un paso pequeño' },
          { to: '/especialista', label: 'Ir al especialista' },
        ],
      },
    ],
  },
  {
    id: 'bipolar',
    label: 'Bipolar',
    tone: 'mania',
    intro: 'El trastorno bipolar no es cambiar de humor en un día: son temporadas que suben y bajan. Entenderlo ayuda a cuidarte a tiempo.',
    steps: [
      {
        title: 'Temporadas que suben y bajan',
        text: 'Pueden durar días o semanas: unas de muchísima energía y otras de depresión, a veces con épocas estables entre ellas.',
        fx: ['wave'],
      },
      {
        title: 'La subida: manía o hipomanía',
        text: 'Mucha energía, ideas que corren, hablar rápido, gastar o arriesgarse de más. Se siente bien, y por eso cuesta notarlo.',
        focus: 'cabeza',
        fx: ['wave', 'mania'],
      },
      {
        title: 'Dormir poco sin cansarse',
        text: 'Unas pocas horas de sueño bastan y no hay cansancio. Es una de las señales más claras.',
        focus: 'cabeza',
        fx: ['wave', 'mania', 'no-sleep'],
      },
      {
        title: 'La bajada',
        text: 'Después puede venir una depresión: el cuerpo pesa y nada da gusto.',
        tone: 'animo',
        focus: 'piernas',
        fx: ['wave', 'dim', 'heavy'],
      },
      {
        title: 'Lo más importante',
        text: 'Si has tenido temporadas de mucha energía sin necesidad de dormir, díselo a tu médico: el tratamiento es distinto, y los antidepresivos solos pueden empeorarlo. Con tratamiento, muchas personas tienen una vida estable.',
        tone: 'calma',
        fx: ['wave', 'breath-slow', 'heart-calm'],
        links: [{ to: '/especialista', label: 'Preparar mi consulta' }],
      },
    ],
  },
  {
    id: 'insomnio',
    label: 'No poder dormir',
    tone: 'estres',
    intro: 'Si llevas noches dando vueltas, no es que no lo intentes: tu cuerpo sigue en alerta cuando debería descansar.',
    steps: [
      {
        title: 'La mente no se apaga',
        text: 'Al acostarte por fin hay silencio, y las preocupaciones aprovechan para salir. El cerebro lo toma como un aviso de peligro.',
        focus: 'cabeza',
        fx: ['stress-brain', 'no-sleep'],
      },
      {
        title: 'El cuerpo sigue encendido',
        text: 'El cortisol, que de noche debería bajar, se queda alto: el corazón y los músculos no terminan de soltarse.',
        focus: 'pecho',
        fx: ['stress-brain', 'cortisol', 'tension'],
      },
      {
        title: 'Pelear con el sueño lo aleja',
        text: 'Mientras más te esfuerzas por dormir y miras el reloj, más alerta te pones. Es un círculo, no una falla tuya.',
        focus: 'cabeza',
        fx: ['no-sleep', 'cycle'],
      },
      {
        title: 'Al otro día todo pesa más',
        text: 'Dormir mal deja el ánimo y los nervios más sensibles. Por eso, después de una mala noche, todo cuesta el doble.',
        tone: 'animo',
        focus: 'piernas',
        fx: ['sleep-bad', 'dim', 'heavy'],
      },
      {
        title: 'Cómo ayudarle a tu cuerpo',
        text: 'Una hora sin pantallas antes de dormir y levantarte siempre a la misma hora. Si en unos 20 minutos no te duermes, sal de la cama a algo tranquilo y regresa con sueño. El sueño vuelve cuando el cuerpo se siente a salvo.',
        tone: 'calma',
        fx: ['breath-slow', 'heart-calm'],
        links: [{ to: '/noche', label: 'Prepararme para dormir' }],
      },
    ],
  },
  {
    id: 'despues-crisis',
    label: 'Después de una crisis',
    tone: 'animo',
    intro: 'Después de una crisis muchas veces llega un bajón: cansancio, temblor o ganas de llorar. Es tu cuerpo apagando la alarma, no que algo esté mal contigo.',
    steps: [
      {
        title: 'La alarma se apaga de golpe',
        text: 'La adrenalina que te sostuvo durante la crisis baja de repente. En unos minutos, el cuerpo gastó muchísima energía.',
        tone: 'alarma',
        focus: 'cabeza',
        fx: ['alarm-brain', 'heart-calm'],
      },
      {
        title: 'Temblor y cansancio',
        text: 'Es normal temblar, sentir las piernas flojas o tener muchísimo sueño: es el cuerpo soltando la tensión.',
        focus: 'piernas',
        fx: ['tremble', 'heavy'],
      },
      {
        title: 'Llanto o sentirte en blanco',
        text: 'También pueden llegar ganas de llorar, un vacío o sentirte fuera de ti un rato. Son ecos de la alarma, y se van.',
        focus: 'pecho',
        fx: ['dim', 'chest-weight'],
      },
      {
        title: 'Cómo cuidarte ahora',
        text: 'Toma agua, come algo ligero, abrígate y descansa sin culparte. Si puedes, escríbele a alguien: después de una crisis, la compañía ayuda mucho.',
        tone: 'calma',
        fx: ['breath-slow', 'heart-calm'],
        links: [
          { to: '/ayuda', label: 'Hablar con alguien' },
          { to: '/diario', label: 'Escribir cómo me fue' },
        ],
      },
    ],
  },
  {
    id: 'medicamento',
    label: 'El medicamento',
    tone: 'calma',
    intro: 'Si empezaste un medicamento y todavía no notas nada, no quiere decir que no funcione: el cerebro necesita semanas para acomodarse.',
    steps: [
      {
        title: 'El cerebro se acomoda poco a poco',
        text: 'Los antidepresivos ayudan al cerebro a regular mejor el ánimo y los nervios, pero ese cambio se construye en semanas, no en días.',
        focus: 'cabeza',
        fx: ['breath-slow'],
      },
      {
        title: 'Primero pueden llegar molestias',
        text: 'Las primeras semanas pueden dar náuseas, dolor de cabeza o un poco más de nervios. Suelen pasar solas; si te preocupan, cuéntaselo a tu médico.',
        tone: 'estres',
        focus: 'estomago',
        fx: ['gut'],
      },
      {
        title: 'La mejoría llega despacio',
        text: 'Muchas personas notan los primeros cambios entre las 2 y las 4 semanas, y el efecto completo suele llegar entre las 4 y las 6, a veces más. A veces mejoran primero el sueño y la energía, y el ánimo después.',
        focus: 'pecho',
        fx: ['breath-slow', 'heart-calm'],
      },
      {
        title: 'No lo dejes de golpe',
        text: 'Aunque te sientas mejor, déjalo o cambia la dosis solo con tu médico: al quitarlo de golpe pueden regresar los síntomas o sentirte mal unos días.',
        fx: ['breath-slow', 'heart-calm'],
        links: [
          { to: '/mi-espacio/medicamentos', label: 'Mis medicamentos' },
          { to: '/especialista', label: 'Preparar mi consulta' },
        ],
      },
    ],
  },
]
