import type { ComponentType } from 'react'
import type { MissionId } from '../data/barrio'
import type { HoleReading } from '../lib/hueco'

// Cómo se conectan las piezas del barrio. La página (src/pages/Barrio.tsx) dibuja el mundo
// y el panel de plática; cada misión es un componente que vive dentro de ese panel.

export type FlowProps = {
  /** El nombre de su mascota, para que los vecinos le hablen. */
  petName: string
  /** Día pesado: la misión ofrece su versión más chiquita. */
  heavy: boolean
  /** Terminó: la página guarda la estampita y la cosa para la casa (finishMission). */
  onDone: () => void
  /** «Hoy no»: la página la deja para otro día (missionLater), sin castigo. */
  onLater: () => void
  /** Cierra la plática sin cambiar nada (por ejemplo, «Ahorita no» antes de empezar). */
  onClose: () => void
  /** La respiración del kiosco prende foquitos en la plaza: de 0 a 1. */
  onGlow?: (amount: number) => void
}

export type MissionFlow = ComponentType<FlowProps>

/** Lo que el tablero ofrece hoy (como mucho tres) y por qué, en palabras sencillas. */
export type Board = { missions: MissionId[]; why: string[] }

export type BoardInput = { reading: HoleReading | null; hour: number }

/** Una cosa que su mascota notó: lo que vio (descriptivo) y qué cambia por eso. */
export type Noticed = { id: string; saw: string; then: string }
