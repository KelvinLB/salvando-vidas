import type { Senal } from '../components/cuerpo3d/organos'

// «Mi diccionario» y «Lo que siento» de Explorar por dentro: palabras que se abren con una frase
// sencilla y fichas que explican paso a paso lo que la gente pregunta en los grupos de apoyo (los
// posts se resumieron; nunca se guardan nombres). Cada paso le dice a la escena 3D qué encender.
// Se cuenta con «puede», «suele» y «una explicación posible»: se explica, no se diagnostica.
// Pendiente de revisión con psicóloga y médico: todos los textos de este archivo.
// Fuentes: Sharpless y Barber 2011, Sleep Med Rev (parálisis del sueño, ~8 % de la población);
// AASM, parálisis del sueño; Harvard Health, «Understanding the stress response»; AHA, depresión
// y ansiedad después de un infarto y rehabilitación cardiaca; NICE y AASM 2017 (TCC-I como primer
// tratamiento del insomnio crónico); FDA y NHS (no suspender hipnóticos de golpe); Ebrahim et al.
// 2013, Alcohol Clin Exp Res (alcohol y la segunda mitad del sueño); Breit et al. 2018 (nervio vago).

/** En el texto, {{id}} abre una palabra; {{id|otra forma}} la escribe distinto. */
export type Termino = { id: string; nombre: string; def: string }

export const TERMINOS: Record<string, Termino & { palabra: string }> = Object.fromEntries(
  (
    [
      ['rem', 'Fase REM', 'fase REM', 'La parte del sueño en la que más se sueña. Los ojos se mueven rápido detrás de los párpados y casi todos los músculos se quedan quietos.'],
      ['amigdala', 'Amígdala', 'amígdala', 'Dos almendritas en el centro del cerebro que revisan todo el tiempo si hay peligro y encienden la alarma.'],
      ['diafragma', 'Diafragma', 'diafragma', 'El músculo en forma de cúpula debajo de los pulmones. Al bajar, mete el aire; sigue trabajando aunque duermas.'],
      ['alveolos', 'Alvéolos', 'alvéolos', 'Bolsitas diminutas al final de los bronquios, cientos de millones. Ahí el oxígeno pasa a la sangre y el dióxido de carbono sale.'],
      ['co2', 'Dióxido de carbono (CO₂)', 'dióxido de carbono', 'El gas que el cuerpo produce al usar energía y que sale al soltar el aire. Si respiras muy rápido, sacas de más, y eso marea.'],
      ['suprarrenales', 'Glándulas suprarrenales', 'suprarrenales', 'Dos glándulas chiquitas encima de los riñones que sueltan las hormonas de la alarma.'],
      ['adrenalina', 'Adrenalina', 'adrenalina', 'La alarma rápida: llega en segundos y se gasta en minutos. Acelera el corazón y la respiración.'],
      ['cortisol', 'Cortisol', 'cortisol', 'La alarma lenta. Ayuda a despertar en la mañana, pero con estrés de semanas se queda encendida en bajito y cansa.'],
      ['vago', 'Nervio vago', 'nervio vago', 'El cable largo que baja del cerebro al corazón, los pulmones y la panza. Es el freno del cuerpo.'],
      ['rehabilitacion', 'Rehabilitación cardiaca', 'rehabilitación cardiaca', 'Un programa con personal de salud después de un problema del corazón: ejercicio vigilado, aprender las señales de alarma y apoyo con el miedo.'],
      ['tcci', 'Terapia para el insomnio (TCC-I)', 'terapia para el insomnio', 'Una terapia corta que cambia hábitos y pensamientos sobre el sueño. Las guías la recomiendan como primer tratamiento para el insomnio que dura.'],
    ] as const
  ).map(([id, nombre, palabra, def]) => [id, { id, nombre, palabra, def }]),
)

const EMERGENCIA =
  'Si el dolor de pecho no se quita, se va al brazo, la mandíbula o la espalda, o te falta el aire, llama a emergencias (911 en México).'

export type Paso = Senal & { t: string }

export type Ficha = {
  id: string
  /** Como lo diría alguien: va en el botón. */
  label: string
  title: string
  /** Pedacitos de palabras (sin acentos) para encontrarla escribiendo con tus palabras. */
  keys: string[]
  /** Antes de ver: una pregunta sin respuestas malas ni puntos. */
  adivina?: { q: string; opts: string[]; a: string }
  aviso?: string
  pasos: Paso[]
  /** Al final: cuándo ir al médico o llamar a emergencias. */
  medico?: string
  riesgo?: string
  cierre?: string
  ir?: { to: string; label: string }
}

export const FICHAS: Ficha[] = [
  {
    id: 'respirar',
    label: '¿Qué pasa cuando respiro?',
    title: 'Cómo respiras por dentro',
    keys: ['respir', 'aire', 'pulmon', 'ahog', 'mare', 'hormigu'],
    pasos: [
      { respira: 'lenta', aire: true, foco: ['pulmones', 'diafragma'], calma: ['diafragma'], bpm: 66,
        t: 'Al tomar aire, el {{diafragma}} baja como un émbolo y los pulmones se llenan. El aire entra por la tráquea y se reparte por los bronquios.' },
      { respira: 'lenta', aire: true, foco: ['pulmones'], brillo: ['pulmones'], bpm: 66,
        t: 'Al final de los bronquios están los {{alveolos}}. Ahí el oxígeno pasa a la sangre, y la sangre lo lleva a todo el cuerpo.' },
      { respira: 'lenta', aire: true, foco: ['corazon', 'pulmones'], flujos: ['vago'], calma: ['corazon'], bpm: 64,
        t: 'Al soltar el aire sale el {{co2}}. Y al soltarlo despacio, el {{vago}} frena un poquito al corazón: por eso exhalar largo calma.' },
      { respira: 'rapida', aire: true, foco: ['pulmones', 'amigdala'], alarma: ['amigdala'], flujos: ['pulmon-alarma'], bpm: 104,
        t: 'Con los nervios se respira rápido y por arriba. No te falta oxígeno: sacas de más {{co2}}, y eso da mareo y hormigueo en dedos y boca.' },
      { respira: 'lenta', aire: true, flujos: ['vago'], calma: ['corazon', 'pulmones'], bpm: 62,
        t: 'Para volver: suelta el aire más largo de lo que lo tomas. Sigue al cuerpo: toma aire mientras se llena… y suéltalo despacio mientras baja.' },
    ],
    ir: { to: '/calma', label: 'Respirar con el cuerpo en Calma' },
  },
  {
    id: 'paralisis',
    label: 'Desperté y no me podía mover',
    title: 'Parálisis del sueño',
    keys: ['mover', 'paraliz', 'aplast', 'desperte', 'presencia', 'gritar', 'subio el muerto', 'se me subio'],
    adivina: {
      q: 'Antes de ver: ¿por qué crees que no te podías mover?',
      opts: ['Algo me estaba deteniendo', 'Me faltaba el aire', 'Mi cuerpo seguía dormido'],
      a: 'La explicación más probable es la tercera: tu mente despertó y tu cuerpo todavía no. Vamos a verlo paso a paso.',
    },
    pasos: [
      { calma: ['cerebro'], ola: 'freno', bpm: 58,
        t: 'Mientras sueñas, en la {{rem}}, el cerebro apaga casi todos los músculos para que el cuerpo no haga lo que pasa en el sueño. Mira la luz que baja: pasa todas las noches.' },
      { foco: ['cerebro'], alarma: ['cerebro'], ola: 'freno', bpm: 62,
        t: 'A veces la mente se despierta antes de que termine ese apagado. Ves tu cuarto y sabes dónde estás, pero el cuerpo todavía no responde. Dura de segundos a unos minutos.' },
      { foco: ['amigdala', 'corazon'], alarma: ['amigdala', 'suprarrenales', 'corazon'], flujos: ['alarma-supra', 'supra-corazon'], bpm: 100,
        t: 'La {{amigdala}} nota que no te puedes mover y enciende la alarma. El sueño se mezcla con lo que ves: por eso se puede sentir un peso en el pecho o que hay alguien en el cuarto.' },
      { foco: ['pulmones', 'diafragma'], calma: ['diafragma', 'pulmones'], respira: 'normal', aire: true, bpm: 92,
        t: 'El {{diafragma}} nunca se apaga: aunque el pecho se sienta aplastado, sigues respirando todo el tiempo.' },
      { flujos: ['vago'], calma: ['corazon'], bpm: 66,
        t: 'Se termina sola. Ayuda mover primero algo pequeño, como un dedo del pie o los ojos, y soltar el aire despacio. Le pasa a mucha gente: cerca de 8 de cada 100 personas lo han vivido al menos una vez, y es más común con estrés y poco sueño.' },
    ],
    medico: 'Si te pasa seguido, o si de día te da un sueño muy fuerte de golpe, coméntalo con un médico: hay especialistas del sueño.',
  },
  {
    id: 'corazon',
    label: 'El corazón me late fuerte sin razón',
    title: 'El corazón acelerado con los nervios',
    keys: ['corazon', 'late', 'latido', 'palpit', 'taquic', 'pecho'],
    adivina: {
      q: 'Antes de ver: si no hay ningún peligro, ¿qué crees que acelera al corazón?',
      opts: ['Algo anda mal en el corazón', 'Una alarma que se prendió en el cerebro', 'No sé'],
      a: 'Muchas veces es la alarma: el cerebro manda la señal y el corazón obedece. Solo un médico puede revisar el corazón; aquí te enseñamos el camino de la alarma.',
    },
    pasos: [
      { foco: ['cerebro'], alarma: ['amigdala'], bpm: 72, t: 'Algo, a veces solo un pensamiento, enciende la {{amigdala}}.' },
      { foco: ['suprarrenales'], alarma: ['amigdala', 'suprarrenales'], flujos: ['alarma-supra'], bpm: 84,
        t: 'La señal baja por el cuerpo y las {{suprarrenales}} sueltan {{adrenalina}}, el chispazo de la alarma.' },
      { foco: ['corazon'], alarma: ['suprarrenales', 'corazon'], flujos: ['supra-corazon'], respira: 'rapida', aire: true, bpm: 118,
        t: 'El corazón late más rápido y más fuerte, y la respiración se acelera. El cuerpo se prepara para correr, aunque no haya de qué.' },
      { foco: ['corazon', 'amigdala'], alarma: ['corazon', 'amigdala'], flujos: ['corazon-alarma'], bpm: 122,
        t: 'Sentir el latido asusta, y el susto le sube otra vez a la alarma. Así se arma el círculo del pánico.' },
      { foco: ['corazon'], calma: ['corazon'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 70,
        t: 'El {{vago}} es el freno. Soltar el aire más largo de lo que entra lo activa, y el latido baja solo en unos minutos.' },
    ],
    medico: EMERGENCIA,
    ir: { to: '/panico', label: 'Si es un ataque de pánico' },
  },
  {
    id: 'infarto',
    label: 'Tuve un infarto y temo que me dé otro',
    title: 'El miedo después de un infarto',
    keys: ['infarto', 'stent', 'cardiolog', 'otro infarto', 'cateterism'],
    aviso: 'Esta ficha no puede decirte si lo que sientes viene de tu corazón o de la alarma. Eso solo lo puede ver tu cardiólogo.',
    pasos: [
      { foco: ['corazon'], alarma: ['corazon'], bpm: 72,
        t: 'Tu corazón vivió algo real y lo están tratando. Que quede miedo después es muy común y no quiere decir que algo esté mal contigo.' },
      { foco: ['corazon', 'amigdala'], alarma: ['amigdala', 'corazon'], flujos: ['corazon-alarma'], bpm: 80,
        t: 'La {{amigdala}} aprendió que el pecho puede ser peligro y ahora vigila cada latido. Al vigilar, el cerebro le sube el volumen a lo que sientes.' },
      { foco: ['corazon', 'suprarrenales'], alarma: ['suprarrenales', 'corazon'], flujos: ['alarma-supra', 'supra-corazon'], bpm: 104,
        t: 'El miedo suelta {{adrenalina}}, que acelera el corazón. Ese latido rápido parece darle la razón al miedo, y el círculo sigue.' },
      { foco: ['corazon'], calma: ['corazon'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 68,
        t: 'Lo que ayuda: la {{rehabilitacion}}, pedirle a tu cardiólogo por escrito qué síntomas son de alarma y cuáles no, y hablar del miedo con alguien de psicología. El miedo también tiene tratamiento.' },
    ],
    medico: EMERGENCIA,
  },
  {
    id: 'tristeza',
    label: 'Siento que me voy a morir de tristeza',
    title: 'La tristeza en el cuerpo',
    keys: ['triste', 'ruptura', 'relacion', 'termin', 'extran', 'duelo', 'perdi', 'corazon roto'],
    pasos: [
      { foco: ['cerebro'], alarma: ['amigdala', 'cerebro'], bpm: 78,
        t: 'Perder a alguien o una relación, el cuerpo lo vive como una amenaza: se enciende la alarma.' },
      { foco: ['estomago'], alarma: ['estomago'], flujos: ['alarma-panza'], bpm: 80, t: 'El estómago se frena: llega el nudo y se va el hambre.' },
      { foco: ['pulmones'], alarma: ['esqueleto'], ola: 'alarma', bpm: 82,
        t: 'Los músculos del pecho y la espalda se aprietan. Por eso la tristeza se siente como un peso en el pecho.' },
      { foco: ['suprarrenales'], alarma: ['suprarrenales'], flujos: ['alarma-supra'], bpm: 80,
        t: 'El {{cortisol}}, la alarma lenta, se queda encendido en bajito, y cuesta dormir.' },
      { calma: ['corazon', 'estomago'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 68,
        t: 'Duele de verdad, y el cuerpo va bajando la alarma con el tiempo. Ayuda comer poquito a sus horas, moverte un poco y contárselo a alguien.' },
    ],
    riesgo: 'Si además aparece la idea de no querer vivir, eso necesita ayuda hoy, no solo una explicación.',
    ir: { to: '/ayuda', label: 'Hablar con alguien' },
  },
  {
    id: 'pastillas',
    label: 'Tomo pastillas para dormir y no quiero depender',
    title: 'Pastillas para dormir',
    keys: ['pastilla', 'adict', 'medicina', 'medicamento', 'depender', 'dormir', 'insomnio', 'clonazepam', 'rivotril'],
    pasos: [
      { foco: ['cerebro'], calma: ['cerebro'], bpm: 64,
        t: 'Muchas pastillas para dormir le bajan el volumen al cerebro para que se apague más fácil. Hay de varios tipos y cada una funciona distinto.' },
      { foco: ['cerebro'], alarma: ['cerebro'], bpm: 66,
        t: 'Con algunas, el cuerpo se acostumbra con el tiempo. Por eso dejarlas de golpe puede traer noches peores por una temporada.' },
      { calma: ['cerebro'], respira: 'lenta', aire: true, bpm: 62,
        t: 'Lo seguro es platicarlo con quien te las recetó: puede armar un plan para bajarlas poco a poco. También existe la {{tcci}}, que ayuda a dormir sin pastillas.' },
    ],
    medico: 'No dejes ni cambies un medicamento por tu cuenta.',
    ir: { to: '/noche', label: 'Para las noches difíciles' },
  },
  {
    id: 'risa',
    label: 'Hoy me la pasé bien, sin alcohol',
    title: 'Cuando la pasas bien con gente',
    keys: ['alcohol', 'diverti', 'risa', 'amig', 'sobri', 'sin tomar', 'la pase bien'],
    pasos: [
      { foco: ['cerebro'], calma: ['cerebro', 'amigdala'], bpm: 70,
        t: 'Reír y platicar con gente de confianza enciende la recompensa del cerebro y le baja el volumen a la alarma.' },
      { foco: ['corazon', 'pulmones'], calma: ['corazon', 'pulmones'], flujos: ['vago'], respira: 'lenta', aire: true, bpm: 64,
        t: 'El {{vago}} trabaja más: el corazón se calma y la respiración se hace lenta y profunda.' },
      { calma: ['cerebro'], bpm: 62,
        t: 'Sin alcohol, el sueño de esa noche también gana: el alcohol ayuda a dormirse, pero rompe la segunda mitad de la noche.' },
    ],
    cierre: 'Vale la pena acordarte de qué hiciste, para repetirlo.',
  },
]

const sinAcentos = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** La ficha que mejor responde a lo que alguien escribió con sus palabras, o ninguna. */
export function buscarFicha(texto: string): Ficha | undefined {
  const q = sinAcentos(texto.trim())
  if (q.length < 3) return undefined
  let mejor: Ficha | undefined
  let puntos = 0
  for (const f of FICHAS) {
    const n = f.keys.filter((k) => q.includes(k)).length + (sinAcentos(f.title).includes(q) ? 2 : 0)
    if (n > puntos) [mejor, puntos] = [f, n]
  }
  return mejor
}

/** Parte un texto en pedazos: texto suelto o una palabra que se abre. */
export function partirTexto(texto: string): ({ texto: string } | { termino: string; texto: string })[] {
  const out: ({ texto: string } | { termino: string; texto: string })[] = []
  const re = /\{\{(\w+)(?:\|([^}]+))?\}\}/g
  let i = 0
  for (let m = re.exec(texto); m; m = re.exec(texto)) {
    if (m.index > i) out.push({ texto: texto.slice(i, m.index) })
    const t = TERMINOS[m[1]]
    out.push(t ? { termino: t.id, texto: m[2] ?? t.palabra } : { texto: m[2] ?? m[1] })
    i = m.index + m[0].length
  }
  if (i < texto.length) out.push({ texto: texto.slice(i) })
  return out
}

/** Las palabras que aparecen en un texto, en orden y sin repetir. */
export const terminosDe = (...textos: string[]) => [
  ...new Set(textos.flatMap((t) => partirTexto(t).flatMap((p) => ('termino' in p ? [p.termino] : [])))),
]
