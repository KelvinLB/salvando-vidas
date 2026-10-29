import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CompanionView from './Companion'
import { PET_PHRASES, companionName } from '../data/companion'
import { useCompanion } from '../lib/companion'
import { useGift } from '../lib/gifts'
import { markMoment } from '../lib/moments'
import { hop, petSound, useBursts } from '../lib/petfx'
import { buzz, pick, useStored } from '../lib/storage'

// La mascota vive en toda la app, flotando en una orilla como las mascotas de escritorio:
// te sigue con la mirada, se arrastra a donde estorbe menos y, al tocarla, ofrece cosas
// pequeñas para hacer juntos. En las pantallas de crisis no sale, para no distraer; tampoco en
// Ajustes, donde taparía los interruptores (entre ellos el que la apaga), ni en Salir del
// hueco, donde ya está dentro del juego.

const SIZE = 68
const GAP = 10
const PEEK = 26
const NOT_ON = ['/mascota', '/panico', '/ayuda', '/mi-espacio/ajustes', '/juegos/hueco', '/barrio', '/juegos/hilos']

/** De qué lado vive y a qué altura, como fracción del alto de la pantalla. */
type Spot = { side: 'left' | 'right'; y: number }
type Point = { x: number; y: number }

// Lo que dice al llegar a cada sección, una sola vez por visita a la app.
const ARRIVALS: Record<string, string> = {
  '/calma': 'Respira conmigo cuando quieras',
  '/distraer': '¿Jugamos algo?',
  '/diario': 'Aquí te escucho, sin juzgarte',
  '/mi-espacio': 'Este es tu lugar',
  '/cuerpo': 'Toca donde lo sientes',
  '/noche': 'Aquí te acompaño esta noche',
  '/mi-dia': 'Un pasito a la vez',
}
const greeted = new Set<string>()
/** Si trae un regalo, lo cuenta una vez; lo que trae se ve solo en su pantalla. */
let toldGift = false

// Respirar juntos: 4 segundos para tomar aire y 6 para soltarlo, tres veces.
const BREATHS = 3
const IN_MS = 4000
const OUT_MS = 6000

const CATCHES = 3
const GAME_MS = 15000

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** El espacio libre entre la barra de arriba y la de abajo. */
function bounds() {
  const top = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 60
  const bottom = document.querySelector('.tabbar')?.getBoundingClientRect().top ?? innerHeight - 70
  return { minX: GAP, maxX: innerWidth - SIZE - GAP, minY: top + GAP, maxY: bottom - SIZE - GAP }
}

export default function FloatingPet() {
  const { companion, mood } = useCompanion()
  const [on] = useStored('mascota-flotante', true)
  const [spot, setSpot] = useStored<Spot>('mascota-lugar', { side: 'right', y: 0.7 })
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [, setViewport] = useState(0)
  const [menu, setMenu] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [line, setLine] = useState('')
  const [breathing, setBreathing] = useState(false)
  const [game, setGame] = useState<(Point & { caught: number }) | null>(null)
  const [drag, setDrag] = useState<Point | null>(null)
  const [gaze, setGaze] = useState<Point>({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)
  const self = useRef<HTMLButtonElement>(null)
  const figure = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const press = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)
  const dragged = useRef(false)
  const bursts = useBursts()
  const { waiting } = useGift()

  const shown = !!companion && on && !NOT_ON.includes(pathname)
  const name = companion ? companionName(companion) : ''

  const b = bounds()
  const home: Point = {
    x: hidden ? (spot.side === 'left' ? PEEK - SIZE : innerWidth - PEEK) : spot.side === 'left' ? b.minX : b.maxX,
    y: clamp(spot.y * innerHeight, b.minY, Math.max(b.minY, b.maxY)),
  }
  const at = drag ?? game ?? home
  const where = useRef(at)
  where.current = at

  const say = (text: string) => setLine(text)

  // La pantalla cambia de tamaño (al girar el teléfono): se vuelve a acomodar.
  useEffect(() => {
    const fit = () => setViewport((n) => n + 1)
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [])

  // Te sigue con la mirada: mira hacia donde está tu dedo o el puntero, y si dejas de
  // moverte un rato, vuelve a verte de frente.
  useEffect(() => {
    if (!shown) return
    let frame = 0
    let rest = 0
    const follow = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const c = where.current
        const dx = e.clientX - (c.x + SIZE / 2)
        const dy = e.clientY - (c.y + SIZE / 2)
        setGaze({ x: clamp(dx / 160, -1, 1), y: clamp(dy / 160, -1, 1) })
      })
      clearTimeout(rest)
      rest = window.setTimeout(() => setGaze({ x: 0, y: 0 }), 2500)
    }
    addEventListener('pointermove', follow)
    addEventListener('pointerdown', follow)
    return () => {
      removeEventListener('pointermove', follow)
      removeEventListener('pointerdown', follow)
      cancelAnimationFrame(frame)
      clearTimeout(rest)
    }
  }, [shown])

  // Parpadea cada tantos segundos, sin ritmo fijo, como cualquiera.
  useEffect(() => {
    if (!shown) return
    let timer = 0
    const next = () => {
      timer = window.setTimeout(() => {
        setBlink(true)
        timer = window.setTimeout(() => {
          setBlink(false)
          next()
        }, 140)
      }, 2500 + Math.random() * 3500)
    }
    next()
    return () => clearTimeout(timer)
  }, [shown])

  // Al llegar a una sección, la saluda una vez. Si trajo un regalo, primero avisa eso.
  useEffect(() => {
    const root = '/' + pathname.split('/')[1]
    const text = ARRIVALS[root]
    setMenu(false)
    if (!shown || hidden) return
    if (waiting && !toldGift) {
      toldGift = true
      const timer = setTimeout(() => say('Te traje algo 🎁 Tócame'), 700)
      return () => clearTimeout(timer)
    }
    if (!text || greeted.has(root)) return
    greeted.add(root)
    const timer = setTimeout(() => say(text), 700)
    return () => clearTimeout(timer)
  }, [pathname, shown, hidden, waiting])

  // Lo que dice se queda unos segundos y se va (mientras respiran, lo lleva la respiración).
  useEffect(() => {
    if (!line || breathing) return
    const timer = setTimeout(() => setLine(''), 3200)
    return () => clearTimeout(timer)
  }, [line, breathing])

  // Respirar juntos: la mascota se infla al tomar aire y se desinfla al soltarlo.
  useEffect(() => {
    if (!breathing) return
    const cycle = IN_MS + OUT_MS
    const timers = Array.from({ length: BREATHS }, (_, i) => [
      setTimeout(() => say('Toma aire…'), i * cycle),
      setTimeout(() => say('Suéltalo despacio…'), i * cycle + IN_MS),
    ]).flat()
    timers.push(
      setTimeout(() => {
        setBreathing(false)
        say('Bien hecho. Aquí sigo')
        buzz(20)
        markMoment('respirar')
      }, BREATHS * cycle),
    )
    return () => timers.forEach(clearTimeout)
  }, [breathing])

  // Atrápame: brinca a otro lugar cada poco; no hay forma de perder.
  useEffect(() => {
    if (!game) return
    const move = setInterval(() => {
      const z = bounds()
      setGame((g) => g && { ...g, x: z.minX + Math.random() * (z.maxX - z.minX), y: z.minY + Math.random() * (z.maxY - z.minY) })
    }, 1300)
    const end = setTimeout(() => {
      setGame(null)
      say('Ya me cansé. ¡Gracias por jugar!')
    }, GAME_MS)
    return () => {
      clearInterval(move)
      clearTimeout(end)
    }
  }, [!!game])

  // El menú se cierra al tocar fuera o con Escape, y el foco vuelve a la mascota.
  useEffect(() => {
    if (!menu) return
    menuRef.current?.querySelector('button')?.focus()
    const outside = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !self.current?.contains(t)) setMenu(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenu(false)
      self.current?.focus()
    }
    addEventListener('pointerdown', outside)
    addEventListener('keydown', escape)
    return () => {
      removeEventListener('pointerdown', outside)
      removeEventListener('keydown', escape)
    }
  }, [menu])

  if (!shown || !companion) return null

  const tap = () => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    hop(figure.current)
    if (hidden) {
      setHidden(false)
      say('¡Aquí estoy!')
      return
    }
    if (game) {
      bursts.add('⭐')
      buzz(15)
      if (game.caught + 1 >= CATCHES) {
        setGame(null)
        say('¡Me atrapaste! 🎉')
      } else {
        setGame({ ...game, caught: game.caught + 1 })
        say(game.caught + 1 === CATCHES - 1 ? '¡Una más!' : '¡Casi!')
      }
      return
    }
    if (breathing) {
      setBreathing(false)
      say('Paramos aquí. Cuando quieras, otra vez')
      return
    }
    setMenu((m) => !m)
  }

  const act = (fn: () => void) => () => {
    setMenu(false)
    fn()
  }
  const actions = [
    ...(waiting ? [{ label: 'Ver lo que te traje', emoji: '🎁', run: () => navigate('/mascota') }] : []),
    {
      label: 'Hacerle cariño',
      emoji: '💗',
      run: () => {
        hop(figure.current)
        bursts.add('💗')
        say(pick(PET_PHRASES))
        petSound(companion.species)
      },
    },
    { label: 'Respirar juntos', emoji: '🌬️', run: () => setBreathing(true) },
    {
      label: 'Jugar a atraparme',
      emoji: '⭐',
      run: () => {
        setGame({ ...where.current, caught: 0 })
        say('¡Atrápame!')
      },
    },
    { label: `Ir con ${name}`, emoji: '🏡', run: () => navigate('/mascota') },
    {
      label: 'Escóndete un rato',
      emoji: '🙈',
      run: () => {
        setLine('')
        setHidden(true)
      },
    },
  ]

  // Arrastrarla: si el dedo se mueve más de unos pixeles, ya no es un toque.
  const down = (e: ReactPointerEvent) => {
    dragged.current = false
    if (game || breathing) return
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
  }
  const move = (e: ReactPointerEvent) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) return
    if (!p.moved) {
      p.moved = true
      self.current?.setPointerCapture(e.pointerId)
      setMenu(false)
      setLine('')
    }
    setDrag({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 })
  }
  const up = (e: ReactPointerEvent) => {
    const p = press.current
    press.current = null
    if (!p?.moved) return
    dragged.current = true
    const z = bounds()
    setHidden(false)
    setSpot({ side: e.clientX < innerWidth / 2 ? 'left' : 'right', y: clamp(e.clientY - SIZE / 2, z.minY, z.maxY) / innerHeight })
    setDrag(null)
    buzz(8)
  }

  const left = at.x + SIZE / 2 < innerWidth / 2
  // Si está muy arriba, el menú y lo que dice salen hacia abajo.
  const high = at.y < 300

  return (
    <div
      className={`pet-float ${left ? 'on-left' : 'on-right'} ${high ? 'high' : ''} ${drag ? 'dragging' : ''} ${game ? 'playing' : ''}`}
      style={{ transform: `translate3d(${Math.round(at.x)}px, ${Math.round(at.y)}px, 0)` }}
    >
      {menu && (
        <div className="pet-menu" id="pet-menu" ref={menuRef} role="group" aria-label={`Qué hacer con ${name}`}>
          <strong>{name}</strong>
          {actions.map((a) => (
            <button key={a.label} type="button" onClick={act(a.run)}>
              <span aria-hidden="true">{a.emoji}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
      <p className={`pet-say ${line && !menu ? '' : 'quiet'}`} aria-live="polite">
        {menu ? '' : line}
      </p>
      <button
        ref={self}
        type="button"
        className={`pet-self ${hidden ? 'peeking' : ''}`}
        aria-label={
          hidden
            ? `${name} se escondió. Tócala para que regrese`
            : game
              ? `Atrapar a ${name}`
              : `Tu mascota, ${name}: tócala para hacer algo juntos o arrástrala para moverla`
        }
        aria-controls={menu ? 'pet-menu' : undefined}
        aria-expanded={hidden || game ? undefined : menu}
        onClick={tap}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          press.current = null
          setDrag(null)
        }}
      >
        <div className={`pet-bob ${breathing ? 'pet-breath' : ''}`}>
          <div ref={figure}>
            <CompanionView look={companion} mood={breathing ? 'calma' : mood} size={SIZE} gaze={gaze} blink={blink} />
          </div>
        </div>
        {bursts.view}
      </button>
    </div>
  )
}
