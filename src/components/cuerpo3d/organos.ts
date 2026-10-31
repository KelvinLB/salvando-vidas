// Las partes que se pueden tocar en «Explorar por dentro» (3D) y su tarjeta corta: qué es, por
// qué se siente así con los nervios o el ánimo bajo, y qué ayuda. Este archivo no importa three:
// lo usan también la lista de partes y la versión en 2D, que deben pesar poco.
//
// Pendiente de revisión con psicóloga y médico.
// Fuentes (las mismas de la investigación «Tu cuerpo, versión 2», cuerpo/contenido.md):
// - Harvard Health, «Understanding the stress response» y «The gut-brain connection».
// - Breit et al. 2018, Front Psychiatry (nervio vago y eje intestino-cerebro): https://pmc.ncbi.nlm.nih.gov/articles/PMC5859128/
// - Laborde et al. 2022, Neurosci Biobehav Rev (respiración lenta y VFC, metaanálisis).
// - MedlinePlus, hiperventilación: https://medlineplus.gov/spanish/ency/article/003071.htm
// - NHS, ansiedad y palpitaciones: https://www.nhs.uk/mental-health/conditions/panic-disorder/
// - Taché y Bonaz 2007, J Clin Invest (estrés: el estómago se frena y el colon se acelera).
// - Revisión sobre sudor psicológico, Skin Pharmacol Physiol (palmas, plantas, cara y axilas).

export type ParteId =
  | 'cerebro'
  | 'amigdala'
  | 'vago'
  | 'pulmones'
  | 'via'
  | 'diafragma'
  | 'corazon'
  | 'estomago'
  | 'intestinos'
  | 'rinones'
  | 'esqueleto'
  | 'piel'

/** Capas que se prenden y apagan. «nervios» es la alarma y el freno: amígdala y nervio vago. */
export type Capa = 'piel' | 'esqueleto' | 'organos' | 'nervios'

/**
 * Lo que la escena muestra en cada paso de una ficha de «Lo que siento». En naranja la alarma, en
 * verde el freno; las señales son puntos que corren por un camino. Sin parpadeos: todo se enciende
 * y se apaga despacio. Este tipo vive aquí (sin three) para que los datos no carguen la escena.
 */
export type Organo3D =
  | 'cerebro'
  | 'amigdala'
  | 'pulmones'
  | 'via'
  | 'diafragma'
  | 'corazon'
  | 'estomago'
  | 'intestinos'
  | 'suprarrenales'
  | 'esqueleto'
  | 'vago'

export type Flujo = 'alarma-supra' | 'supra-corazon' | 'corazon-alarma' | 'alarma-panza' | 'pulmon-alarma' | 'vago'

export type Senal = {
  /** A dónde se acerca la cámara; sin foco, el cuerpo entero. */
  foco?: Organo3D[]
  /** Encendidos en naranja: la alarma. */
  alarma?: Organo3D[]
  /** Encendidos en verde: el freno. */
  calma?: Organo3D[]
  /** Los pulmones se iluminan con el aire. */
  brillo?: Organo3D[]
  flujos?: Flujo[]
  respira?: 'lenta' | 'normal' | 'rapida'
  /** Se ve el aire entrar y salir. */
  aire?: boolean
  bpm?: number
  /** Una banda de luz que baja por la piel y los huesos: el apagado del sueño o la tensión. */
  ola?: 'alarma' | 'freno'
}

export type Parte = {
  id: ParteId
  nombre: string
  capa: Capa
  que: string
  porque: string
  ayuda: string
  /** Una pantalla de la app que sirve para lo que dice «qué ayuda». */
  ir?: { to: string; label: string }
}

export const CAPAS: { id: Capa; label: string }[] = [
  { id: 'piel', label: 'Piel' },
  { id: 'esqueleto', label: 'Huesos' },
  { id: 'organos', label: 'Órganos' },
  { id: 'nervios', label: 'Alarma y freno' },
]

export const PARTES: Parte[] = [
  {
    id: 'amigdala',
    nombre: 'Amígdala',
    capa: 'nervios',
    que: 'Dos almendritas en el centro del cerebro, una de cada lado. Revisan todo el tiempo si hay peligro.',
    porque:
      'Cuando lee algo como peligro, enciende la alarma del cuerpo en menos de un segundo, aunque el peligro no sea real. Por eso el susto llega antes que la explicación.',
    ayuda:
      'Ponerle nombre («es mi alarma, no un peligro») y soltar el aire despacio. La alarma no se apaga a la fuerza: se calma cuando el cuerpo recibe señales de que está a salvo.',
    ir: { to: '/calma', label: 'Respirar despacio' },
  },
  {
    id: 'cerebro',
    nombre: 'Cerebro',
    capa: 'organos',
    que: 'Arma todo lo que sientes y piensas. La parte de enfrente, detrás de la frente, es la que calma a la alarma y ayuda a pensar con orden.',
    porque:
      'Con mucho miedo, cansancio o tristeza, esa parte de enfrente se oye menos. Por eso cuesta pensar claro en una crisis o decidir cosas pequeñas en un día pesado, y eso no es tu culpa.',
    ayuda: 'Una cosa a la vez. Dormir a horas parecidas, moverse un poco y escribir lo que da vueltas en la cabeza le devuelven el volumen.',
    ir: { to: '/diario', label: 'Escribirlo' },
  },
  {
    id: 'vago',
    nombre: 'Nervio vago',
    capa: 'nervios',
    que: 'Un cable largo que baja del cerebro por el cuello hasta el corazón, los pulmones y la panza. Es la línea principal del freno del cuerpo.',
    porque:
      'La ansiedad pisa el acelerador; el {{vago|vago}} es el freno, y siempre está ahí. También lleva al cerebro lo que pasa en la panza y el pecho, por eso el cuerpo y el ánimo se contagian.',
    ayuda:
      'Soltar el aire más largo de lo que lo tomas. Al exhalar, el corazón baja un poco su ritmo: es el freno trabajando. No hace falta ningún truco raro, solo respirar despacio un rato.',
    ir: { to: '/calma', label: 'Respirar despacio' },
  },
  {
    id: 'pulmones',
    nombre: 'Pulmones',
    capa: 'organos',
    que: 'Dos esponjas que meten aire y sacan el gas que sobra. Los mueve el {{diafragma}}, un músculo debajo de ellos.',
    porque:
      'Con los nervios se respira rápido y arriba, en el pecho. No te falta oxígeno: sacas de más otro gas, el {{co2}}, y eso da mareo y hormigueo en dedos y boca.',
    ayuda: 'Soltar el aire despacio, no jalar más. Poner una mano en la panza y sentir que se infla al tomar aire.',
    ir: { to: '/calma', label: 'Respirar despacio' },
  },
  {
    id: 'via',
    nombre: 'Tráquea y bronquios',
    capa: 'organos',
    que: 'El tubo por donde baja el aire, que abajo se divide en ramas, una para cada pulmón. Al final de las ramas están los {{alveolos}}.',
    porque: 'Con los nervios se puede sentir la garganta cerrada o un nudo, aunque el aire sigue pasando todo el tiempo.',
    ayuda: 'Tragar saliva, beber agua a sorbos y soltar el aire largo. Si de verdad no entra el aire o se hinchan los labios o la lengua, llama a emergencias.',
    ir: { to: '/calma', label: 'Respirar despacio' },
  },
  {
    id: 'diafragma',
    nombre: 'Diafragma',
    capa: 'organos',
    que: 'El músculo en forma de cúpula debajo de los pulmones. Al bajar, mete el aire; sigue trabajando aunque duermas o no lo pienses.',
    porque: 'Con la tensión se queda arriba, apretado, y la respiración se vuelve corta y por el pecho.',
    ayuda: 'Una mano en la panza: siente que se infla al tomar aire y baja al soltarlo. Eso es el diafragma moviéndose.',
    ir: { to: '/calma', label: 'Respirar despacio' },
  },
  {
    id: 'corazon',
    nombre: 'Corazón',
    capa: 'organos',
    que: 'Un músculo del tamaño de tu puño que mueve la sangre por todo el cuerpo, sin descanso y sin que lo pienses.',
    porque:
      'La {{adrenalina}} lo hace latir más rápido y más fuerte para llevar sangre a brazos y piernas. Sentirlo así no quiere decir que esté fallando: con la ansiedad, el cerebro le sube el volumen a lo que sientes por dentro.',
    ayuda:
      'Exhalar largo y esperar: el latido baja solo en unos minutos. Si el dolor de pecho no se quita o se va al brazo, la mandíbula o la espalda, llama a emergencias.',
    ir: { to: '/cuerpo?ver=panico', label: 'Ver qué pasa en el pánico' },
  },
  {
    id: 'estomago',
    nombre: 'Estómago',
    capa: 'organos',
    que: 'La bolsa donde empieza la digestión. Está debajo de las costillas, un poco a la izquierda.',
    porque:
      'Con la alarma, el cuerpo pone en pausa la digestión: el estómago se frena. De ahí el nudo, la náusea o no tener hambre. El estrés de semanas también puede darte acidez.',
    ayuda: 'Respirar con la panza, comer poquito y a sus horas, y algo tibio. Si el dolor es fuerte o no se quita, que lo revise un médico.',
    ir: { to: '/cuerpo?zona=estomago', label: 'Marcar lo que siento' },
  },
  {
    id: 'intestinos',
    nombre: 'Intestinos',
    capa: 'organos',
    que: 'Un tubo muy largo y doblado que termina la digestión. Platica con el cerebro todo el tiempo, en las dos direcciones.',
    porque:
      'Con el estrés, el intestino se acelera mientras el estómago se frena. Por eso con los nervios puede haber náusea y, al mismo tiempo, ganas de ir al baño. La colitis nerviosa es real, no «está en tu cabeza».',
    ayuda:
      'Calmar la mente ayuda a la panza, y cuidar la panza ayuda a la mente. Caminar un poco y comer a sus horas. Si hay sangre o bajas de peso sin querer, ve con un médico.',
    ir: { to: '/cuerpo?ver=estres', label: 'Ver qué hace el estrés' },
  },
  {
    id: 'rinones',
    nombre: 'Riñones y suprarrenales',
    capa: 'organos',
    que: 'Los riñones limpian la sangre. Encima de cada uno hay una glándula chiquita, la {{suprarrenales|suprarrenal}}, que suelta las hormonas de la alarma.',
    porque:
      'Hay dos alarmas. La {{adrenalina}} es el chispazo: llega en segundos y se gasta en minutos, por eso el pánico sube y baja. El {{cortisol}} es la alarma lenta: con el estrés de semanas se queda encendido en bajito y cansa.',
    ayuda: 'Para el chispazo, esperar y exhalar: pasa. Para la alarma lenta, pausas de verdad durante el día, moverse y dormir a horas parecidas.',
    ir: { to: '/cuerpo?ver=estres', label: 'Ver qué hace el estrés' },
  },
  {
    id: 'esqueleto',
    nombre: 'Costillas y columna',
    capa: 'esqueleto',
    que: 'La caja de las costillas cuida al corazón y a los pulmones, y se mueve con cada respiración. La columna sostiene todo y protege la médula.',
    porque:
      'Con la tensión, los músculos entre las costillas y los de la espalda se aprietan. Eso se siente como el pecho apretado o como un peso en la espalda.',
    ayuda: 'Aflojar a propósito: subir los hombros, sostener un momento y soltarlos. Estirarte despacio y respirar con la panza.',
    ir: { to: '/cuerpo#aflojar', label: 'Aflojar el cuerpo' },
  },
  {
    id: 'piel',
    nombre: 'Piel',
    capa: 'piel',
    que: 'Cubre y cuida todo el cuerpo. Tiene muchas glándulas de sudor, sobre todo en las palmas, las plantas y la cara.',
    porque:
      'Las manos sudan con los nervios aunque no haga calor: esas glándulas se encienden con la alarma, no con la temperatura. También pueden enfriarse, porque la sangre se va a los músculos.',
    ayuda: 'Agua fría en las manos o en la cara, y soltar el aire despacio. Pasa cuando la alarma baja.',
  },
]

export const parteById = (id: string) => PARTES.find((p) => p.id === id)
