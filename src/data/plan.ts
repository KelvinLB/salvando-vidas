// El Plan de Seguridad de Stanley y Brown, una herramienta clínica usada en prevención del
// suicidio, contado como preguntas de una en una. Se llena con calma, en un buen momento, y
// se usa en orden: primero lo que puedo hacer yo, después otras personas y al final los
// profesionales. Los textos y las ideas deben pasar por la revisión de un psicólogo.

export type StepKey = 'senales' | 'yo' | 'lugares' | 'personas' | 'profesionales' | 'entorno'

export type PlanStep = {
  key: StepKey
  /** Para la barra de pasos. */
  label: string
  /** Para el plan ya escrito. */
  title: string
  question: string
  hint: string
  /** Ideas que se agregan con un toque. */
  ideas: string[]
  /** Ideas para completar: se ponen en el campo y la persona escribe el resto. */
  blanks?: string[]
  /** Solo si la persona activó el contenido de fe. */
  faithIdeas?: string[]
}

export const PLAN_STEPS: PlanStep[] = [
  {
    key: 'senales',
    label: 'Señales',
    title: 'Mis señales de alerta',
    question: '¿Cómo te das cuenta de que se viene un momento difícil?',
    hint: 'Pensamientos, sensaciones o situaciones que te avisan. Conocerlas te ayuda a usar tu plan a tiempo.',
    ideas: [
      'No puedo dormir',
      'Me encierro y no quiero ver a nadie',
      'Pienso que soy una carga',
      'Siento un vacío que no se va',
      'Lloro sin saber por qué',
      'Dejo de comer o como de más',
      'Después de una discusión',
      'Cuando me quedo a solas de noche',
    ],
  },
  {
    key: 'yo',
    label: 'Lo que hago yo',
    title: 'Lo que puedo hacer yo',
    question: '¿Qué puedes hacer tú, sin nadie más, para sentirte un poco mejor?',
    hint: 'Cosas que te calman o te distraen un rato, aunque sea poquito.',
    ideas: [
      'Respirar despacio un minuto',
      'Darme una ducha tibia',
      'Salir a caminar',
      'Nombrar 5 cosas que veo',
      'Tomar un té despacio',
      'Abrazar una almohada',
      'Escribir en mi diario',
    ],
  },
  {
    key: 'lugares',
    label: 'Lugares',
    title: 'Lugares y personas que me distraen',
    question: '¿A dónde puedes ir, o con quién estar, para no quedarte a solas con tus pensamientos?',
    hint: 'No hace falta contarles lo que pasa: basta con estar con alguien o en un lugar con gente.',
    ideas: [
      'Ir a la sala con mi familia',
      'Un parque',
      'La casa de una amiga o un amigo',
      'Una cafetería',
      'Una videollamada con alguien',
      'Sacar a pasear a mi perro',
    ],
    faithIdeas: ['Mi iglesia o mi grupo de fe'],
  },
  {
    key: 'personas',
    label: 'Personas',
    title: 'Personas a las que puedo pedir ayuda',
    question: '¿A quién le puedes pedir ayuda?',
    hint: 'Hasta tres personas de confianza. Aparecen en «Necesito ayuda» para llamarles o escribirles con un toque.',
    ideas: [],
  },
  {
    key: 'profesionales',
    label: 'Profesionales',
    title: 'Profesionales y servicios',
    question: '¿Qué profesionales o servicios puedes buscar?',
    hint: 'Si escribes su teléfono, en «Necesito ayuda» se les podrá llamar con un toque.',
    ideas: [],
    blanks: ['Mi psicóloga o psicólogo: ', 'Mi psiquiatra: ', 'Mi médico: ', 'La urgencia más cercana: '],
  },
  {
    key: 'entorno',
    label: 'A salvo',
    title: 'Cómo hacer mi entorno más seguro',
    question: '¿Qué puedes alejar de ti, o pedirle a alguien que guarde, cuando te sientas en riesgo?',
    hint: 'Poner distancia entre tú y lo que podría hacerte daño es de lo que más protege en una crisis.',
    ideas: [
      'Pedirle a alguien que guarde mis medicamentos',
      'Sacar de la casa lo que me pueda hacer daño',
      'No tomar alcohol cuando me siento así',
      'Dejar las llaves del coche con alguien',
      'Quedarme donde haya más gente',
    ],
  },
]

export const STEP = Object.fromEntries(PLAN_STEPS.map((s) => [s.key, s])) as Record<StepKey, PlanStep>

/** Lo que le gusta a la mascota (que representa a la persona), dicho como algo que se puede hacer. */
export const LIKE_ACTIONS: Record<string, string> = {
  musica: 'Poner música que me guste',
  naturaleza: 'Salir a ver los árboles o el cielo',
  animales: 'Ver videos de animales',
  peliculas: 'Ver una película que me guste',
  dibujar: 'Dibujar un rato',
  acertijos: 'Resolver un acertijo',
  juegos: 'Jugar algo tranquilo',
  escribir: 'Escribir en mi diario',
  cocinar: 'Cocinar algo sencillo',
  universo: 'Ver videos del universo',
  reir: 'Ver algo que me haga reír',
  moverse: 'Estirarme o hacer yoga suave',
}

export const BREATHING_HELPED = 'Respirar 4-6 un minuto, como en la app'
