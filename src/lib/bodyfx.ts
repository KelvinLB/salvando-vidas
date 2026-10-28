import { animate, stagger, svg } from 'animejs'
import type { Fx } from '../data/bodyStories'

// Movimiento de cada efecto del cuerpo, con anime.js. Qué se ve y de qué color lo
// decide el CSS (atributos data-fx y data-tone); aquí solo va lo que se mueve.
// Se llaman dentro de un createScope, así que los selectores buscan solo en el cuerpo.

const pulse = { loop: true, alternate: true, ease: 'inOutSine' } as const

/** Recorre un trazo de punta a punta, como una señal que viaja por los nervios. */
function travel(selector: string, duration: number) {
  animate(svg.createDrawable(selector), {
    draw: ['0 0', '0 1', '1 1'],
    duration,
    delay: stagger(140),
    loop: true,
    ease: 'inOutQuad',
  })
}

/** Puntos que avanzan por una ruta escondida, repartidos a lo largo de ella. */
function flow(group: string, path: string, count: number, duration: number) {
  for (let i = 0; i < count; i++) {
    const route = svg.createMotionPath(path, i / count + 0.001)
    if (!route) return
    const { translateX, translateY } = route
    animate(`${group} circle:nth-of-type(${i + 1})`, { translateX, translateY, duration, ease: 'linear', loop: true })
  }
}

export const FX: Record<Fx, () => void> = {
  'alarm-brain': () => {
    animate('.b-alarm-ring', { scale: [1, 6], opacity: [0.9, 0], duration: 1500, delay: stagger(750), loop: true, ease: 'outQuad' })
    animate('.b-amygdala', { scale: [1, 1.6], duration: 380, ...pulse })
  },
  'stress-brain': () => {
    animate('.b-press', { translateY: [0, 5], duration: 1100, delay: stagger(140), ...pulse })
  },
  nerves: () => travel('.b-nerve', 1700),
  'heart-fast': () => {
    animate('.b-heart', { scale: [1, 1.28], duration: 300, ...pulse })
  },
  'heart-very-fast': () => {
    animate('.b-heart', { scale: [1, 1.4], duration: 170, ...pulse })
    animate('.b-heart-ring', { scale: [1, 2.4], opacity: [0.7, 0], duration: 700, loop: true, ease: 'outQuad' })
  },
  'heart-calm': () => {
    animate('.b-heart', { scale: [1, 1.1], duration: 900, ...pulse })
  },
  'breath-fast': () => {
    animate('.b-lung', { scale: [1, 1.09], duration: 420, ...pulse })
  },
  'breath-slow': () => {
    // Inhalar 4 s y soltar 6 s, igual que la respiración de Calma.
    animate('.b-lung', { scale: [{ to: 1.12, duration: 4000 }, { to: 1, duration: 6000 }], loop: true, ease: 'inOutSine' })
    animate('.b-aura', { scale: [{ to: 1.06, duration: 4000 }, { to: 0.97, duration: 6000 }], loop: true, ease: 'inOutSine' })
  },
  'stomach-knot': () => {
    animate('.b-stomach', { rotate: [-6, 6], scale: [1, 0.9], duration: 520, ...pulse })
    travel('.b-knot', 1400)
  },
  gut: () => {
    animate('.b-bubble', { translateY: [0, -16], opacity: [1, 0], duration: 1300, delay: stagger(420), loop: true, ease: 'outSine' })
  },
  tension: () => {
    animate('.b-arms', { translateY: [0, -4], duration: 1200, ...pulse })
    travel('.b-tense', 1100)
  },
  tremble: () => {
    animate('.b-hand', { translateX: [-1.4, 1.4], duration: 55, ...pulse })
    animate('.b-sweat', { translateY: [0, 14], opacity: [1, 0], duration: 1200, delay: stagger(500), loop: true, ease: 'inQuad' })
  },
  dizzy: () => {
    animate('.b-dizzy', { rotate: [0, 360], duration: 2600, loop: true, ease: 'linear' })
  },
  cortisol: () => {
    animate('.b-adrenal', { scale: [1, 1.3], duration: 700, ...pulse })
    flow('.b-cortisol-up', '.b-route-up', 3, 3600)
    flow('.b-cortisol-arm', '.b-route-arm', 2, 2800)
  },
  'sleep-bad': () => {
    // Las zetas se cortan antes de llegar arriba: el sueño se interrumpe.
    animate('.b-z', { translateY: [0, -14], opacity: [0, 1, 0], duration: 1600, delay: stagger(450), loop: true, ease: 'outSine' })
  },
  'no-sleep': () => {
    animate('.b-clock-hand', { rotate: [0, 360], duration: 900, loop: true, ease: 'linear' })
  },
  dim: () => {
    animate('.b-dim', { opacity: [0.18, 0.4], duration: 2600, ...pulse })
  },
  heavy: () => {
    animate('.b-down', { translateY: [0, 10], opacity: [1, 0], duration: 1500, delay: stagger(300), loop: true, ease: 'inSine' })
    animate('.b-figure', { translateY: [0, 3], duration: 2400, ...pulse })
  },
  'chest-weight': () => {
    animate('.b-stone', { translateY: [0, 3], duration: 1800, ...pulse })
  },
  'sparkles-fade': () => {
    animate('.b-spark', { scale: [1, 0.35], opacity: [1, 0.15], duration: 1600, delay: stagger(500), ease: 'inOutSine' })
  },
  cycle: () => {
    animate('.b-cycle', { rotate: [0, 360], duration: 7000, loop: true, ease: 'linear' })
  },
  mania: () => {
    animate('.b-ideas', { rotate: [0, 360], duration: 1300, loop: true, ease: 'linear' })
    animate('.b-rays', { scale: [1, 1.12], duration: 300, ...pulse })
  },
  throat: () => {
    animate('.b-throat', { scale: [1, 0.72], duration: 900, ...pulse })
  },
  tingle: () => {
    animate('.b-tingle', { opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6], duration: 700, delay: stagger(110), loop: true, ease: 'inOutSine' })
  },
  restless: () => {
    animate('.b-legs', { translateX: [-1.2, 1.2], duration: 110, ...pulse })
  },
  wave: () => {
    const route = svg.createMotionPath('.b-wave-path')
    if (!route) return
    const { translateX, translateY } = route
    animate('.b-wave-dot', { translateX, translateY, duration: 9000, loop: true, ease: 'linear' })
  },
}
