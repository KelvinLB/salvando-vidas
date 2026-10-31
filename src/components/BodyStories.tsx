import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import BodyFrame from './BodyFrame'
import BodyModel from './BodyModel'
import PetSays from './PetSays'
import InfoViz from './cuerpo-info/InfoViz'
import type { CompanionMood } from '../data/companion'
import { REGION_LABELS, STORIES, type Fx, type Region, type StoryStep, type Tone } from '../data/bodyStories'

// «Cómo funciona»: lo que pasa por dentro con la ansiedad, el pánico, el estrés, la
// depresión o el trastorno bipolar, paso a paso. Entender de dónde sale lo que sientes
// le quita parte del miedo. Los temas de «Por dentro» (src/data/cuerpoInfo.ts) explican cómo
// trabaja el cuerpo por sistemas, cada uno con un dibujo chico debajo del texto.

const IDLE: Fx[] = ['breath-slow', 'heart-calm']

/** La mascota cuenta la historia con la carita de lo que se siente en ella. */
const TONE_MOOD: Record<Tone, CompanionMood> = {
  alarma: 'nervios',
  estres: 'cansado',
  animo: 'triste',
  mania: 'calma',
  calma: 'calma',
}

/** Las dos filas de chips, para que quepan en el teléfono. */
const GROUPS = [
  ['vives', 'Lo que vives'],
  ['dentro', 'Por dentro'],
] as const
type Group = (typeof GROUPS)[number][0]
const groupOf = (id: string | null): Group => STORIES.find((s) => s.id === id)?.group ?? 'vives'

/** Tiempo para leer cada paso sin prisa (y un poco más si trae dibujo que mirar). */
const readTime = (step: StoryStep) => Math.max(5000, (step.title + step.text).length * 50) + (step.viz ? 2500 : 0)

export default function BodyStories({ initial, still }: { initial: string | null; still: boolean }) {
  const [storyId, setStoryId] = useState(initial)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(() => initial !== null && !still)
  const [hint, setHint] = useState('')
  const [group, setGroup] = useState(() => groupOf(initial))

  const story = STORIES.find((s) => s.id === storyId)
  const current = story?.steps[step]
  const last = !!story && step === story.steps.length - 1
  const auto = playing && !last
  const duration = current ? readTime(current) : 0
  const next = current?.see ? STORIES.find((s) => s.id === current.see) : undefined

  useEffect(() => {
    if (!auto) return
    const timer = setTimeout(() => setStep((s) => s + 1), duration)
    return () => clearTimeout(timer)
  }, [auto, step, duration])

  const choose = (id: string) => {
    setStoryId(id)
    setGroup(groupOf(id))
    setStep(0)
    setPlaying(!still)
    setHint('')
  }

  const go = (i: number) => {
    setStep(i)
    setPlaying(false)
    setHint('')
  }

  // Tocar una parte del cuerpo lleva al paso que habla de ella; si hay varios, va
  // pasando de uno en uno.
  const onRegion = (region: Region) => {
    if (!story) {
      setHint('Primero elige arriba qué quieres entender.')
      return
    }
    const matches = story.steps.flatMap((s, i) => (s.focus === region ? [i] : []))
    if (matches.length === 0) {
      setHint(`En esta explicación no hay un paso sobre ${REGION_LABELS[region]}. Prueba con otra parte.`)
      return
    }
    go(matches.find((i) => i > step) ?? matches[0])
  }

  return (
    <section className="card body-card">
      <div className="ci-pick">
        <div className="ci-groups" role="group" aria-label="Qué tipo de explicación">
          {GROUPS.map(([id, label]) => (
            <button key={id} aria-pressed={group === id} onClick={() => setGroup(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className={`chips${group === 'dentro' ? ' ci-topics' : ''}`} role="group" aria-label="¿Qué quieres entender?">
          {STORIES.filter((s) => (s.group ?? 'vives') === group).map((s) => (
            <button
              key={s.id}
              className={`chip${s.id === storyId ? ' selected' : ''}`}
              aria-pressed={s.id === storyId}
              onClick={() => choose(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {story && (
        <PetSays key={story.id} mood={TONE_MOOD[story.tone]} compact>
          <p className="body-intro">{story.intro}</p>
        </PetSays>
      )}

      <BodyFrame title={story ? story.label : 'En calma'} hint="Toca una parte del cuerpo">
        <BodyModel
          fx={current?.fx ?? IDLE}
          tone={current ? (current.tone ?? story.tone) : null}
          focus={current?.focus}
          still={still}
          onRegion={onRegion}
        />
      </BodyFrame>

      <div className="body-caption" aria-live={auto ? 'off' : 'polite'}>
        {story && current ? (
          <>
            <p className="eyebrow">
              Paso {step + 1} de {story.steps.length}
            </p>
            <h2>{current.title}</h2>
            <p>{current.text}</p>
            {current.viz && <InfoViz viz={current.viz} still={still} />}
            {current.note && <p className="callout warm small">{current.note}</p>}
            {current.links && (
              <div className="row">
                {current.links.map((l) => (
                  <Link key={l.to} to={l.to} className="btn small">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
            {next && (
              <button className="ci-see" onClick={() => choose(next.id)}>
                Ver también: {next.label}
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
            {current.more && (
              // Se pliega de nuevo en cada paso; abrirla pausa la historia para leer con calma.
              <details key={`${story.id}-${step}`} className="ci-more" onToggle={(e) => e.currentTarget.open && setPlaying(false)}>
                <summary>Saber más: {current.more.title}</summary>
                <div className="ci-more-body">
                  <p>{current.more.text}</p>
                  {current.more.viz && <InfoViz viz={current.more.viz} still={still} />}
                </div>
              </details>
            )}
          </>
        ) : (
          <>
            <h2>Así respira un cuerpo en calma</h2>
            <p className="muted">Elige arriba qué quieres ver. También puedes tocar una parte del cuerpo.</p>
          </>
        )}
        {hint && <p className="muted small">{hint}</p>}
      </div>

      {story && (
        <>
          {auto && (
            <div className="body-progress" aria-hidden="true">
              <span key={`${story.id}-${step}`} style={{ animationDuration: `${duration}ms` }} />
            </div>
          )}
          <div className="body-controls">
            <button className="icon-btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Paso anterior">
              <ChevronLeft size={22} />
            </button>
            <div className="body-dots">
              {story.steps.map((s, i) => (
                <button
                  key={s.title}
                  className={i === step ? 'active' : ''}
                  aria-label={`Paso ${i + 1}: ${s.title}`}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            {last ? (
              <button className="icon-btn" onClick={() => choose(story.id)} aria-label="Ver de nuevo">
                <RotateCcw size={20} />
              </button>
            ) : (
              <button className="icon-btn" onClick={() => setPlaying(!playing)} aria-label={auto ? 'Pausar' : 'Reproducir'}>
                {auto ? <Pause size={20} /> : <Play size={20} />}
              </button>
            )}
            <button className="icon-btn" onClick={() => go(step + 1)} disabled={last} aria-label="Paso siguiente">
              <ChevronRight size={22} />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
