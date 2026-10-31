import { animate, createScope, createTimer, type JSAnimation, type Timer } from 'animejs'
import {
  ALARM_DONE,
  ALARM_FADING,
  ALARM_STEPS,
  BREATH_DONE,
  BREATH_STEPS,
  type SenalCaption,
} from '../../data/senal'

// El motor de «Sigue la señal». Cada cuadro mueve unos cuantos valores hacia su meta (qué
// tan prendida está la alarma, la tensión, la sangre en brazos y piernas, la panza frenada)
// y el dibujo los toma de ahí. Así la alarma puede cortarse a la mitad con «Respirar lento»
// y todo regresa suave desde donde iba. El reloj es un timer de anime.js dentro de un
// createScope: se pausa fuera de la pantalla o con la pestaña oculta, y al desmontar se
// revierte todo.
//
// Con movimiento reducido (`still`) nada viaja ni late: cada valor salta a su meta, las
// rutas se ven completas y la leyenda cuenta lo mismo.

export type SenalMode = 'rest' | 'alarm' | 'breathe'

export type SenalUI = {
  caption: (c: SenalCaption) => void
  mode: (m: SenalMode) => void
  /** La guía de respiración: qué hacer y en qué respiración va (0 a 2). */
  breath: (b: { word: string; k: number }) => void
  /** La amígdala y el hipotálamo encendidos. */
  brain: (b: { amy: boolean; hypo: boolean }) => void
}

type Box = [number, number, number, number]
type Targets = { a: number; ten: number; bl: number; gd: number; emit: number }
type Route = {
  tg: SVGPathElement
  tr: SVGPathElement
  pg: SVGPathElement
  pu: SVGPathElement
  head: SVGCircleElement
  len: number
  t0: number
  dur: number
  lv: number
  lvT: number
  blue: boolean
}
type Step = { at: number; run: () => void }

const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u))
const at = (cx: number, cy: number, sx: number, sy: number) =>
  `translate(${cx} ${cy}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-cx} ${-cy})`
const op = (n: Element, v: number) => {
  ;(n as SVGElement).style.opacity = v.toFixed(3)
}

/** Inhala 4 segundos, suelta el aire 6, tres veces. */
const IN = 4
const OUT = 6
const CYCLE = IN + OUT
const BREATHS = 3

export function createSenal(root: HTMLElement, ui: SenalUI, initialStill: boolean) {
  let still = initialStill
  const $ = <T extends Element>(s: string) => root.querySelector(s) as T
  const $$ = <T extends Element>(s: string) => Array.from(root.querySelectorAll(s)) as T[]
  const svg = $<SVGSVGElement>('[data-sg="svg"]')

  // ---------- Estado ----------
  const S = {
    t: 0,
    mode: 'rest' as SenalMode,
    seq: null as { t0: number; steps: Step[]; i: number } | null,
    // Valores que se acercan a su meta: alarma, tensión, sangre, panza frenada, adrenalina.
    a: 0, ten: 0, bl: 0, gd: 0, emit: 0,
    T: { a: 0, ten: 0, bl: 0, gd: 0, emit: 0 } as Targets,
    adr: 0,
    blue: 0,
    blueAt: 0,
    tau: 1.3,
    br: 0,
    hb: 0,
    amyRing: -99,
    bt0: 0,
    bk: -1,
    bEx: false,
    guide: 0,
    base: { a: 0, ten: 0, bl: 0, gd: 0, emit: 0 } as Targets,
  }

  // ---------- Partes del dibujo ----------
  const el = {
    lungs: $('[data-sg="lungs"]'),
    dia: $('[data-sg="diaphragm"]'),
    heart: $('[data-sg="heart"]'),
    haloW: $('[data-sg="halo-warm"]'),
    haloB: $('[data-sg="halo-blue"]'),
    tense: $('[data-sg="tense"]'),
    gutdim: $('[data-sg="gutdim"]'),
    stomach: $('[data-sg="stomach"]'),
    pfc: $('[data-sg="pfc"]'),
    vessels: $('[data-sg="vessels"]'),
    links: $$<SVGPathElement>('.sg-pfclink'),
    adrGlow: $$('.sg-adr-glow'),
    amyRings: $$<SVGCircleElement>('[data-sg="amy-ring"]'),
    ring: $<HTMLElement>('[data-sg="breath-ring"]'),
  }
  const ROUTES: Record<string, Route> = {}
  for (const g of $$<SVGGElement>('.sg-route')) {
    const [tg, tr, pg, pu] = Array.from(g.querySelectorAll('path'))
    ROUTES[g.dataset.route!] = {
      tg, tr, pg, pu,
      head: g.querySelector('.sg-head')!,
      len: tr.getTotalLength(),
      t0: -99, dur: 1, lv: 0, lvT: 0,
      blue: g.classList.contains('blue'),
    }
  }
  const PATHS: Record<string, { p: SVGPathElement; len: number }> = {}
  for (const p of $$<SVGPathElement>('[data-path]')) PATHS[p.dataset.path!] = { p, len: p.getTotalLength() }
  // Adrenalina: cada partícula con su ruta, su ritmo y su desfase.
  const PART_ROUTES = ['paL', 'paR', 'armL', 'armR', 'legL', 'legR']
  const particles = $$<SVGGElement>('[data-sg="particle"]').map((c, i) => ({
    c,
    r: PATHS[PART_ROUTES[i % 6]],
    per: 2.4 + ((i * 37) % 10) / 10,
    off: (i * 0.61) % 1,
  }))
  // Flechas de sangre: tres por brazo y por pierna, en el tramo de afuera.
  const ARROW_ROUTES: [string, number, number][] = [['armL', 0.42, 0.96], ['armR', 0.42, 0.96], ['legL', 0.22, 0.94], ['legR', 0.22, 0.94]]
  const arrows = $$<SVGPathElement>('[data-sg="arrow"]').map((a, i) => {
    const [id, u0, u1] = ARROW_ROUTES[Math.floor(i / 3)]
    return { a, r: PATHS[id], u0, u1, k: i % 3 }
  })

  // ---------- Señales que viajan ----------
  function travel(id: string, dur: number) {
    const r = ROUTES[id]
    r.t0 = S.t
    r.dur = dur
    r.lvT = 1
  }
  function quietRoutes(blueToo: boolean) {
    for (const r of Object.values(ROUTES)) if (blueToo || !r.blue) {
      r.lvT = 0
      r.t0 = -99
    }
  }
  function setMode(m: SenalMode) {
    S.mode = m
    ui.mode(m)
    if (m !== 'alarm') ui.brain({ amy: false, hypo: false })
  }
  const setTargets = (v: Targets) => {
    S.T = { ...v }
  }
  const ZERO: Targets = { a: 0, ten: 0, bl: 0, gd: 0, emit: 0 }

  // ---------- «Sonó la alarma» ----------
  const N = ALARM_STEPS.length
  const step = (i: number, invite = false) =>
    ui.caption({
      kick: `Sonó la alarma · ${i + 1} de ${N}`,
      title: ALARM_STEPS[i][0],
      text: ALARM_STEPS[i][1],
      dots: { n: N, i },
      invite,
      tone: i > 0 && i < N - 1 ? 'warm' : undefined,
    })
  const ALARM: Step[] = [
    { at: 0, run() {
      setMode('alarm')
      S.tau = 1.3
      quietRoutes(true)
      ui.brain({ amy: true, hypo: false })
      S.amyRing = S.t
      S.T.a = Math.max(S.T.a, 0.12)
      step(0)
    } },
    { at: 2.6, run() { step(1); travel('r1L', 1.1); travel('r1R', 1.1) } },
    { at: 3.7, run() { ui.brain({ amy: true, hypo: true }) } },
    { at: 5.0, run() { step(2); travel('r2L', 2.3); travel('r2R', 2.3) } },
    { at: 7.4, run() { step(3); S.adr = 1; S.T.emit = 1; S.T.a = 0.42 } },
    { at: 10.2, run() { step(4); S.T.a = 1 } },
    { at: 13.4, run() { step(5); S.T.bl = 1; S.T.gd = 1 } },
    { at: 16.6, run() { step(6); S.T.ten = 1 } },
    { at: 19.8, run() { step(7, true) } },
    { at: 27, run() {
      // Nadie se queda en el pico: si no respira, la adrenalina se gasta sola.
      S.tau = 7
      setTargets(ZERO)
      ui.caption(ALARM_FADING)
    } },
    { at: 45, run() { endCalm(ALARM_DONE) } },
  ]
  function alarm() {
    S.seq = { t0: S.t, steps: ALARM, i: 0 }
    wake()
  }
  function endCalm(c: SenalCaption) {
    S.seq = null
    setMode('rest')
    S.tau = 1.6
    setTargets(ZERO)
    quietRoutes(false)
    if (still) S.blue = 0
    ui.caption(c)
  }

  // ---------- «Respirar lento» ----------
  function breathe() {
    S.seq = null
    setMode('breathe')
    S.bt0 = S.t
    S.bk = -1
    S.bEx = false
    S.tau = 1.8
    S.base = { a: S.a, ten: S.ten, bl: S.bl, gd: S.gd, emit: S.emit }
    wake()
  }
  function breatheStep() {
    const e = S.t - S.bt0
    if (e >= CYCLE * BREATHS) {
      endCalm(BREATH_DONE)
      return
    }
    const k = Math.floor(e / CYCLE)
    const ph = e - k * CYCLE
    const ex = ph >= IN
    if (k !== S.bk) {
      S.bk = k
      S.bEx = false
      ui.caption({ kick: `Respirar lento · ${k + 1} de ${BREATHS}`, title: BREATH_STEPS[k][0], text: BREATH_STEPS[k][1], dots: { n: BREATHS, i: k } })
      ui.breath({ word: 'Inhala', k })
    }
    if (ex && !S.bEx) {
      // Al soltar el aire, el freno: una luz azul baja por el nervio vago y la alarma
      // baja un tercio en cada respiración. Si nunca sonó, el corazón igual se calma un poco.
      S.bEx = true
      ui.breath({ word: 'Suelta el aire', k })
      travel('vL', 3.4)
      travel('vR', 3.4)
      S.blueAt = S.t + 1.5
      const f = 1 - (k + 1) / BREATHS
      const b = S.base
      setTargets({ a: b.a * f, ten: b.ten * f, bl: b.bl * f, gd: b.gd * f, emit: b.emit * f * 0.6 })
      // Lo ámbar se apaga junto con la alarma.
      if (k === BREATHS - 1) quietRoutes(false)
    }
    S.guide = ex ? 1 - ease((ph - IN) / OUT) : ease(ph / IN)
  }

  // ---------- Un paso de la simulación ----------
  function advance(dt: number) {
    S.t += dt
    const sq = S.seq
    if (sq) {
      const e = S.t - sq.t0
      while (S.seq === sq && sq.i < sq.steps.length && sq.steps[sq.i].at <= e) sq.steps[sq.i++].run()
    }
    if (S.mode === 'breathe') breatheStep()
    const k = still ? 1 : 1 - Math.exp(-dt / S.tau)
    S.a += (S.T.a - S.a) * k
    S.ten += (S.T.ten - S.ten) * k
    S.bl += (S.T.bl - S.bl) * k
    S.gd += (S.T.gd - S.gd) * k
    S.emit += (S.T.emit - S.emit) * k
    S.adr *= Math.exp(-dt / (still ? 3 : 1.4))
    if (S.blueAt && S.t >= S.blueAt) {
      S.blue = 1
      S.blueAt = 0
    }
    S.blue *= Math.exp(-dt / (still ? 2.5 : 1.1))
    // Ritmos estilizados de la respiración y el latido, sin números: con la alarma van más
    // rápido, y al soltar el aire despacio el latido se alarga un poco.
    const exhaling = S.mode === 'breathe' && S.bEx
    S.br = (S.br + dt / lerp(5.4, 2.5, S.a)) % 1
    let hp = lerp(1.12, 0.58, S.a)
    if (S.mode === 'breathe') hp *= exhaling ? 1.12 : 0.97
    S.hb = (S.hb + dt / hp) % 1
    for (const r of Object.values(ROUTES)) r.lv += (r.lvT - r.lv) * (still ? 1 : 1 - Math.exp(-dt / 0.6))
  }

  // ---------- Pintar el cuadro ----------
  function render() {
    // La respiración: la de la guía cuando se respira lento; si no, la del cuerpo.
    let b: number
    let amp = 1
    if (S.mode === 'breathe') {
      b = S.guide
      amp = 1.35
    } else {
      const f = 0.42
      b = S.br < f ? ease(S.br / f) : 1 - ease((S.br - f) / (1 - f))
      amp = lerp(1, 0.72, S.a)
    }
    if (still) {
      for (const n of [el.lungs, el.dia, el.heart, el.stomach]) n.removeAttribute('transform')
    } else {
      el.lungs.setAttribute('transform', at(110, 104, 1 + 0.035 * b * amp, 1 + 0.065 * b * amp))
      el.dia.setAttribute('transform', `translate(0 ${(4.2 * b * amp).toFixed(2)})`)
      const wob = 0.012 * (1 - S.gd)
      el.stomach.setAttribute('transform', at(126, 198, 1 + wob * Math.sin(S.t * 1.3), 1 + wob * Math.sin(S.t * 1.3 + 1)))
    }
    // Latido «lub-dub» suave: el corazón apenas crece, nunca late fuerte.
    const ph = S.hb
    const beat = Math.exp(-(((ph - 0.07) / 0.05) ** 2)) + 0.55 * Math.exp(-(((ph - 0.25) / 0.055) ** 2))
    if (!still) {
      const s = 1 + (0.03 + 0.032 * S.a) * beat
      el.heart.setAttribute('transform', at(116, 155, s, s))
    }
    op(el.haloW, S.a * (still ? 0.75 : 0.55 + 0.35 * beat))
    op(el.haloB, Math.min(1, S.blue) * 0.9)
    op(el.tense, S.ten)
    op(el.gutdim, S.gd * 0.55)
    el.adrGlow.forEach((g) => op(g, Math.max(still ? (S.adr > 0.08 ? 0.9 : 0) : S.adr, S.emit * 0.42)))
    // La corteza prefrontal «se oye menos» con la alarma y vuelve con la calma.
    op(el.pfc, 0.88 - 0.45 * S.a)
    el.links.forEach((l) => {
      l.style.strokeWidth = (1.2 - 0.8 * S.a).toFixed(2)
      l.style.opacity = (0.42 - 0.25 * S.a).toFixed(2)
    })
    // Anillo de la amígdala: dos ondas lentas, nunca más de una por segundo.
    const ae = S.t - S.amyRing
    el.amyRings.forEach((r) => {
      if (still || ae < 0 || ae > 2.8) {
        r.style.opacity = '0'
        return
      }
      const u = (ae % 1.4) / 1.4
      r.setAttribute('r', (3 + 7 * u).toFixed(2))
      r.style.opacity = (0.9 * (1 - u)).toFixed(3)
    })
    // Las señales que viajan.
    for (const r of Object.values(ROUTES)) {
      if (r.blue && r.lvT && S.t > r.t0 + r.dur + 0.4) r.lvT = 0
      if (still) {
        // Sin movimiento la ruta se ve completa mientras está prendida.
        r.tr.style.strokeDasharray = r.tg.style.strokeDasharray = 'none'
        op(r.tr, r.lvT ? 0.95 : 0)
        op(r.tg, r.lvT ? 0.35 : 0)
        op(r.pu, 0)
        op(r.pg, 0)
        op(r.head, 0)
        continue
      }
      const u = clamp((S.t - r.t0) / r.dur)
      const lv = r.lv * (r.blue ? 1 : 0.35 + 0.65 * Math.max(S.a, S.mode === 'alarm' ? 0.6 : 0))
      const L = r.len
      const shown = u * L
      r.tr.style.strokeDasharray = r.tg.style.strokeDasharray = `${L} ${L}`
      r.tr.style.strokeDashoffset = r.tg.style.strokeDashoffset = (L - shown).toFixed(2)
      op(r.tr, lv * 0.95)
      op(r.tg, lv * 0.32)
      const moving = S.t >= r.t0 && S.t - r.t0 < r.dur + 0.35
      const fade = moving ? (u < 1 ? 1 : 1 - (S.t - r.t0 - r.dur) / 0.35) : 0
      const seg = Math.min(16, L * 0.4)
      r.pu.style.strokeDasharray = r.pg.style.strokeDasharray = `${seg.toFixed(2)} ${(L + seg).toFixed(2)}`
      r.pu.style.strokeDashoffset = r.pg.style.strokeDashoffset = (seg - shown).toFixed(2)
      op(r.pu, fade)
      op(r.pg, fade * 0.38)
      op(r.head, fade)
      if (fade > 0) {
        const pt = r.tr.getPointAtLength(shown)
        r.head.setAttribute('cx', pt.x.toFixed(2))
        r.head.setAttribute('cy', pt.y.toFixed(2))
      }
    }
    // La adrenalina en la sangre: sin movimiento, los vasos se pintan de ámbar.
    el.vessels.classList.toggle('sg-adren', still && S.emit > 0.3)
    for (const q of particles) {
      if (still || S.emit < 0.02) {
        if (q.c.style.opacity !== '0') q.c.style.opacity = '0'
        continue
      }
      const u = (S.t / q.per + q.off) % 1
      const pt = q.r.p.getPointAtLength(u * q.r.len)
      q.c.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`)
      op(q.c, S.emit * Math.sin(Math.PI * u) * 0.95)
    }
    // Flechas: la sangre se va hacia brazos y piernas.
    for (const w of arrows) {
      if (S.bl < 0.02) {
        if (w.a.style.opacity !== '0') w.a.style.opacity = '0'
        continue
      }
      const f = still ? (w.k + 0.5) / 3 : (S.t * 0.16 + w.k / 3) % 1
      const d = lerp(w.u0, w.u1, f) * w.r.len
      const p1 = w.r.p.getPointAtLength(d)
      const p2 = w.r.p.getPointAtLength(Math.min(w.r.len, d + 1))
      const ang = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI
      w.a.setAttribute('transform', `translate(${p1.x.toFixed(2)} ${p1.y.toFixed(2)}) rotate(${ang.toFixed(1)})`)
      op(w.a, S.bl * (still ? 0.9 : Math.sin(Math.PI * f)))
    }
    // La guía de respiración.
    if (S.mode === 'breathe' && el.ring) el.ring.style.transform = `scale(${still ? 0.82 : (0.58 + 0.42 * b).toFixed(3)})`
  }

  // ---------- Reloj: solo corre en pantalla, con la pestaña visible y sin pausa ----------
  let visible = true
  let paused = false
  let last = 0
  let timer: Timer | null = null
  const scope = createScope({ root })
  scope.add(() => {
    timer = createTimer({
      duration: 1000,
      loop: true,
      autoplay: false,
      onUpdate: () => {
        const now = performance.now()
        const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
        last = now
        advance(dt)
        render()
        // Quieto y en calma no hay nada que pintar.
        if (still && S.mode === 'rest' && !S.seq) sleep()
      },
    })
  })
  function sleep() {
    timer?.pause()
  }
  function wake() {
    if (!visible || paused || !timer) return
    last = 0
    timer.resume()
  }

  // ---------- Cámara: el viewBox se mueve suave hacia la parte ----------
  const vb = { x: 0, y: 0, w: 220, h: 400 }
  let camAnim: JSAnimation | null = null
  const setVB = () => svg.setAttribute('viewBox', [vb.x, vb.y, vb.w, vb.h].map((n) => n.toFixed(2)).join(' '))
  const aspect = () => {
    const r = svg.getBoundingClientRect()
    return r.width && r.height ? r.width / r.height : 0.55
  }
  function fullBox(): Box {
    const a = aspect()
    let h = 404
    let w = h * a
    if (w < 226) {
      w = 226
      h = w / a
    }
    return [110 - w / 2, 200 - h / 2, w, h]
  }
  /** La parte queda arriba, a un cuarto de la altura, para que la ficha quepa debajo. */
  function partBox([cx, cy, s]: [number, number, number]): Box {
    const a = aspect()
    const h = Math.max(s * 2.5, (s * 1.45) / a)
    const w = h * a
    return [cx - w / 2, cy - h * 0.27, w, h]
  }
  let focus: [number, number, number] | null = null
  function camTo(target: Box, instant = false) {
    camAnim?.cancel()
    camAnim = null
    const [x, y, w, h] = target
    if (instant || still) {
      Object.assign(vb, { x, y, w, h })
      setVB()
      return
    }
    camAnim = animate(vb, { x, y, w, h, duration: 760, ease: 'inOutCubic', onUpdate: setVB })
  }

  const onResize = () => camTo(focus ? partBox(focus) : fullBox(), true)
  window.addEventListener('resize', onResize)
  camTo(fullBox(), true)
  render()
  wake()

  return {
    alarm,
    breathe,
    /** Acercarse a una parte, o volver a ver todo el cuerpo con null. */
    zoom(box: [number, number, number] | null, instant = false) {
      focus = box
      camTo(box ? partBox(box) : fullBox(), instant)
    },
    setPaused(p: boolean) {
      paused = p
      if (p) sleep()
      else wake()
    },
    setVisible(v: boolean) {
      visible = v
      if (v) wake()
      else sleep()
    },
    setStill(s: boolean) {
      still = s
      render()
      wake()
    },
    destroy() {
      window.removeEventListener('resize', onResize)
      camAnim?.cancel()
      scope.revert()
    },
  }
}

export type SenalEngine = ReturnType<typeof createSenal>
