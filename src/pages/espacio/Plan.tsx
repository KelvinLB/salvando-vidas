import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import JellyRadio from '../../components/bits/JellyRadio'
import { PlanItem } from '../../components/CrisisPlan'
import PageHeader from '../../components/PageHeader'
import PeopleEditor from '../../components/PeopleEditor'
import { PLAN_STEPS, type PlanStep } from '../../data/plan'
import { type Plan, useKnown, usePlan } from '../../lib/plan'
import { type Person, usePeople } from '../../lib/people'
import { still } from '../../lib/petfx'
import { useStored } from '../../lib/storage'

// Mi plan de seguridad. Se llena como se arma la mascota: una pregunta a la vez, con ideas que
// se agregan con un toque y lo que la app ya sabe de la persona, para no empezar en blanco.
// Escrito, se lee como una hoja y aparece en «Necesito ayuda».

/** Para mandárselo a alguien de confianza, como recomienda el plan original. */
function planText(plan: Plan, people: Person[]) {
  const lines = ['MI PLAN DE SEGURIDAD', '']
  PLAN_STEPS.forEach((s, i) => {
    const items = [
      ...(s.key === 'personas' ? people.filter((p) => p.name.trim()).map((p) => [p.name, p.phone].filter(Boolean).join(': ')) : []),
      ...(plan[s.key] ?? []),
    ]
    if (!items.length) return
    lines.push(`${i + 1}. ${s.title}`, ...items.map((item) => `- ${item}`), '')
  })
  return lines.join('\n').trim()
}

function Ideas({ title, ideas, chosen, onToggle }: { title: string; ideas: string[]; chosen: string[]; onToggle: (i: string) => void }) {
  if (!ideas.length) return null
  return (
    <div className="option-group">
      <small className="muted">{title}</small>
      <div className="chips">
        {ideas.map((idea) => {
          const on = chosen.includes(idea)
          return (
            <button key={idea} className={`chip ${on ? 'selected' : ''}`} aria-pressed={on} onClick={() => onToggle(idea)}>
              {on ? '✓ ' : '+ '}
              {idea}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepEditor({ step }: { step: PlanStep }) {
  const { plan, add, remove, toggle } = usePlan()
  const known = useKnown(step.key)
  const [faith] = useStored('fe', false)
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const items = plan[step.key] ?? []
  const ideas = [...step.ideas, ...(faith ? (step.faithIdeas ?? []) : [])].filter((i) => !known.includes(i))

  const save = () => {
    add(step.key, text)
    setText('')
  }

  // Una idea para completar se pone en el campo, con el cursor al final.
  const fill = (blank: string) => {
    setText(blank)
    requestAnimationFrame(() => {
      input.current?.focus()
      input.current?.setSelectionRange(blank.length, blank.length)
    })
  }

  return (
    <>
      {step.key === 'personas' && <PeopleEditor />}

      {step.key === 'personas' && items.length > 0 && <small className="muted">También habías anotado</small>}
      {items.length > 0 && (
        <ul className="plan-items editable">
          {items.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <button className="icon-btn" onClick={() => remove(step.key, item)} aria-label={`Quitar «${item}»`}>
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {step.key !== 'personas' && (
        <>
          <Ideas title="De lo que ya sabemos de ti" ideas={known} chosen={items} onToggle={(i) => toggle(step.key, i)} />
          <Ideas title="Ideas" ideas={ideas} chosen={items} onToggle={(i) => toggle(step.key, i)} />
          {step.blanks && (
            <div className="option-group">
              <small className="muted">Para completar</small>
              <div className="chips">
                {step.blanks.map((b) => (
                  <button key={b} className="chip" onClick={() => fill(b)}>
                    {b.replace(/: $/, '…')}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="row add-own">
            <input
              ref={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="O escribe lo tuyo…"
              aria-label="Escribe lo tuyo"
              maxLength={120}
            />
            <button className="btn small" onClick={save} disabled={!text.trim()}>
              Agregar
            </button>
          </div>
        </>
      )}
    </>
  )
}

function Guided({ index, onStep, onDone }: { index: number; onStep: (i: number) => void; onDone: () => void }) {
  const { has } = usePlan()
  const [dir, setDir] = useState(1)
  const bar = useRef<HTMLDivElement>(null)
  const step = PLAN_STEPS[index]
  const next = PLAN_STEPS[index + 1]

  // Como en el editor de la mascota: el paso se asoma completo en la barra y la pregunta, desde arriba.
  useEffect(() => {
    const behavior = still() ? 'auto' : 'smooth'
    const chip = bar.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (bar.current && chip) {
      bar.current.scrollTo({ left: chip.offsetLeft - (bar.current.clientWidth - chip.offsetWidth) / 2, behavior })
    }
    window.scrollTo({ top: 0, behavior })
  }, [index])

  const go = (i: number) => {
    setDir(i > index ? 1 : -1)
    onStep(i)
  }

  return (
    <div className="stack plan-guided">
      <PageHeader title="Mi plan de seguridad" />
      <div className="part-bar" ref={bar}>
        <JellyRadio
          items={PLAN_STEPS.map((s, i) => ({ value: s.key, label: `${has(s.key) ? '✓' : i + 1} ${s.label}` }))}
          value={step.key}
          onChange={(_, i) => go(i)}
          ariaLabel="Pasos del plan"
          size="sm"
          swell={0.12}
          chipColor="var(--surface-soft)"
          textColor="var(--text)"
          activeColor="var(--primary)"
          activeTextColor="var(--primary-ink)"
        />
      </div>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.section
          key={step.key}
          className="card plan-step"
          custom={dir}
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <small className="muted">
            Paso {index + 1} de {PLAN_STEPS.length}
          </small>
          <h2>{step.question}</h2>
          <p className="muted">{step.hint}</p>
          <StepEditor step={step} />
        </motion.section>
      </AnimatePresence>

      <div className="editor-foot">
        {next ? (
          <>
            <button className="btn" onClick={() => go(index + 1)}>
              Siguiente: {next.label}
            </button>
            <button className="btn ghost" onClick={onDone}>
              Listo
            </button>
          </>
        ) : (
          <button className="btn" onClick={onDone}>
            Listo
          </button>
        )}
      </div>
    </div>
  )
}

function Written({ onEdit, justDone }: { onEdit: (i: number) => void; justDone: boolean }) {
  const { plan, has, ready } = usePlan()
  const { people } = usePeople()
  const [copied, setCopied] = useState(false)
  const firstEmpty = PLAN_STEPS.findIndex((s) => !has(s.key))

  const share = async () => {
    const text = planText(plan, people)
    if (navigator.share) return navigator.share({ title: 'Mi plan de seguridad', text }).catch(() => {})
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Sin portapapeles: el plan sigue en pantalla.
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Mi plan de seguridad"
        subtitle="Para los días difíciles, cuando cuesta pensar con claridad. Se llena con calma, en un buen momento, y si puedes, con alguien de confianza."
      />

      {justDone && (
        <div className="callout info" role="status">
          <p>
            Guardado. Tu plan ya aparece en <Link to="/ayuda">«Necesito ayuda»</Link>, para cuando lo
            necesites. Puedes cambiarlo cuando quieras.
          </p>
        </div>
      )}

      {ready === 0 ? (
        <section className="card plan-intro">
          <p className="big-emoji" aria-hidden="true">
            🛟
          </p>
          <h2>Seis preguntas, una a la vez</h2>
          <p className="muted">
            Lo que te avisa que viene un momento difícil, lo que te ayuda, a dónde ir y a quién buscar.
            Hay ideas para tocar, y puedes dejar cualquier pregunta para después.
          </p>
          <button className="btn big" onClick={() => onEdit(0)}>
            Empezar mi plan
          </button>
        </section>
      ) : (
        <>
          <p className="muted small">
            {ready === PLAN_STEPS.length
              ? 'Tu plan está completo. Revísalo de vez en cuando: lo que ayuda también cambia.'
              : `Llevas ${ready} de ${PLAN_STEPS.length} pasos. No tiene que estar completo para servir.`}
          </p>
          {PLAN_STEPS.map((s, i) => {
            const named = s.key === 'personas' ? people.filter((p) => p.name.trim()) : []
            const items = plan[s.key] ?? []
            return (
              <section key={s.key} className={`card plan-sheet ${has(s.key) ? '' : 'empty'}`}>
                <div className="row spread">
                  <h3>
                    {i + 1}. {s.title}
                  </h3>
                  <button className="btn small ghost" onClick={() => onEdit(i)}>
                    {has(s.key) ? 'Cambiar' : 'Llenar'}
                  </button>
                </div>
                {named.length > 0 || items.length > 0 ? (
                  <ul className="plan-items">
                    {named.map((p) => (
                      <PlanItem key={p.id} text={[p.name, p.phone].filter(Boolean).join(': ')} />
                    ))}
                    {items.map((item) => (
                      <PlanItem key={item} text={item} />
                    ))}
                  </ul>
                ) : (
                  <p className="muted small">Todavía en blanco.</p>
                )}
              </section>
            )
          })}
          <div className="row">
            {firstEmpty >= 0 && (
              <button className="btn" onClick={() => onEdit(firstEmpty)}>
                Seguir llenándolo
              </button>
            )}
            <button className="btn ghost" onClick={share}>
              {copied ? '¡Copiado!' : 'Mandárselo a alguien de confianza'}
            </button>
          </div>
        </>
      )}

      <p className="muted small">
        Está basado en el Plan de Seguridad de Stanley y Brown, el que usan los especialistas para los
        momentos de crisis. Se guarda solo en este teléfono.
      </p>
    </div>
  )
}

export default function PlanDeSeguridad() {
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [justDone, setJustDone] = useState(false)
  const asked = Number(params.get('paso'))
  const index = asked >= 1 && asked <= PLAN_STEPS.length ? asked - 1 : -1

  useEffect(() => {
    if (index < 0) window.scrollTo(0, 0)
  }, [index])

  // Llenar el plan vive en la dirección: el botón de atrás del teléfono regresa a la hoja.
  const edit = (i: number) => {
    setJustDone(false)
    setParams({ paso: String(i + 1) }, { state: { inside: true } })
  }
  const step = (i: number) => setParams({ paso: String(i + 1) }, { replace: true, state })
  const done = () => {
    setJustDone(true)
    if ((state as { inside?: boolean } | null)?.inside) navigate(-1)
    else setParams({}, { replace: true })
  }

  return (
    <MotionConfig reducedMotion="user">
      {index >= 0 ? <Guided index={index} onStep={step} onDone={done} /> : <Written onEdit={edit} justDone={justDone} />}
    </MotionConfig>
  )
}
