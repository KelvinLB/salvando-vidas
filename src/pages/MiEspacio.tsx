import { useEffect, useState } from 'react'
import { ChevronRight, Settings } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { companionName } from '../data/companion'
import { MOODS } from '../data/content'
import { PLAN_STEPS } from '../data/plan'
import { useCompanion } from '../lib/companion'
import { planDone, useDayPlans } from '../lib/dayplan'
import { listThoughts } from '../lib/db'
import { dayTitle } from '../lib/diary'
import { firstName, usePeople } from '../lib/people'
import { usePlan } from '../lib/plan'
import { lastDays, moodTrend } from '../lib/progress'
import { type JournalEntry, type Letter, type Medication, type MoodEntry, today, useStored } from '../lib/storage'
import { TrendBadge } from './espacio/ComoVoy'

// Mi espacio: lo personal, ordenado por para qué sirve. Cada renglón dice cómo va, para que
// se entienda sin entrar. Los ajustes quedan aparte, detrás del engrane.

// Antes había pestañas: los enlaces viejos con ?tab= siguen llegando a su lugar.
const OLD_TABS: Record<string, string> = {
  plan: '/mi-espacio/plan',
  razones: '/mi-espacio/caja',
  diario: '/diario',
  tratamiento: '/mi-espacio/medicamentos',
  ajustes: '/mi-espacio/ajustes',
}

function Row({ to, emoji, title, status }: { to: string; emoji: string; title: string; status: string }) {
  return (
    <Link to={to} className="space-row">
      <span className="tile-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="space-text">
        <strong>{title}</strong>
        <small>{status}</small>
      </span>
      <ChevronRight size={20} aria-hidden="true" />
    </Link>
  )
}

/** La semana en caritas y hacia dónde va; lleva a «Cómo voy». */
function HowAmI() {
  const [moods] = useStored<MoodEntry[]>('moods', [])
  const days = lastDays(7)
  const mood = new Map(moods.map((m) => [m.date, m.mood]))
  const trend = moodTrend(moods)
  const marked = days.filter((d) => mood.has(d)).length

  return (
    <Link to="/mi-espacio/como-voy" className="card link-card how-am-i">
      <div className="row spread">
        <h2>Cómo voy</h2>
        {trend && <TrendBadge trend={trend} />}
      </div>
      {marked ? (
        <div className="mood-week" aria-label={`Marcaste ${marked} de los últimos 7 días`}>
          {days.map((d) => (
            <span key={d}>
              <span aria-hidden="true">{MOODS.find((m) => m.value === mood.get(d))?.emoji ?? '·'}</span>
              <small aria-hidden="true">{dayTitle(d).short.charAt(0).toUpperCase()}</small>
            </span>
          ))}
        </div>
      ) : (
        <p className="muted small">Marca cómo te sientes en Inicio y aquí vas a ver tu camino, sin rachas ni calificaciones.</p>
      )}
    </Link>
  )
}

export default function MiEspacio() {
  const [params] = useSearchParams()
  const { ready } = usePlan()
  const { people } = usePeople()
  const { companion } = useCompanion()
  const { today: todayPlan } = useDayPlans()
  const [reasons] = useStored<JournalEntry[]>('razones', [])
  const [letter] = useStored<Letter | null>('carta', null)
  const [moods] = useStored<MoodEntry[]>('moods', [])
  const [steps] = useStored<Record<string, boolean>>('camino', {})
  const [meds] = useStored<Medication[]>('meds', [])
  const [taken] = useStored<string[]>('meds-tomados', [])
  const [photos, setPhotos] = useState(0)

  useEffect(() => {
    listThoughts().then((all) => setPhotos(all.filter((t) => t.photo).length))
  }, [])

  const old = OLD_TABS[params.get('tab') ?? '']
  if (old) return <Navigate to={old} replace />

  const named = people.filter((p) => p.name.trim())
  const walked = Object.values(steps).filter(Boolean).length
  const box = [
    reasons.length && (reasons.length === 1 ? '1 razón' : `${reasons.length} razones`),
    photos && (photos === 1 ? '1 foto' : `${photos} fotos`),
    letter && 'tu carta',
  ].filter(Boolean)
  const tasksDone = todayPlan?.tasks.filter((t) => t.done).length ?? 0
  const low = (moods.find((m) => m.date === today())?.mood ?? 3) <= 2

  return (
    <div className="stack">
      <PageHeader
        title="Mi espacio"
        subtitle="Solo tuyo. Privado y guardado en este teléfono."
        action={
          <Link to="/mi-espacio/ajustes" className="btn small ghost">
            <Settings size={18} aria-hidden="true" />
            Ajustes
          </Link>
        }
      />

      {low && letter && (
        <Link to="/mi-espacio/caja" className="card link-card emergency-soft">
          <h2>💌 Tienes una carta tuya para hoy</h2>
          <p className="muted">La escribiste en un día bueno, justo para un día así.</p>
        </Link>
      )}

      <HowAmI />

      <h2 className="section-title">Para los días difíciles</h2>
      <div className="space-list">
        <Row
          to="/mi-espacio/plan"
          emoji="🛟"
          title="Mi plan de seguridad"
          status={ready === 0 ? 'Seis preguntas, una a la vez' : ready === PLAN_STEPS.length ? 'Completo' : `${ready} de ${PLAN_STEPS.length} pasos listos`}
        />
        <Row
          to="/mi-espacio/caja"
          emoji="💛"
          title="Mi caja de esperanza"
          status={box.length ? box.join(' · ') : 'Tus razones, tus fotos y una carta para ti'}
        />
        <Row
          to="/mi-espacio/personas"
          emoji="📞"
          title="Mis personas"
          status={named.length ? named.map(firstName).join(', ') : 'A quién llamar con un toque'}
        />
      </div>

      <h2 className="section-title">Mi tratamiento</h2>
      <div className="space-list">
        <Row
          to="/especialista"
          emoji="🩺"
          title="Camino al especialista"
          status={walked === 0 ? 'Pasos pequeños y un resumen para tu consulta' : walked >= 5 ? 'Los cinco pasos dados' : `Llevas ${walked} de 5 pasos`}
        />
        <Row
          to="/mi-espacio/medicamentos"
          emoji="💊"
          title="Mis medicamentos"
          status={!meds.length ? 'Lo que tomas y lo que notas' : taken.includes(today()) ? 'Tomado hoy ✓' : '¿Ya lo tomaste hoy?'}
        />
      </div>

      <h2 className="section-title">Mi día a día</h2>
      <div className="space-list">
        <Row
          to="/mi-dia"
          emoji="☀️"
          title="Mi día"
          status={
            !todayPlan
              ? 'Un plan pequeño con premio al final'
              : planDone(todayPlan)
                ? 'Día logrado ✓'
                : `${tasksDone} de ${todayPlan.tasks.length} cosas hechas hoy`
          }
        />
        <Row
          to="/mascota"
          emoji="🐾"
          title="Mi mascota"
          status={companion ? `${companionName(companion)} te acompaña` : 'Alguien que te represente'}
        />
      </div>

      <p className="space-more">
        Más: <Link to="/redes">Lo que se dice en redes</Link> · <Link to="/opinion">Tu opinión</Link>
      </p>
    </div>
  )
}
