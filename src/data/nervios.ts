import type { CompanionMood } from './companion'

// «Entender mis nervios»: seis lecciones cortas sobre el pánico, de unos dos minutos cada una.
// Pantallas breves con un dibujo, para leerse en calma y no en plena crisis. Explican sin
// diagnosticar; lo médico se dice con cuidado y siempre con la puerta al médico abierta.
// Pendiente de revisar con un psicólogo antes de publicar.

export type ArtId =
  | 'alarma'
  | 'adrenalina'
  | 'ola'
  | 'personas'
  | 'circulo'
  | 'romper'
  | 'sensaciones'
  | 'mochila'
  | 'boton'
  | 'escalera'
  | 'guardar'
  | 'practicar'
  | 'balanza'
  | 'platica'
  | 'cuidarse'
  | 'senales'
  | 'consulta'
  | 'ayuda'

export type LessonLink = { to: string; label: string }

export type LessonScreen = {
  art: ArtId
  title: string
  text: string
  /** Una pantalla que se toca: el círculo del miedo o lo que es cada sensación. */
  interactive?: 'circulo' | 'sensaciones'
  /** Un aviso aparte, más pequeño (lo del médico, por ejemplo). */
  note?: string
  links?: LessonLink[]
}

export type Lesson = {
  id: string
  title: string
  /** Lo que se aprende, en una línea, para la lista. */
  short: string
  screens: LessonScreen[]
  /** Lo que dice la mascota al terminar. */
  end: string
  endMood?: CompanionMood
}

export const LESSONS: Lesson[] = [
  {
    id: 'que-es',
    title: 'Qué es un ataque de pánico',
    short: 'Una alarma que suena sin incendio.',
    screens: [
      {
        art: 'alarma',
        title: 'Una alarma que suena sin incendio',
        text: 'Un ataque de pánico es la alarma del cuerpo encendiéndose de golpe, sin un peligro de verdad. Como la alarma de humo que suena porque se quemó un pan: hace muchísimo ruido, pero no hay incendio.',
      },
      {
        art: 'adrenalina',
        title: 'La adrenalina prepara al cuerpo',
        text: 'Cuando suena la alarma, el cuerpo suelta adrenalina para huir o defenderse: el corazón late más rápido, respiras más, los músculos se tensan y sudas. Es el mismo sistema que te ayudaría a correr si de verdad hubiera un peligro.',
      },
      {
        art: 'ola',
        title: 'Sube, llega arriba y baja',
        text: 'Casi siempre llega a lo más fuerte en unos minutos y después baja, aunque no hagas nada. La adrenalina se gasta y el cuerpo regresa a su ritmo. Se siente eterno, pero pasa.',
      },
      {
        art: 'personas',
        title: 'Le pasa a mucha gente',
        text: 'Muchas personas tienen al menos un ataque de pánico en su vida. No es debilidad, no es tu culpa y no significa que estés perdiendo la razón. Es una alarma demasiado sensible, y eso se puede entrenar.',
      },
    ],
    end: 'Una falsa alarma: mucho ruido y nada de incendio. Ya lo sabes, y eso ayuda.',
  },
  {
    id: 'circulo',
    title: 'El círculo del miedo',
    short: 'Por qué una sensación pequeña crece tanto.',
    screens: [
      {
        art: 'circulo',
        title: 'Una vuelta que se alimenta sola',
        text: 'El pánico casi nunca empieza grande. Empieza con algo pequeño y da vueltas. Toca cada paso del círculo para verlo.',
        interactive: 'circulo',
      },
      {
        art: 'romper',
        title: 'Dónde se rompe',
        text: 'El círculo se rompe en lo que piensas de la sensación. Si en vez de «me va a dar algo» te dices «es mi alarma, es incómoda y va a pasar», el miedo ya no la alimenta y el cuerpo baja solo.',
      },
      {
        art: 'sensaciones',
        title: 'El miedo al miedo',
        text: 'Después de varios ataques, es común empezar a vigilar el cuerpo: cada latido o mareo parece el inicio de otro. Esa vigilancia también da vueltas en el círculo. Entenderlo ya le quita fuerza.',
        links: [{ to: '/cuerpo?ver=panico', label: 'Verlo en tu cuerpo' }],
      },
    ],
    end: 'Sensación, susto, más sensación. Ahora que ves el círculo, puedes salirte de él.',
  },
  {
    id: 'no-es-peligroso',
    title: 'Por qué no es peligroso',
    short: 'Qué es cada cosa que sientes.',
    screens: [
      {
        art: 'sensaciones',
        title: 'Lo que sientes tiene explicación',
        text: 'Cada sensación del pánico es la adrenalina haciendo su trabajo. Toca las que te pasan para ver de dónde vienen.',
        interactive: 'sensaciones',
      },
      {
        art: 'ola',
        title: 'Incómodo no es lo mismo que peligroso',
        text: 'Se siente horrible, y eso es real. Pero un ataque de pánico, por sí solo, no daña al corazón ni al cerebro, y pasa aunque no hagas nada para pararlo.',
        note: 'Esto explica lo que pasa en el pánico; no revisa tu salud. Si tienes dudas sobre tu salud, consulta a tu médico. Si es la primera vez, si se siente distinto a otras veces, o si el dolor del pecho es fuerte, dura más de unos minutos o se va al brazo, la mandíbula, el cuello o la espalda, llama a emergencias. Ir a revisarte no es exagerar.',
        links: [{ to: '/ayuda', label: 'Números de emergencia' }],
      },
    ],
    end: 'Tu cuerpo se está preparando para correr, no se está rompiendo. Incómodo, no peligroso.',
  },
  {
    id: 'seguridad',
    title: 'Las conductas de seguridad',
    short: 'Lo que hacemos para sentirnos a salvo, y por qué conviene soltarlo poco a poco.',
    screens: [
      {
        art: 'mochila',
        title: 'Lo que hacemos «por si acaso»',
        text: 'Cuando el pánico asusta, es natural protegerse: no salir sin alguien, cargar agua o una pastilla por si acaso, sentarse junto a la puerta, evitar el café, el ejercicio o los lugares llenos, tomarse el pulso a cada rato.',
      },
      {
        art: 'guardar',
        title: 'Ayudan hoy, pero guardan el miedo',
        text: 'Alivian en el momento, pero le dejan al cerebro una idea: «me salvé gracias a eso». Así nunca descubre que el pánico iba a pasar solo, y el miedo se queda igual de grande.',
      },
      {
        art: 'boton',
        title: 'Esta app también puede volverse una',
        text: 'La guía de pánico de esta app va a seguir aquí siempre, y está bien usarla. Pero si cada vez que sientes algo corres a abrirla, puede volverse otro «por si acaso». Por eso la guía tiene el camino «Quiero enfrentarlo» y por eso existe Practicar con el cuerpo: para que vayas viendo que tu cuerpo sabe calmarse solo.',
        links: [{ to: '/nervios/practicar', label: 'Practicar con el cuerpo' }],
      },
      {
        art: 'escalera',
        title: 'Soltarlas poco a poco',
        text: 'No hace falta dejarlas todas de golpe. Escoge una pequeña y pruébala un rato: ir a la tienda sin la botella de agua o tomarte el pulso una vez menos. El miedo va a subir y después va a bajar. Cada vez cuesta un poco menos.',
        note: 'Si algo te lo indicó tu médico, como un medicamento, no lo dejes sin platicarlo antes con quien te atiende.',
      },
    ],
    end: 'Un «por si acaso» a la vez, a tu ritmo. Yo te acompaño.',
  },
  {
    id: 'largo-plazo',
    title: 'Lo que ayuda a largo plazo',
    short: 'Practicar con el cuerpo, revisar lo que temes y la terapia.',
    screens: [
      {
        art: 'practicar',
        title: 'Practicar con el cuerpo',
        text: 'Lo que más ayuda es perderle el miedo a las sensaciones. Se hace provocándolas a propósito, poco a poco y con cuidado (marearte un poco, agitarte), hasta que el cuerpo aprende que no pasa nada. Aquí puedes probarlo, empezando por lo más suave.',
        links: [{ to: '/nervios/practicar', label: 'Practicar con el cuerpo' }],
      },
      {
        art: 'balanza',
        title: 'Revisar lo que temes',
        text: 'Después de una crisis, pregúntate qué temías que pasara y qué pasó de verdad. Casi siempre lo temido no llega. Con el tiempo, el miedo se va quedando sin pruebas.',
      },
      {
        art: 'platica',
        title: 'La terapia cognitivo-conductual',
        text: 'Es la terapia con mejor evidencia para el pánico. Con un especialista aprendes justo esto, paso a paso y a tu ritmo. Suele ser un tratamiento corto. A veces también ayuda un medicamento: eso lo decide contigo un médico.',
        links: [{ to: '/especialista', label: 'Preparar mi consulta' }],
      },
      {
        art: 'cuidarse',
        title: 'Lo de todos los días',
        text: 'Dormir, moverte y bajarle al café y al alcohol ayudan a que la alarma esté menos sensible. Respirar lento ayuda en el momento; lo que más cambia las cosas con el tiempo es practicar.',
      },
    ],
    end: 'Poquito a poco, el cuerpo aprende que puede solo. Y no tienes que hacerlo sin compañía.',
  },
  {
    id: 'especialista',
    title: 'Cuándo buscar a un especialista',
    short: 'Señales de que vale la pena pedir ayuda.',
    screens: [
      {
        art: 'senales',
        title: 'Si el pánico te está cambiando la vida',
        text: 'Vale la pena buscar ayuda si los ataques se repiten, si vives con miedo a que vuelvan, si dejaste de salir, de manejar o de ir a ciertos lugares, o si para aguantarlo usas alcohol u otras sustancias.',
      },
      {
        art: 'consulta',
        title: 'Primero, una revisión',
        text: 'Si nunca te han revisado, un médico puede descartar otras causas, como la tiroides, el corazón o algún medicamento. Saberlo también tranquiliza. Después, un psicólogo puede acompañarte con la terapia.',
        links: [{ to: '/especialista', label: 'Preparar mi consulta' }],
      },
      {
        art: 'ayuda',
        title: 'Si hoy no puedes más',
        text: 'Si piensas en hacerte daño o sientes que ya no puedes, no esperes a la cita: hay alguien que puede escucharte ahora mismo.',
        links: [{ to: '/ayuda', label: 'Necesito ayuda' }],
      },
    ],
    end: 'Pedir ayuda no es exagerar. Es cuidarte.',
  },
]

export const lessonById = (id: string | null) => LESSONS.find((l) => l.id === id)

/** El círculo del miedo, en el orden en que da vueltas. */
export const FEAR_CIRCLE = [
  {
    id: 'sensacion',
    label: 'Una sensación',
    text: 'El corazón da un brinco, te mareas un poco o te falta el aire. Algo normal, como subir escaleras o tomar café.',
  },
  {
    id: 'pensamiento',
    label: 'Lo que piensas',
    text: '«¿Y si es un infarto?», «¿y si me desmayo?», «¿y si pierdo el control?». La mente lo lee como un peligro.',
  },
  {
    id: 'miedo',
    label: 'Más miedo',
    text: 'Ese pensamiento asusta, y el susto enciende la alarma más fuerte. Suelta más adrenalina.',
  },
  {
    id: 'mas',
    label: 'Más sensación',
    text: 'Con más adrenalina, el corazón late más fuerte y el mareo crece. Y eso parece confirmar el miedo… y vuelve a empezar.',
  },
] as const

/** Lo que es cada sensación del pánico. Cuidado con lo médico: describir, no prometer. */
export const SENSATIONS = [
  {
    id: 'corazon',
    label: 'El corazón a mil',
    text: 'La adrenalina hace que el corazón lata más rápido y más fuerte, para llevar sangre a los músculos. Es lo mismo que hace cuando corres o subes escaleras.',
  },
  {
    id: 'aire',
    label: 'Falta de aire',
    text: 'Con el susto respiras rápido y por arriba del pecho. Se siente como que no entra el aire, pero casi siempre estás tomando de más. Soltar el aire lento lo acomoda.',
  },
  {
    id: 'mareo',
    label: 'Mareo',
    text: 'Respirar rápido cambia un poco el equilibrio de gases en la sangre, y eso marea o hace sentir la cabeza ligera. Desmayarse en un ataque de pánico es poco común.',
  },
  {
    id: 'hormigueo',
    label: 'Hormigueo',
    text: 'En las manos, los pies o alrededor de la boca. También viene de respirar rápido, y se quita cuando la respiración vuelve a su ritmo.',
  },
  {
    id: 'pecho',
    label: 'El pecho apretado',
    text: 'Con el miedo, los músculos del pecho se tensan y pueden apretar o doler. Si el dolor es fuerte, dura más de unos minutos o se va al brazo, la mandíbula, el cuello o la espalda, llama a emergencias.',
  },
  {
    id: 'calor',
    label: 'Calor, sudor o escalofríos',
    text: 'El cuerpo se calienta para moverse y suda para enfriarse. Por eso a veces llegan oleadas de calor y luego frío.',
  },
  {
    id: 'irreal',
    label: 'Sentir que nada es real',
    text: 'Como si vieras todo de lejos o a través de un vidrio. Es la mente bajándole el volumen a tanta alarma. Se siente muy raro, pero pasa.',
  },
  {
    id: 'control',
    label: 'Miedo a perder el control',
    text: 'El pánico no hace que pierdas la razón ni que hagas algo que no quieres. Es miedo muy fuerte, y el miedo, por fuerte que sea, baja.',
  },
] as const
