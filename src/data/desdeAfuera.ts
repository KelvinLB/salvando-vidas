// Desde afuera: lo que se escoge para hacerse uno mismo, las escenas, los bichitos de las
// sensaciones y los «¿y si…?». Las respuestas hablan de la persona en tercera persona, con su
// nombre, como se le habla a alguien que se quiere (si no dio nombre, se le habla de tú).

export type SceneId = 'metro' | 'banco' | 'cuarto'
export type Hair = 'corto' | 'largo' | 'chongo' | 'trenzas' | 'rizos' | 'sin'

/** Cómo se hizo la persona, su nombre (opcional) y dónde pasa. */
export type Yo = { skin: number; hair: Hair; hcol: number; lentes: boolean; shirt: number; name: string; scene: SceneId }
export type Sticker = { s: SceneId; d: number }

export const YO_KEY = 'desde-afuera-yo'
export const STICKERS_KEY = 'desde-afuera-calcas'
export const MAX_STICKERS = 6

export const SKINS: [string, string][] = [
  ['#f5d6bd', 'Piel muy clara'],
  ['#e8bd96', 'Piel clara'],
  ['#cf9a6e', 'Piel morena clara'],
  ['#a9744c', 'Piel morena'],
  ['#83552f', 'Piel morena oscura'],
  ['#5c3a24', 'Piel oscura'],
]
export const HAIRS: [Hair, string][] = [
  ['corto', 'Corto'],
  ['largo', 'Largo'],
  ['chongo', 'Chongo'],
  ['trenzas', 'Trenzas'],
  ['rizos', 'Rizos'],
  ['sin', 'Sin pelo'],
]
export const HAIR_COLORS: [string, string][] = [
  ['#2a201b', 'Negro'],
  ['#5b3a26', 'Castaño'],
  ['#8d5f3a', 'Castaño claro'],
  ['#c69a55', 'Rubio'],
  ['#b9b3ab', 'Canoso'],
  ['#9a4a2c', 'Cobrizo'],
]
export const SHIRTS: [string, string][] = [
  ['--da-c1', 'Rosa'],
  ['--da-c2', 'Azul'],
  ['--da-c3', 'Amarilla'],
  ['--da-c4', 'Verde'],
  ['--da-c5', 'Naranja'],
  ['--da-c6', 'Morada'],
]
export const GLASSES: [boolean, string][] = [
  [false, 'Sin lentes'],
  [true, 'Con lentes'],
]

export const SCENES: Record<SceneId, { n: string; w: string }> = {
  metro: { n: 'En el metro', w: 'en el metro' },
  banco: { n: 'En la fila del banco', w: 'en la fila del banco' },
  cuarto: { n: 'En tu cuarto de noche', w: 'en tu cuarto, de noche' },
}
export const ORDER: SceneId[] = ['metro', 'banco', 'cuarto']
export const nextScene = (s: SceneId) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]

export const DEFAULT_YO: Yo = { skin: 2, hair: 'corto', hcol: 0, lentes: false, shirt: 1, name: '', scene: 'metro' }

const idx = (v: unknown, n: number, d: number) => (typeof v === 'number' && v >= 0 && v < n ? v | 0 : d)

/** Lo guardado, revisado: si algo no se entiende, va lo de siempre. */
export function cleanYo(s: Partial<Yo> | null | undefined): Yo {
  if (!s || typeof s !== 'object') return DEFAULT_YO
  return {
    skin: idx(s.skin, SKINS.length, DEFAULT_YO.skin),
    hair: HAIRS.some((h) => h[0] === s.hair) ? (s.hair as Hair) : DEFAULT_YO.hair,
    hcol: idx(s.hcol, HAIR_COLORS.length, DEFAULT_YO.hcol),
    lentes: !!s.lentes,
    shirt: idx(s.shirt, SHIRTS.length, DEFAULT_YO.shirt),
    name: typeof s.name === 'string' ? s.name.slice(0, 24) : '',
    scene: s.scene && s.scene in SCENES ? s.scene : DEFAULT_YO.scene,
  }
}

/** Cosas para encontrar en cada escena: id, cómo se nombra, x, y y radio del círculo. */
export const SEEK: Record<SceneId, [string, string, number, number, number][]> = {
  metro: [
    ['tubo', 'el tubo', 140, 232, 14],
    ['ventana', 'la ventana', 68, 92, 18],
    ['mapa', 'el mapa de la línea', 68, 41, 14],
    ['asiento', 'un asiento naranja', 104, 190, 13],
    ['mochila', 'una mochila', 356, 176, 13],
    ['salida', 'el letrero de salida', 200, 30, 13],
    ['piso', 'el piso', 120, 280, 13],
  ],
  banco: [
    ['turno', 'el turno en la pantalla', 68, 41, 16],
    ['reloj', 'el reloj', 68, 96, 15],
    ['planta', 'la planta', 40, 196, 15],
    ['cinta', 'la cinta de la fila', 138, 214, 12],
    ['pluma', 'la pluma con cadena', 252, 128, 12],
    ['ventanilla', 'la ventanilla', 356, 98, 16],
    ['piso', 'el piso de cuadritos', 130, 277, 13],
  ],
  cuarto: [
    ['luna', 'la luna', 112, 52, 14],
    ['lampara', 'la lámpara', 94, 184, 15],
    ['almohada', 'la almohada', 360, 186, 15],
    ['celular', 'el celular', 310, 197, 12],
    ['cactus', 'el cactus', 60, 94, 12],
    ['poster', 'el póster', 310, 72, 16],
    ['pantuflas', 'las pantuflas', 264, 276, 12],
  ],
}

export type CritId = 'corazon' | 'remolino' | 'llamita' | 'hormigas' | 'nudo'

/** Las sensaciones, como bichitos: salen solas mientras sube la ola (`at`, en segundos). */
export const CRITS: { id: CritId; n: string; x: number; y: number; at: number; t: string }[] = [
  { id: 'corazon', n: 'Corazón tambor', x: 146, y: 176, at: 2, t: 'Es adrenalina: tu corazón se prepara para correr. Incómodo, no peligroso.' },
  {
    id: 'remolino',
    n: 'Remolino',
    x: 256,
    y: 114,
    at: 4.5,
    t: 'Es el mareo de respirar rápido: entra más aire del que hace falta. Se acomoda al soltar el aire despacio.',
  },
  { id: 'llamita', n: 'Llamita', x: 146, y: 128, at: 7, t: 'Es el calor de un cuerpo que se alista para moverse; por eso sudas. Se apaga sola.' },
  {
    id: 'hormigas',
    n: 'Hormiguitas',
    x: 252,
    y: 208,
    at: 9.5,
    t: 'Es el hormigueo en las manos o en la cara. También viene de respirar rápido. Raro, pero no hace daño.',
  },
  { id: 'nudo', n: 'Nudo', x: 256, y: 162, at: 12, t: 'Es la presión en el pecho: músculos tensos, listos para defenderte. Se aflojan cuando baja la ola.' },
]

type Fear = {
  q: string
  at: number
  /** Tres respuestas; `heart` es si ya marcó que le revisaron el corazón y salió bien. */
  r: (name: string, heart: boolean) => string[]
  /** Lo que pasó de verdad, para el final. */
  out: (name: string) => string
}

// Ninguna respuesta da por hecho que un médico revisó el corazón, salvo que la persona lo
// haya marcado en la guía de pánico.
export const FEARS: Fear[] = [
  {
    q: '¿Y si me desmayo?',
    at: 6,
    r: (N) =>
      N
        ? [
            `En el pánico la presión sube, no baja. Es muy raro que ${N} se desmaye.`,
            `${N} ya ha sentido este mareo y aquí sigue, de pie.`,
            `Si ${N} quiere, puede sentarse. El mareo se va solo.`,
          ]
        : [
            'En el pánico la presión sube, no baja. Es muy raro desmayarse.',
            'Ya has sentido este mareo y aquí sigues, de pie.',
            'Si quieres, te sientas. El mareo se va solo.',
          ],
    out: (N) => (N ? `${N} no se desmayó.` : 'No te desmayaste.'),
  },
  {
    q: '¿Y si es un infarto?',
    at: 11,
    r: (N, heart) =>
      N
        ? [
            `A ${N} se le acelera el corazón por la ola, y baja cuando baja la ola.`,
            `Un corazón rápido es un corazón trabajando. ${N} lo puede dejar latir.`,
            heart
              ? `A ${N} ya le revisaron el corazón y salió bien. Esto es la ola.`
              : `Esto ya le pasó a ${N}, y su corazón siempre volvió a su paso.`,
          ]
        : [
            'Tu corazón se acelera por la ola, y baja cuando baja la ola.',
            'Un corazón rápido es un corazón trabajando. Déjalo latir.',
            heart ? 'Ya te revisaron el corazón y salió bien. Esto es la ola.' : 'Esto ya te pasó, y tu corazón siempre volvió a su paso.',
          ],
    out: (N) => (N ? `El corazón de ${N} volvió a su paso.` : 'Tu corazón volvió a su paso.'),
  },
  {
    q: 'Todos me están viendo',
    at: 16,
    r: (N) =>
      N
        ? [
            `Casi nadie se dio cuenta. Desde afuera, a ${N} se le nota mucho menos.`,
            `${N} no le debe explicaciones a nadie. Puede quedarse o salir un rato.`,
            `Si alguien lo nota, solo ve a ${N} en un mal rato. Le pasa a cualquiera.`,
          ]
        : [
            'Casi nadie se dio cuenta. Desde afuera se nota mucho menos.',
            'No le debes explicaciones a nadie. Puedes quedarte o salir un rato.',
            'Si alguien lo nota, solo ve un mal rato. Le pasa a cualquiera.',
          ],
    out: () => 'Nadie hizo nada raro. La vida siguió.',
  },
  {
    q: '¿Y si no se me quita?',
    at: 22,
    r: (N) =>
      N
        ? [
            `${N}, ya te ha pasado y siempre se fue.`,
            `Ninguna ola se queda arriba para siempre. Esta tampoco, ${N}.`,
            `El cuerpo de ${N} está hecho para calmarse. Ya lo está haciendo.`,
          ]
        : [
            'Ya te ha pasado y siempre se fue.',
            'Ninguna ola se queda arriba para siempre. Esta tampoco.',
            'Tu cuerpo está hecho para calmarse. Ya lo está haciendo.',
          ],
    out: () => 'Se quitó solo, sin pelearlo.',
  },
]

/** Lo que se puede hacer mientras pasa la ola; ninguno es obligatorio. */
export const TODO: [string, string][] = [
  ['crit', 'Conocer a los bichitos'],
  ['yrsi', 'Contestar los ¿y si…?'],
  ['breath', 'Respirar a la par'],
  ['cold', 'Algo frío'],
  ['feet', 'Los pies en el suelo'],
]
