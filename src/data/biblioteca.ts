import type { Organo3D, Senal, Sensacion, Zona } from '../components/cuerpo3d/organos'

// «Biblioteca» de Explorar: cada cosa que le pasa a la mente se explica con un objeto que funciona
// (lo mueves y ves qué pasa) y después se ve en el cuerpo de vidrio. La idea de explicar
// construyendo viene de Anatomy (github.com/wheresryan22/anatomy). Las fichas (bibliotecaFichas.ts)
// se escribieron a partir de las fuentes que cada una lista, y la guía de a quién acudir
// (bibliotecaGuia.ts) a partir de las suyas. Se explica, no se diagnostica: «puede», «suele».

export type FamiliaId =
  | 'ansiedad'
  | 'animo'
  | 'trauma'
  | 'obsesivo'
  | 'neuro'
  | 'comida'
  | 'sueno'
  | 'psicosis'
  | 'personalidad'
  | 'adicciones'
  | 'salud'
  | 'nodx'

export const FAMILIAS: { id: FamiliaId; nombre: string }[] = [
  { id: 'ansiedad', nombre: 'Ansiedad y miedo' },
  { id: 'animo', nombre: 'Ánimo' },
  { id: 'trauma', nombre: 'Trauma y estrés' },
  { id: 'obsesivo', nombre: 'Obsesiones y repeticiones' },
  { id: 'neuro', nombre: 'Neurodesarrollo' },
  { id: 'comida', nombre: 'Comida y cuerpo' },
  { id: 'sueno', nombre: 'Sueño' },
  { id: 'psicosis', nombre: 'Psicosis' },
  { id: 'personalidad', nombre: 'Personalidad' },
  { id: 'adicciones', nombre: 'Adicciones' },
  { id: 'salud', nombre: 'El cuerpo y la salud' },
  { id: 'nodx', nombre: 'No son trastornos, pero pesan' },
]

export type Fuente = { texto: string; url?: string }

/** El objeto de cada ficha: qué se dibuja y con qué palabras se mueve. */
export type Objeto =
  | { tipo: 'alarma'; disparo: string; calma: string; medida: string }
  | { tipo: 'radio'; estrategia: string; medida: string; efectos: string[] }
  | { tipo: 'luz'; acciones: string[]; medida: string }
  | { tipo: 'cerradura'; ceder: string; esperar: string; medida: string; ganas: string }
  | { tipo: 'ola'; ceder: string; surfear: string; medida: string }
  | { tipo: 'marea'; anclas: string[]; medida: string }
  | { tipo: 'ecualizador'; canales: string[]; apoyos: { nombre: string; baja: string[] }[]; medida: string }

export type TipoObjeto = Objeto['tipo']

export type FichaBib = {
  id: string
  familia: FamiliaId
  objeto: string
  condicion: string
  /** Dónde suele sentirse y qué: se tiñe en el cuerpo de vidrio. */
  zonas: Partial<Record<Zona, Sensacion>>
  /** De 0 a 1: qué tan fuerte se enciende la alarma del cuerpo. */
  intensidad: number
  /** La ayuda inmediata va arriba, antes del objeto. */
  riesgo?: boolean
  nuevo?: string
  figura: Objeto
  pista: string
  comoFunciona: string
  que: string
  cuerpo: string
  ayuda: string
  acudir: string
  mito: string
  realidad: string
  compartir: string
  antes?: string
  /** La situación de «Cómo se mueve la ansiedad» que recorre su ola, si hay. */
  ola?: string
  fuentes: Fuente[]
}

export type Confusion = {
  id: string
  a: string
  b: string
  objeto: TipoObjeto
  comparacion: string
  senal: string
  fuentes: Fuente[]
}

/** Lo que el cuerpo de vidrio enciende al abrir una ficha: las zonas, y la alarma según qué tan fuerte. */
export function senalDe(f: FichaBib): Senal {
  const fuerte = f.intensidad >= 0.6
  const alarma: Organo3D[] = fuerte ? ['amigdala', 'suprarrenales'] : f.intensidad >= 0.35 ? ['amigdala'] : []
  return {
    alarma,
    respira: fuerte ? 'rapida' : 'normal',
    aire: true,
    bpm: Math.round(66 + f.intensidad * 44),
    zonas: f.zonas,
  }
}

/** El texto sin las marcas de palabras del diccionario, para leerlo en voz alta o compartirlo. */
export const sinMarcas = (t: string) => t.replace(/\{\{\w+(?:\|([^}]+))?\}\}/g, (_, otra: string | undefined) => otra ?? '')
