import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { Dices } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import CompanionView from '../components/Companion'
import PageHeader from '../components/PageHeader'
import PetGift from '../components/PetGift'
import PetRoom from '../components/PetRoom'
import JellyRadio from '../components/bits/JellyRadio'
import {
  ANSWERS,
  COLORS,
  type Companion,
  type CompanionLook,
  DEFAULT_COMPANION,
  FACES,
  HEADS,
  LIKES,
  MAX_TRAITS,
  MOOD_STATES,
  MOOD_TIPS,
  NAME_IDEAS,
  NECKS,
  PATTERN_OPTIONS,
  PET_PHRASES,
  QUESTIONS,
  SPECIES,
  TRAITS,
  capitalize,
  companionName,
} from '../data/companion'
import {
  GAD_MAX,
  PHQ_MAX,
  REVIEW_EVERY_DAYS,
  type Review,
  SIGNALS,
  daysSince,
  gadLevel,
  mixKind,
  moodFromAnswers,
  phqLevel,
  scores,
  useCompanion,
} from '../lib/companion'
import { useGift } from '../lib/gifts'
import { MOMENTS, type Moment, markMoment, plantStage, useMoments } from '../lib/moments'
import { hop, petSound, still, useBursts, usePeriod } from '../lib/petfx'
import { type JournalEntry, type MoodEntry, newId, pick, today, useStored } from '../lib/storage'

const listJoin = (items: string[]) => new Intl.ListFormat('es', { type: 'conjunction' }).format(items)

const albumDate = (date: string) =>
  date === today() ? 'Hoy' : new Date(date + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

const auraOf = (review: Review) => {
  const { phq, gad } = scores(review.answers)
  return { dep: phq / PHQ_MAX, anx: gad / GAD_MAX, calm: mixKind(phq, gad) === 'pocas' }
}

function ago(date: string) {
  const days = daysSince(date)
  return days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`
}

function LikeLink({ like, className, children }: { like: (typeof LIKES)[number]; className: string; children: ReactNode }) {
  return like.to ? (
    <Link to={like.to} className={className}>
      {children}
    </Link>
  ) : (
    <a href={like.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

/** Una opción se ve ya puesta en la mascota, para elegir viendo y no imaginando. */
function LookTile({ look, label, on, onPick }: { look: CompanionLook; label: string; on: boolean; onPick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`tile look ${on ? 'selected' : ''}`} onClick={onPick}>
      <span aria-hidden="true">
        <CompanionView look={look} size={76} />
      </span>
      <small>{label}</small>
    </button>
  )
}

// Como el editor de avatares de WhatsApp: la mascota se queda flotando arriba mientras
// eliges, una parte a la vez, y reacciona a cada cosa que le pones.
const PARTS = [
  { value: 'forma', label: 'Forma', title: 'Su forma' },
  { value: 'color', label: 'Color', title: 'Su color' },
  { value: 'cabeza', label: 'Cabeza', title: 'En la cabeza' },
  { value: 'cara', label: 'Cara', title: 'En la cara' },
  { value: 'cuello', label: 'Cuello', title: 'En el cuello' },
  { value: 'nombre', label: 'Nombre', title: '¿Cómo se llama?' },
  { value: 'ser', label: 'Forma de ser', title: 'Su forma de ser' },
  { value: 'gustos', label: 'Le gusta', title: 'Le gusta…' },
] as const
type Part = (typeof PARTS)[number]['value']

function Editor({ initial, onSave, onCancel }: { initial: Companion; onSave: (c: Companion) => void; onCancel?: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [part, setPart] = useState<Part>('forma')
  const figure = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const arrived = useRef(false)
  const bursts = useBursts()

  const set = <K extends keyof Companion>(key: K, value: Companion[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    hop(figure.current)
  }
  const toggle = (key: 'traits' | 'likes', item: { id: string; emoji: string }, max = Infinity) => {
    const list = draft[key]
    if (list.includes(item.id)) return setDraft({ ...draft, [key]: list.filter((x) => x !== item.id) })
    if (list.length >= max) return
    setDraft({ ...draft, [key]: [...list, item.id] })
    hop(figure.current)
    bursts.add(item.emoji)
  }
  const surprise = () => {
    setDraft((d) => ({
      ...d,
      species: pick(SPECIES).id,
      color: pick(COLORS).id,
      head: pick(HEADS).id,
      face: pick(FACES).id,
      neck: pick(NECKS).id,
      pattern: Math.random() < 0.25 ? 'alebrije' : 'liso',
    }))
    hop(figure.current)
    bursts.add('✨')
  }

  useEffect(() => {
    // Al cambiar de parte, su pestaña se asoma completa y la lista empieza desde arriba.
    if (!arrived.current) {
      arrived.current = true
      return
    }
    const behavior = still() ? 'auto' : 'smooth'
    const chip = bar.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (bar.current && chip) {
      bar.current.scrollTo({ left: chip.offsetLeft - (bar.current.clientWidth - chip.offsetWidth) / 2, behavior })
    }
    window.scrollTo({ top: 0, behavior })
  }, [part])

  const name = companionName(draft)
  const traits = TRAITS.filter((t) => draft.traits.includes(t.id))
  const index = PARTS.findIndex((p) => p.value === part)
  const next = PARTS[index + 1]
  const creating = !onCancel

  const looks = <K extends 'species' | 'head' | 'face' | 'neck'>(
    key: K,
    options: readonly { id: Companion[K]; label: string }[],
  ) => (
    <div className="looks" role="radiogroup" aria-label={PARTS[index].title}>
      {options.map((o) => (
        <LookTile
          key={o.id}
          look={{ ...draft, [key]: o.id }}
          label={o.label}
          on={draft[key] === o.id}
          onPick={() => set(key, o.id)}
        />
      ))}
    </div>
  )

  return (
    <div className="stack editor">
      <div className="avatar-stage" style={{ '--tint': draft.color } as CSSProperties}>
        <div className="avatar-spot">
          <div className="avatar-float">
            <div ref={figure}>
              <CompanionView look={draft} mood="feliz" size={132} name={name} />
            </div>
          </div>
          {bursts.view}
          {part === 'nombre' && (
            <p className="avatar-bubble" aria-hidden="true">
              ¡Hola! Soy {name}
            </p>
          )}
          <button
            type="button"
            className="avatar-dice"
            onClick={surprise}
            aria-label="Sorpréndeme: elegir forma, color y cosas al azar"
          >
            <Dices size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <strong className="avatar-name">{name}</strong>
        <div className="part-bar" ref={bar}>
          <JellyRadio
            items={PARTS}
            value={part}
            onChange={(v) => setPart(v as Part)}
            ariaLabel="Qué quieres elegir"
            size="md"
            swell={0.12}
            chipColor="var(--surface-soft)"
            textColor="var(--text)"
            activeColor="var(--primary)"
            activeTextColor="var(--primary-ink)"
          />
        </div>
      </div>

      <section className="card avatar-panel">
        <h2>{PARTS[index].title}</h2>

        {part === 'forma' && looks('species', SPECIES)}

        {part === 'color' && (
          <>
            <div className="swatches wrap big" role="radiogroup" aria-label="Color">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={draft.color === c.id}
                  aria-label={c.label}
                  className={`swatch ${draft.color === c.id ? 'selected' : ''}`}
                  style={{ background: c.id }}
                  onClick={() => set('color', c.id)}
                />
              ))}
            </div>
            <p className="muted small">{COLORS.find((c) => c.id === draft.color)?.label}</p>
            <h3>Su estilo</h3>
            <div className="looks" role="radiogroup" aria-label="Su estilo">
              {PATTERN_OPTIONS.map((o) => (
                <LookTile
                  key={o.id}
                  look={{ ...draft, pattern: o.id }}
                  label={o.label}
                  on={(draft.pattern ?? 'liso') === o.id}
                  onPick={() => set('pattern', o.id)}
                />
              ))}
            </div>
            <p className="muted small">El alebrije lleva figuras de colores, como las artesanías mexicanas.</p>
          </>
        )}

        {part === 'cabeza' && looks('head', HEADS)}
        {part === 'cara' && looks('face', FACES)}
        {part === 'cuello' && looks('neck', NECKS)}

        {part === 'nombre' && (
          <>
            <input
              value={draft.name}
              maxLength={16}
              placeholder="Nubi"
              aria-label="Nombre de tu mascota"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <div className="chips">
              {NAME_IDEAS.map((n) => (
                <button key={n} className={`chip ${draft.name === n ? 'selected' : ''}`} onClick={() => set('name', n)}>
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        {part === 'ser' && (
          <>
            <p className="muted small">
              Elige hasta {MAX_TRAITS}, lo bonito y también lo difícil. Puedes cambiarlo cuando quieras: las
              personas también cambian.
            </p>
            <div className="chips">
              {TRAITS.map((t) => {
                const on = draft.traits.includes(t.id)
                return (
                  <button
                    key={t.id}
                    className={`chip ${on ? 'selected' : ''}`}
                    aria-pressed={on}
                    disabled={!on && draft.traits.length >= MAX_TRAITS}
                    onClick={() => toggle('traits', t, MAX_TRAITS)}
                  >
                    {t.emoji} {t.label}
                  </button>
                )
              })}
            </div>
            {traits.length > 0 && (
              <p className="mix-line">Una mezcla de {listJoin(traits.map((t) => t.label.toLowerCase()))}.</p>
            )}
          </>
        )}

        {part === 'gustos' && (
          <>
            <p className="muted small">Lo que te gusta, o lo que te gustaba antes, aunque hoy no te den ganas.</p>
            <div className="chips">
              {LIKES.map((l) => {
                const on = draft.likes.includes(l.id)
                return (
                  <button
                    key={l.id}
                    className={`chip ${on ? 'selected' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggle('likes', l)}
                  >
                    {l.emoji} {capitalize(l.label)}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>

      <div className="editor-foot">
        {creating && next ? (
          <>
            <button className="btn" onClick={() => setPart(next.value)}>
              Siguiente: {next.label}
            </button>
            <button className="btn ghost" onClick={() => onSave(draft)}>
              Listo
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => onSave(draft)}>
              {creating ? 'Listo' : 'Guardar'}
            </button>
            {onCancel && (
              <button className="btn ghost" onClick={onCancel}>
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Questions({
  companion,
  onDone,
  onCancel,
}: {
  companion: Companion
  onDone: (answers: Record<string, number>) => void
  onCancel: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [index, setIndex] = useState(-1)
  const name = companionName(companion)

  if (index === -1) {
    return (
      <section className="card center">
        <CompanionView look={companion} mood="calma" size={130} name={name} />
        <h2>¿Cómo ha estado {name} estas 2 semanas?</h2>
        <p className="muted">
          {name} te representa: responde pensando en ti. Son {QUESTIONS.length} preguntas cortas, unos 3
          minutos. No hay respuestas buenas ni malas, y puedes parar cuando quieras.
        </p>
        <button className="btn big" onClick={() => setIndex(0)}>
          Empezar
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Ahora no
        </button>
      </section>
    )
  }

  const q = QUESTIONS[index]
  const answer = (value: number) => {
    const next = { ...answers, [q.id]: value }
    setAnswers(next)
    if (index + 1 < QUESTIONS.length) setIndex(index + 1)
    else onDone(next)
  }

  return (
    <section className="card center">
      <div className="progress full" aria-hidden="true">
        <span style={{ width: `${(index / QUESTIONS.length) * 100}%` }} />
      </div>
      <small className="muted">
        Pregunta {index + 1} de {QUESTIONS.length}
      </small>
      <CompanionView look={companion} mood={moodFromAnswers(answers)} size={110} name={name} />
      <p className="muted">En las últimas 2 semanas…</p>
      <h2 className="question">
        ¿Qué tan seguido {name} {q.text}?
      </h2>
      <div className="answers">
        {ANSWERS.map((a) => (
          <button
            key={a.value}
            className={`btn ${answers[q.id] === a.value ? '' : 'ghost'}`}
            onClick={() => answer(a.value)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="row spread full">
        <button className="btn small ghost" onClick={() => setIndex(index - 1)}>
          ← Atrás
        </button>
        <button className="btn small ghost" onClick={onCancel}>
          Salir
        </button>
      </div>
    </section>
  )
}

function Meter({ label, hint, value, max, level, tone }: { label: string; hint: string; value: number; max: number; level: string; tone: 'blue' | 'amber' }) {
  return (
    <div className="meter">
      <div className="row spread">
        <strong>{label}</strong>
        <span className="muted small">{level}</span>
      </div>
      <div className="progress">
        <span className={tone} style={{ width: `${Math.max(3, (value / max) * 100)}%` }} />
      </div>
      <small className="muted">
        {hint} · {value} de {max}
      </small>
    </div>
  )
}

function Mix({ review }: { review: Review }) {
  const { phq, gad } = scores(review.answers)
  return (
    <div className="stack tight">
      <Meter label="Ánimo bajo" hint="Señales de depresión (PHQ-9)" value={phq} max={PHQ_MAX} level={SIGNALS[phqLevel(phq)]} tone="blue" />
      <Meter label="Nervios" hint="Señales de ansiedad (GAD-7)" value={gad} max={GAD_MAX} level={SIGNALS[gadLevel(gad)]} tone="amber" />
    </div>
  )
}

const MEANING: Record<ReturnType<typeof mixKind>, (name: string) => string> = {
  mezcla: (name) =>
    `Lo que carga ${name} se parece a una mezcla de depresión y ansiedad. Es muy común que vengan juntas, y las dos tienen tratamiento.`,
  depresion: (name) =>
    `Lo que carga ${name} se parece sobre todo a la depresión: el ánimo bajo, el cansancio, no disfrutar lo que antes gustaba.`,
  ansiedad: (name) =>
    `Lo que carga ${name} se parece sobre todo a la ansiedad: la preocupación que no para, los nervios, no poder relajarse.`,
  leve: (name) =>
    `${name} carga algunas señales de ánimo bajo o de nervios. No es poca cosa: vale la pena estar al pendiente.`,
  pocas: (name) =>
    `${name} carga pocas señales de depresión o de ansiedad por ahora. Si aun así te sientes mal, también cuenta: lo que sientes importa.`,
}

function Result({ review, previous, companion }: { review: Review; previous?: Review; companion: Companion }) {
  const name = companionName(companion)
  const { phq, gad, risk } = scores(review.answers)
  const kind = mixKind(phq, gad)
  const strong = phq >= 20 || gad >= 15
  const before = previous ? scores(previous.answers) : undefined

  return (
    <div className="stack">
      {risk && (
        <section className="card emergency" role="alert">
          <h2>Gracias por decirlo</h2>
          <p>
            Respondiste que {name} ha pensado en morir, en desaparecer o en hacerse daño. Como {name} te
            representa, eso habla de ti, y decirlo es muy valiente. No tienes que esperar a la consulta
            ni estar en peligro para llamar: hay alguien que puede escucharte hoy.
          </p>
          <div className="row">
            <Link to="/ayuda" className="btn">
              Hablar con alguien ahora
            </Link>
            <Link to="/mi-espacio/plan" className="btn ghost">
              Mi plan de seguridad
            </Link>
          </div>
        </section>
      )}

      <section className="card center">
        <CompanionView look={companion} mood={moodFromAnswers(review.answers)} size={150} name={name} aura={auraOf(review)} />
        <h2>La mezcla de {name}</h2>
        <p>{MEANING[kind](name)}</p>
        <small className="muted">
          {kind === 'pocas'
            ? 'El verde a su alrededor es calma: pocas señales.'
            : 'El color a su alrededor es su mezcla: azul por el ánimo bajo, amarillo por los nervios.'}
        </small>
      </section>

      <section className="card">
        <Mix review={review} />
        {previous && before && (
          <p className="muted small">
            La vez anterior ({ago(previous.date)}): ánimo bajo {before.phq}, nervios {before.gad}.{' '}
            {phq <= before.phq - 5 || gad <= before.gad - 5
              ? 'Va mejorando. Lo que estás haciendo cuenta.'
              : phq >= before.phq + 5 || gad >= before.gad + 5
                ? 'Ahora carga más que antes. Es buen momento para pedir apoyo.'
                : 'Se mantiene parecido.'}
          </p>
        )}
      </section>

      {kind === 'mezcla' || kind === 'depresion' || kind === 'ansiedad' ? (
        <div className="callout warm">
          <p>
            <strong>Esto no es un diagnóstico</strong>, pero sí una señal clara de que mereces ayuda.
            {strong ? ' Vale la pena buscarla pronto, esta misma semana si puedes.' : ''} Con estas
            respuestas, un especialista puede orientarte mejor: van solas en tu resumen para la consulta.
          </p>
          <Link to="/especialista" className="btn">
            Dar el primer paso
          </Link>
        </div>
      ) : kind === 'leve' ? (
        <div className="callout info">
          <p>
            Si sigue igual en dos semanas, o si ya te pesa en tu día a día, habla con un especialista.
            Puedes volver a preguntarle a {name} para ver cómo cambia.
          </p>
          <Link to="/especialista" className="btn ghost">
            Cómo llegar al especialista
          </Link>
        </div>
      ) : null}

      <p className="disclaimer">
        Las preguntas vienen del PHQ-9 y del GAD-7, cuestionarios que usan médicos de todo el mundo para
        orientarse. Aquí sirven para conocerte mejor, no para diagnosticar: eso solo puede hacerlo un
        especialista.
      </p>
    </div>
  )
}

type Mode = 'ver' | 'editar' | 'preguntas' | 'resultado'

export default function Mascota() {
  const { companion, setCompanion, mood, setMood, reviews, setReviews, latest } = useCompanion()
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const mode = (params.get('modo') ?? 'ver') as Mode
  const [welcome, setWelcome] = useState(false)
  const [hello, setHello] = useState('')
  const petted = useRef<HTMLDivElement>(null)
  const bursts = useBursts()
  const { got, lived, fresh, markSeen } = useMoments()
  const gift = useGift()
  const [reasons] = useStored<JournalEntry[]>('razones', [])
  const [moods] = useStored<MoodEntry[]>('moods', [])
  const period = usePeriod()
  const [awake, setAwake] = useState(false)
  const [news, setNews] = useState<Moment[]>([])
  const [unwrapped, setUnwrapped] = useState(false)
  const [allMoments, setAllMoments] = useState(false)

  // Arreglarla, preguntarle y ver el resultado son pasos del historial: el botón de atrás
  // del teléfono regresa con la mascota en vez de sacar a la persona de la pantalla.
  const open = (next: Mode) => setParams({ modo: next }, { state: { inside: true } })
  const close = () => (state?.inside ? navigate(-1) : setParams({}, { replace: true }))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [mode])

  useEffect(() => {
    if (!hello) return
    const timer = setTimeout(() => setHello(''), Math.max(2600, hello.length * 70))
    return () => clearTimeout(timer)
  }, [hello])

  // Lo nuevo en su rincón se cuenta una sola vez, y brilla mientras dura esta visita.
  const freshIds = fresh.map((m) => m.id).join()
  useEffect(() => {
    if (!freshIds || !companion || mode !== 'ver') return
    setNews((all) => [...all, ...fresh.filter((m) => !all.some((n) => n.id === m.id))])
    markSeen()
  }, [freshIds, !!companion, mode])

  if (!companion || mode === 'editar') {
    return (
      <div className="stack">
        <PageHeader
          title={companion ? `Cambiar a ${companionName(companion)}` : 'Tu mascota'}
          subtitle={
            companion
              ? undefined
              : 'Crea a alguien que te represente. A veces es más fácil contar cómo está tu mascota que cómo estás tú.'
          }
        />
        <Editor
          initial={companion ?? DEFAULT_COMPANION}
          onSave={(c) => {
            setCompanion(c)
            if (!companion) {
              setWelcome(true)
              markMoment('conocernos')
            }
            if (mode === 'editar') close()
          }}
          onCancel={companion ? close : undefined}
        />
      </div>
    )
  }

  const name = companionName(companion)

  if (mode === 'preguntas') {
    return (
      <div className="stack">
        <Questions
          companion={companion}
          onCancel={close}
          onDone={(answers) => {
            const review: Review = { id: newId(), date: today(), answers }
            // Si responde dos veces el mismo día, cuenta la última.
            setReviews((all) => [review, ...all.filter((r) => r.date !== review.date)])
            // El resultado toma el lugar de las preguntas: atrás ya no regresa a contestarlas.
            setParams({ modo: 'resultado' }, { replace: true, state })
          }}
        />
      </div>
    )
  }

  if (mode === 'resultado' && latest) {
    return (
      <div className="stack">
        <PageHeader title={`Cómo ha estado ${name}`} subtitle={`Tus respuestas de ${ago(latest.date)}.`} />
        <Result review={latest} previous={reviews[1]} companion={companion} />
        <button className="btn ghost" onClick={close}>
          Volver con {name}
        </button>
      </div>
    )
  }

  const tip = MOOD_TIPS[mood]
  const traits = TRAITS.filter((t) => companion.traits.includes(t.id))
  const likes = LIKES.filter((l) => companion.likes.includes(l.id))
  const due = !latest || daysSince(latest.date) >= REVIEW_EVERY_DAYS

  // De noche se duerme en su camita y te invita a descansar. Si hoy pesa, se queda despierta
  // contigo; y si la tocas, se despierta para acompañarte.
  const night = period === 'noche'
  const heavy =
    (moods.find((m) => m.date === today())?.mood ?? 3) <= 2 || mood === 'triste' || mood === 'apagado' || mood === 'nervios'
  const asleep = night && !heavy && !awake
  const said = hello || (night && heavy && !awake ? 'Hoy no me duermo: me quedo contigo.' : '')
  const idle = asleep
    ? `${name} se durmió. Tú también mereces descansar.`
    : gift.waiting
      ? `${name} te trajo algo. Toca la cajita para abrirlo.`
      : `Toca a ${name} para hacerle cariño.`
  const grew = news.length > 0 && plantStage(lived.length) > plantStage(lived.length - news.length)
  const album = [...lived].reverse()
  const opened = gift.gift?.opened && !gift.gift.thanked ? gift.gift : null

  const pet = () => {
    hop(petted.current)
    if (asleep) {
      setAwake(true)
      setHello('Aquí estoy. ¿No puedes dormir? Te acompaño.')
      return
    }
    bursts.add('💗')
    petSound(companion.species)
    setHello(pick(PET_PHRASES.filter((h) => h !== hello)))
  }
  const unwrap = () => {
    gift.open()
    setUnwrapped(true)
    hop(petted.current)
    bursts.add('🎁')
  }
  const thanks = () => {
    gift.thank()
    setAwake(true)
    window.scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' })
    hop(petted.current)
    bursts.add('💗')
    petSound(companion.species)
    setHello('Lo guardaste tú: yo solo te lo traje.')
  }

  return (
    <div className="stack">
      <PageHeader title={name} subtitle="Tu mascota te representa: cuando cambias tú, cambia también." />

      <section className="card center pet-home">
        <PetRoom
          name={name}
          got={got}
          reasons={reasons.length}
          period={period}
          fresh={news.map((m) => m.id)}
          gift={gift.waiting ? unwrap : undefined}
        >
          <div className="avatar-spot">
            <button
              type="button"
              className="pet"
              onClick={pet}
              aria-label={asleep ? `Despertar a ${name}: se durmió en su camita` : `Hacerle cariño a ${name}`}
            >
              <div ref={petted}>
                <CompanionView
                  look={companion}
                  mood={asleep ? 'cansado' : mood}
                  size={180}
                  name={name}
                  aura={latest ? auraOf(latest) : undefined}
                />
              </div>
            </button>
            {bursts.view}
          </div>
        </PetRoom>
        {welcome && (
          <p className="callout info">
            Hola, soy {name}. Voy a estar contigo, en los días buenos y en los difíciles. Me vas a ver
            flotando en las demás pantallas: tócame cuando quieras.
          </p>
        )}
        <p className={`pet-line ${said ? 'said' : 'muted small'}`} aria-live="polite">
          {said ? `«${said}»` : idle}
        </p>
        {night && (
          <div className="pet-night">
            {asleep && <small className="muted">Si no puedes dormir, toca a {name}: se despierta para acompañarte.</small>}
            <Link to="/noche" className="btn small ghost">
              Prepararme para dormir
            </Link>
          </div>
        )}
        {news.length > 0 && (
          <div className="room-news">
            <strong>✨ Nuevo en su rincón</strong>
            {news.length > 3 ? (
              // La primera vez, con todo lo que ya había hecho, llega mucho junto: se cuenta en una línea.
              <p>
                Se llenó con lo que ya han vivido juntos: {news.length} cosas nuevas
                {grew ? ' y su plantita creció' : ''}. Cada una está en «Nuestros momentos».
              </p>
            ) : (
              <ul>
                {news.map((m) => (
                  <li key={m.id}>
                    {capitalize(m.item)} <small className="muted">· {m.title}</small>
                  </li>
                ))}
                {grew && (
                  <li>
                    Su plantita creció <small className="muted">· con todo lo que han vivido</small>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
        {traits.length > 0 && (
          <>
            <p className="mix-line">Una mezcla de {listJoin(traits.map((t) => t.label.toLowerCase()))}.</p>
            <div className="tags">
              {traits.map((t) => (
                <span key={t.id} className="tag">
                  {t.emoji} {t.label}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {opened && <PetGift gift={opened} name={name} reveal={unwrapped} onThanks={thanks} />}

      <section className="card">
        <h2>¿Cómo está {name} hoy?</h2>
        <div className="moods mascot-moods" role="radiogroup" aria-label={`Cómo está ${name} hoy`}>
          {MOOD_STATES.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={mood === m.id}
              className={`mood ${mood === m.id ? 'selected' : ''}`}
              onClick={() => setMood(m.id)}
            >
              <span aria-hidden="true">{m.emoji}</span>
              <small>{m.label}</small>
            </button>
          ))}
        </div>
        {tip && (
          <div className="callout info">
            <p>{tip.text}</p>
            <Link to={tip.to} className="btn small ghost">
              {tip.action}
            </Link>
          </div>
        )}
      </section>

      {album.length > 0 && (
        <section className="card">
          <h2>Nuestros momentos</h2>
          <p className="muted small">
            Cada cosa en su rincón es algo que vivieron juntos. Ningún momento se pierde: si un día no
            vienes, {name} te espera igual.
          </p>
          <ol className="album">
            {(allMoments ? album : album.slice(0, 3)).map((m) => (
              <li key={m.id}>
                <span className="album-emoji" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="album-text">
                  <small>{albumDate(got[m.id]!)}</small>
                  <strong>{m.title}</strong>
                  <span>{m.text}</span>
                </span>
              </li>
            ))}
          </ol>
          {album.length > 3 && (
            <button className="btn small ghost" aria-expanded={allMoments} onClick={() => setAllMoments(!allMoments)}>
              {allMoments ? 'Ver menos' : `Ver los ${album.length} momentos`}
            </button>
          )}
          {album.length < MOMENTS.length && <small className="muted">Quedan más cosas por descubrir juntos, sin prisa.</small>}
        </section>
      )}

      {likes.length > 0 && (
        <section className="card">
          <h2>Lo que le gusta a {name}</h2>
          <p className="muted small">Cuando nada emociona, volver a algo conocido cuesta menos que buscar algo nuevo.</p>
          <div className="grid">
            {likes.map((l) => (
              <LikeLink key={l.id} like={l} className="tile">
                <span className="tile-emoji" aria-hidden="true">
                  {l.emoji}
                </span>
                <strong>{capitalize(l.label)}</strong>
              </LikeLink>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>¿Cómo ha estado {name} estas 2 semanas?</h2>
        {latest ? (
          <>
            <Mix review={latest} />
            <small className="muted">Le preguntaste {ago(latest.date)}.</small>
          </>
        ) : (
          <p className="muted">
            {QUESTIONS.length} preguntas cortas para conocer lo que carga {name}. Te ayudan a saber si lo
            que sientes se parece a la depresión, a la ansiedad o a una mezcla de las dos.
          </p>
        )}
        {latest && scores(latest.answers).risk && (
          <Link to="/ayuda" className="btn">
            Hablar con alguien ahora
          </Link>
        )}
        <div className="row">
          <button className={`btn ${due ? '' : 'ghost'}`} onClick={() => open('preguntas')}>
            {!latest ? 'Preguntarle' : due ? 'Ya pasaron 2 semanas: preguntarle otra vez' : 'Preguntarle otra vez'}
          </button>
          {latest && (
            <button className="btn ghost" onClick={() => open('resultado')}>
              Qué significa
            </button>
          )}
        </div>
      </section>

      {reviews.length > 1 && (
        <section className="card">
          <h2>Cómo ha cambiado</h2>
          <ul className="history">
            {reviews.slice(0, 8).map((r) => {
              const s = scores(r.answers)
              return (
                <li key={r.id}>
                  <small className="muted">{new Date(r.date + 'T12:00').toLocaleDateString('es', { dateStyle: 'medium' })}</small>
                  <span>
                    Ánimo bajo: {SIGNALS[phqLevel(s.phq)].toLowerCase()} · Nervios: {SIGNALS[gadLevel(s.gad)].toLowerCase()}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <button className="btn ghost" onClick={() => open('editar')}>
        Cambiar cómo es {name}
      </button>
    </div>
  )
}
