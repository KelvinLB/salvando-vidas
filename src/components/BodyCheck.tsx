import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import BodyFrame, { LevelMeter } from './BodyFrame'
import BodyModel, { type CanvasPoint } from './BodyModel'
import PetSays from './PetSays'
import MapaEmociones from './cuerpo-siento/MapaEmociones'
import { MAX_SPOTS, SPOT_MIN, SPOT_START, SpotLayer, SpotTools, clampR, partName } from './cuerpo-siento/Marcas'
import TusPalabras, { MINE_KEY, NOTES_KEY, NotePins } from './cuerpo-siento/TusPalabras'
import ViewSwitch from './cuerpo-siento/ViewSwitch'
import { type View, regionAt, regionCenter } from './cuerpo-siento/figura'
import {
  AREAS,
  BANDS,
  DURATIONS,
  HELPS,
  INTENSITY,
  PATTERNS,
  RED_FLAGS,
  SENSATIONS,
  SPOT_AFTER,
  type Area,
  type Pattern,
  type RedFlag,
  type Sensation,
} from '../data/bodyCheck'
import type { CompanionMood } from '../data/companion'
import { YO_KEY, type Yo, cleanYo } from '../data/desdeAfuera'
import { COUNTRIES, findCountry, guessCountry } from '../data/helplines'
import type { Region } from '../data/bodyStories'
import {
  type BodyNote,
  type BodyNow,
  type BodyRecord,
  EMPTY_NOW,
  type Spot,
  bandOf,
  calmingFx,
  freshNow,
  readBody,
} from '../lib/bodyCheck'
import { markMoment } from '../lib/moments'
import { firstName, telOf, usePeople, whatsappOf } from '../lib/people'
import { buzz, newId, today, useStored } from '../lib/storage'

// «Lo que siento»: marcar dónde se siente (en una o en varias partes), ver qué puede
// estar pasando y bajarle juntos. Nunca obliga: primero calma, y después ofrece ayuda.
// Las señales de alarma sí se dicen claro, pero sin asustar.
//
// La figura se ve de frente, de espalda o de lado; con el dedo se puede marcar dónde exacto y
// qué tan grande, y después de respirar la persona dice cómo lo siente ahora (la marca solo se
// achica si ella lo dice). Mientras se respira, el nervio vago se ilumina al soltar el aire.

// Bajarle juntos: un minuto de respiración 4-6, como en Calma.
const IN = 4
const OUT = 6
const TOTAL = 60

const isRegion = (a: Area | null): a is Region => !!a && a !== 'mente' && a !== 'todo'

/** La carita con que la mascota explica cada cosa: siente lo mismo que la persona. */
const PET_MOOD: Record<Pattern, CompanionMood> = {
  ansiedad: 'nervios',
  panico: 'nervios',
  estres: 'cansado',
  depresion: 'triste',
  bipolar: 'calma',
}

/** Lo que se calmó, dicho de esa parte del cuerpo. */
const CALMER: Record<Area, string> = {
  cabeza: 'tu cabeza ya está más tranquila',
  mente: 'tu mente ya está más tranquila',
  cuello: 'tus hombros ya están más sueltos',
  pecho: 'tu pecho ya está más tranquilo',
  estomago: 'tu estómago ya está más tranquilo',
  brazos: 'tus manos ya están más tranquilas',
  piernas: 'tus piernas ya están más tranquilas',
  todo: 'tu cuerpo ya está más tranquilo',
}

/** Dónde se marcó más; si hay empate, es todo el cuerpo. */
function mainArea(picked: Sensation[]): Area {
  const counts = new Map<Area, number>()
  picked.forEach((s) => counts.set(s.area, (counts.get(s.area) ?? 0) + 1))
  const [first, second] = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return !first || (second && second[1] === first[1]) ? 'todo' : first[0]
}

const calmer = (picked: Sensation[]) => {
  const area = mainArea(picked)
  // En «Estómago y espalda», si solo fue la espalda, se dice de la espalda.
  if (area === 'estomago' && picked.every((s) => s.area !== 'estomago' || s.id === 'espalda-baja')) {
    return 'tu espalda ya está más suelta'
  }
  return CALMER[area]
}

/** Una marca como se puso, sin lo que se dijo después de respirar. */
const unrated = ({ id, view, x, y, r, region }: Spot): Spot => ({ id, view, x, y, r, region })

/** Al abrir una zona, el cuerpo sube a la vista para que se vea reaccionar. */
const showBody = (smooth: boolean) =>
  document.querySelector('.body-card.check')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })

function RedCards({ red }: { red: RedFlag[] }) {
  const [code] = useStored('country', guessCountry)
  const { reachable } = usePeople()
  const person = reachable[0]
  const country = findCountry(code) ?? COUNTRIES[0]

  return red.map((r) =>
    r === 'crisis' ? (
      <div key={r} className="callout warm" role="status">
        <strong>Gracias por decírmelo.</strong>
        <p>
          Esos pensamientos duelen mucho, y no tienes que cargarlos a solas. Hablar con alguien ahora
          puede ayudar, aunque sea un poco.
        </p>
        <div className="row">
          <Link to="/ayuda" className="btn">
            Hablar con alguien ahora
          </Link>
          <Link to="/mi-espacio/plan" className="btn ghost">
            Mi plan de seguridad
          </Link>
        </div>
      </div>
    ) : (
      <div key={r} className="callout alarm" role="status">
        <strong>{RED_FLAGS[r].title}</strong>
        <p>{RED_FLAGS[r].text}</p>
        <p className="small">Mientras tanto, siéntate y suelta el aire despacio. Pedir ayuda no es exagerar.</p>
        <div className="row">
          <a href={`tel:${country.emergency}`} className={`btn${RED_FLAGS[r].urgent ? ' danger' : ''}`}>
            Llamar a emergencias · {country.emergency}
          </a>
          {person && (
            <a href={telOf(person.phone)} className="btn ghost">
              Llamar a {firstName(person)}
            </a>
          )}
        </div>
      </div>
    ),
  )
}

type Props = {
  still: boolean
  onStory: (id: string) => void
  /** Zona que llega abierta, por ejemplo al tocar el cuerpo en Inicio. */
  initialArea?: Area
}

export default function BodyCheck({ still, onStory, initialArea }: Props) {
  const [saved, setSaved] = useStored<BodyNow>('cuerpo-ahora', EMPTY_NOW)
  const [records, setRecords] = useStored<BodyRecord[]>('cuerpo-registros', [])
  const [heartChecked] = useStored('corazon-revisado', false)
  const { reachable, country: code } = usePeople()
  const person = reachable[0]
  const [area, setArea] = useState<Area | null>(initialArea ?? null)
  const [calming, setCalming] = useState<number | null>(null)
  const [askAfter, setAskAfter] = useState(false)
  const [after, setAfter] = useState<number | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [relief, setRelief] = useState(0)
  const [loaded] = useState(() => Date.now())
  const [notes] = useStored<BodyNote[]>(NOTES_KEY, [])
  const [yoSaved] = useStored<Partial<Yo> | null>(YO_KEY, null)
  const [mine] = useStored(MINE_KEY, true)
  const yo = yoSaved && mine ? cleanYo(yoSaved) : null

  const now = freshNow(saved, loaded)
  const { ids, intensity, duration, stage } = now
  const update = (patch: Partial<BodyNow>) => setSaved({ ...now, ...patch, at: Date.now() })

  // Marcar con el dedo: mientras se arrastra, la marca vive aquí y se guarda al soltar.
  const [view, setView] = useState<View>(() => now.spots?.[0]?.view ?? 'frente')
  const [marking, setMarking] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [draft, setDraft] = useState<Spot[] | null>(null)
  const draftRef = useRef<Spot[] | null>(null)
  const drag = useRef<{ id: string; r0: number; d0: number; fresh: boolean; moved: boolean } | null>(null)
  const [said, setSaid] = useState('')
  const spots = draft ?? now.spots ?? []
  const selected = spots.find((s) => s.id === sel) ?? null

  const reading = readBody(ids, intensity)
  const { red, band, feel } = reading
  const usual = reading.picked.filter((s) => !s.red)

  useEffect(() => {
    if (!initialArea) return
    if (stage !== 'marcar') update({ stage: 'marcar' })
    if (window.innerWidth < 640) showBody(false)
    // Solo al llegar: después la persona decide qué abrir.
  }, [])

  useEffect(() => {
    if (calming === null) return
    const done = calming >= TOTAL
    const timer = setTimeout(
      () => {
        if (done) {
          setCalming(null)
          setAskAfter(true)
          buzz(30)
          markMoment('respirar')
          return
        }
        const t = (calming + 1) % (IN + OUT)
        if (t === 0 || t === IN) buzz(12)
        setCalming(calming + 1)
      },
      done ? 0 : 1000,
    )
    return () => clearTimeout(timer)
  }, [calming])

  const toggle = (id: string) => {
    buzz(8)
    const adding = !ids.includes(id)
    update({ ids: adding ? [...ids, id] : ids.filter((x) => x !== id) })
    // Si es una señal de alarma, que el aviso quede a la vista sin tener que buscarlo.
    if (adding && SENSATIONS.find((s) => s.id === id)?.red) {
      requestAnimationFrame(() =>
        document.querySelector('.sensations [role="status"]')?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest' }),
      )
    }
  }

  const openArea = (a: Area) => {
    setArea(area === a ? null : a)
    if (area !== a && window.innerWidth < 640) showBody(!still)
  }

  const restart = () => {
    update({ ...EMPTY_NOW })
    setArea(null)
    setMarking(false)
    setSel(null)
    setCalming(null)
    setAskAfter(false)
    setAfter(null)
    setRecordId(null)
  }

  const startCalm = () => {
    if (spots.some((s) => s.after !== undefined)) update({ spots: spots.map(unrated) })
    setAfter(null)
    setAskAfter(false)
    setCalming(0)
    showBody(!still)
  }

  const rateAfter = (value: number) => {
    setAfter(value)
    setAskAfter(false)
    if (recordId) setRecords((list) => list.map((r) => (r.id === recordId ? { ...r, after: value } : r)))
    // Bajó: el cuerpo suelta una onda de alivio donde más se sentía.
    if (value < (intensity ?? reading.level)) {
      setRelief((n) => n + 1)
      buzz([12, 70, 18])
      markMoment('cuerpo')
    }
  }

  // Después de respirar: la persona dice cómo siente lo que marcó, y la marca cambia a eso.
  const answerSpots = (scale: number) => {
    const list = spots.map((s) => ({ ...unrated(s), after: Math.max(4, s.r * scale) }))
    update({ spots: list })
    if (recordId) setRecords((all) => all.map((r) => (r.id === recordId ? { ...r, spots: list } : r)))
    if (!list.some((s) => s.view === view)) setView(list[0].view)
    showBody(!still)
  }

  const announce = (s: Spot | undefined) => {
    if (s) setSaid(`Marca en ${s.region ? partName(s.region, s.view).toLowerCase() : 'la figura'}, ${s.r < 12 ? 'chica' : s.r < 22 ? 'mediana' : 'grande'}.`)
  }
  const setDraftBoth = (list: Spot[] | null) => {
    draftRef.current = list
    setDraft(list)
  }
  const addSpot = (x: number, y: number, r: number, region = regionAt(view, x, y)): [Spot, Spot[]] => {
    const spot: Spot = { id: newId(), view, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, r, region }
    return [spot, [...spots.map(unrated), spot].slice(-MAX_SPOTS)]
  }

  const onCanvas = (type: 'down' | 'move' | 'up', p: CanvasPoint) => {
    if (type === 'down') {
      // Si toca una marca que ya está, la agranda o la achica desde donde la tomó.
      const hit = [...spots].reverse().find((s) => s.view === view && Math.hypot(p.x - s.x, p.y - s.y) <= Math.max(s.r, 10))
      if (hit) {
        setSel(hit.id)
        drag.current = { id: hit.id, r0: hit.r, d0: Math.hypot(p.x - hit.x, p.y - hit.y), fresh: false, moved: false }
        setDraftBoth(spots.map(unrated))
        return
      }
      const [spot, list] = addSpot(p.x, p.y, SPOT_MIN)
      setSel(spot.id)
      drag.current = { id: spot.id, r0: SPOT_MIN, d0: 0, fresh: true, moved: false }
      setDraftBoth(list)
      buzz(8)
      return
    }
    const d = drag.current
    const list = draftRef.current
    if (!d || !list) return
    if (type === 'move') {
      const s = list.find((x) => x.id === d.id)
      if (!s) return
      const dist = Math.hypot(p.x - s.x, p.y - s.y)
      if (Math.abs(dist - d.d0) > 2) d.moved = true
      if (d.moved) setDraftBoth(list.map((x) => (x.id === d.id ? { ...x, r: clampR(d.r0 + dist - d.d0) } : x)))
      return
    }
    drag.current = null
    // Un toque sin arrastrar deja una marca mediana.
    const done = list.map((x) => (x.id === d.id && d.fresh && !d.moved ? { ...x, r: SPOT_START } : x))
    setDraftBoth(null)
    update({ spots: done })
    announce(done.find((x) => x.id === d.id))
  }

  const placeIn = (region: Region) => {
    const [x, y] = regionCenter(view, region)
    const [spot, list] = addSpot(x, y, SPOT_START, region)
    update({ spots: list })
    setSel(spot.id)
    announce(spot)
  }
  const resizeSel = (delta: number) => {
    const list = spots.map((s) => (s.id === sel ? { ...unrated(s), r: clampR(s.r + delta) } : unrated(s)))
    update({ spots: list })
    announce(list.find((s) => s.id === sel))
  }
  const removeSel = () => {
    update({ spots: spots.filter((s) => s.id !== sel).map(unrated) })
    setSel(null)
    setSaid('Marca quitada.')
  }

  const save = () => {
    const record: BodyRecord = {
      id: recordId ?? newId(),
      date: today(),
      ids,
      intensity,
      after,
      duration,
      ...(spots.length > 0 && { spots }),
    }
    setRecords((list) => [record, ...list.filter((r) => r.id !== record.id)].slice(0, 60))
    setRecordId(record.id)
  }

  // Cómo se ve el cuerpo: mientras se respira se va calmando; después muestra lo que la
  // persona dijo que sintió, para que la lectura sea verdad.
  const before = intensity ?? reading.level
  // Si se calmó, el cuerpo se ve en calma y solo queda un rastro de lo que todavía siente.
  const better = after !== null && after < before
  const calm = calming !== null ? calming / TOTAL : askAfter ? 1 : better ? (5 - after) / 4 : 0
  const shown = after !== null ? readBody(ids, after) : reading
  const main = mainArea(usual)
  const reliefRegion: Region = isRegion(main) ? main : main === 'mente' ? 'cabeza' : 'pecho'
  const phase = calming === null ? null : calming % (IN + OUT) < IN ? 'in' : 'out'
  const left = calming === null ? 0 : phase === 'in' ? IN - (calming % (IN + OUT)) : IN + OUT - (calming % (IN + OUT))

  const areaLabel = AREAS.find((a) => a.id === area)?.label
  const count = (a: Area) => SENSATIONS.filter((s) => s.area === a && ids.includes(s.id)).length
  const n = ids.length
  const marks: Partial<Record<View, number>> = {}
  spots.forEach((s) => (marks[s.view] = (marks[s.view] ?? 0) + 1))
  const rated = spots.filter((s) => s.after !== undefined)
  const smaller = rated.some((s) => s.after! < s.r * 0.9)
  const bigger = rated.some((s) => s.after! > s.r * 1.1)

  return (
    <>
      <section className="card body-card check">
        <BodyFrame
          title={stage === 'resumen' ? 'Así está tu cuerpo' : 'Tu cuerpo ahora'}
          state={red.length ? 'Atención' : n ? BANDS[shown.band].label : 'En calma'}
          hint={
            marking
              ? 'Toca y arrastra donde lo sientes'
              : stage === 'marcar'
                ? 'Toca donde lo sientes'
                : calming !== null
                  ? 'Respira con el cuerpo'
                  : undefined
          }
          readout={n > 0 ? <LevelMeter level={shown.level} band={shown.band} /> : undefined}
          tools={
            <div className="body-tools">
              <ViewSwitch
                view={view}
                onChange={(v) => {
                  setView(v)
                  setSel(null)
                }}
                marks={marks}
              />
              {stage === 'marcar' &&
                (marking ? (
                  <SpotTools
                    view={view}
                    spots={spots}
                    sel={selected}
                    onPlace={placeIn}
                    onResize={resizeSel}
                    onRemove={removeSel}
                    onDone={() => {
                      setMarking(false)
                      setSel(null)
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => {
                      setArea(null)
                      setMarking(true)
                    }}
                  >
                    {spots.length ? 'Cambiar mis marcas' : 'Marcar dónde exacto'}
                  </button>
                ))}
              <p className="visually-hidden" aria-live="polite">
                {said}
              </p>
            </div>
          }
        >
          <BodyModel
            fx={calming !== null || askAfter || better ? calmingFx(reading.fx) : n ? reading.fx : ['breath-slow', 'heart-calm']}
            tone={better ? 'calma' : reading.tone}
            focus={isRegion(area) ? area : area === 'mente' ? 'cabeza' : undefined}
            heat={reading.heat}
            calm={calm}
            tour={stage === 'marcar' && !n && !area && !spots.length}
            still={still}
            onRegion={stage === 'marcar' ? openArea : undefined}
            relief={better && relief ? { region: reliefRegion, n: relief } : undefined}
            view={view}
            phase={phase}
            yo={yo}
            layer={
              <>
                <SpotLayer spots={spots} view={view} sel={marking ? sel : null} compare={stage === 'resumen'} />
                <NotePins notes={notes} view={view} />
              </>
            }
            onCanvas={marking && stage === 'marcar' ? onCanvas : undefined}
          />
        </BodyFrame>

        {stage === 'marcar' && (
          <div className="stack tight">
            <p className="muted small">Toca una parte del cuerpo o elige aquí. Puedes marcar varias.</p>
            <div className="chips" role="group" aria-label="Partes del cuerpo">
              {AREAS.map((a) => (
                <button
                  key={a.id}
                  className={`chip${area === a.id ? ' selected' : ''}`}
                  aria-expanded={area === a.id}
                  onClick={() => openArea(a.id)}
                >
                  {a.label}
                  {count(a.id) > 0 && <span className="chip-count">{count(a.id)}</span>}
                </button>
              ))}
            </div>

            {/* En el teléfono es una hoja abajo, para que el cuerpo se vea reaccionar arriba. */}
            {area && (
              <div className="sensations" role="group" aria-label={areaLabel}>
                <div className="sheet-head">
                  <h3>{areaLabel}</h3>
                  <button className="btn small" onClick={() => setArea(null)}>
                    Listo
                  </button>
                </div>
                {SENSATIONS.filter((s) => s.area === area).map((s) => {
                  const on = ids.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      className={`sensation${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => toggle(s.id)}
                    >
                      <span className="sensation-box" aria-hidden="true">
                        {on && <Check size={15} strokeWidth={3} />}
                      </span>
                      {s.label}
                    </button>
                  )
                })}
                <RedCards red={red.filter((r) => SENSATIONS.some((s) => s.red === r && s.area === area && ids.includes(s.id)))} />
              </div>
            )}

            {!area && <RedCards red={red} />}

            <div className="row spread">
              <span className="muted small">
                {n ? `Marcaste ${n} ${n === 1 ? 'cosa' : 'cosas'}` : 'Todavía no marcas nada'}
              </span>
              {n > 0 && (
                <button className="btn small ghost" onClick={restart}>
                  Borrar todo
                </button>
              )}
            </div>
            <button
              className="btn big"
              disabled={!n}
              onClick={() => {
                setArea(null)
                update({ stage: red.length && !usual.length ? 'resumen' : 'nivel' })
              }}
            >
              ¿Qué me está pasando?
            </button>
          </div>
        )}

        {stage === 'nivel' && (
          <div className="stack tight">
            <RedCards red={red} />
            <h2>¿Qué tan fuerte lo sientes ahorita?</h2>
            <div className="chips">
              {INTENSITY.map((i) => (
                <button
                  key={i.value}
                  className={`chip${intensity === i.value ? ' selected' : ''}`}
                  aria-pressed={intensity === i.value}
                  onClick={() => update({ intensity: i.value })}
                >
                  {i.label}
                </button>
              ))}
            </div>
            <h2>¿Desde cuándo?</h2>
            <div className="chips">
              {DURATIONS.map((d) => (
                <button
                  key={d.id}
                  className={`chip${duration === d.id ? ' selected' : ''}`}
                  aria-pressed={duration === d.id}
                  onClick={() => update({ duration: d.id })}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button className="btn big" disabled={!intensity} onClick={() => update({ stage: 'resumen' })}>
              Ver lo que me pasa
            </button>
            <button className="btn ghost" onClick={() => update({ stage: 'marcar' })}>
              Cambiar lo que marqué
            </button>
          </div>
        )}

        {stage === 'resumen' && (
          <div className="stack tight" aria-live="polite">
            <RedCards red={red} />
            {usual.length > 0 && calming === null && !askAfter && after === null && (
              <>
                <p className="band-text">{BANDS[band].text[feel]}</p>
                <button className="btn big" onClick={startCalm}>
                  Bajarle juntos · 1 minuto
                </button>
                <p className="muted small center">Respira con el cuerpo y mira cómo se va calmando.</p>
              </>
            )}

            {calming !== null && (
              <div className="calm-cue">
                <p className="calm-word">{phase === 'in' ? 'Toma aire' : 'Suéltalo despacio'}</p>
                <p className="calm-count" aria-hidden="true">
                  {left}
                </p>
                {/* Pendiente de revisión con psicóloga y médico. Fuente: Laborde et al. 2022
                    (Neurosci Biobehav Rev), respiración lenta y tono vagal; Breit et al. 2018. */}
                <p className="muted small calm-why">
                  Al soltar el aire, mira la línea azul: es el nervio vago, el freno de tu cuerpo. Le avisa al corazón
                  que baje el ritmo, poco a poco.
                </p>
                <div className="body-progress" aria-hidden="true">
                  <span style={{ animationDuration: `${TOTAL}s` }} />
                </div>
                <button className="btn ghost" onClick={() => setCalming(TOTAL)}>
                  Terminar
                </button>
              </div>
            )}

            {askAfter && (
              <>
                <h2>¿Y ahora, qué tan fuerte lo sientes?</h2>
                <div className="chips">
                  {INTENSITY.map((i) => (
                    <button key={i.value} className="chip" onClick={() => rateAfter(i.value)}>
                      {i.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {after !== null && spots.length > 0 && rated.length === 0 && (
              <div className="stack tight">
                <h3>¿Y lo que marcaste? ¿Cómo lo sientes ahora?</h3>
                <div className="chips">
                  {SPOT_AFTER.map((o) => (
                    <button key={o.id} type="button" className="chip" onClick={() => answerSpots(o.scale)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {rated.length > 0 && (
              <p className="muted small spot-note">
                {smaller
                  ? 'Mira tu marca: la línea punteada es como lo sentías antes, y el color es como lo sientes ahora.'
                  : bigger
                    ? 'Tu marca creció un poco: la línea punteada es como estaba antes. Gracias por decirlo tal cual.'
                    : 'Tu marca se quedó igual, y está bien: a veces el cuerpo tarda.'}
              </p>
            )}

            {after !== null && (
              <div className={`callout outcome ${better ? 'better' : 'info'}`}>
                <PetSays mood={better ? 'feliz' : 'calma'} compact>
                  {better ? (
                    <>
                      <p className="pet-says-lead">Mira: {calmer(usual)}. Eso lo hiciste tú.</p>
                      <p>
                        Bajó de «{INTENSITY[before - 1].label.toLowerCase()}» a «{INTENSITY[after - 1].label.toLowerCase()}».
                        Tu cuerpo supo calmarse, y tú le enseñaste cómo.
                      </p>
                    </>
                  ) : after === before ? (
                    <p>
                      Sigue igual, y está bien: a veces el cuerpo tarda en creerte. Puedes repetirlo, o probar otra
                      de las cosas de abajo.
                    </p>
                  ) : (
                    <p>
                      Gracias por decírmelo; no hiciste nada mal. Cuando sube así, ayuda mucho no estar a solas:
                      abajo tienes con quién hablar.
                    </p>
                  )}
                </PetSays>
                <button className="btn ghost" onClick={startCalm}>
                  Respirar otra vez
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {stage === 'resumen' && (
        <>
          {reading.mix.length > 0 && (
            <section className="card">
              <p className="eyebrow">Lo que podría estar pasando</p>
              {reading.mix.length > 1 && (
                <p className="muted">
                  Se parece a una mezcla de {reading.mix.map((p) => PATTERNS[p].label).join(' y ')}. Es muy común
                  sentir varias a la vez.
                </p>
              )}
              {reading.mix.map((p) => (
                <div key={p} className="stack tight">
                  <h2>{PATTERNS[p].title}</h2>
                  <PetSays mood={PET_MOOD[p]}>
                    <p className="pet-says-lead">{PATTERNS[p].feel}</p>
                    <p>{PATTERNS[p].text}</p>
                    <p>{PATTERNS[p].cheer}</p>
                  </PetSays>
                  <button className="btn small ghost" onClick={() => onStory(p)}>
                    Ver cómo funciona por dentro
                  </button>
                </div>
              ))}
              {(ids.includes('mal-sueno') || reading.mix.includes('panico')) && (
                <div className="row">
                  {ids.includes('mal-sueno') && (
                    <button className="btn small ghost" onClick={() => onStory('insomnio')}>
                      Por qué no puedo dormir
                    </button>
                  )}
                  {reading.mix.includes('panico') && (
                    <button className="btn small ghost" onClick={() => onStory('despues-crisis')}>
                      El bajón después de una crisis
                    </button>
                  )}
                </div>
              )}
              {reading.chest &&
                !red.includes('corazon') &&
                (heartChecked ? (
                  <p className="callout info small">
                    💚 Ya te revisaron el corazón y salió bien: esto se parece más a la alarma de la ansiedad. Si
                    un día se siente distinto o dura más de unos minutos, que te revisen otra vez.
                  </p>
                ) : (
                  <p className="callout warm small">
                    Si es la primera vez, se siente distinto a otras veces o viene con sudor frío, náusea o
                    mareo, que te revisen hoy. Si el dolor o la presión dura más de unos minutos, llama a
                    emergencias: ir no es exagerar.
                  </p>
                ))}
              <p className="muted small">Es una orientación, no un diagnóstico.</p>
            </section>
          )}

          {usual.length > 0 && (
            <section className="card">
              <p className="eyebrow">Cómo está reaccionando tu cuerpo</p>
              <ul className="reactions">
                {usual.map((s) => (
                  <li key={s.id}>
                    <strong>{s.label}</strong>
                    <p>{s.why}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {usual.length > 0 && <MapaEmociones heat={reading.heat} spots={spots} feel={feel} />}

          {reading.helps.length > 0 && (
            <section className="card">
              <p className="eyebrow">Para bajarle ahora</p>
              {reading.helps.map((id) => (
                <div key={id} className="help-item">
                  <h3>{HELPS[id].title}</h3>
                  <p>{HELPS[id].text}</p>
                  {HELPS[id].to && (
                    <Link to={HELPS[id].to} className="btn small ghost">
                      {HELPS[id].action}
                    </Link>
                  )}
                </div>
              ))}
            </section>
          )}

          <section className="card soft">
            <h2>No tienes que cargarlo a solas</h2>
            <p>
              {bandOf(shown.level) === 'fuerte' || (after !== null && after > before)
                ? 'Cuando el cuerpo está así de alerta, ayuda mucho no estar a solas. Si quieres, escríbele a alguien o llama a una línea de apoyo: están para esto.'
                : duration === 'semanas'
                  ? 'Si esto lleva semanas, no tienes que esperar a que empeore. Un especialista puede ayudarte a que pase menos seguido y con menos fuerza.'
                  : duration === 'dias'
                    ? 'Si sigue así unos días más, cuéntaselo a alguien de confianza o a tu médico.'
                    : 'Si esto te pasa seguido, vale la pena contárselo a alguien. Tiene tratamiento.'}
            </p>
            <div className="row">
              {person && (
                <a
                  className="btn"
                  href={whatsappOf(person.phone, code, 'Hola, no me siento muy bien. ¿Podemos platicar un rato?')}
                  target="_blank"
                  rel="noreferrer"
                >
                  Escribirle a {firstName(person)}
                </a>
              )}
              <Link to="/ayuda" className={`btn${person ? ' ghost' : ''}`}>
                Líneas de apoyo
              </Link>
              <Link to="/especialista" className="btn ghost">
                Preparar mi consulta
              </Link>
            </div>
            {recordId && records.some((r) => r.id === recordId) ? (
              <p className="muted small">✓ Guardado en este teléfono para tu resumen de consulta.</p>
            ) : (
              <>
                <button className="btn ghost" onClick={save}>
                  Guardar para mi consulta
                </button>
                <p className="muted small">
                  Se guarda solo en este teléfono, para que tu médico vea qué sientes y qué tan seguido.
                </p>
              </>
            )}
          </section>

          <TusPalabras spots={spots} hasYo={!!yoSaved} />

          <div className="row">
            <button className="btn ghost" onClick={() => update({ stage: 'marcar' })}>
              Cambiar lo que marqué
            </button>
            <button className="btn ghost" onClick={restart}>
              Empezar de nuevo
            </button>
          </div>
        </>
      )}

      {stage !== 'resumen' && <TusPalabras spots={spots} hasYo={!!yoSaved} />}
    </>
  )
}
