import { Suspense, useEffect, useRef } from 'react'
import { Compass, House, LifeBuoy, NotebookPen, Puzzle, Sprout, Wind } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import FloatingPet from './FloatingPet'
import UpdatePrompt from './UpdatePrompt'
import { prepareGift } from '../lib/gifts'
import { MOMENT_SOURCES, syncMoments } from '../lib/moments'
import { SECTIONS, rememberStep } from '../lib/sections'
import { onStoredChange } from '../lib/storage'

const ICONS = { '/': House, '/calma': Wind, '/explorar': Compass, '/distraer': Puzzle, '/diario': NotebookPen, '/mi-espacio': Sprout }

export default function Layout() {
  const { pathname, search } = useLocation()
  const topbar = useRef<HTMLElement>(null)

  useEffect(() => {
    rememberStep(pathname + search)
  }, [pathname, search])

  // Lo que la persona vive con su mascota y el regalo del día se revisan al abrir la app, al
  // volver a ella y cada vez que cambia algo que pueda traer un momento nuevo.
  useEffect(() => {
    const check = () => {
      void syncMoments()
      void prepareGift()
    }
    const back = () => document.visibilityState === 'visible' && check()
    check()
    const stop = onStoredChange((key) => (MOMENT_SOURCES.has(key) || key === 'moods') && check())
    document.addEventListener('visibilitychange', back)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', back)
    }
  }, [])

  // Lo que se queda pegado arriba (como la mascota mientras se arregla) se acomoda
  // justo debajo de esta barra, que flota un poco despegada de la orilla en cada teléfono.
  useEffect(() => {
    const bar = topbar.current
    if (!bar) return
    const observer = new ResizeObserver(() => {
      const top = parseFloat(getComputedStyle(bar).top) || 0
      document.documentElement.style.setProperty('--topbar-h', `${bar.offsetHeight + top}px`)
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app">
      <header className="topbar vidrio" ref={topbar}>
        <Link to="/" className="brand" aria-label="Ir al inicio">
          <img src="/logo.svg" alt="" width={32} height={32} />
          <span>Salvando Vidas</span>
        </Link>
        {pathname !== '/ayuda' && (
          <Link to="/ayuda" className="sos">
            <LifeBuoy size={18} strokeWidth={2} aria-hidden="true" />
            Necesito ayuda
          </Link>
        )}
      </header>

      <main className="content">
        <Suspense fallback={<p className="muted page-loading">Cargando…</p>}>
          <Outlet />
        </Suspense>
      </main>

      <nav className="tabbar vidrio" aria-label="Secciones">
        {SECTIONS.map(({ to, label, also }) => {
          const Icon = ICONS[to]
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `tab${isActive || also.some((p) => pathname.startsWith(p)) ? ' active' : ''}`
              }
            >
              <span className="tab-icon" aria-hidden="true">
                <Icon size={24} strokeWidth={2} />
              </span>
              <span className="tab-label">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      <FloatingPet />
      <UpdatePrompt />
    </div>
  )
}
