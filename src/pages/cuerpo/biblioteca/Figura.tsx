import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Objeto } from '../../../data/biblioteca'

// Los objetos que funcionan de la Biblioteca. Hay siete, y cada ficha elige uno y le pone sus
// palabras: la alarma que se dispara con poco, la radio que se vuelve a subir, la luz que sube de a
// poquito, la cerradura que pide revisarse, la ola de ganas que pasa sola, la marea de temporadas y
// el ecualizador de canales. Se mueven solo con lo que la persona hace o con el tiempo que pasa:
// nada parpadea ni late, y no hay puntos ni forma de perder.

/** Un paso de simulación por cuadro, con el tiempo transcurrido en segundos. */
function useCuadro(paso: (dt: number) => void) {
  const ref = useRef(paso)
  useEffect(() => {
    ref.current = paso
  })
  useEffect(() => {
    let id = 0
    let antes = performance.now()
    const cuadro = (t: number) => {
      const dt = Math.min(0.1, (t - antes) / 1000)
      antes = t
      ref.current(dt)
      id = requestAnimationFrame(cuadro)
    }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [])
}

/** El estado de una simulación: vive en un ref y solo se vuelve a pintar cuando cambia lo que se ve. */
function useSim<T extends object>(inicial: T, foto: (s: T) => string) {
  const sim = useRef(inicial)
  const [, setVer] = useState('')
  const pintar = () => setVer(foto(sim.current))
  return [sim.current, pintar] as const
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const pct = (v: number) => `${Math.round(v)} %`

function Escena({ pista, lectura, children }: { pista: string; lectura: ReactNode; children: ReactNode }) {
  return (
    <div className="bib-escena">
      <p className="bib-pista">{pista}</p>
      <svg className="bib-dibujo" viewBox="0 0 500 300" aria-hidden="true">
        {children}
      </svg>
      <p className="bib-lectura">{lectura}</p>
    </div>
  )
}

const L = ({ k, v }: { k: string; v: ReactNode }) => (
  <span>
    {k} <b>{v}</b>
  </span>
)

// Colores fijos del escenario (oscuro en los dos temas, como el cuerpo de vidrio).
const VIDRIO = '#8fd6cb'
const FONDO = '#0f1c1b'
const PIEZA = '#173130'
const ALARMA = '#ff7a45'
const FRENO = '#4fe39a'
const LUZ = '#fff1d6'
const MORADO = '#b99cff'

/* ---------- La alarma ---------- */
function Alarma({ o, pista }: { o: Extract<Objeto, { tipo: 'alarma' }>; pista: string }) {
  const [sens, setSens] = useState(9)
  const [s, pintar] = useSim({ chispa: 0, alarma: 0, min: 0, calma: 0, activo: false, aviso: '' }, (s) =>
    [Math.round(s.chispa * 100), Math.round(s.alarma * 100), Math.floor(s.min), s.calma > 0, s.aviso].join(),
  )
  useCuadro((dt) => {
    s.chispa = Math.max(0, s.chispa - dt * 0.02)
    const meta = clamp(s.chispa * sens * 0.75, 0, 1)
    // Sube rápido; sola se apaga en unos diez minutos (aquí, un segundo son 30), y con calma un poco antes.
    if (meta > s.alarma) s.alarma += (meta - s.alarma) * Math.min(1, dt * 3)
    else s.alarma = Math.max(0, s.alarma - dt * (s.calma > 0 ? 0.075 : 0.05))
    s.calma = Math.max(0, s.calma - dt)
    if (s.activo) {
      s.min += dt * 0.5
      if (s.alarma < 0.02 && s.chispa < 0.01) {
        s.activo = false
        s.aviso = `se apagó sola en ${Math.max(1, Math.round(s.min))} min`
      }
    }
    pintar()
  })
  const a = s.alarma
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k="chispa" v={pct(s.chispa * 100)} />
            <L k={o.medida} v={pct(a * 100)} />
            <L k="latido" v={`${Math.round(72 + a * 58)} lpm`} />
            <span>{s.activo ? `minuto ${Math.floor(s.min) + 1}` : s.aviso}</span>
          </>
        }
      >
        <line x1="40" y1="40" x2="460" y2="40" stroke={VIDRIO} strokeOpacity="0.35" strokeWidth="2" />
        <g fill="none" stroke={ALARMA} strokeWidth="3" strokeLinecap="round" opacity={a}>
          <path d="M200 86 Q190 106 200 126" />
          <path d="M180 74 Q164 106 180 138" />
          <path d="M160 62 Q138 106 160 150" />
          <path d="M300 86 Q310 106 300 126" />
          <path d="M320 74 Q336 106 320 138" />
          <path d="M340 62 Q362 106 340 150" />
        </g>
        <ellipse cx="250" cy="62" rx="52" ry="16" fill={FONDO} stroke={VIDRIO} strokeWidth="2" />
        <path d="M198 62 L202 98 Q250 118 298 98 L302 62" fill={PIEZA} stroke={VIDRIO} strokeWidth="2" />
        <circle cx="250" cy="86" r="6" fill={a > 0.15 ? ALARMA : FRENO} />
        {/* La chispa: algo pequeño (un pan, un recuerdo, una sensación) que hace sonar todo. */}
        <g opacity={0.25 + clamp(s.chispa / 0.1, 0, 1) * 0.75}>
          <path d="M250 196 Q270 222 262 246 Q250 262 238 246 Q230 222 250 196 Z" fill={ALARMA} fillOpacity="0.8" />
          <path d="M250 222 Q258 236 252 248 Q246 252 244 244 Q242 234 250 222 Z" fill={LUZ} />
        </g>
        <rect x="170" y="258" width="160" height="10" rx="5" fill={PIEZA} stroke={VIDRIO} strokeOpacity="0.5" />
      </Escena>
      <div className="bib-controles">
        <button
          type="button"
          className="btn small"
          onClick={() => {
            Object.assign(s, { chispa: 0.15, min: 0, activo: true, aviso: '' })
          }}
        >
          {o.disparo}
        </button>
        <button type="button" className="btn ghost small" disabled={a < 0.15} onClick={() => (s.calma = 6)}>
          {s.calma > 0 ? `${o.calma}…` : o.calma}
        </button>
        <label className="bib-rango">
          Sensibilidad
          <input type="range" min={1} max={10} value={sens} onChange={(e) => setSens(+e.target.value)} />
        </label>
      </div>
    </>
  )
}

/* ---------- La radio ---------- */
const efecto = (v: number) => (v > 6 ? 'pesado' : v > 3 ? 'a medias' : 'más ligero')

function Radio({ o, pista }: { o: Extract<Objeto, { tipo: 'radio' }>; pista: string }) {
  const [vol, setVol] = useState(8)
  const [plan, setPlan] = useState(false)
  const tiempo = useRef(0)
  const tocando = useRef(false)
  useCuadro((dt) => {
    // Sin estrategia, bajarle a mano dura poco: se vuelve a subir sola. Con ella, se queda bajita.
    tiempo.current += dt
    if (plan && tiempo.current > 0.6 && vol > 2) {
      tiempo.current = 0
      setVol((v) => v - 1)
    } else if (!plan && !tocando.current && tiempo.current > 2.5 && vol < 8) {
      tiempo.current = 0
      setVol((v) => v + 1)
    }
  })
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k={o.medida} v={`${vol}/10`} />
            {o.efectos.map((e) => (
              <L key={e} k={e} v={efecto(vol)} />
            ))}
          </>
        }
      >
        <g opacity={plan ? 1 : 0.25}>
          <circle cx="400" cy="70" r="30" fill={FONDO} stroke={VIDRIO} strokeWidth="2" />
          <line x1="400" y1="70" x2="400" y2="50" stroke={LUZ} strokeWidth="3" strokeLinecap="round" />
          <line x1="400" y1="70" x2="414" y2="78" stroke={LUZ} strokeWidth="3" strokeLinecap="round" />
        </g>
        <g fill="none" stroke={ALARMA} strokeWidth="3" strokeLinecap="round" opacity={vol / 10}>
          <path d="M110 110 Q96 146 110 182" />
          <path d="M88 96 Q66 146 88 196" />
          <path d="M66 82 Q36 146 66 210" />
        </g>
        <rect x="130" y="90" width="240" height="160" rx="22" fill={PIEZA} stroke={VIDRIO} strokeWidth="2" />
        <rect x="150" y="108" width="200" height="38" rx="8" fill={FONDO} stroke={VIDRIO} strokeOpacity="0.6" />
        <line x1="214" y1="112" x2="214" y2="142" stroke={ALARMA} strokeWidth="3" />
        <circle cx="190" cy="200" r="32" fill={FONDO} stroke={VIDRIO} strokeOpacity="0.5" />
        <g transform={`rotate(${-135 + vol * 27} 310 200)`}>
          <circle cx="310" cy="200" r="28" fill={FONDO} stroke={VIDRIO} strokeWidth="2" />
          <line x1="310" y1="200" x2="310" y2="178" stroke={LUZ} strokeWidth="4" strokeLinecap="round" />
        </g>
      </Escena>
      <div className="bib-controles">
        <label className="bib-rango">
          Volumen
          <input
            type="range"
            min={0}
            max={10}
            value={vol}
            onPointerDown={() => (tocando.current = true)}
            onPointerUp={() => (tocando.current = false)}
            onBlur={() => (tocando.current = false)}
            onChange={(e) => {
              tiempo.current = 0
              setVol(+e.target.value)
            }}
          />
        </label>
        <button type="button" className="btn small" aria-pressed={plan} onClick={() => setPlan((p) => !p)}>
          {plan ? 'Quitar la estrategia' : o.estrategia}
        </button>
      </div>
    </>
  )
}

/* ---------- La luz ---------- */
const energia = (l: number) => (l < 30 ? 'muy baja' : l < 50 ? 'baja' : l < 70 ? 'regresando' : 'más estable')

function Luz({ o, pista }: { o: Extract<Objeto, { tipo: 'luz' }>; pista: string }) {
  const [luz, setLuz] = useState(20)
  const [ultimo, setUltimo] = useState<string | null>(null)
  const espera = useRef(0)
  useCuadro((dt) => {
    // A veces baja sola, un poquito, aunque hayas hecho todo bien.
    espera.current += dt
    if (espera.current > 4 && luz > 15) {
      espera.current = 0
      setLuz((l) => l - 1)
    }
  })
  const l = luz / 100
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k={o.medida} v={pct(luz)} />
            <L k="energía" v={energia(luz)} />
            <span>{ultimo ? `lo último: ${ultimo.toLowerCase()}` : 'lo último: nada todavía'}</span>
          </>
        }
      >
        <defs>
          <radialGradient id="bib-cono" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor={LUZ} stopOpacity="0.85" />
            <stop offset="1" stopColor={LUZ} stopOpacity="0" />
          </radialGradient>
        </defs>
        <line x1="200" y1="0" x2="200" y2="60" stroke={VIDRIO} strokeWidth="2" />
        <path d="M150 110 L60 290 L340 290 L250 110 Z" fill="url(#bib-cono)" opacity={0.1 + l * 0.9} />
        <path d="M150 110 Q150 62 200 60 Q250 62 250 110 Z" fill={PIEZA} stroke={VIDRIO} strokeWidth="2" />
        <circle cx="200" cy="116" r="15" fill={LUZ} opacity={0.2 + l * 0.8} />
        <rect x="200" y="262" width="90" height="12" rx="6" fill={PIEZA} stroke={VIDRIO} strokeOpacity="0.5" />
        <path
          d="M226 262 Q222 236 236 226 M244 262 Q246 242 262 236"
          stroke={FRENO}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity={0.3 + l * 0.7}
        />
        <rect x="380" y="90" width="64" height="150" rx="14" fill={PIEZA} stroke={VIDRIO} strokeWidth="2" />
        <rect x="405" y="108" width="14" height="114" rx="7" fill={FONDO} />
        <rect x="396" y={204 - l * 96} width="32" height="18" rx="6" fill={LUZ} />
      </Escena>
      <div className="bib-controles">
        {o.acciones.map((a, i) => (
          <button
            key={a}
            type="button"
            className="btn ghost small"
            onClick={() => {
              espera.current = 0
              setLuz((v) => Math.min(85, v + 4 + (i % 3)))
              setUltimo(a)
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </>
  )
}

/* ---------- La cerradura ---------- */
function Cerradura({ o, pista }: { o: Extract<Objeto, { tipo: 'cerradura' }>; pista: string }) {
  const [s, pintar] = useSim({ veces: 0, inq: 70, meta: 70, ganas: 40, espera: -1 }, (s) =>
    [s.veces, Math.round(s.inq), Math.round(s.ganas), s.espera < 0 ? -1 : s.espera < 3 ? 0 : 1].join(),
  )
  useCuadro((dt) => {
    if (s.espera >= 0) {
      // Primero sube… y luego baja sola, si no se hace lo que pide.
      s.espera += dt
      s.meta = s.espera < 3 ? 92 : 15
      s.ganas = Math.max(10, s.ganas - dt * 2.5)
      if (s.espera > 12) s.espera = -1
    }
    s.inq += (s.meta - s.inq) * Math.min(1, dt * (s.espera >= 3 ? 0.35 : 1.2))
    pintar()
  })
  const alto = (p: number) => (p / 100) * 196
  const esperando = s.espera >= 0
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k="veces" v={s.veces} />
            <L k={o.medida} v={pct(s.inq)} />
            <L k={o.ganas} v={pct(s.ganas)} />
          </>
        }
      >
        <rect x="160" y="30" width="180" height="250" rx="10" fill={PIEZA} stroke={VIDRIO} strokeWidth="2" />
        <rect x="180" y="50" width="140" height="90" rx="6" fill="none" stroke={VIDRIO} strokeOpacity="0.35" />
        <rect x="180" y="160" width="140" height="100" rx="6" fill="none" stroke={VIDRIO} strokeOpacity="0.35" />
        <rect x="286" y="140" width="36" height="52" rx="8" fill={FONDO} stroke={VIDRIO} strokeWidth="2" />
        <circle cx="304" cy="158" r="6" fill={LUZ} />
        <rect x="301" y="162" width="6" height="16" rx="3" fill={LUZ} />
        <rect x="402" y="40" width="32" height="210" rx="10" fill={FONDO} stroke={VIDRIO} strokeOpacity="0.6" />
        <rect x="406" y={246 - alto(s.inq)} width="24" height={alto(s.inq)} rx="7" fill={ALARMA} />
        <rect x="66" y="40" width="32" height="210" rx="10" fill={FONDO} stroke={VIDRIO} strokeOpacity="0.6" />
        <rect x="70" y={246 - alto(s.ganas)} width="24" height={alto(s.ganas)} rx="7" fill={MORADO} />
      </Escena>
      <div className="bib-leyenda-barras" aria-hidden="true">
        <span>
          <i style={{ background: MORADO }} /> {o.ganas}
        </span>
        <span>
          <i style={{ background: ALARMA }} /> {o.medida}
        </span>
      </div>
      <div className="bib-controles">
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            Object.assign(s, {
              veces: s.veces + 1,
              inq: 25,
              meta: Math.min(95, 70 + (s.veces + 1) * 5),
              ganas: Math.min(100, s.ganas + 12),
              espera: -1,
            })
          }}
        >
          {o.ceder}
        </button>
        <button type="button" className="btn small" disabled={esperando} onClick={() => (s.espera = 0)}>
          {!esperando ? o.esperar : s.espera < 3 ? 'Esperando… sube' : 'Esperando… ya baja'}
        </button>
      </div>
    </>
  )
}

/* ---------- La ola de ganas ---------- */
function Ola({ o, pista }: { o: Extract<Objeto, { tipo: 'ola' }>; pista: string }) {
  // Cada ola de ganas sube, llega a su punto y baja sola. Hacer lo que pide la corta de golpe, pero
  // la siguiente llega más alta; esperarla hace que las que siguen sean más bajas.
  const [s, pintar] = useSim({ ganas: 20, t: -1, pico: 80, fuerza: 1, surfeando: false, cedidas: 0, pasaron: 0, calma: 0 }, (s) =>
    [Math.round(s.ganas), s.t < 0, s.surfeando, s.cedidas, s.pasaron, Math.round(s.pico)].join(),
  )
  useCuadro((dt) => {
    if (s.t < 0) {
      s.calma += dt
      s.ganas += (20 - s.ganas) * Math.min(1, dt)
      if (s.calma > 4) {
        s.t = 0
        s.pico = clamp(80 * s.fuerza, 35, 98)
      }
    } else {
      s.t += dt
      // Sube en unos 3 segundos y baja en unos 7: la forma de una ola.
      const meta = s.t < 3 ? s.pico : 15
      s.ganas += (meta - s.ganas) * Math.min(1, dt * (s.t < 3 ? 1.4 : 0.45))
      if (s.t > 10) {
        if (s.surfeando) {
          s.pasaron += 1
          s.fuerza = Math.max(0.45, s.fuerza - 0.12)
        }
        Object.assign(s, { t: -1, calma: 0, surfeando: false })
      }
    }
    pintar()
  })
  const g = s.ganas / 100
  const amp = 8 + g * 90
  const d = `M20 240 C120 240 150 ${240 - amp} 250 ${240 - amp} S380 240 480 240`
  const proxima = s.fuerza > 1.05 ? 'más alta' : s.fuerza < 0.95 ? 'más baja' : 'igual'
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k={o.medida} v={pct(s.ganas)} />
            <L k="la próxima ola" v={proxima} />
            <span>{s.t < 0 ? 'entre olas' : s.surfeando ? 'esperándola' : 'llegó una ola'}</span>
          </>
        }
      >
        <line x1="20" y1="240" x2="480" y2="240" stroke={VIDRIO} strokeOpacity="0.35" strokeDasharray="6 8" strokeWidth="2" />
        <path d={`${d} L480 280 L20 280 Z`} fill={VIDRIO} fillOpacity="0.12" />
        <path d={d} fill="none" stroke={s.ganas > 60 ? ALARMA : VIDRIO} strokeWidth="4" strokeLinecap="round" />
        <circle cx="250" cy={232 - amp} r="9" fill={s.surfeando ? FRENO : LUZ} />
      </Escena>
      <div className="bib-controles">
        <button
          type="button"
          className="btn ghost small"
          disabled={s.t < 0}
          onClick={() => {
            Object.assign(s, { ganas: 8, t: -1, calma: 0, surfeando: false, cedidas: s.cedidas + 1 })
            s.fuerza = Math.min(1.25, s.fuerza + 0.12)
          }}
        >
          {o.ceder}
        </button>
        <button type="button" className="btn small" disabled={s.t < 0 || s.surfeando} onClick={() => (s.surfeando = true)}>
          {s.surfeando ? 'Esperando a que baje…' : o.surfear}
        </button>
      </div>
    </>
  )
}

/* ---------- La marea ---------- */
function Marea({ o, pista }: { o: Extract<Objeto, { tipo: 'marea' }>; pista: string }) {
  const [anclas, setAnclas] = useState<string[]>([])
  const [s, pintar] = useSim({ fase: 0, amp: 1 }, (s) => [Math.round(s.fase * 40), Math.round(s.amp * 40)].join())
  const meta = 1 - anclas.length * 0.22
  useCuadro((dt) => {
    // Una temporada completa cada 16 segundos; con anclas, las olas se hacen más bajas poco a poco.
    s.fase = (s.fase + dt / 16) % 1
    s.amp += (meta - s.amp) * Math.min(1, dt * 0.6)
    pintar()
  })
  const y = (x: number) => 150 - Math.sin((x / 460) * Math.PI * 4 - s.fase * Math.PI * 2) * 100 * s.amp
  let d = ''
  for (let x = 0; x <= 460; x += 10) d += `${x ? 'L' : 'M'}${20 + x} ${y(x).toFixed(1)}`
  const yo = y(230)
  const donde = yo < 110 ? 'arriba' : yo > 190 ? 'abajo' : 'en medio'
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k={o.medida} v={donde} />
            <L k="olas" v={s.amp > 0.8 ? 'muy altas' : s.amp > 0.5 ? 'medianas' : 'más bajas'} />
          </>
        }
      >
        <rect x="20" y="110" width="460" height="80" rx="10" fill={FRENO} fillOpacity="0.08" />
        <line x1="20" y1="150" x2="480" y2="150" stroke={VIDRIO} strokeOpacity="0.35" strokeDasharray="6 8" strokeWidth="2" />
        <path d={d} fill="none" stroke={VIDRIO} strokeWidth="4" strokeLinecap="round" />
        <line x1="250" y1="30" x2="250" y2="270" stroke={LUZ} strokeOpacity="0.25" strokeWidth="2" />
        <circle cx="250" cy={yo} r="10" fill={yo < 110 || yo > 190 ? ALARMA : LUZ} />
      </Escena>
      <div className="bib-controles" role="group" aria-label="Anclas">
        {o.anclas.map((a) => {
          const on = anclas.includes(a)
          return (
            <button
              key={a}
              type="button"
              className={`btn small${on ? '' : ' ghost'}`}
              aria-pressed={on}
              onClick={() => setAnclas((xs) => (on ? xs.filter((x) => x !== a) : [...xs, a]))}
            >
              {a}
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ---------- El ecualizador ---------- */
function Ecualizador({ o, pista }: { o: Extract<Objeto, { tipo: 'ecualizador' }>; pista: string }) {
  const [apoyos, setApoyos] = useState<string[]>([])
  const nivel = (c: string, i: number) => {
    const base = [88, 74, 92, 80][i % 4]
    const bajas = o.apoyos.filter((a) => apoyos.includes(a.nombre) && a.baja.includes(c)).length
    return Math.max(18, base - bajas * 42)
  }
  const niveles = o.canales.map(nivel)
  const carga = niveles.reduce((a, b) => a + b, 0) / niveles.length
  const ancho = 440 / o.canales.length
  return (
    <>
      <Escena
        pista={pista}
        lectura={
          <>
            <L k={o.medida} v={pct(carga)} />
            <span>{apoyos.length ? `con ${apoyos.length === 1 ? 'un apoyo' : `${apoyos.length} apoyos`}` : 'sin apoyos'}</span>
          </>
        }
      >
        {o.canales.map((c, i) => {
          const h = (niveles[i] / 100) * 190
          const x = 30 + i * ancho + ancho / 2
          return (
            <g key={c}>
              <rect x={x - 18} y="40" width="36" height="196" rx="10" fill={FONDO} stroke={VIDRIO} strokeOpacity="0.6" />
              <rect
                className="bib-barra"
                x={x - 14}
                y={232 - h}
                width="28"
                height={h}
                rx="7"
                fill={niveles[i] > 60 ? ALARMA : FRENO}
              />
              <text x={x} y="262" textAnchor="middle" fill="#b9cec7" fontSize="15" fontFamily="inherit">
                {c.length > 14 ? `${c.slice(0, 13)}…` : c}
              </text>
            </g>
          )
        })}
      </Escena>
      <ul className="bib-canales">
        {o.canales.map((c, i) => (
          <li key={c}>
            {c}: <b>{niveles[i] > 60 ? 'alto' : niveles[i] > 35 ? 'medio' : 'bajo'}</b>
          </li>
        ))}
      </ul>
      <div className="bib-controles" role="group" aria-label="Apoyos">
        {o.apoyos.map((a) => {
          const on = apoyos.includes(a.nombre)
          return (
            <button
              key={a.nombre}
              type="button"
              className={`btn small${on ? '' : ' ghost'}`}
              aria-pressed={on}
              onClick={() => setApoyos((xs) => (on ? xs.filter((x) => x !== a.nombre) : [...xs, a.nombre]))}
            >
              {a.nombre}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default function Figura({ objeto, pista }: { objeto: Objeto; pista: string }) {
  switch (objeto.tipo) {
    case 'alarma':
      return <Alarma o={objeto} pista={pista} />
    case 'radio':
      return <Radio o={objeto} pista={pista} />
    case 'luz':
      return <Luz o={objeto} pista={pista} />
    case 'cerradura':
      return <Cerradura o={objeto} pista={pista} />
    case 'ola':
      return <Ola o={objeto} pista={pista} />
    case 'marea':
      return <Marea o={objeto} pista={pista} />
    case 'ecualizador':
      return <Ecualizador o={objeto} pista={pista} />
  }
}

/** Una versión quieta y chiquita de cada objeto, en dos ajustes, para «Dos que se confunden». */
export function Mini({ tipo, nivel }: { tipo: Objeto['tipo']; nivel: number }) {
  const n = clamp(nivel, 0, 1)
  return (
    <svg className="bib-mini" viewBox="0 0 120 80" aria-hidden="true">
      {tipo === 'luz' && (
        <>
          <path d="M44 30 L20 78 L100 78 L76 30 Z" fill={LUZ} opacity={0.08 + n * 0.6} />
          <path d="M44 30 Q44 14 60 13 Q76 14 76 30 Z" fill={PIEZA} stroke={VIDRIO} />
        </>
      )}
      {tipo === 'alarma' && (
        <>
          <g fill="none" stroke={ALARMA} strokeWidth="2.5" strokeLinecap="round" opacity={0.15 + n * 0.85}>
            <path d="M38 26 Q30 40 38 54" />
            <path d="M82 26 Q90 40 82 54" />
            {n > 0.5 && <path d="M28 18 Q16 40 28 62" />}
            {n > 0.5 && <path d="M92 18 Q104 40 92 62" />}
          </g>
          <ellipse cx="60" cy="40" rx="16" ry="12" fill={PIEZA} stroke={VIDRIO} />
        </>
      )}
      {tipo !== 'luz' && tipo !== 'alarma' && (
        <>
          <rect x="48" y="8" width="24" height="64" rx="8" fill={FONDO} stroke={VIDRIO} strokeOpacity="0.6" />
          <rect x="51" y={69 - n * 58} width="18" height={n * 58} rx="5" fill={n > 0.6 ? ALARMA : FRENO} />
        </>
      )}
    </svg>
  )
}
