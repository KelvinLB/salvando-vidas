import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, LifeBuoy, LockKeyhole } from 'lucide-react'
import { AnimatePresence, MotionConfig, type Variants, motion, useDragControls } from 'motion/react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DiaryComposer, { EMPTY_DRAFT, type Draft, draftHasContent } from '../components/DiaryComposer'
import DiaryCover from '../components/DiaryCover'
import PageHeader from '../components/PageHeader'
import RiskNotice from '../components/RiskNotice'
import { MOODS } from '../data/content'
import { KIND, KINDS } from '../data/diary'
import { feelingLabel } from '../data/feelings'
import { moodFromScale, useCompanion } from '../lib/companion'
import { type EntryKind, type Thought, deleteThought, listThoughts, replaceThoughts, saveThought } from '../lib/db'
import { dayOf, dayTitle, howLongAgo, kindOf, stampOn, timeOf, useBlobUrl } from '../lib/diary'
import { LOCK_AFTER, lockDiary, useDiaryLock } from '../lib/lock'
import { markMoment } from '../lib/moments'
import { soundsLikeRisk } from '../lib/risk'
import { type MoodEntry, buzz, newId, pick, today, useStored } from '../lib/storage'

// Mi diario: cada día con algo guardado es una página. Las páginas se pasan
// deslizando como las de un cuaderno, y en cada una caben lo que sientes, lo que pasó y
// los recuerdos que no quieres olvidar. Abierto, ocupa toda la pantalla: solo quedan el
// diario y la ayuda, nada más de la app alrededor.

// Hacia adelante (a un día más nuevo), la hoja de encima se levanta desde el lomo y deja
// ver la siguiente; hacia atrás, la hoja anterior vuelve a caer encima.
const TURN = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const
const AT_ONCE = { duration: 0 }
const FLIP: Variants = {
  enter: (dir: number) => (dir < 0 ? { rotateY: -100, zIndex: 2 } : { opacity: 0, scale: 0.98, zIndex: 0 }),
  center: { rotateY: 0, opacity: 1, scale: 1, x: 0, zIndex: 1, transition: { ...TURN, zIndex: AT_ONCE } },
  exit: (dir: number) =>
    dir > 0
      ? { rotateY: -100, x: 0, zIndex: 2, transition: { ...TURN, ease: [0.45, 0, 0.55, 1], zIndex: AT_ONCE } }
      : { opacity: 0, scale: 0.98, zIndex: 0, transition: { duration: 0.45, zIndex: AT_ONCE } },
}

// Desde aquí no se arrastra la hoja: son controles que también se mueven de lado.
const NO_DRAG = 'audio, input, textarea, select, .day-strip'
const SWIPE = 80

// Si la persona sale de la app más de LOCK_AFTER, el diario se cierra solo con llave.
// No al instante: elegir una foto o contestar un mensaje también saca de la app un momento.

type Saved = { kind: EntryKind; risk: boolean }

function Entry({ entry, index, glow, onRemove }: { entry: Thought; index: number; glow: boolean; onRemove: () => void }) {
  const k = KIND[kindOf(entry)]
  const photo = useBlobUrl(entry.photo)
  const audio = useBlobUrl(entry.audio)
  return (
    <motion.li
      id={`nota-${entry.id}`}
      className={`entry ${glow ? 'glow' : ''}`}
      data-kind={k.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.08 + index * 0.06 } }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
    >
      <div className="entry-head">
        <span className="entry-kind">
          <span aria-hidden="true">{k.emoji}</span> {k.label}
        </span>
        <span className="entry-time">{timeOf(entry)}</span>
        <button className="entry-x" onClick={onRemove} aria-label={`Borrar ${k.label.toLowerCase()} de las ${timeOf(entry)}`}>
          ✕
        </button>
      </div>
      {photo && (
        <figure className="polaroid">
          <img src={photo} alt="Foto del recuerdo" loading="lazy" />
        </figure>
      )}
      {entry.feelings.length > 0 && (
        <div className="tags">
          {entry.feelings.map((f) => (
            <span key={f} className="tag">
              {feelingLabel(f)}
            </span>
          ))}
        </div>
      )}
      {entry.text && <p className="pre entry-text">{entry.text}</p>}
      {audio && <audio controls src={audio} preload="metadata" />}
    </motion.li>
  )
}

/** El sello del día: cómo te fue, con las mismas caritas de Inicio. */
function MoodStamp({ value, isToday, onPick }: { value?: number; isToday: boolean; onPick: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const mood = MOODS.find((m) => m.value === value)

  if (open) {
    return (
      <div className="mood-pick" role="radiogroup" aria-label={isToday ? '¿Cómo va tu día?' : '¿Cómo fue ese día?'}>
        {MOODS.map((m) => (
          <button
            key={m.value}
            role="radio"
            aria-checked={m.value === value}
            aria-label={m.label}
            className={m.value === value ? 'selected' : ''}
            onClick={() => {
              onPick(m.value)
              setOpen(false)
            }}
          >
            {m.emoji}
          </button>
        ))}
      </div>
    )
  }
  return mood ? (
    <button className="stamp inked" key={mood.value} onClick={() => setOpen(true)} aria-label={`El día se sintió: ${mood.label}. Toca para cambiarlo`}>
      <span aria-hidden="true">{mood.emoji}</span> {mood.label}
    </button>
  ) : (
    <button className="stamp" onClick={() => setOpen(true)}>
      {isToday ? '¿Cómo va tu día?' : '¿Cómo fue ese día?'}
    </button>
  )
}

type StripDay = { day: string; mood?: number; kinds: EntryKind[] }

/** La tira de días de arriba: para saltar a cualquier página sin pasar una por una. */
function DayStrip({ days, current, onPick }: { days: StripDay[]; current: string; onPick: (d: string) => void }) {
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-current]')
    const box = strip.current
    if (!el || !box) return
    box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [current, days.length])

  return (
    <div className="day-strip" ref={strip} aria-label="Días de tu diario">
      {days.map(({ day, mood, kinds }, i) => {
        const t = dayTitle(day)
        const newMonth = i === 0 || day.slice(0, 7) !== days[i - 1].day.slice(0, 7)
        return (
          <Fragment key={day}>
            {newMonth && <span className="strip-month">{t.month}</span>}
            <button
              className={`strip-day ${day === current ? 'active' : ''}`}
              aria-current={day === current ? 'date' : undefined}
              aria-label={`${t.weekday} ${t.date}`}
              onClick={() => onPick(day)}
            >
              <small>{t.short}</small>
              <strong>{t.number}</strong>
              <span className="strip-marks" aria-hidden="true">
                {mood ? MOODS.find((m) => m.value === mood)?.emoji : kinds.map((k) => <i key={k} data-kind={k} />)}
              </span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

export default function Diario() {
  const [entries, setEntries] = useState<Thought[]>([])
  const [moods, setMoods] = useStored<MoodEntry[]>('moods', [])
  const { companion, setMood: setCompanionMood } = useCompanion()
  const todayKey = today()
  // Abierto o cerrado vive en la dirección, así el botón de atrás del teléfono lo cierra.
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { key, setKey, locked, unlock } = useDiaryLock(true)
  // Con clave, el diario se ve solo si se abrió aquí (o si se volvió a él antes de LOCK_AFTER).
  const [entered, setEntered] = useState(!locked)
  const open = params.get('modo') === 'abierto' && entered && !locked
  // Cómo se llegó aquí: recién abierto con la llave, recién cerrado, o ya estaba abierto.
  const [moment, setMoment] = useState<'opened' | 'closed' | null>(null)
  const wasOpen = useRef(open)
  const [day, setDay] = useState(todayKey)
  const [dir, setDir] = useState(0)
  const [kind, setKind] = useState<EntryKind | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [removed, setRemoved] = useState<Thought | null>(null)
  const [glow, setGlow] = useState<string>()
  const room = useRef<HTMLDivElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const datePicker = useRef<HTMLInputElement>(null)
  const drag = useDragControls()
  const dragged = useRef(false)

  useEffect(() => {
    listThoughts().then(setEntries)
  }, [])

  // Las páginas: hoy, cada día con algo guardado o con su carita, y el día que estés viendo.
  const days = useMemo(() => {
    const all = new Set([todayKey, day, ...entries.map(dayOf), ...moods.map((m) => m.date)])
    return [...all].filter((d) => d <= todayKey).sort()
  }, [entries, moods, day, todayKey])

  const strip = days.map((d) => ({
    day: d,
    mood: moods.find((m) => m.date === d)?.mood,
    kinds: KINDS.map((k) => k.id).filter((k) => entries.some((e) => dayOf(e) === d && kindOf(e) === k)),
  }))

  const at = days.indexOf(day)
  const older = days[at - 1]
  const newer = days[at + 1]
  const page = entries.filter((e) => dayOf(e) === day).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const mood = moods.find((m) => m.date === day)?.mood
  const memories = entries.filter((e) => kindOf(e) === 'recuerdo')
  const title = dayTitle(day)
  const ago = howLongAgo(day)
  const isToday = day === todayKey

  const go = (next?: string) => {
    if (!next || next === day) return
    setDir(next > day ? 1 : -1)
    setDay(next)
    setSaved(null)
    buzz(6)
  }

  // Si la hoja quedó arriba de la pantalla, se sube a verla desde el principio.
  useEffect(() => {
    const box = room.current
    const el = book.current
    if (!box || !el || glow) return
    const top = el.offsetTop - (box.querySelector<HTMLElement>('.room-bar')?.offsetHeight ?? 0)
    if (box.scrollTop > top) box.scrollTo({ top, behavior: 'smooth' })
  }, [day])

  // Al cerrarlo (con el botón o con el de atrás del teléfono), el candado vuelve a su lugar
  // y, si tiene clave, se vuelve a pedir.
  useEffect(() => {
    if (wasOpen.current && !open) {
      setMoment('closed')
      setEntered(false)
      lockDiary()
    }
    wasOpen.current = open
  }, [open])

  // Abierto, el diario es lo único en la pantalla: lo de atrás no se mueve y el foco entra.
  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('diary-open')
    room.current?.focus()
    return () => document.documentElement.classList.remove('diary-open')
  }, [open])

  // Al abrir un recuerdo, la hoja se pasa y luego se baja hasta él para que brille.
  useEffect(() => {
    if (!glow) return
    const show = setTimeout(
      () => document.getElementById(`nota-${glow}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      650,
    )
    const done = setTimeout(() => setGlow(undefined), 3200)
    return () => {
      clearTimeout(show)
      clearTimeout(done)
    }
  }, [glow])

  useEffect(() => {
    if (!removed) return
    const timer = setTimeout(() => setRemoved(null), 6000)
    return () => clearTimeout(timer)
  }, [removed])

  const pickMood = (value: number) => {
    setMoods((prev) => [...prev.filter((m) => m.date !== day), { date: day, mood: value }])
    // Lo último que dijiste hoy manda: la mascota toma la cara de este ánimo.
    if (isToday && companion) setCompanionMood(moodFromScale(value))
    buzz(10)
  }

  const save = async () => {
    if (!kind || !draftHasContent(draft, kind)) return
    const entry: Thought = {
      id: newId(),
      createdAt: stampOn(day),
      kind,
      text: draft.text.trim(),
      feelings: kind === 'recuerdo' ? [] : draft.feelings,
      audio: draft.recording?.blob,
      seconds: draft.recording?.seconds,
      photo: kind === 'recuerdo' ? draft.photo : undefined,
    }
    await saveThought(entry)
    markMoment('diario')
    setEntries((all) => [entry, ...all])
    const risk = soundsLikeRisk(entry.text)
    setSaved({ kind, risk })
    setKind(null)
    setDraft(EMPTY_DRAFT)
    buzz(18)
  }

  const remove = async (entry: Thought) => {
    await deleteThought(entry.id)
    setEntries((all) => all.filter((e) => e.id !== entry.id))
    setRemoved(entry)
  }

  const undo = async () => {
    if (!removed) return
    await saveThought(removed)
    setEntries((all) => [removed, ...all])
    setRemoved(null)
  }

  // Mejor un recuerdo de otro día, para que la hoja se pase; si no hay, uno de esta página.
  const openMemory = () => {
    const elsewhere = memories.filter((m) => dayOf(m) !== day)
    const others = elsewhere.length ? elsewhere : memories.filter((m) => m.id !== glow)
    if (!others.length) return
    const memory = pick(others)
    go(dayOf(memory))
    setGlow(memory.id)
  }

  const openDiary = () => {
    setMoment('opened')
    setEntered(true)
    // Si la dirección ya dice «abierto» (se volvió con la clave vencida), no se agrega otro paso.
    if (params.get('modo') !== 'abierto') setParams({ modo: 'abierto' }, { state: { inside: true } })
  }

  // Olvidó la clave: el diario empieza en blanco y sin clave; lo demás de la app se queda.
  const forget = async () => {
    await replaceThoughts([])
    setEntries([])
    setKey(null)
  }

  const closeDiary = () => {
    if ((state as { inside?: boolean } | null)?.inside) navigate(-1)
    else setParams({}, { replace: true })
  }

  useEffect(() => {
    if (!open) return
    let leftAt = 0
    const watch = () => {
      if (document.hidden) leftAt = Date.now()
      else if (leftAt && Date.now() - leftAt > LOCK_AFTER) closeDiary()
    }
    document.addEventListener('visibilitychange', watch)
    return () => document.removeEventListener('visibilitychange', watch)
  }, [open])

  const write = (k: EntryKind) => {
    setKind(k)
    setSaved(null)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="stack">
        <PageHeader
          title="Mi diario"
          subtitle="Saca lo que traes dentro y guarda lo que no quieres olvidar. Nadie más lo va a leer ni escuchar."
        />

        {!open && (
          <DiaryCover
            pages={new Set(entries.map(dayOf)).size}
            relock={moment === 'closed'}
            onOpen={openDiary}
            locked={locked}
            hint={key?.hint}
            onUnlock={unlock}
            onForget={forget}
          />
        )}

        {open && (
          <motion.div
            ref={room}
            className="diary-room"
            role="dialog"
            aria-modal="true"
            aria-label="Tu diario"
            tabIndex={-1}
            initial={moment === 'opened' ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <header className="room-bar">
              <button className="room-btn" onClick={closeDiary}>
                <LockKeyhole size={18} aria-hidden="true" />
                Cerrar
              </button>
              <span className="room-title">Mi diario</span>
              <Link to="/ayuda" className="room-btn">
                <LifeBuoy size={18} aria-hidden="true" />
                Ayuda
              </Link>
            </header>

            <motion.div
              className="room-inner"
              initial={moment === 'opened' ? { scale: 0.96, y: 12 } : false}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="diary-nav">
                <DayStrip days={strip} current={day} onPick={go} />
                {/* El campo de fecha, invisible, va encima del ícono: así el toque abre el calendario del teléfono. */}
                <span className="icon-btn diary-calendar">
                  <CalendarDays size={22} strokeWidth={1.75} aria-hidden="true" />
                  <input
                    ref={datePicker}
                    type="date"
                    aria-label="Ir a otro día"
                    max={todayKey}
                    value={day}
                    onClick={() => {
                      try {
                        datePicker.current?.showPicker()
                      } catch {
                        // Sin showPicker, el toque mismo abre el calendario del teléfono.
                      }
                    }}
                    onChange={(e) => e.target.value && go(e.target.value)}
                  />
                </span>
              </div>

              <div className="diary-book" ref={book}>
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.article
                    key={day}
                    className="diary-page"
                    aria-label={`${title.weekday} ${title.date}`}
                    custom={dir}
                    variants={FLIP}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag={kind ? false : 'x'}
                    dragListener={false}
                    dragControls={drag}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: newer ? 0.5 : 0.08, right: older ? 0.5 : 0.08 }}
                    dragSnapToOrigin
                    onPointerDown={(e) => {
                      dragged.current = false
                      if (!kind && !(e.target as Element).closest(NO_DRAG)) drag.start(e)
                    }}
                    onDragStart={() => (dragged.current = true)}
                    onDragEnd={(_, { offset, velocity }) => {
                      const swipe = offset.x + velocity.x * 0.2
                      if (swipe < -SWIPE) go(newer)
                      else if (swipe > SWIPE) go(older)
                    }}
                    // Si el dedo arrastró la hoja, al soltar no cuenta como toque en un botón.
                    onClickCapture={(e) => {
                      if (!dragged.current) return
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <header className="page-head">
                      <button className="icon-btn turn" onClick={() => go(older)} disabled={!older} aria-label="Día anterior">
                        <ChevronLeft size={24} aria-hidden="true" />
                      </button>
                      <div className="page-date">
                        <small>
                          {ago && `${ago} · `}página {at + 1}
                        </small>
                        <h2>{title.weekday}</h2>
                        <span>{title.date}</span>
                      </div>
                      <button className="icon-btn turn" onClick={() => go(newer)} disabled={!newer} aria-label="Día siguiente">
                        <ChevronRight size={24} aria-hidden="true" />
                      </button>
                    </header>

                    <div className="stamp-row">
                      <MoodStamp value={mood} isToday={isToday} onPick={pickMood} />
                    </div>

                    {page.length > 0 && (
                      <ul className="entries">
                        <AnimatePresence>
                          {page.map((e, i) => (
                            <Entry key={e.id} entry={e} index={i} glow={e.id === glow} onRemove={() => remove(e)} />
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}

                    {saved &&
                      (saved.risk ? (
                        <RiskNotice />
                      ) : saved.kind === 'recuerdo' ? (
                        <div className="callout info" role="status">
                          <p>Guardado. Cuando un día pese, aquí va a estar.</p>
                        </div>
                      ) : (
                        <div className="callout info" role="status">
                          <p>
                            Guardado en tu diario. Sacarlo ya es algo. Si quieres, estas notas pueden ayudarte a
                            explicarle al especialista cómo te has sentido.
                          </p>
                          <div className="row">
                            <Link to="/especialista" className="btn small ghost">
                              Preparar mi consulta
                            </Link>
                            {memories.length > 0 && (
                              <button className="btn small ghost" onClick={openMemory}>
                                🌼 Ver un recuerdo bonito
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                    {kind ? (
                      <DiaryComposer
                        kind={kind}
                        onKind={setKind}
                        draft={draft}
                        onDraft={setDraft}
                        onSave={save}
                        onClose={() => setKind(null)}
                      />
                    ) : (
                      <div className="write-here">
                        <p className="write-ask">
                          {page.length
                            ? '¿Algo más para este día?'
                            : isToday
                              ? 'Esta página está en blanco. ¿Con qué la empiezas?'
                              : 'Este día está en blanco. ¿Te acuerdas de algo?'}
                        </p>
                        <div className="kind-tiles">
                          {KINDS.map((k) => (
                            <button key={k.id} className="kind-tile" data-kind={k.id} onClick={() => write(k.id)}>
                              <span className="kind-emoji" aria-hidden="true">
                                {k.emoji}
                              </span>
                              <strong>{k.label}</strong>
                              <small>{k.hint}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.article>
                </AnimatePresence>
              </div>

              <footer className="room-foot">
                {days.length > 1 && <p>Desliza la hoja o usa las flechas para pasar de día.</p>}
                <div className="row">
                  {!isToday && (
                    <button className="room-btn" onClick={() => go(todayKey)}>
                      Ir a hoy
                    </button>
                  )}
                  {memories.length > 0 && (
                    <button className="room-btn" onClick={openMemory}>
                      🌼 Abrir un recuerdo
                    </button>
                  )}
                </div>
                <p className="room-private">
                  <LockKeyhole size={14} aria-hidden="true" />
                  Solo tú lo ves. Si sales de la app un rato, se cierra con llave.
                </p>
              </footer>
            </motion.div>

            {removed && (
              <div className="diary-undo" role="status">
                <span>Se borró de tu diario.</span>
                <button className="btn small" onClick={undo}>
                  Deshacer
                </button>
              </div>
            )}
          </motion.div>
        )}

        <Link to="/responder" className="card link-card">
          <h2>¿Tu mente te dice cosas crueles?</h2>
          <p className="muted">«Soy una carga», «a nadie le importaría»… Aprende a responderle.</p>
        </Link>

      </div>
    </MotionConfig>
  )
}
