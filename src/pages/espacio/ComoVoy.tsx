import { useEffect, useState } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import ReminderCard from '../../components/ReminderCard'
import { companionName } from '../../data/companion'
import { MOODS } from '../../data/content'
import type { BodyRecord } from '../../lib/bodyCheck'
import { GAD_MAX, PHQ_MAX, REVIEW_EVERY_DAYS, daysSince, scores, useCompanion } from '../../lib/companion'
import { type DayPlan, planDone } from '../../lib/dayplan'
import { listThoughts } from '../../lib/db'
import { fearSummary, usePanicLog } from '../../lib/panico'
import { dayOf, dayTitle } from '../../lib/diary'
import { type Move, type Trend, TREND_WORDS, agoWords, lastDays, moodTrend, reviewChange } from '../../lib/progress'
import { type Medication, type MoodEntry, localDate, useStored } from '../../lib/storage'

// Cómo voy: el camino visto desde lejos, con lo que la persona ya marca en la app. Sin rachas
// ni calificaciones. Si algo va más pesado se dice con calma y se ofrece apoyo, nunca un regaño.

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Cuatro semanas de lunes a domingo; la última es esta, con los días que faltan en blanco. */
function weeks() {
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 21)
  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return localDate(d)
  })
}

const TREND_ICON = { mejor: TrendingUp, parejo: Minus, pesado: TrendingDown }

export function TrendBadge({ trend }: { trend: Trend }) {
  const Icon = TREND_ICON[trend]
  return (
    <span className={`trend ${trend}`}>
      <Icon size={16} aria-hidden="true" />
      {TREND_WORDS[trend]}
    </span>
  )
}

function MoodMonth({ moods }: { moods: MoodEntry[] }) {
  const [picked, setPicked] = useState<string>()
  const today = localDate()
  const days = weeks()
  const mood = new Map(moods.map((m) => [m.date, m.mood]))
  const marked = days.filter((d) => mood.has(d))
  const count = (test: (v: number) => boolean) => marked.filter((d) => test(mood.get(d)!)).length
  const trend = moodTrend(moods)
  const label = (d: string) => MOODS.find((m) => m.value === mood.get(d))

  return (
    <section className="card">
      <div className="row spread">
        <h2>Tu ánimo</h2>
        {trend && <TrendBadge trend={trend} />}
      </div>
      <p className="muted small">Cuatro semanas. Cada carita es un día que marcaste en Inicio o en tu diario.</p>

      <div className="mood-month">
        {WEEKDAYS.map((w, i) => (
          <small key={i} className="mood-weekday" aria-hidden="true">
            {w}
          </small>
        ))}
        {days.map((d) => {
          const t = dayTitle(d)
          const m = label(d)
          if (d > today) return <span key={d} className="mood-cell future" aria-hidden="true" />
          return (
            <button
              key={d}
              className={`mood-cell ${d === picked ? 'picked' : ''} ${d === today ? 'today' : ''}`}
              aria-label={`${t.weekday} ${t.date}: ${m ? m.label : 'sin marcar'}`}
              aria-pressed={d === picked}
              onClick={() => setPicked(d === picked ? undefined : d)}
            >
              <span aria-hidden="true">{m ? m.emoji : '·'}</span>
              <small aria-hidden="true">{t.number}</small>
            </button>
          )
        })}
      </div>

      <p className="mood-readout" aria-live="polite">
        {picked
          ? `${dayTitle(picked).weekday} ${dayTitle(picked).date}: ${label(picked) ? `${label(picked)!.emoji} ${label(picked)!.label}` : 'sin marcar'}`
          : marked.length
            ? `Marcaste ${marked.length} de estos días: ${count((v) => v >= 4)} bien, ${count((v) => v === 3)} regular y ${count((v) => v <= 2)} mal.`
            : 'Todavía no hay días marcados. Marca cómo te sientes en Inicio y aquí vas a ir viendo tu camino.'}
      </p>

      {trend === 'pesado' && (
        <div className="callout warm">
          <p>
            Estos días han pesado más que los anteriores. No es tu culpa ni un retroceso: es una señal para
            cuidarte un poco más, y para no cargarlo a solas.
          </p>
          <div className="row">
            <Link to="/mi-espacio/plan" className="btn small ghost">
              Mi plan para días difíciles
            </Link>
            <Link to="/ayuda" className="btn small ghost">
              Hablar con alguien
            </Link>
          </div>
        </div>
      )}
      {trend === 'mejor' && <p className="small">Algo de lo que estás haciendo te está ayudando. Date crédito por eso.</p>}
    </section>
  )
}

/** Antes y ahora en la misma regla: el punto claro es antes, el oscuro es ahora. */
function Dumbbell({ label, then, now, max }: { label: string; then: number; now: number; max: number }) {
  const at = (v: number) => `${(v / max) * 100}%`
  const [lo, hi] = then < now ? [then, now] : [now, then]
  return (
    <div className="dumbbell">
      <p>
        <strong>{label}</strong>{' '}
        <span className="muted">
          {then} → {now} de {max}
        </span>
      </p>
      <div className="dumbbell-track" aria-hidden="true">
        <span className="dumbbell-span" style={{ left: at(lo), width: `calc(${at(hi)} - ${at(lo)})` }} />
        <i className="then" style={{ left: at(then) }} />
        <i className="now" style={{ left: at(now) }} />
      </div>
      <div className="dumbbell-ends" aria-hidden="true">
        <small>Pocas señales</small>
        <small>Muchas</small>
      </div>
    </div>
  )
}

const MOVE_WORDS: Record<Move, string> = { baja: 'bajaron', igual: 'se mantuvieron', sube: 'subieron' }

function Reviews() {
  const { companion, reviews } = useCompanion()
  const name = companion ? companionName(companion) : 'tu mascota'
  const latest = reviews[0]
  const change = reviewChange(reviews)
  const ask = companion ? '/mascota?modo=preguntas' : '/mascota'

  if (!latest) {
    return (
      <section className="card">
        <h2>Lo que carga {name}</h2>
        <p className="muted">
          Cada dos semanas, {companion ? name : 'tu mascota'} te puede hacer unas preguntas cortas sobre cómo ha estado:
          son las que usan los médicos para la depresión y la ansiedad. Aquí vas a ver cómo cambia.
        </p>
        <Link to={ask} className="btn ghost">
          {companion ? `Responder las preguntas de ${name}` : 'Crear mi mascota'}
        </Link>
      </section>
    )
  }

  const s = scores(latest.answers)
  const due = REVIEW_EVERY_DAYS - daysSince(latest.date)
  const risk = s.risk && due >= 0
  const up = change && (change.phq.move === 'sube' || change.gad.move === 'sube')
  const down = change && !up && (change.phq.move === 'baja' || change.gad.move === 'baja')

  return (
    <section className="card">
      <h2>Lo que carga {name}</h2>
      {change ? (
        <>
          <p className="muted small">
            Sus respuestas de {agoWords(change.then.date)} y de {agoWords(change.now.date)}. Te representa: lo que carga
            es lo que cargas tú.
          </p>
          <Dumbbell label="Ánimo bajo" then={change.phq.then} now={change.phq.now} max={PHQ_MAX} />
          <Dumbbell label="Nervios" then={change.gad.then} now={change.gad.now} max={GAD_MAX} />
          <p className="dumbbell-legend small">
            <i className="then" aria-hidden="true" /> {agoWords(change.then.date)}
            <i className="now" aria-hidden="true" /> {agoWords(change.now.date)}
          </p>
          <p>
            Las señales de ánimo bajo {MOVE_WORDS[change.phq.move]} y las de nervios {MOVE_WORDS[change.gad.move]}.{' '}
            {up
              ? 'No es tu culpa, y es justo lo que tu especialista necesita saber.'
              : down
                ? 'Es una buena señal: sigue con lo que te está ayudando.'
                : 'Ir parejo también es información.'}
          </p>
          {up && (
            <Link to="/especialista" className="btn small ghost">
              Preparar mi consulta
            </Link>
          )}
        </>
      ) : (
        <>
          <p className="muted small">Sus primeras respuestas, de {agoWords(latest.date)}.</p>
          <Dumbbell label="Ánimo bajo" then={s.phq} now={s.phq} max={PHQ_MAX} />
          <Dumbbell label="Nervios" then={s.gad} now={s.gad} max={GAD_MAX} />
          <p className="muted small">Cuando responda otra vez, aquí vas a ver si cambió.</p>
        </>
      )}
      {due <= 0 ? (
        <Link to={ask} className="btn ghost">
          Ya toca preguntarle a {name} otra vez
        </Link>
      ) : (
        <p className="muted small">
          La siguiente vez toca en {due === 1 ? '1 día' : `${due} días`}.
        </p>
      )}
      {risk && (
        <div className="callout warm">
          <p>
            En su última respuesta, {name} dijo que ha pensado en morir o en hacerse daño. Si esos
            pensamientos siguen ahí, no tienes que esperar a la consulta.
          </p>
          <div className="row">
            <Link to="/ayuda" className="btn small">
              Hablar con alguien ahora
            </Link>
            <Link to="/mi-espacio/plan" className="btn small ghost">
              Mi plan de seguridad
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

function Treatment() {
  const [meds] = useStored<Medication[]>('meds', [])
  const [taken] = useStored<string[]>('meds-tomados', [])
  if (!meds.length) return null
  const days = lastDays(14)
  const n = days.filter((d) => taken.includes(d)).length
  return (
    <section className="card">
      <h2>Tu medicamento</h2>
      <p>
        Lo marcaste {n} de los últimos 14 días.{' '}
        <span className="muted">Un día sin marcar no siempre es un día sin tomarlo: a veces solo se olvida anotar.</span>
      </p>
      <div className="med-days" aria-hidden="true">
        {days.map((d) => (
          <span key={d} className={taken.includes(d) ? 'on' : ''} title={d} />
        ))}
      </div>
      <Link to="/mi-espacio/medicamentos" className="btn small ghost">
        Mis medicamentos
      </Link>
    </section>
  )
}

function Care() {
  const [plans] = useStored<Record<string, DayPlan>>('mi-dia', {})
  const [body] = useStored<BodyRecord[]>('cuerpo-registros', [])
  const [written, setWritten] = useState(0)
  const days = lastDays(14)
  const since = days[0]

  useEffect(() => {
    listThoughts().then((all) => setWritten(new Set(all.map(dayOf).filter((d) => d >= since)).size))
  }, [since])

  const done = Object.values(plans).filter((p) => p.date >= since && planDone(p)).length
  const listened = body.filter((r) => r.date >= since).length
  const tiles = [
    { n: done, unit: done === 1 ? 'día' : 'días', text: 'con tu plan del día cumplido', to: '/mi-dia' },
    { n: written, unit: written === 1 ? 'día' : 'días', text: 'que escribiste en tu diario', to: '/diario' },
    { n: listened, unit: listened === 1 ? 'vez' : 'veces', text: 'que escuchaste a tu cuerpo', to: '/cuerpo' },
  ].filter((t) => t.n > 0)
  if (!tiles.length) return null

  return (
    <section className="card">
      <h2>Lo que has hecho por ti</h2>
      <p className="muted small">En las últimas dos semanas. Cada cosa cuenta, aunque haya sido poquito.</p>
      <div className="stat-tiles">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="stat-tile">
            <strong>
              {t.n} <span>{t.unit}</span>
            </strong>
            <small>{t.text}</small>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Lo que temía en cada crisis y si pasó: su propia evidencia contra el miedo. */
function PanicFears() {
  const entries = usePanicLog()
  const lines = fearSummary(entries)
  if (!lines.length) return null
  const happened = lines.some((l) => l.si > 0)
  return (
    <section className="card">
      <h2>Lo que temías y lo que pasó</h2>
      <p className="muted small">Lo que anotaste al terminar la guía de pánico.</p>
      <ul className="plain">
        {lines.map((l) => (
          <li key={l.id}>{l.text}</li>
        ))}
      </ul>
      {happened ? (
        <p className="small">Si pasó algo en tu cuerpo, cuéntaselo a tu médico. Y si te asustó, aquí seguimos.</p>
      ) : (
        <p className="small">El miedo se siente muy real, pero tu cuerpo te ha ido demostrando otra cosa.</p>
      )}
    </section>
  )
}

export default function ComoVoy() {
  const [moods] = useStored<MoodEntry[]>('moods', [])
  const recent = moods.filter((m) => m.date >= lastDays(28)[0]).length

  return (
    <div className="stack">
      <PageHeader
        title="Cómo voy"
        subtitle="Tu camino visto desde lejos, con lo que ya marcas en la app. Sin rachas ni calificaciones: los días malos también cuentan."
      />
      <MoodMonth moods={moods} />
      <Reviews />
      <Treatment />
      <Care />
      <PanicFears />
      {recent < 21 && (
        <ReminderCard
          kind="animo"
          title="¿Se te olvida marcar cómo estás?"
          text="Un aviso cada día en tu calendario, para darte un minuto. Así esta página se va llenando."
        />
      )}
      <p className="muted small">
        Todo esto también va en tu <Link to="/especialista">resumen para la consulta</Link>. Orienta; no es un
        diagnóstico.
      </p>
    </div>
  )
}
