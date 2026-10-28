// Sonidos ambientales generados en el dispositivo con Web Audio.
// No descargan nada, funcionan sin conexión y no tienen derechos de autor.

export type SoundId = 'lluvia' | 'mar' | 'viento' | 'cuenco'

export const SOUNDS: { id: SoundId; emoji: string; title: string }[] = [
  { id: 'lluvia', emoji: '🌧️', title: 'Lluvia' },
  { id: 'mar', emoji: '🌊', title: 'Olas del mar' },
  { id: 'viento', emoji: '🍃', title: 'Viento suave' },
  { id: 'cuenco', emoji: '🔔', title: 'Cuenco tibetano' },
]

let ctx: AudioContext | null = null

export function audioContext(): AudioContext {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function noiseBuffer(ac: AudioContext, kind: 'pink' | 'brown'): AudioBuffer {
  const length = ac.sampleRate * 4
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    if (kind === 'brown') {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      b0 = 0.99765 * b0 + white * 0.099046
      b1 = 0.963 * b1 + white * 0.2965164
      b2 = 0.57 * b2 + white * 1.0526913
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11
    }
  }
  return buffer
}

function loopNoise(ac: AudioContext, kind: 'pink' | 'brown') {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac, kind)
  src.loop = true
  return src
}

/** Oscilador lento que mueve un parámetro, para que el sonido "respire". */
function lfo(ac: AudioContext, target: AudioParam, rate: number, depth: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.frequency.value = rate
  gain.gain.value = depth
  osc.connect(gain).connect(target)
  return osc
}

export type Player = { setVolume: (v: number) => void; stop: () => void }

export function play(id: SoundId, volume: number): Player {
  const ac = audioContext()
  const master = ac.createGain()
  master.gain.value = 0
  master.connect(ac.destination)
  master.gain.linearRampToValueAtTime(volume, ac.currentTime + 1.5)

  const sources: AudioScheduledSourceNode[] = []

  if (id === 'lluvia') {
    const src = loopNoise(ac, 'pink')
    const hp = new BiquadFilterNode(ac, { type: 'highpass', frequency: 400 })
    const lp = new BiquadFilterNode(ac, { type: 'lowpass', frequency: 7000 })
    src.connect(hp).connect(lp).connect(master)
    sources.push(src)
  }

  if (id === 'mar') {
    const src = loopNoise(ac, 'brown')
    const swell = ac.createGain()
    swell.gain.value = 0.55
    const lp = new BiquadFilterNode(ac, { type: 'lowpass', frequency: 900 })
    src.connect(lp).connect(swell).connect(master)
    sources.push(src, lfo(ac, swell.gain, 0.09, 0.45), lfo(ac, lp.frequency, 0.09, 500))
  }

  if (id === 'viento') {
    const src = loopNoise(ac, 'pink')
    const bp = new BiquadFilterNode(ac, { type: 'bandpass', frequency: 500, Q: 0.8 })
    src.connect(bp).connect(master)
    sources.push(src, lfo(ac, bp.frequency, 0.05, 300))
  }

  if (id === 'cuenco') {
    // Acorde suave con armónicos que laten despacio.
    const pad = ac.createGain()
    pad.gain.value = 0.12
    pad.connect(master)
    for (const freq of [196, 293.66, 392, 587.33]) {
      const osc = new OscillatorNode(ac, { type: 'sine', frequency: freq })
      const g = ac.createGain()
      g.gain.value = 0.5
      osc.connect(g).connect(pad)
      sources.push(osc, lfo(ac, g.gain, 0.07 + freq / 20000, 0.35))
    }
  }

  sources.forEach((s) => s.start())

  return {
    setVolume: (v) => master.gain.setTargetAtTime(v, ac.currentTime, 0.2),
    stop: () => {
      master.gain.setTargetAtTime(0, ac.currentTime, 0.4)
      setTimeout(() => {
        sources.forEach((s) => s.stop())
        master.disconnect()
      }, 2000)
    },
  }
}

/** "Pop" corto para el juego de burbujas. */
export function pop() {
  const ac = audioContext()
  const osc = new OscillatorNode(ac, { type: 'sine', frequency: 500 + Math.random() * 300 })
  const gain = ac.createGain()
  const t = ac.currentTime
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.08)
  gain.gain.setValueAtTime(0.25, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.12)
}

/** El «clic» del candado del diario: dos golpecitos metálicos, muy bajitos. */
export function lockClick() {
  const ac = audioContext()
  const t = ac.currentTime
  ;[0, 0.07].forEach((delay, i) => {
    const osc = new OscillatorNode(ac, { type: 'triangle', frequency: i ? 1900 : 2600 })
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.12, t + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.05)
    osc.connect(gain).connect(ac.destination)
    osc.start(t + delay)
    osc.stop(t + delay + 0.06)
  })
}

/** El ronroneo del michi: un rumor grave que late unas 24 veces por segundo, muy bajito. */
export function purr(seconds = 1.6) {
  const ac = audioContext()
  const t = ac.currentTime
  const src = new AudioBufferSourceNode(ac, { buffer: noiseBuffer(ac, 'brown'), loop: true })
  const lp = new BiquadFilterNode(ac, { type: 'lowpass', frequency: 320 })
  const beat = ac.createGain()
  beat.gain.value = 0.5
  const flutter = lfo(ac, beat.gain, 24, 0.5)
  const env = ac.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(0.32, t + 0.25)
  env.gain.setValueAtTime(0.32, t + seconds - 0.45)
  env.gain.linearRampToValueAtTime(0, t + seconds)
  src.connect(lp).connect(beat).connect(env).connect(ac.destination)
  src.start(t)
  flutter.start(t)
  src.stop(t + seconds + 0.05)
  flutter.stop(t + seconds + 0.05)
}

/** Una risita: cuatro notitas cortas que suben, como un «ji ji ji ji». */
export function giggle() {
  const ac = audioContext()
  const start = ac.currentTime
  const base = 620 + Math.random() * 120
  for (let i = 0; i < 4; i++) {
    const t = start + i * 0.11
    const osc = new OscillatorNode(ac, { type: 'triangle', frequency: base * (1 + i * 0.12) })
    osc.frequency.exponentialRampToValueAtTime(base * (1.25 + i * 0.12), t + 0.07)
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  }
}
