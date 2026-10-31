import type { Senal } from '../components/cuerpo3d/organos'

// «Cómo se mueve la ansiedad» en Explorar: eliges una situación y la recorres punto por punto sobre
// su ola (cuando empieza, cuando sube, lo más alto, cuando baja), mientras el cuerpo en 3D muestra
// qué se enciende y dónde se siente. Cada situación tiene su propia forma de ola: el pánico sube de
// golpe, la preocupación se queda arriba, con la sangre el corazón primero sube y luego cae. La
// cámara no se acerca: se ve el cuerpo entero para que se note dónde se siente cada cosa.
// Se nombran por lo que pasa, no por un diagnóstico, y se cuentan con «suele» y «puede».
// Pendiente de revisión con psicóloga y médico: todos los textos de este archivo.
// Fuentes: NHS, ataques de pánico y ansiedad generalizada; APA, DSM-5-TR (el pico del pánico llega
// en minutos); MedlinePlus, hiperventilación; Harvard Health, «Understanding the stress response»;
// Taché y Bonaz 2007, J Clin Invest (estrés y tubo digestivo); Borkovec, preocupación y «horario de
// preocupación»; Gilovich et al. 1998, J Pers Soc Psychol (la ilusión de transparencia: los nervios
// se notan menos de lo que uno cree); Kozlowska et al. 2015, Harv Rev Psychiatry (congelarse como
// respuesta de defensa); Öst y Sterner 1987, Behav Res Ther (tensión aplicada en la fobia a la
// sangre); Salkovskis y Warwick, el círculo de revisarse en la ansiedad por la salud.

export type Momento = {
  /** Cómo se llama ese punto de la ola. */
  nombre: string
  /** Qué tan alta va la ola ahí, de 0 a 1 (0.3 es como estás en un día cualquiera). */
  nivel: number
  t: string
  senal: Senal
}

export type Situacion = {
  id: string
  /** Como lo diría alguien: va en el botón. */
  label: string
  title: string
  intro: string
  momentos: Momento[]
  /** Al final: cuándo ir al médico o llamar a emergencias. */
  medico?: string
  riesgo?: string
  cierre?: string
  ir?: { to: string; label: string }
}

export const SITUACIONES: Situacion[] = [
  {
    id: 'golpe',
    label: 'Cuando llega de golpe',
    title: 'Cuando la ansiedad llega de golpe',
    intro: 'Es lo que mucha gente llama un ataque de pánico. Sube rápido, llega a lo más alto en minutos y baja.',
    momentos: [
      {
        nombre: 'Empieza',
        nivel: 0.35,
        senal: { alarma: ['amigdala'], respira: 'normal', aire: true, bpm: 86 },
        t: 'Muchas veces empieza con algo pequeño: un latido fuerte, un mareo, un calor. La {{amigdala}} lo nota y lo lee como peligro, aunque no lo sea.',
      },
      {
        nombre: 'Sube',
        nivel: 0.72,
        senal: {
          alarma: ['amigdala', 'suprarrenales', 'corazon'],
          flujos: ['alarma-supra', 'supra-corazon'],
          respira: 'rapida',
          aire: true,
          bpm: 118,
          zonas: { manos: 'sudor' },
        },
        t: 'La alarma manda soltar {{adrenalina}}. En segundos el corazón se acelera, la respiración se vuelve rápida y las manos sudan: el cuerpo se prepara para correr.',
      },
      {
        nombre: 'Lo más alto',
        nivel: 1,
        senal: {
          alarma: ['amigdala', 'corazon', 'pulmones'],
          flujos: ['pulmon-alarma', 'corazon-alarma'],
          respira: 'rapida',
          aire: true,
          bpm: 128,
          zonas: { manos: 'hormigueo', cara: 'hormigueo', pecho: 'tension' },
        },
        t: 'Al respirar tan rápido sale de más {{co2}}: llegan el hormigueo en manos y boca, el mareo y la sensación de que falta el aire. El pecho se aprieta porque los músculos están tensos. Asusta mucho, pero no es peligroso.',
      },
      {
        nombre: 'Baja',
        nivel: 0.5,
        senal: { calma: ['corazon'], flujos: ['vago'], respira: 'normal', aire: true, bpm: 94, zonas: { pecho: 'tension' } },
        t: 'La {{adrenalina}} se gasta pronto: lo más fuerte suele pasar en unos diez minutos. El {{vago}} empieza a frenar y el corazón baja poco a poco, aunque no hagas nada.',
      },
      {
        nombre: 'Después',
        nivel: 0.22,
        senal: { calma: ['corazon', 'pulmones'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 74, zonas: { cuello: 'tension' } },
        t: 'Quedan cansancio y músculos adoloridos, como después de correr. Es normal: el cuerpo trabajó fuerte. Descansar y tomar agua ayuda.',
      },
    ],
    medico:
      'Si es la primera vez, o el dolor de pecho no se quita o se va al brazo, la mandíbula o la espalda, llama a emergencias (911 en México) o ve a que te revisen.',
    ir: { to: '/panico', label: 'Si te está pasando ahora' },
  },
  {
    id: 'preocupar',
    label: 'Cuando no paro de preocuparme',
    title: 'Cuando la preocupación no se apaga',
    intro: 'Esta ola no sube tan alto, pero tarda mucho en bajar. Se queda encendida en bajito por días.',
    momentos: [
      {
        nombre: 'Empieza',
        nivel: 0.38,
        senal: { alarma: ['cerebro', 'amigdala'], bpm: 76 },
        t: 'Empieza con un «¿y si…?». El cerebro trata de resolver algo que todavía no pasa, y la {{amigdala}} lo toma como si ya estuviera pasando.',
      },
      {
        nombre: 'Se queda',
        nivel: 0.6,
        senal: {
          alarma: ['amigdala', 'suprarrenales'],
          flujos: ['alarma-supra'],
          respira: 'normal',
          bpm: 80,
          zonas: { cuello: 'tension', cara: 'tension' },
        },
        t: 'No es una alarma fuerte: es una alarma bajita que no se apaga. El {{cortisol}} se queda arriba y los músculos se quedan listos: cuello, hombros y mandíbula apretados.',
      },
      {
        nombre: 'En la panza',
        nivel: 0.64,
        senal: {
          alarma: ['estomago', 'intestinos'],
          flujos: ['alarma-panza'],
          respira: 'normal',
          bpm: 80,
          zonas: { panza: 'tension', cuello: 'tension' },
        },
        t: 'Con los días, la panza lo resiente: el estómago se frena y el intestino se acelera. Por eso aparecen la acidez, la panza suelta o un nudo que no se va.',
      },
      {
        nombre: 'En la noche',
        nivel: 0.62,
        senal: { alarma: ['cerebro'], respira: 'normal', bpm: 76, zonas: { cuello: 'tension' } },
        t: 'En la noche la mente sigue dando vueltas: cuesta dormir o el sueño es ligero. Al otro día, con el cansancio, preocuparte cuesta menos y descansar cuesta más.',
      },
      {
        nombre: 'Baja',
        nivel: 0.3,
        senal: { calma: ['cerebro', 'corazon'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 68, ola: 'freno' },
        t: 'Baja cuando el cuerpo recibe otra señal: soltar el aire despacio, moverte, o darle a la preocupación un horario (quince minutos al día para pensarla, y fuera de ahí, «eso lo veo a las seis»). Los hombros sueltan y la alarma se calla un rato.',
      },
    ],
    medico:
      'Si la preocupación ya no te deja vivir en paz desde hace semanas, vale la pena hablarlo con alguien de psicología: tiene tratamiento.',
    ir: { to: '/calma', label: 'Respirar en Calma' },
  },
  {
    id: 'gente',
    label: 'Cuando hay gente mirando',
    title: 'Cuando sientes que todos te miran',
    intro: 'Hablar en clase, en una junta o llegar a una fiesta. Esta ola muchas veces empieza antes de llegar.',
    momentos: [
      {
        nombre: 'Antes',
        nivel: 0.48,
        senal: { alarma: ['amigdala', 'estomago'], flujos: ['alarma-panza'], bpm: 84 },
        t: 'Desde horas o días antes, la mente ensaya todo lo que puede salir mal, y la panza se aprieta.',
      },
      {
        nombre: 'Sube',
        nivel: 0.76,
        senal: {
          alarma: ['amigdala', 'suprarrenales', 'corazon'],
          flujos: ['alarma-supra', 'supra-corazon'],
          respira: 'normal',
          bpm: 106,
          zonas: { cara: 'calor', manos: 'sudor' },
        },
        t: 'Frente a la gente sube la {{adrenalina}}: la cara se pone roja y caliente, las manos sudan y el corazón se acelera.',
      },
      {
        nombre: 'Lo más alto',
        nivel: 1,
        senal: {
          alarma: ['amigdala', 'cerebro'],
          respira: 'rapida',
          aire: true,
          bpm: 112,
          zonas: { cara: 'calor', cuello: 'tension', manos: 'sudor' },
        },
        t: 'La atención se va hacia adentro: «se me nota», «me tiembla la voz». La garganta y el cuello se tensan y la mente se puede quedar en blanco. Desde afuera casi siempre se nota mucho menos de lo que sientes.',
      },
      {
        nombre: 'Baja',
        nivel: 0.5,
        senal: { calma: ['corazon'], flujos: ['vago'], respira: 'normal', aire: true, bpm: 90, zonas: { cara: 'calor' } },
        t: 'Si te quedas un rato, la alarma baja sola: el cuerpo no puede sostenerla mucho tiempo. Y cada vez que te quedas, la {{amigdala}} aprende que no era tan peligroso.',
      },
      {
        nombre: 'Después',
        nivel: 0.28,
        senal: { calma: ['cerebro', 'corazon'], respira: 'lenta', aire: true, bpm: 72 },
        t: 'Después la mente repasa lo que pasó y se fija en lo que salió mal. Ayuda acordarte también de lo que sí salió bien.',
      },
    ],
    ir: { to: '/nervios', label: 'Entender mis nervios' },
  },
  {
    id: 'recuerdo',
    label: 'Cuando algo me recuerda lo que pasó',
    title: 'Cuando algo te recuerda algo difícil',
    intro: 'Después de vivir algo muy fuerte, un detalle puede encender la alarma como si estuviera pasando otra vez.',
    momentos: [
      {
        nombre: 'Un detalle',
        nivel: 0.25,
        senal: { alarma: ['amigdala'], bpm: 74 },
        t: 'Un olor, un sonido, una fecha, un lugar. La {{amigdala}} lo reconoce antes de que tú lo pienses: guarda lo que pasó para avisarte rápido.',
      },
      {
        nombre: 'Se enciende',
        nivel: 1,
        senal: {
          alarma: ['amigdala', 'suprarrenales', 'corazon'],
          flujos: ['alarma-supra', 'supra-corazon'],
          respira: 'rapida',
          aire: true,
          bpm: 120,
          zonas: { pecho: 'tension', manos: 'sudor' },
        },
        t: 'La alarma sube de golpe. El cuerpo reacciona al recuerdo, no al ahora: el corazón se acelera y todo se pone alerta.',
      },
      {
        nombre: 'O te congelas',
        nivel: 0.7,
        senal: { alarma: ['amigdala'], calma: ['corazon'], flujos: ['vago'], respira: 'lenta', bpm: 64, zonas: { manos: 'frio', cara: 'frio' } },
        t: 'A veces, en vez de acelerarse, el cuerpo se congela: se queda quieto, se siente pesado o lejano, como si no fuera real. Es otra forma que tiene de protegerse, no algo que tú elijas.',
      },
      {
        nombre: 'Vuelves',
        nivel: 0.4,
        senal: { calma: ['corazon', 'cerebro'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 78 },
        t: 'Para volver al ahora ayudan los sentidos: nombrar cinco cosas que ves, tocar algo frío, sentir los pies en el piso. Así el cerebro nota que el peligro ya pasó.',
      },
      {
        nombre: 'Después',
        nivel: 0.24,
        senal: { calma: ['corazon', 'cerebro'], respira: 'lenta', aire: true, bpm: 70 },
        t: 'Puede quedar cansancio o tristeza. Si estos momentos llegan seguido, hablarlo con alguien de psicología ayuda mucho: hay terapias hechas justo para esto.',
      },
    ],
    riesgo: 'Si lo que recuerdas te hace pensar en hacerte daño o en no querer vivir, busca ayuda hoy.',
    ir: { to: '/calma', label: 'Volver al presente en Calma' },
  },
  {
    id: 'sangre',
    label: 'Cuando veo sangre o agujas',
    title: 'Cuando ves sangre o una aguja',
    intro: 'Con la sangre, las agujas o las heridas, el cuerpo hace algo distinto que con otros miedos: primero sube y luego cae.',
    momentos: [
      {
        nombre: 'Al verla',
        nivel: 0.4,
        senal: { alarma: ['amigdala'], bpm: 84 },
        t: 'Al ver la sangre o la aguja, la {{amigdala}} se enciende como en cualquier susto.',
      },
      {
        nombre: 'Sube',
        nivel: 0.78,
        senal: {
          alarma: ['amigdala', 'corazon'],
          flujos: ['alarma-supra', 'supra-corazon'],
          bpm: 104,
          zonas: { manos: 'sudor' },
        },
        t: 'Primero el corazón y la {{presion}} suben, como con cualquier miedo.',
      },
      {
        nombre: 'Cae',
        nivel: 0.04,
        senal: { calma: ['corazon'], flujos: ['vago'], respira: 'lenta', bpm: 52, zonas: { cara: 'frio', manos: 'frio' } },
        t: 'Luego el {{vago}} frena de más: el corazón y la {{presion}} bajan de golpe. Llega menos sangre a la cabeza, y aparecen la palidez, el sudor frío, la vista borrosa y a veces el desmayo.',
      },
      {
        nombre: 'Qué ayuda',
        nivel: 0.34,
        senal: { calma: ['corazon'], respira: 'normal', bpm: 72 },
        t: 'En cuanto lo sientas venir, acuéstate o siéntate con la cabeza baja. Y aprieta fuerte los músculos de piernas, brazos y panza unos quince segundos, suelta y repite: eso sube la {{presion}} y ayuda a no desmayarte.',
      },
    ],
    medico: 'Si te desmayas seguido o sin una razón clara, que te revise un médico.',
    cierre: 'Es muy común, y con práctica (y apretando los músculos) suele pasar cada vez menos.',
  },
  {
    id: 'sensaciones',
    label: 'Cuando me fijo en cada latido',
    title: 'Cuando te fijas en cada sensación',
    intro: 'Cuando te preocupa tu salud, una sensación pequeña puede volverse una ola que da vueltas.',
    momentos: [
      {
        nombre: 'Notas algo',
        nivel: 0.32,
        senal: { bpm: 74 },
        t: 'Todo el día hay sensaciones: un latido fuerte, un piquete, un ruido en la panza. Casi siempre pasan sin que las notes.',
      },
      {
        nombre: 'Te fijas',
        nivel: 0.52,
        senal: { alarma: ['cerebro'], bpm: 78 },
        t: 'Si te preocupa tu salud, el cerebro le pone una lupa: entre más te fijas, más fuerte se siente.',
      },
      {
        nombre: 'Te asusta',
        nivel: 0.74,
        senal: { alarma: ['amigdala', 'corazon'], flujos: ['corazon-alarma'], bpm: 90 },
        t: 'La {{amigdala}} lo lee como señal de enfermedad y enciende la alarma. Te revisas el pulso o lo buscas en internet, y por un ratito te calmas.',
      },
      {
        nombre: 'El círculo',
        nivel: 0.9,
        senal: {
          alarma: ['amigdala', 'suprarrenales', 'corazon'],
          flujos: ['corazon-alarma', 'alarma-supra', 'supra-corazon'],
          bpm: 100,
          zonas: { pecho: 'tension' },
        },
        t: 'Pero la alarma suelta {{adrenalina}}, que hace latir más fuerte al corazón… y eso parece darle la razón al miedo. Así se arma el círculo.',
      },
      {
        nombre: 'Sales',
        nivel: 0.32,
        senal: { calma: ['corazon'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 70 },
        t: 'Se rompe cuando la atención se va a otra cosa y cuando te revisas menos. Acordar con tu médico cada cuándo revisarte ayuda más que buscar en internet.',
      },
    ],
    medico: 'Si algo es nuevo, fuerte o no se quita, sí vale la pena que te revise un médico. La idea no es ignorar tu cuerpo: es no vivir revisándolo.',
    ir: { to: '/nervios', label: 'Entender mis nervios' },
  },
]
