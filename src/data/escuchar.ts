// Reflexiones con voz para «Para escuchar». Pendientes de revisión con psicóloga.
// Los audios se generan con tools/voces (ver su README) y viven en public/audio/escuchar/<id>.m4a.
// El texto de cada una es su guion: tools/voces/guiones/<id>.txt.
export type Reflexion = {
  id: string
  title: string
  about: string
  // Las que hablan de pedir ayuda muestran debajo el enlace a las líneas de ayuda.
  ayuda?: boolean
}

export type Serie = {
  title: string
  // La serie de fe solo aparece si la persona la activó en Ajustes.
  fe?: boolean
  items: Reflexion[]
}

export const SERIES: Serie[] = [
  {
    title: 'Para un día pesado',
    items: [
      { id: 'hoy-pesa', title: 'Hoy pesa', about: 'Para un día en el que todo cuesta el doble.' },
      {
        id: 'cuando-no-puedo-llorar',
        title: 'Cuando no puedo llorar',
        about: 'Cuando el dolor se queda atorado y no sale en lágrimas.',
      },
      {
        id: 'no-esperes-a-tener-ganas',
        title: 'No esperes a tener ganas',
        about: 'Las ganas suelen llegar después de moverte, no antes.',
      },
      {
        id: 'cuando-no-me-puedo-levantar',
        title: 'Cuando no me puedo levantar',
        about: 'Salir de la cama por partes, sin regañarte.',
      },
    ],
  },
  {
    title: 'Para la noche',
    items: [
      {
        id: 'la-cabeza-no-se-apaga',
        title: 'La cabeza no se apaga',
        about: 'Dejar para mañana lo que da vueltas de noche.',
      },
      {
        id: 'si-despiertas-de-madrugada',
        title: 'Si despiertas de madrugada',
        about: 'Sin pelear con el insomnio.',
      },
      {
        id: 'cuerpo-pesado-cama-blanda',
        title: 'Cuerpo pesado, cama blanda',
        about: 'Un recorrido lento por el cuerpo para descansar.',
      },
    ],
  },
  {
    title: 'Cuando todo se siente sin sentido',
    items: [
      {
        id: 'el-hueco-no-es-todo',
        title: 'El hueco no es todo lo que eres',
        about: 'Sentir vacío es algo que vives, no una verdad sobre tu vida.',
        ayuda: true,
      },
      {
        id: 'algo-pequeno-por-alguien',
        title: 'Algo pequeño por alguien',
        about: 'A veces el sentido aparece al hacer algo por otro ser.',
      },
      {
        id: 'lo-que-todavia-puedo-elegir',
        title: 'Lo que todavía puedo elegir',
        about: 'Cuando no puedes cambiar lo que pasa.',
      },
    ],
  },
  {
    title: 'Cuando llega el pánico',
    items: [
      {
        id: 'la-ola-sube-y-baja',
        title: 'La ola sube y baja',
        about: 'Para escuchar en el momento: respira con la voz.',
      },
      {
        id: 'tu-corazon-hace-su-trabajo',
        title: 'Tu corazón está haciendo su trabajo',
        about: 'Por qué late tan fuerte cuando llega el miedo.',
      },
      {
        id: 'despues-de-la-ola',
        title: 'Después de la ola',
        about: 'Cuidar al cuerpo cuando ya bajó.',
      },
    ],
  },
  {
    title: 'Para tratarte con cariño',
    items: [
      {
        id: 'hablate-como-a-alguien-que-quieres',
        title: 'Háblate como a alguien que quieres',
        about: 'Notar el dolor y decirte algo amable.',
      },
      {
        id: 'la-culpa-que-pesa-de-mas',
        title: 'La culpa que pesa de más',
        about: 'Hacerte cargo sin castigarte.',
      },
      {
        id: 'no-eres-la-unica-persona',
        title: 'No eres la única persona',
        about: 'La soledad miente: mucha gente siente esto mismo.',
      },
    ],
  },
  {
    title: 'Duelo y pedir ayuda',
    items: [
      {
        id: 'extranar-tambien-es-querer',
        title: 'Extrañar también es querer',
        about: 'El duelo no tiene calendario.',
      },
      {
        id: 'pedir-ayuda-no-es-molestar',
        title: 'Pedir ayuda no es molestar',
        about: 'A quién pedirla y qué decir.',
        ayuda: true,
      },
      {
        id: 'un-dia-a-la-vez',
        title: 'Un día a la vez',
        about: 'Solo con hoy, o con la próxima hora.',
      },
    ],
  },
  {
    title: 'Fe',
    fe: true,
    items: [
      {
        id: 'si-rezas-aqui-cabe',
        title: 'Si rezas, aquí cabe',
        about: 'Llevar lo que sientes a tu oración, sin culpa.',
      },
    ],
  },
]

// Mientras no haya una persona que preste su voz con permiso firmado, la voz es sintética.
export const VOZ = 'una voz de prueba hecha por computadora'
