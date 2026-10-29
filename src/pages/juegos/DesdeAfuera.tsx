import { type KeyboardEvent, type PointerEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import PetSays from '../../components/PetSays'
import { Avatar, CritBody, Hands, type Parts, SCENE_ART, Sticker, lerp, partsOf, pose, smooth } from '../../components/desde-afuera/Art'
import { companionName } from '../../data/companion'
import {
  CRITS,
  DEFAULT_YO,
  FEARS,
  GLASSES,
  HAIRS,
  HAIR_COLORS,
  MAX_STICKERS,
  ORDER,
  SCENES,
  SEEK,
  SHIRTS,
  SKINS,
  STICKERS_KEY,
  type SceneId,
  type Sticker as StickerEntry,
  TODO,
  YO_KEY,
  type Yo,
  cleanYo,
  nextScene,
} from '../../data/desdeAfuera'
import { useCompanion } from '../../lib/companion'
import { readHole } from '../../lib/hueco'
import { soundsLikeRisk } from '../../lib/risk'
import { useStored } from '../../lib/storage'
import './desde-afuera.css'

// Desde afuera: la persona se hace un muñequito parecido a ella y se ve con una ola de pánico en
// el metro, en el banco o en su cuarto. Desde afuera lo acompaña: conoce a los bichitos de las
// sensaciones, le contesta los «¿y si…?» con su nombre, respira a la par, le da algo frío y
// sienten el piso. No se pierde: la ola baja sola, aunque no haga nada. Es para jugar en calma;
// «Necesito ayuda» pausa el juego y lleva a la ayuda de verdad. Sin sonido, reloj ni puntos.

type Pt = { x: number; y: number }
type Fx = { x: number; y: number; vx: number; vy: number; l: number; m: number; s: number; c: string }
type FearUI = { state: 'none' | 'dark' | 'light' | 'gone'; si: number; text: string; lt: boolean; flip: boolean; away: boolean; pop: boolean }
type CritUI = { shown: boolean; asleep: boolean; pop: boolean; sl: number; ang: number }
type Panel =
  | { k: 'todo' }
  | { k: 'crit'; i: number }
  | { k: 'fear'; i: number }
  | { k: 'done'; left: boolean }
  | { k: 'seek' }
  | { k: 'end' }

type Game = {
  t: number
  /** Cuánto ha bajado la ola, de 0 a 1. */
  fu: number
  x: number
  level: number
  ten: number
  rs: number
  relief: number
  clock: number
  kinds: Set<string>
  ended: boolean
  endT: number
  endShown: boolean
  idle: number
  hintI: number
  said: Set<string>
  open: number | null
  crit: CritUI[]
  fears: FearUI[]
  answered: number[]
  br: { mode: 'idle' | 'in' | 'out' | 'back'; inh: number; tin: number; tout: number; dur: number; from: number; puffT: number; said: boolean }
  breaths: number
  puffs: Fx[]
  sparks: Fx[]
  slots: (number | null)[]
  lastSpawn: number
  glass: 'slot' | 'drag' | 'held'
  gp: Pt
  goff: Pt
  dragFrom: Pt
  dragMoved: number
  roots: boolean
  seek: boolean
  /** Los círculos de «cinco cosas»: todavía no, todos, solo los encontrados o ninguno. */
  rings: 'none' | 'all' | 'found' | 'gone'
  found: number[]
  labelsGone: boolean
  five: number
  rough: number
  panel: Panel
  say: string
  guide: string
}

// Dónde salen los «¿y si…?», cuánto sube la ola y dónde quedan el vaso y las manos.
const SLOTS: [number, number][] = [
  [0.27, 0.22],
  [0.73, 0.22],
]
const RISE = 18
const PEAK = 3
const HOLD: Pt = { x: 200, y: 181 }
const SLOT: Pt = { x: 45, y: 264 }
const ROOTS = [
  'M189 268 C186 278 177 284 168 293',
  'M192 269 C194 280 190 288 192 299',
  'M208 269 C206 281 210 290 207 299',
  'M211 268 C214 279 223 285 233 292',
  'M200 270 C199 278 201 286 199 296',
]
const SVGNS = 'http://www.w3.org/2000/svg'

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// La ola: sube unos 18 s, se queda arriba 3 s y baja sola en 60 a 80 s (un poco más rápido si
// la acompaña).
function curve(x: number) {
  if (x < 0.2) return 0.12 + 0.88 * smooth(x / 0.2)
  if (x < 0.24) return 1
  const u = (x - 0.24) / 0.76
  return 0.1 + (0.9 * (1 + Math.cos(Math.PI * u))) / 2
}
const jitter = (x: number, rough: number) => rough * 0.09 * Math.sin(x * 80 + 1.7) * Math.sin(x * 23) * (x < 0.6 ? 1 : 0.5)
const meterAt = (x: number, rough: number): [number, number] => [7 + 68 * x, 35 - 28 * clamp(curve(x) + jitter(x, rough), 0, 1.05)]

const star = (x: number, y: number, s: number) =>
  `M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`

/** Tantos hijos `tag` como haga falta dentro de `g`, reusando los que ya hay. */
function pool(g: SVGGElement | null, n: number, tag: string) {
  if (!g) return []
  while (g.childElementCount < n) g.appendChild(document.createElementNS(SVGNS, tag))
  while (g.childElementCount > n) g.lastElementChild!.remove()
  return Array.from(g.children)
}

function newGame(): Game {
  return {
    t: 0,
    fu: 0,
    x: 0,
    level: 0.12,
    ten: 0.12,
    rs: 0,
    relief: 0,
    clock: 0,
    kinds: new Set(),
    ended: false,
    endT: 0,
    endShown: false,
    idle: 0,
    hintI: 0,
    said: new Set(),
    open: null,
    crit: CRITS.map(() => ({ shown: false, asleep: false, pop: false, sl: 0, ang: 0 })),
    fears: FEARS.map((f) => ({ state: 'none', si: 0, text: f.q, lt: false, flip: false, away: false, pop: false })),
    answered: [],
    br: { mode: 'idle', inh: 0, tin: 0, tout: 0, dur: 4, from: 0, puffT: 0, said: false },
    breaths: 0,
    puffs: [],
    sparks: [],
    slots: [null, null],
    lastSpawn: -9,
    glass: 'slot',
    gp: { ...SLOT },
    goff: { x: 0, y: 0 },
    dragFrom: { x: 0, y: 0 },
    dragMoved: 0,
    roots: false,
    seek: false,
    rings: 'none',
    found: [],
    labelsGone: false,
    five: 0,
    rough: -1,
    panel: { k: 'todo' },
    say: '',
    guide: '',
  }
}

const onEnter = (e: KeyboardEvent, act: () => void) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  act()
}

export default function DesdeAfuera() {
  const { companion, mood } = useCompanion()
  const pet = companion ? companionName(companion) : null
  const [saved, setSaved] = useStored<Yo>(YO_KEY, DEFAULT_YO)
  const yo = cleanYo(saved)
  const [stickers, setStickers] = useStored<StickerEntry[]>(STICKERS_KEY, [])
  const [heart] = useStored('corazon-revisado', false)
  const [phase, setPhase] = useState<'setup' | 'play'>('setup')
  const [round, setRound] = useState(0)
  const [back, setBack] = useState(false)
  const [help, setHelp] = useState(false)
  const [risk, setRisk] = useState(false)
  const [visible, setVisible] = useState(true)
  const [pageHidden, setPageHidden] = useState(() => document.hidden)
  const [small, setSmall] = useState(true)
  const [sr, setSr] = useState('')
  const [, setTick] = useState(0)
  const ids = useId()

  const G = useRef<Game | null>(null)
  const yoRef = useRef(yo)
  yoRef.current = yo
  const still = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const timers = useRef<number[]>([])
  const focusNext = useRef<string | HTMLElement | null>(null)
  const scrollPanel = useRef(false)
  const helpFrom = useRef<Element | null>(null)

  const rootRef = useRef<HTMLElement>(null)
  const prevRef = useRef<SVGSVGElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const ovRef = useRef<HTMLDivElement>(null)
  const avRef = useRef<SVGGElement>(null)
  const handsRef = useRef<SVGGElement>(null)
  const glassRef = useRef<SVGGElement>(null)
  const puffsRef = useRef<SVGGElement>(null)
  const sparksRef = useRef<SVGGElement>(null)
  const mlineRef = useRef<SVGPathElement>(null)
  const mfillRef = useRef<SVGPathElement>(null)
  const mdotRef = useRef<SVGCircleElement>(null)
  const breathRef = useRef<HTMLButtonElement>(null)
  const sayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const critRefs = useRef<(SVGGElement | null)[]>([])
  const bubRefs = useRef<(HTMLDivElement | null)[]>([])
  const lblRefs = useRef<(HTMLDivElement | null)[]>([])
  const AV = useRef<Parts>({})
  const HD = useRef<Parts>({})
  const CP = useRef<Parts[]>([])

  const bump = () => setTick((n) => n + 1)
  const nm = () => yoRef.current.name.trim().slice(0, 24)
  const sus = () => (nm() ? 'sus' : 'tus')
  const breathLabel = () => (nm() ? `Respira con ${nm()}` : 'Respira a la par')
  const later = (f: () => void, ms: number) => {
    timers.current.push(window.setTimeout(f, ms))
  }
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => (still.current = mq.matches)
    mq.addEventListener('change', change)
    const vis = () => setPageHidden(document.hidden)
    document.addEventListener('visibilitychange', vis)
    let io: IntersectionObserver | undefined
    if (rootRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => setVisible(es[es.length - 1].isIntersecting))
      io.observe(rootRef.current)
    }
    return () => {
      mq.removeEventListener('change', change)
      document.removeEventListener('visibilitychange', vis)
      io?.disconnect()
      clearTimers()
    }
  }, [])

  // Con señales de riesgo en sus registros, la ayuda va antes que el juego.
  useEffect(() => {
    let live = true
    void readHole(pet ?? 'tu mascota', mood).then((r) => live && setRisk(r.risk))
    return () => {
      live = false
    }
    // Se lee una vez, al llegar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const announce = (t: string) => {
    setSr('')
    later(() => setSr(t), 60)
  }

  const say = (t: string) => {
    const g = G.current
    if (!g) return
    g.say = t
    g.idle = 0
    const el = sayRef.current
    if (el && !still.current) {
      el.classList.remove('da-talk')
      void el.offsetWidth
      el.classList.add('da-talk')
    }
    bump()
  }

  const did = (k: string | null, r: number) => {
    const g = G.current!
    g.relief = Math.min(1, g.relief + r)
    if (k) g.kinds.add(k)
    bump()
  }

  const spark = (g: Game, x: number, y: number, vx: number, vy: number, l: number, m: number, s: number, c: string) => {
    const z = still.current
    g.sparks.push({ x, y, vx: z ? 0 : vx, vy: z ? 0 : vy, l, m, s, c })
  }

  // ---------- Los bichitos y los «¿y si…?» ----------

  const showCrit = (g: Game, i: number) => {
    g.crit[i].shown = true
    g.crit[i].pop = !still.current
    bump()
  }

  const tapCrit = (i: number) => {
    const g = G.current
    if (!g || help) return
    const c = g.crit[i]
    if (!c.shown) return
    const first = !g.kinds.has('crit')
    if (!c.asleep) {
      c.asleep = true
      did('crit', 0.06)
    }
    g.panel = { k: 'crit', i }
    announce(`${CRITS[i].n}. ${CRITS[i].t}`)
    if (g.crit.every((x) => x.asleep) && !g.said.has('allc')) {
      g.said.add('allc')
      say('Ya los conoces a todos. Siguen ahí, pero dormiditos.')
    } else if (first) say('Ponerle nombre le quita lo misterioso. No hay que pelearlo: se duerme solo.')
    bump()
  }

  const spawnFear = (g: Game, i: number, si: number) => {
    const f = g.fears[i]
    f.state = 'dark'
    f.si = si
    f.pop = !still.current
    g.slots[si] = i
    g.lastSpawn = g.t
    if (!g.said.has('f1')) {
      g.said.add('f1')
      say('Ahí sale un ¿y si…? Tócalo para contestarle.')
    }
    bump()
  }

  const openFear = (i: number) => {
    const g = G.current
    if (!g || help || g.ended || g.fears[i].state !== 'dark') return
    const N = nm()
    g.open = i
    g.panel = { k: 'fear', i }
    say(N ? 'Háblale con su nombre, como a alguien que quieres.' : 'Háblate como le hablarías a alguien que quieres.')
    focusNext.current = '[data-rep]'
    scrollPanel.current = true
    bump()
  }

  const reply = (k: number) => {
    const g = G.current
    const i = g?.open
    if (!g || i == null) return
    const f = g.fears[i]
    if (f.state !== 'dark') return
    const txt = FEARS[i].r(nm(), heart)[k]
    f.state = 'light'
    g.open = null
    g.answered.push(i)
    did('yrsi', 0.07)
    const swap = () => {
      f.text = txt
      f.lt = true
      bump()
    }
    if (still.current) swap()
    else {
      f.flip = true
      later(swap, 250)
      later(() => {
        f.flip = false
        bump()
      }, 520)
    }
    later(() => {
      f.away = true
      if (g.slots[f.si] === i) g.slots[f.si] = null
      bump()
    }, 4300)
    later(() => {
      f.state = 'gone'
      bump()
    }, 5900)
    say(txt)
    g.panel = { k: 'done', left: g.fears.some((x) => x.state === 'dark' || x.state === 'none') }
    focusNext.current = '[data-focus="done"]'
    bump()
  }

  // ---------- Respirar a la par ----------

  const breathIn = () => {
    const g = G.current
    if (!g || g.ended || help) return
    const B = g.br
    if (B.mode === 'in') return
    B.mode = 'in'
    B.tin = 0
    B.from = B.inh
    B.said = false
    g.guide = 'Toma aire, sin forzar… y suelta el botón.'
    g.idle = 0
    bump()
  }

  const breathOut = () => {
    const g = G.current
    const B = g?.br
    if (!g || !B || B.mode !== 'in') return
    if (B.tin < 0.45) {
      B.mode = 'back'
      g.guide = 'Déjalo presionado mientras tomas aire.'
    } else {
      B.mode = 'out'
      B.tout = 0
      B.dur = clamp(B.tin * 1.7, 3, 7)
      B.from = B.inh
      B.puffT = 0
      g.guide = 'Ahora suéltalo despacio… más largo que al tomarlo.'
    }
    bump()
  }

  const breathStep = (g: Game, dt: number) => {
    const B = g.br
    if (B.mode === 'in') {
      B.tin += dt
      B.inh = Math.min(1, B.from + B.tin / 3.5)
      if (B.tin > 6.5 && !B.said) {
        B.said = true
        g.guide = 'Ya puedes soltarlo.'
        bump()
      }
    } else if (B.mode === 'out') {
      B.tout += dt
      B.inh = B.from * (1 - smooth(B.tout / B.dur))
      B.puffT -= dt
      if (!still.current && B.puffT <= 0 && B.tout < B.dur * 0.85) {
        B.puffT = 0.32
        g.puffs.push({ x: 208, y: 128 + 2 * g.ten, vx: 15 + Math.random() * 7, vy: -4 - Math.random() * 5, l: 0, m: 1.7, s: 0, c: '' })
      }
      if (B.tout >= B.dur) {
        B.mode = 'idle'
        B.inh = 0
        g.breaths++
        did('breath', g.breaths <= 4 ? 0.08 : 0)
        const N = nm()
        g.guide =
          g.breaths === 1
            ? 'Así. Soltar lento es lo que calma.'
            : g.breaths === 3
              ? N
                ? `El pecho de ${N} ya va más tranquilo.`
                : 'Tu pecho ya va más tranquilo.'
              : 'Otra vez, si quieres.'
        bump()
      }
    } else if (B.mode === 'back') {
      B.inh = Math.max(0, B.inh - dt * 1.5)
      if (B.inh <= 0) B.mode = 'idle'
    }
  }

  // ---------- Algo frío y los pies en el suelo ----------

  const give = () => {
    const g = G.current
    if (!g || g.ended || help || g.glass === 'held') return
    g.glass = 'held'
    did('cold', 0.15)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      spark(g, HOLD.x + Math.cos(a) * 19, HOLD.y + Math.sin(a) * 17, Math.cos(a) * 7, Math.sin(a) * 7 - 3, -k * 0.1, 2.2, 3.4, '#bfe6ff')
    }
    say('Lo frío en las manos ayuda al cuerpo a bajar el ritmo.')
  }

  const startSeek = () => {
    const g = G.current
    if (!g || g.ended || g.seek || g.found.length >= 5) return
    g.seek = true
    g.rings = 'all'
    g.panel = { k: 'seek' }
    announce('En la escena aparecieron círculos. Toca cinco cosas que veas.')
    bump()
  }

  const feet = () => {
    const g = G.current
    if (!g || g.ended || help) return
    if (g.roots) {
      if (g.seek) {
        svgRef.current?.querySelector<SVGElement>('.da-seekring:not(.da-found)')?.focus({ preventScroll: true })
        say('Toca los círculos: cinco cosas que se vean.')
      }
      return
    }
    g.roots = true
    did('feet', 0.12)
    say(`Siente el piso bajo ${sus()} pies. Ahora busca cinco cosas que se vean.`)
    later(startSeek, still.current ? 0 : 1500)
  }

  const findObj = (k: number) => {
    const g = G.current
    if (!g || help || !g.seek || g.found.includes(k) || g.found.length >= 5) return
    g.found.push(k)
    const o = SEEK[yoRef.current.scene][k]
    for (let j = 0; j < 5; j++) {
      const a = (j / 5) * Math.PI * 2
      spark(g, o[2] + Math.cos(a) * o[4], o[3] + Math.sin(a) * o[4], Math.cos(a) * 8, Math.sin(a) * 8, 0, 1, 2.6, '#f3c969')
    }
    g.panel = { k: 'seek' }
    if (g.found.length === 5) {
      g.seek = false
      did('see', 0.12)
      say('Cinco cosas. Eso es estar aquí, en el presente.')
      g.rings = 'found'
      later(() => {
        g.labelsGone = true
        g.rings = 'gone'
        bump()
      }, 3500)
    } else announce(o[1])
    bump()
  }

  // Si pasa un rato sin tocar nada, la mascota sugiere algo; nunca apura.
  const hint = (g: Game) => {
    const dark = g.fears.some((f) => f.state === 'dark')
    const H: string[] = []
    if (!g.kinds.has('crit') && g.crit.some((c) => c.shown)) H.push('Toca a los bichitos para saber qué son.')
    if (dark && !g.kinds.has('yrsi')) H.push('Esas nubes oscuras son los ¿y si…? Toca una para contestarle.')
    if (!g.kinds.has('breath')) H.push(`Deja presionado «${breathLabel()}» y suéltalo despacio.`)
    if (g.glass !== 'held') H.push(`Arrastra el agua fría hasta ${sus()} manos.`)
    if (!g.roots) H.push(`Toca ${sus()} pies: vamos a sentir el piso.`)
    if (g.seek) H.push('Busca los círculos y toca cinco cosas que veas.')
    if (dark && g.kinds.has('yrsi')) H.push('Queda un ¿y si…? flotando. Si quieres, contéstale.')
    if (!H.length) H.push('No tienes que hacer nada más. Mira cómo baja la ola.')
    say(H[g.hintI++ % H.length])
  }

  // ---------- El final ----------

  const finish = (g: Game) => {
    g.ended = true
    g.endT = 0
    g.open = null
    g.crit.forEach((c) => {
      if (!c.shown) c.shown = true
      c.asleep = true
    })
    g.slots = [null, null]
    g.fears.forEach((f) => {
      if (f.state !== 'dark') return
      f.away = true
      later(() => {
        f.state = 'gone'
        bump()
      }, 1600)
    })
    g.seek = false
    g.rings = 'gone'
    g.labelsGone = true
    if (g.br.mode !== 'idle') g.br.mode = 'back'
    g.guide = ''
    const N = nm()
    say(N ? `Ya bajó. ${N} lo atravesó.` : 'Ya bajó. Lo atravesaste.')
    const C = ['#f3c969', '#7dbb9f', '#e46a8f', '#6d8cc7']
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI * 2
      spark(g, 200 + Math.cos(a) * 70, 170 + Math.sin(a) * 95, Math.cos(a) * 10, Math.sin(a) * 10, -j * 0.06, 1.8, 4, C[j % 4])
    }
    const scene = yoRef.current.scene
    setStickers((prev) =>
      [{ s: scene, d: Date.now() }, ...(Array.isArray(prev) ? prev.filter((s) => s && s.s in SCENES) : [])].slice(0, MAX_STICKERS),
    )
  }

  const showEnd = (g: Game) => {
    g.endShown = true
    g.panel = { k: 'end' }
    focusNext.current = '[data-focus="end"]'
    scrollPanel.current = true
    bump()
  }

  const highFive = () => {
    const g = G.current
    if (!g || !g.ended) return
    g.five = 1
    for (let j = 0; j < 9; j++) {
      const a = (j / 9) * Math.PI * 2
      spark(g, 238 + Math.cos(a) * 14, 118 + Math.sin(a) * 14, Math.cos(a) * 22, Math.sin(a) * 22, 0, 1.1, 3.6, j % 2 ? '#f3c969' : '#e46a8f')
    }
    say('¡Eso! Lo atravesaron a la par.')
  }

  // ---------- Cuadro por cuadro ----------

  const step = (g: Game, dt: number) => {
    g.clock += dt
    if (!g.ended) {
      g.t += dt
      let x: number
      if (g.t < RISE) x = (0.2 * g.t) / RISE
      else if (g.t < RISE + PEAK) x = 0.2 + (0.04 * (g.t - RISE)) / PEAK
      else {
        g.fu = Math.min(1, g.fu + dt / Math.max(60, 80 - 4 * g.kinds.size))
        x = 0.24 + 0.76 * g.fu
      }
      g.x = x
      g.level = curve(x)
      g.crit.forEach((c, i) => {
        if (!c.shown && g.t >= CRITS[i].at) showCrit(g, i)
      })
      const i = g.fears.findIndex((f) => f.state === 'none')
      const si = g.slots.indexOf(null)
      if (i >= 0 && si >= 0 && g.t >= FEARS[i].at && g.t - g.lastSpawn >= 3) spawnFear(g, i, si)
      const N = nm()
      if (!g.said.has('h1') && g.t >= 8 && !g.kinds.has('crit')) {
        g.said.add('h1')
        say('Toca a los bichitos para saber qué son.')
      }
      if (!g.said.has('pk') && g.t >= RISE) {
        g.said.add('pk')
        say('Este es lo más alto. De aquí, solo baja.')
        announce('La ola llegó a lo más alto.')
      }
      if (!g.said.has('half') && g.fu >= 0.45) {
        g.said.add('half')
        say(N ? `Ya va bajando. ${N} lo está atravesando.` : 'Ya va bajando. Lo estás atravesando.')
      }
      if (!g.said.has('low') && g.fu >= 0.82) {
        g.said.add('low')
        say('Ya casi. La ola se está acomodando sola.')
      }
      g.idle += dt
      if (g.idle > 14) hint(g)
      g.ten = g.level * (1 - 0.5 * g.rs)
      if (g.fu >= 1) finish(g)
    } else {
      g.endT += dt
      g.ten = Math.max(0, g.ten - dt * 0.8)
      if (!g.endShown && g.endT > 1.3) showEnd(g)
      g.five = Math.max(0, g.five - dt * 1.1)
    }
    g.rs += (g.relief - g.rs) * Math.min(1, dt * 1.2)
    breathStep(g, dt)
    const z = still.current
    g.crit.forEach((c) => {
      c.sl += ((c.asleep ? 1 : 0) - c.sl) * Math.min(1, dt * 3)
      c.ang += dt * (z ? 0 : lerp(320, 25, c.sl) * (0.5 + 0.5 * g.level))
    })
    if (g.glass !== 'drag') {
      const tg = g.glass === 'held' ? (g.ended ? { x: 188, y: 176 } : HOLD) : SLOT
      if (z) g.gp = { ...tg }
      else {
        const k = Math.min(1, dt * 9)
        g.gp = { x: lerp(g.gp.x, tg.x, k), y: lerp(g.gp.y, tg.y, k) }
      }
    }
    g.puffs.forEach((p) => {
      p.l += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    })
    g.puffs = g.puffs.filter((p) => p.l < p.m)
    g.sparks.forEach((p) => {
      p.l += dt
      if (p.l > 0) {
        p.x += p.vx * dt
        p.y += p.vy * dt
      }
    })
    g.sparks = g.sparks.filter((p) => p.l < p.m)
  }

  const meterPath = (rough: number) => {
    let d = ''
    for (let i = 0; i <= 64; i++) {
      const [a, b] = meterAt(i / 64, rough)
      d += `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`
    }
    mlineRef.current?.setAttribute('d', d)
    mfillRef.current?.setAttribute('d', `${d}L75 37L7 37Z`)
  }

  const draw = () => {
    const g = G.current
    if (!g || !AV.current.shirt) return
    const z = still.current
    const B = g.br
    const inh = z ? (B.mode === 'in' || B.mode === 'out' ? 1 : 0) : B.inh
    pose(
      AV.current,
      HD.current,
      {
        t: g.ten,
        inh,
        pose: g.ended ? 'wave' : g.glass === 'held' ? 'hold' : 'tense',
        happy: g.ended,
        glass: g.glass === 'held',
        five: smooth(g.five),
      },
      g.clock,
      z,
    )
    glassRef.current?.setAttribute('transform', `translate(${g.gp.x.toFixed(1)} ${g.gp.y.toFixed(1)})`)
    const k = g.clock
    g.crit.forEach((c, i) => {
      const E = CP.current[i]
      if (!c.shown || !E?.body) return
      const id = CRITS[i].id
      const a = z ? 0 : (1 - c.sl) * (0.4 + 0.6 * g.level)
      const s = lerp(1, 0.72, c.sl) * (1 + (z ? 0 : 0.035 * c.sl * Math.sin(k * 1.6)))
      let sx = s
      let sy = s
      if (id === 'corazon') {
        const p = 1 + 0.15 * a * Math.abs(Math.sin(k * 7))
        sx *= p
        sy *= p
        const d = a * 28 * Math.sin(k * 14)
        E.k1.setAttribute('transform', `rotate(${d.toFixed(1)} -5 -9)`)
        E.k2.setAttribute('transform', `rotate(${(-d).toFixed(1)} 5 -9)`)
        const o = (1 - c.sl).toFixed(2)
        E.k1.setAttribute('opacity', o)
        E.k2.setAttribute('opacity', o)
      } else if (id === 'remolino') E.spin.setAttribute('transform', `rotate(${(c.ang % 360).toFixed(1)})`)
      else if (id === 'llamita') {
        const f = Math.sin(k * 13)
        sy *= 1 + 0.13 * a * f
        sx *= 1 - 0.05 * a * f
      } else if (id === 'hormigas') {
        for (let j = 0; j < 3; j++)
          E[`ant${j}`]?.setAttribute(
            'transform',
            `translate(${(-11 + j * 11 + 4 * a * Math.sin(k * 6 + j * 1.3)).toFixed(1)} ${(1.6 * a * Math.sin(k * 12 + j)).toFixed(1)})`,
          )
      } else {
        const f = Math.sin(k * 5)
        sx *= 1 + 0.08 * a * f
        sy *= 1 - 0.08 * a * f
      }
      E.body.setAttribute('transform', `scale(${sx.toFixed(3)} ${sy.toFixed(3)})`)
      E.z.setAttribute('opacity', (c.sl * (z ? 1 : 0.55 + 0.45 * Math.sin(k * 1.5))).toFixed(2))
      if (E.eo && E.eo.classList.contains('da-off') !== c.asleep) {
        E.eo.classList.toggle('da-off', c.asleep)
        E.ec.classList.toggle('da-off', !c.asleep)
      }
      if (E.tight && E.tight.classList.contains('da-off') !== c.asleep) {
        E.tight.classList.toggle('da-off', c.asleep)
        E.loose.classList.toggle('da-off', !c.asleep)
      }
    })
    const rough = Math.max(0.12, 1 - 0.17 * g.kinds.size)
    if (rough !== g.rough) {
      g.rough = rough
      meterPath(rough)
    }
    const x = z ? Math.floor(g.x * 14 + 1e-6) / 14 : g.x
    const [mx, my] = meterAt(x, g.rough)
    mdotRef.current?.setAttribute('cx', mx.toFixed(1))
    mdotRef.current?.setAttribute('cy', my.toFixed(1))
    pool(puffsRef.current, g.puffs.length, 'circle').forEach((el, j) => {
      const p = g.puffs[j]
      const q = p.l / p.m
      el.setAttribute('cx', p.x.toFixed(1))
      el.setAttribute('cy', p.y.toFixed(1))
      el.setAttribute('r', (2 + 5 * q).toFixed(1))
      el.setAttribute('fill', '#fff')
      el.setAttribute('stroke', '#9fb8d8')
      el.setAttribute('stroke-width', '.8')
      el.setAttribute('opacity', (0.75 * (1 - q)).toFixed(2))
    })
    const live = g.sparks.filter((p) => p.l >= 0)
    pool(sparksRef.current, live.length, 'path').forEach((el, j) => {
      const p = live[j]
      const q = p.l / p.m
      const s = p.s * (z ? 1 : 0.6 + 0.5 * Math.sin((Math.min(1, q * 3) * Math.PI) / 2))
      el.setAttribute('d', star(+p.x.toFixed(1), +p.y.toFixed(1), +s.toFixed(2)))
      el.setAttribute('fill', p.c)
      el.setAttribute('opacity', (1 - q).toFixed(2))
    })
    breathRef.current?.style.setProperty('--p', inh.toFixed(3))
  }

  // Solo corre mientras se juega, se ve en pantalla, la pestaña está activa y no está abierta
  // la ayuda. Al salir de la pantalla se detiene.
  const running = phase === 'play' && !help && visible && !pageHidden
  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const g = G.current
      if (!g) return
      step(g, Math.min(0.1, (now - last) / 1000))
      last = now
      draw()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // Todo lo que leen vive en refs; basta con reiniciar al cambiar de ronda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, round])

  // Al empezar una ronda: las partes del dibujo que se mueven y el primer cuadro.
  useLayoutEffect(() => {
    if (phase !== 'play') return
    AV.current = partsOf(avRef.current)
    HD.current = partsOf(handsRef.current)
    CP.current = critRefs.current.map((g) => partsOf(g, 'c'))
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  // La vista previa de «Hazte tú», quieta y casi sin nervios.
  useLayoutEffect(() => {
    if (phase !== 'setup') return
    const p = partsOf(prevRef.current)
    pose(p, p, { t: 0.08, inh: 0, pose: 'tense', happy: false }, 0, true)
  })

  // Las nubes y las etiquetas se acomodan dentro de la escena, sin salirse.
  const place = () => {
    const ov = ovRef.current
    const g = G.current
    if (!ov || !g) return
    const W = ov.clientWidth
    const H = ov.clientHeight
    g.fears.forEach((f, i) => {
      const el = bubRefs.current[i]
      if (!el) return
      const bw = el.offsetWidth
      const bh = el.offsetHeight
      if (f.lt) {
        el.style.left = `${Math.max(6, (W - bw) / 2)}px`
        el.style.top = '6px'
        return
      }
      const [sx, sy] = SLOTS[f.si]
      el.style.left = `${clamp(sx * W - bw / 2, 6, Math.max(6, W - bw - 6))}px`
      el.style.top = `${clamp(sy * H - bh, 6, Math.max(6, H - bh - 14))}px`
    })
    const objs = SEEK[yoRef.current.scene]
    g.found.forEach((k, j) => {
      const el = lblRefs.current[j]
      if (!el) return
      const o = objs[k]
      const bw = el.offsetWidth
      const lh = el.offsetHeight
      let ly = ((o[3] - o[4]) / 300) * H - 3
      if (ly - lh < 4) ly = ((o[3] + o[4]) / 300) * H + lh + 3
      el.style.left = `${clamp((o[2] / 400) * W, bw / 2 + 4, W - bw / 2 - 4)}px`
      el.style.top = `${ly}px`
    })
  }
  useLayoutEffect(place)
  useEffect(() => {
    const ov = ovRef.current
    if (phase !== 'play' || !ov || !('ResizeObserver' in window)) return
    const ro = new ResizeObserver(() => {
      setSmall(ov.clientWidth < 480)
      place()
    })
    ro.observe(ov)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  // El foco va a lo que acaba de abrirse (las respuestas, el final, la ayuda).
  useEffect(() => {
    const target = focusNext.current
    if (target) {
      focusNext.current = null
      const el = typeof target === 'string' ? rootRef.current?.querySelector<HTMLElement>(target) : target
      el?.focus({ preventScroll: true })
    }
    if (scrollPanel.current) {
      scrollPanel.current = false
      panelRef.current?.scrollIntoView({ block: 'nearest' })
    }
  })

  // ---------- Jugar, salir y ayuda ----------

  const play = (scene?: SceneId) => {
    const next = scene ? { ...yo, scene } : yo
    if (scene) setSaved(next)
    yoRef.current = next
    clearTimers()
    const g = newGame()
    G.current = g
    const N = next.name.trim()
    const w = SCENES[next.scene].w
    g.say = N
      ? `Mira: ahí está ${N}, ${w}. Le está empezando una ola de pánico. Desde afuera puedes echarle la mano.`
      : `Mira: ahí estás tú, ${w}. Te está empezando una ola de pánico. Desde afuera puedes echarte la mano.`
    setPhase('play')
    setRound((r) => r + 1)
    setBack(false)
    setSr('')
    focusNext.current = '.da-scene'
    later(() => sceneRef.current?.scrollIntoView({ block: 'nearest' }), 0)
    bump()
  }

  const bye = () => {
    clearTimers()
    G.current = null
    setPhase('setup')
    setBack(true)
    focusNext.current = '.da-go'
  }

  const helpOpen = () => {
    helpFrom.current = document.activeElement
    setHelp(true)
    focusNext.current = '[data-focus="help"]'
  }
  const helpClose = () => {
    setHelp(false)
    const from = helpFrom.current
    focusNext.current =
      from instanceof HTMLElement && from.isConnected && !from.closest('.da-off') ? from : '.da-helpbtn'
  }

  // ---------- Arrastrar el vaso ----------

  const svgPoint = (e: PointerEvent): Pt => {
    const m = svgRef.current?.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }
  const glassDown = (e: PointerEvent<SVGGElement>) => {
    const g = G.current
    if (!g || g.ended || help || g.glass === 'held') return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Sin captura también se puede arrastrar, mientras el dedo siga encima.
    }
    const p = svgPoint(e)
    g.glass = 'drag'
    g.goff = { x: g.gp.x - p.x, y: g.gp.y - p.y }
    g.dragFrom = p
    g.dragMoved = 0
    g.idle = 0
  }
  const glassMove = (e: PointerEvent<SVGGElement>) => {
    const g = G.current
    if (!g || g.glass !== 'drag') return
    const p = svgPoint(e)
    g.dragMoved = Math.max(g.dragMoved, Math.hypot(p.x - g.dragFrom.x, p.y - g.dragFrom.y))
    g.gp = { x: clamp(p.x + g.goff.x, 12, 388), y: clamp(p.y + g.goff.y, 12, 288) }
  }
  const glassDrop = () => {
    const g = G.current
    if (!g || g.glass !== 'drag') return
    g.glass = 'slot'
    // Un toque sin arrastrar también se lo da.
    if (g.dragMoved < 6 || Math.hypot(g.gp.x - HOLD.x, g.gp.y - HOLD.y) < 62) give()
    else say(`Casi. Llévala hasta ${sus()} manos.`)
  }

  const g = G.current
  const N = yo.name.trim()
  const scene = yo.scene
  const helpFirst = risk || soundsLikeRisk(yo.name)
  const held = g?.glass === 'held'
  const validStickers = (Array.isArray(stickers) ? stickers : []).filter((s) => s && s.s in SCENES)

  const swatches = (label: string, key: 'skin' | 'hcol' | 'shirt', list: [string, string][], bg: (v: string) => string) => (
    <div className="da-g" role="group" aria-labelledby={`${ids}-${key}`}>
      <span className="da-lab" id={`${ids}-${key}`}>
        {label}
      </span>
      <div className="da-row">
        {list.map(([v, name], k) => (
          <button
            key={v}
            type="button"
            className="da-sw"
            aria-label={name}
            aria-pressed={yo[key] === k}
            style={{ background: bg(v) }}
            onClick={() => setSaved({ ...yo, [key]: k })}
          />
        ))}
      </div>
    </div>
  )

  const panel = () => {
    if (!g) return null
    const p = g.panel
    switch (p.k) {
      case 'todo':
        return (
          <div className="da-card">
            <h3>Mientras pasa la ola</h3>
            <ul className="da-ideas">
              {TODO.map(([k, label]) => (
                <li key={k} className={g.kinds.has(k) ? 'da-done' : undefined}>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )
      case 'crit':
        return (
          <div className="da-card da-info">
            <h3>{CRITS[p.i].n}</h3>
            <p>{CRITS[p.i].t}</p>
          </div>
        )
      case 'fear':
        return (
          <div className="da-card">
            <h3>«{FEARS[p.i].q}»</h3>
            <p>{N ? `¿Qué le dices a ${N} desde afuera?` : '¿Qué te dices desde afuera?'} Todas sirven.</p>
            <div className="da-replies">
              {FEARS[p.i].r(N, heart).map((t, k) => (
                <button key={k} type="button" className="btn ghost" data-rep={k} onClick={() => reply(k)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )
      case 'done':
        return (
          <div className="da-card da-info">
            <h3 tabIndex={-1} data-focus="done">
              Se fue más ligero
            </h3>
            <p>{p.left ? 'Si sale otro ¿y si…?, también puedes contestarle.' : 'Lo que temías no manda. Lo que pasa, sí.'}</p>
          </div>
        )
      case 'seek': {
        const objs = SEEK[scene]
        return (
          <div className="da-card">
            <h3>Cinco cosas que se ven</h3>
            <ul className="da-ideas">
              {[0, 1, 2, 3, 4].map((k) => (
                <li key={k} className={g.found[k] != null ? 'da-done' : undefined}>
                  {g.found[k] != null ? objs[g.found[k]][1] : '…'}
                </li>
              ))}
            </ul>
          </div>
        )
      }
      case 'end': {
        const feared = g.answered.length
          ? g.answered
          : FEARS.map((_, i) => i).filter((i) => g.fears[i].state !== 'none')
        const nx = nextScene(scene)
        return (
          <div className="da-card da-end">
            <h3 tabIndex={-1} data-focus="end">
              Lo atravesaste.
            </h3>
            <p>Desde afuera se ve distinto: tu cuerpo hizo la ola y la bajó.</p>
            <button type="button" className="btn small ghost" onClick={highFive}>
              Chocar la mano
            </button>
            {feared.length > 0 && (
              <div className="da-recap">
                <div className="da-rr da-rh">
                  <span>Lo que temías</span>
                  <span>Lo que pasó</span>
                </div>
                {feared.map((i) => (
                  <div key={i} className="da-rr">
                    <span>{FEARS[i].q}</span>
                    <span>{FEARS[i].out(N)}</span>
                  </div>
                ))}
                <p className="da-nada">Nada de eso pasó.</p>
              </div>
            )}
            <div className="da-stk">
              <div className="da-stk-new">
                <Sticker scene={scene} />
              </div>
              <p>
                <strong>Calcomanía nueva</strong>
                <br />
                {SCENES[scene].n}
              </p>
            </div>
            {validStickers.length > 1 && (
              <div>
                <p className="muted small da-stks-t">Tus últimas calcomanías</p>
                <ul className="da-stks">
                  {validStickers.map((s, j) => (
                    <li key={`${j}-${s.d}`} title={SCENES[s.s].n}>
                      <Sticker scene={s.s} />
                      <span className="visually-hidden">{SCENES[s.s].n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="da-row">
              <button type="button" className="btn" onClick={() => play(nx)}>
                Otra vez, {SCENES[nx].w}
              </button>
              <button type="button" className="btn ghost" onClick={bye}>
                Ya estuvo
              </button>
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Desde afuera"
        subtitle={`Te ves desde afuera en una ola de pánico y te echas la mano hasta que baja.${pet ? ` ${pet} te acompaña.` : ''} Es para jugar en calma, como práctica. Sin reloj, puntos ni forma de perder.`}
      />

      {/* Con señales de riesgo, la ayuda va antes que el juego. */}
      {helpFirst && (
        <div className="callout warm">
          <p>Si ahorita sientes que no puedes con esto, hay alguien que puede escucharte en este momento.</p>
          <Link to="/ayuda" className="btn danger">
            Hablar con alguien ahora
          </Link>
        </div>
      )}

      <section
        ref={rootRef}
        className={`card da-game${phase === 'play' && !running ? ' da-paused' : ''}`}
        aria-label="Desde afuera"
        onPointerDown={() => g && (g.idle = 0)}
        onKeyDown={() => g && (g.idle = 0)}
      >
        <div className="da-bar" inert={help}>
          <p>
            <strong className="da-title">Desde afuera</strong>
            <span className="da-where">{phase === 'play' ? SCENES[scene].n : 'Hazte tú'}</span>
          </p>
          <button type="button" className="da-helpbtn" onClick={helpOpen}>
            Necesito ayuda
          </button>
        </div>

        {phase === 'setup' ? (
          <div className="da-cols da-setup" inert={help}>
            <div className="da-prev">
              <svg ref={prevRef} viewBox="118 62 164 214" aria-hidden="true">
                <circle cx="200" cy="180" r="80" style={{ fill: 'var(--primary-soft)' }} />
                <g transform="translate(200 0)">
                  <Avatar yo={yo} sfx="p" />
                  <Hands yo={yo} />
                </g>
              </svg>
            </div>
            <div className="da-opts">
              <div className="da-head">
                <h2>Hazte tú</h2>
                <button type="button" className="btn small ghost" onClick={() => play()}>
                  Saltar
                </button>
              </div>
              <p className="muted small">
                {back
                  ? 'Aquí te espera cuando quieras practicar. Puedes cambiarte o escoger otra escena.'
                  : 'Elige rápido, como más se te parezca. Todo se queda en este dispositivo.'}
              </p>
              {swatches('Tu piel', 'skin', SKINS, (v) => v)}
              <div className="da-g" role="group" aria-labelledby={`${ids}-hair`}>
                <span className="da-lab" id={`${ids}-hair`}>
                  Tu pelo
                </span>
                <div className="da-row">
                  {HAIRS.map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      className={`chip${yo.hair === v ? ' selected' : ''}`}
                      aria-pressed={yo.hair === v}
                      onClick={() => setSaved({ ...yo, hair: v })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {swatches('Color de pelo', 'hcol', HAIR_COLORS, (v) => v)}
              <div className="da-g" role="group" aria-labelledby={`${ids}-lentes`}>
                <span className="da-lab" id={`${ids}-lentes`}>
                  Lentes
                </span>
                <div className="da-row">
                  {GLASSES.map(([v, label]) => (
                    <button
                      key={label}
                      type="button"
                      className={`chip${yo.lentes === v ? ' selected' : ''}`}
                      aria-pressed={yo.lentes === v}
                      onClick={() => setSaved({ ...yo, lentes: v })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {swatches('Tu playera', 'shirt', SHIRTS, (v) => `var(${v})`)}
              <div className="da-g">
                <label className="da-lab" htmlFor={`${ids}-name`}>
                  ¿Cómo te llamas? Para hablarte desde afuera
                </label>
                <input
                  id={`${ids}-name`}
                  className="da-input"
                  maxLength={24}
                  autoComplete="off"
                  placeholder="Opcional"
                  value={yo.name}
                  onChange={(e) => setSaved({ ...yo, name: e.target.value.slice(0, 24) })}
                  onKeyDown={(e) => e.key === 'Enter' && play()}
                />
              </div>
              <div className="da-g" role="group" aria-labelledby={`${ids}-scene`}>
                <span className="da-lab" id={`${ids}-scene`}>
                  ¿Dónde pasa?
                </span>
                <div className="da-scenes">
                  {ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="da-sc"
                      aria-pressed={scene === s}
                      onClick={() => setSaved({ ...yo, scene: s })}
                    >
                      <Sticker scene={s} />
                      <span>{SCENES[s].n}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="btn da-go" onClick={() => play()}>
                Empezar
              </button>
            </div>
          </div>
        ) : (
          g && (
            <div className="da-cols" inert={help}>
              <div ref={sceneRef} className="da-scene" tabIndex={-1}>
                <svg
                  ref={svgRef}
                  viewBox="0 0 400 300"
                  role="group"
                  aria-label={`${SCENES[scene].n}. ${N ? `Ahí está ${N}` : 'Ahí estás tú'}, en una ola de pánico.`}
                >
                  <g aria-hidden="true">{SCENE_ART[scene]}</g>
                  <g className={`da-roots${g.roots ? ' da-grow' : ''}`} aria-hidden="true">
                    {ROOTS.map((d) => (
                      <path key={d} pathLength={1} d={d} />
                    ))}
                    <ellipse className="da-leaf" cx="175" cy="263" rx="5" ry="2.4" transform="rotate(-30 175 263)" />
                    <ellipse className="da-leaf" cx="225" cy="263" rx="5" ry="2.4" transform="rotate(30 225 263)" />
                  </g>
                  <g ref={avRef} transform="translate(200 0)" aria-hidden="true">
                    <Avatar yo={yo} sfx="s" />
                  </g>
                  <g ref={puffsRef} aria-hidden="true" />
                  <g aria-hidden="true">
                    <rect
                      x="12"
                      y="246"
                      width="66"
                      height="48"
                      rx="11"
                      style={{ fill: 'var(--surface)', stroke: 'var(--border)' }}
                      strokeDasharray="4 3"
                      opacity=".92"
                    />
                    <text x="45" y="290" fontSize="8.5" textAnchor="middle" style={{ fill: 'var(--text-2)' }} fontFamily="Inter,system-ui,sans-serif">
                      agua fría
                    </text>
                  </g>
                  <g
                    ref={glassRef}
                    className={`da-glass${held ? ' da-held' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={held ? `Agua fría, ya en ${sus()} manos` : `Agua fría. Arrástrala hasta ${sus()} manos, o presiona Enter para dársela.`}
                    onPointerDown={glassDown}
                    onPointerMove={glassMove}
                    onPointerUp={glassDrop}
                    onPointerCancel={glassDrop}
                    onKeyDown={(e) => onEnter(e, give)}
                  >
                    <rect className="da-ring" x="-19" y="-20" width="38" height="40" rx="9" />
                    <path d="M-9 -13 L9 -13 L7 13 L-7 13Z" style={{ fill: 'var(--da-glass)', stroke: 'var(--da-line)' }} strokeWidth=".9" />
                    <path d="M-8.2 -4 L8.2 -4 L7 13 L-7 13Z" fill="#8ecae6" opacity=".9" />
                    <rect x="-5.5" y="-8" width="6" height="6" rx="1.5" fill="#fff" opacity=".95" transform="rotate(12 -2.5 -5)" />
                    <rect x="1" y="-3.5" width="5.5" height="5.5" rx="1.5" fill="#fff" opacity=".85" transform="rotate(-10 3.7 -.7)" />
                    <path d="M-5.6 -10.5 L-4.6 10" stroke="#fff" strokeWidth="1.3" opacity=".65" />
                  </g>
                  <g ref={handsRef} transform="translate(200 0)" aria-hidden="true">
                    <Hands yo={yo} />
                  </g>
                  <g
                    className="da-feet"
                    role="button"
                    tabIndex={0}
                    aria-label={`${N ? `Los pies de ${N}` : 'Tus pies'}: toca para sentir el piso`}
                    transform="translate(200 0)"
                    onClick={feet}
                    onKeyDown={(e) => onEnter(e, feet)}
                  >
                    <rect className="da-ring" x="-28" y="255" width="56" height="21" rx="10" />
                  </g>
                  <g>
                    {CRITS.map((c, i) => (
                      <g
                        key={c.id}
                        ref={(el) => {
                          critRefs.current[i] = el
                        }}
                        className={`da-crit${g.crit[i].pop ? ' da-pop' : ''}${g.crit[i].shown ? '' : ' da-off'}`}
                        role="button"
                        tabIndex={0}
                        aria-label={g.crit[i].asleep ? `${c.n}, ya dormidito. Toca para leer otra vez qué es.` : `${c.n}. Toca para saber qué es.`}
                        transform={`translate(${c.x} ${c.y}) scale(1.12)`}
                        onClick={() => tapCrit(i)}
                        onKeyDown={(e) => onEnter(e, () => tapCrit(i))}
                      >
                        <g className="da-popw">
                          <circle className="da-ring" r="18" />
                          <g data-c="body">
                            <CritBody id={c.id} />
                          </g>
                          <text data-c="z" x="9" y="-12" fontSize="9" fontWeight="700" style={{ fill: 'var(--text-2)' }} opacity="0" fontFamily="Inter,system-ui,sans-serif">
                            z
                          </text>
                        </g>
                      </g>
                    ))}
                  </g>
                  <g>
                    {g.rings !== 'none' &&
                      SEEK[scene].map((o, k) => {
                        const found = g.found.includes(k)
                        return (
                          <circle
                            key={o[0]}
                            className={`da-seekring${found ? ' da-found' : ''}${g.rings === 'gone' || (g.rings === 'found' && !found) ? ' da-off' : ''}`}
                            role="button"
                            tabIndex={0}
                            aria-label={found ? `Ya lo viste: ${o[1]}` : `Lo veo: ${o[1]}`}
                            cx={o[2]}
                            cy={o[3]}
                            r={o[4]}
                            onClick={() => findObj(k)}
                            onKeyDown={(e) => onEnter(e, () => findObj(k))}
                          />
                        )
                      })}
                  </g>
                  <g ref={sparksRef} aria-hidden="true" />
                  <g aria-hidden="true" transform="translate(310 250)">
                    <rect width="82" height="42" rx="10" style={{ fill: 'var(--surface)', stroke: 'var(--border)' }} opacity=".94" />
                    <text x="75" y="12.5" fontSize="7.5" textAnchor="end" style={{ fill: 'var(--muted)' }} fontFamily="Inter,system-ui,sans-serif">
                      la ola
                    </text>
                    <path ref={mfillRef} style={{ fill: 'color-mix(in srgb, var(--tone-animo) 30%, transparent)' }} />
                    <path ref={mlineRef} fill="none" style={{ stroke: 'var(--tone-animo)' }} strokeWidth="2" strokeLinejoin="round" />
                    <circle ref={mdotRef} r="4.2" style={{ fill: 'var(--accent)', stroke: 'var(--surface)' }} strokeWidth="1.6" />
                  </g>
                </svg>
                <div ref={ovRef} className={`da-ov${small ? ' da-sm' : ''}`}>
                  {g.fears.map((f, i) =>
                    f.state === 'dark' || f.state === 'light' ? (
                      <div
                        key={i}
                        ref={(el) => {
                          bubRefs.current[i] = el
                        }}
                        className={`da-bub${f.pop ? ' da-in' : ''}${f.lt ? ' da-lt' : ''}${f.away ? ' da-away' : ''}`}
                      >
                        <button
                          type="button"
                          className={`da-bubin${f.lt ? ' da-light' : ''}${f.flip ? ' da-flip' : ''}`}
                          disabled={f.state !== 'dark'}
                          aria-label={f.state === 'dark' ? `Un ¿y si…?: ${FEARS[i].q}. Toca para contestarle.` : undefined}
                          onClick={() => openFear(i)}
                        >
                          {f.text}
                        </button>
                      </div>
                    ) : null,
                  )}
                  {g.found.map((k, j) => (
                    <div
                      key={k}
                      ref={(el) => {
                        lblRefs.current[j] = el
                      }}
                      className={`da-lbl${g.labelsGone ? ' da-gone' : ''}`}
                      aria-hidden="true"
                    >
                      {SEEK[scene][k][1]}
                    </div>
                  ))}
                </div>
              </div>

              <div className="da-side">
                <div ref={sayRef} className="da-say">
                  <PetSays mood={g.ended ? 'feliz' : 'calma'} compact>
                    <p aria-live="polite">{g.say}</p>
                  </PetSays>
                </div>
                <div ref={panelRef} className="da-panel">
                  {panel()}
                </div>
                {!g.ended && (
                  <div className="da-acts">
                    <button
                      ref={breathRef}
                      type="button"
                      className="btn ghost da-breath"
                      aria-describedby={`${ids}-guide`}
                      onPointerDown={(e) => {
                        if (e.button > 0) return
                        e.preventDefault()
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId)
                        } catch {
                          // Sin captura, soltar fuera del botón también suelta el aire.
                        }
                        breathIn()
                      }}
                      onPointerUp={breathOut}
                      onPointerCancel={breathOut}
                      onLostPointerCapture={breathOut}
                      onKeyDown={(e) => {
                        if (e.key !== ' ' && e.key !== 'Enter') return
                        e.preventDefault()
                        if (!e.repeat) breathIn()
                      }}
                      onKeyUp={(e) => {
                        if (e.key !== ' ' && e.key !== 'Enter') return
                        e.preventDefault()
                        breathOut()
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <i aria-hidden="true" />
                      <span>{breathLabel()}</span>
                      <small>Déjalo presionado</small>
                    </button>
                    <p className="da-guide" id={`${ids}-guide`} aria-live="polite">
                      {g.guide}
                    </p>
                    <div className="da-row">
                      <button type="button" className="btn small ghost" disabled={held} onClick={give}>
                        {held ? (N ? 'Ya tiene el vaso' : 'Ya tienes el vaso') : 'Darle el vaso'}
                      </button>
                      <button type="button" className="btn small ghost" disabled={g.found.length >= 5} onClick={feet}>
                        {!g.roots
                          ? 'Los pies en el suelo'
                          : g.found.length >= 5
                            ? N
                              ? 'Ya sintió el piso'
                              : 'Ya sentiste el piso'
                            : 'Encuentra 5 cosas'}
                      </button>
                    </div>
                    <p className="muted small">Puedes hacer todo, algo o nada: la ola baja de todos modos.</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {help && (
          <div className="da-help" onKeyDown={(e) => e.key === 'Escape' && helpClose()}>
            <div className="da-card" role="dialog" aria-modal="true" aria-labelledby={`${ids}-help`}>
              <h3 id={`${ids}-help`} tabIndex={-1} data-focus="help">
                Primero tú
              </h3>
              <p>Si te está pasando de verdad ahora, deja el juego. No tienes que pasarlo a solas.</p>
              <div className="da-row">
                <Link to="/ayuda" className="btn danger">
                  Hablar con alguien ahora
                </Link>
                <Link to="/panico" className="btn">
                  Abrir la guía de pánico
                </Link>
              </div>
              <button type="button" className="btn small ghost" onClick={helpClose}>
                Volver al juego
              </button>
            </div>
          </div>
        )}

        <p className="visually-hidden" aria-live="polite">
          {sr}
        </p>
      </section>

      <section className="card da-why">
        <h2>Por qué funciona</h2>
        <p className="muted small">
          Mirarte desde afuera y hablarte con tu nombre, como le hablas a alguien que quieres, ayuda a bajarle el volumen a lo
          que sientes. Y aquí aprendes con la experiencia lo que dice la guía de pánico: la ola sube, llega a lo más alto y
          baja sola, aunque no hagas nada.
        </p>
        <p className="muted small">
          Es práctica para momentos tranquilos, no un tratamiento. En una crisis de verdad, usa la{' '}
          <Link to="/panico">guía de pánico</Link>. Si el dolor en el pecho es nuevo o distinto, primero el médico.
        </p>
      </section>
    </div>
  )
}
