import { type FormEvent, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import RiskNotice from '../RiskNotice'
import CartaArte from './CartaArte'
import { MAX_WORDS, WORDS, type WordId } from '../../data/sentido'
import { soundsLikeRisk } from '../../lib/risk'
import { addMoment, answerCard, cardOfDay, saveWords, useCardAnswers, useJar, useWords } from '../../lib/sentido'
import { pick, today } from '../../lib/storage'

// Los pasos alrededor de la ventana: ponerle palabras, guardar un momento en el frasco y la
// carta de hoy. Ninguno es obligatorio y ninguno se cuenta. Cada uno, al cumplirse, avisa a la
// pantalla con lo que dice la mascota y si despeja un pedazo de la ventana.
//
// Fuentes (detalle en src/data/sentido.ts):
// - Ponerle nombre a lo que se siente baja su intensidad (Lieberman y colegas, 2007).
// - Saborear lo pequeño (Positive Affect Treatment, Craske y colegas, 2019).
// - Los tres caminos al sentido de Viktor Frankl, con preguntas chiquitas (psicoterapia
//   centrada en el sentido, Breitbart).
// Textos pendientes de revisión con psicóloga.

export type OnStep = (say: string, clears: boolean) => void

function StepTitle({ id, n, done, children }: { id: string; n: number; done: boolean; children: string }) {
  return (
    <h2 className="ns-step-title" id={id}>
      <span className={`ns-n${done ? ' done' : ''}`} aria-hidden="true">
        {done ? <Check size={14} strokeWidth={3} /> : n}
      </span>
      {children}
      {done && <span className="visually-hidden"> (hecho hoy)</span>}
    </h2>
  )
}

/* ---------- 1. Palabras finas ---------- */

export function Palabras({ onStep }: { onStep: OnStep }) {
  const [entries] = useWords()
  const picked = entries.find((e) => e.date === today())?.words ?? []
  const full = picked.length >= MAX_WORDS

  const toggle = (id: WordId) => {
    if (picked.includes(id)) return saveWords(picked.filter((w) => w !== id))
    if (full) return
    saveWords([...picked, id])
    onStep(
      picked.length === 0
        ? 'Ponerle nombre ya le baja un poco el volumen. No tiene que ser exacto.'
        : 'Va. Esa también se queda contigo hoy.',
      true,
    )
  }

  return (
    <section className="card ns-step" id="ns-palabras" aria-labelledby="ns-palabras-t">
      <StepTitle id="ns-palabras-t" n={1} done={picked.length > 0}>
        Ponle palabras
      </StepTitle>
      <p className="muted small">Elige hasta tres. Nadie las interpreta: son tuyas.</p>
      <div className="chips ns-words">
        {WORDS.map((w) => {
          const on = picked.includes(w.id)
          return (
            <button
              key={w.id}
              type="button"
              className={`chip${on ? ' selected' : ''}`}
              aria-pressed={on}
              aria-disabled={!on && full}
              onClick={() => toggle(w.id)}
            >
              {w.label}
            </button>
          )
        })}
      </div>
      {full && <p className="muted small">Ya son tres. Si quieres cambiar una, quita otra.</p>}
    </section>
  )
}

/* ---------- 2. Un frasco de momentos ---------- */

const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const CANDY = ['#e46a8f', '#f0c25a', '#5f9e82', '#6d8cc7', '#f0915c', '#b394dd']
const SHOWN = 32
const fmtDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })

/** El frasco dibujado, con un dulce o un papelito por momento. No lleva número: no se cuentan. */
function Jar({ ids, fresh, open }: { ids: string[]; fresh: string | null; open: boolean }) {
  const shown = ids.slice(-SHOWN)
  return (
    <svg className={`ns-jar${open ? ' open' : ''}`} viewBox="0 0 140 172" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="ns-jar-in">
          <path d="M46 42h48q24 6 24 32v68q0 16-16 16H38q-16 0-16-16V74q0-26 24-32z" />
        </clipPath>
      </defs>
      <path className="ns-jar-glass" d="M44 34h52v8q26 6 26 34v66q0 20-20 20H38q-20 0-20-20V76q0-28 26-34z" />
      <g clipPath="url(#ns-jar-in)">
        {shown.map((id, i) => {
          const h = hash(id)
          const col = i % 4
          const row = Math.floor(i / 4)
          const x = 37 + col * 22 + ((h % 7) - 3) + (row % 2) * 6
          const y = 148 - row * 14 - ((h >> 3) % 4)
          const rot = (h % 50) - 25
          const color = CANDY[h % CANDY.length]
          return (
            <g key={id} className={id === fresh ? 'ns-drop' : undefined}>
              <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.55)`}>
                {h % 3 === 0 ? (
                  <>
                    <rect x="-6" y="-4.5" width="12" height="9" rx="1" fill="#fff6dc" stroke="#d8c9a8" strokeWidth=".8" />
                    <path d="M-6 -4.5l6 4.5 6-4.5" fill="none" stroke="#d8c9a8" strokeWidth=".8" />
                  </>
                ) : (
                  <>
                    <path d="M-5 0l-4-3.6v7.2zM5 0l4-3.6v7.2z" fill={color} opacity=".7" />
                    <ellipse rx="5.4" ry="4" fill={color} />
                    <path d="M-2.6 -1.6q2.6-1.4 5.2 0" fill="none" stroke="#fff" strokeWidth=".9" opacity=".6" />
                  </>
                )}
              </g>
            </g>
          )
        })}
      </g>
      <path className="ns-jar-shine" d="M30 84q-2 30 2 56" />
      <path className="ns-jar-line" d="M44 34h52v8q26 6 26 34v66q0 20-20 20H38q-20 0-20-20V76q0-28 26-34z" />
      <g className="ns-jar-lid">
        <path d="M38 20q32-8 64 0l-4 16q-28-5-56 0z" fill="#e46a8f" />
        <path d="M44 23l4 9M56 21l2 10M70 20v10M84 21l-2 10M96 23l-4 9" stroke="#fff" strokeWidth="1.4" opacity=".55" />
        <path d="M40 32q30-6 60 0" fill="none" stroke="#8a5a36" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function Frasco({ onStep, still }: { onStep: OnStep; still: boolean }) {
  const [jar] = useJar()
  const [text, setText] = useState('')
  const [fresh, setFresh] = useState<string | null>(null)
  const [drawn, setDrawn] = useState<string | null>(null)
  const risky = soundsLikeRisk(text)
  const savedToday = jar.some((m) => m.date === today())
  // Lo que suena a riesgo se guarda igual, pero no sale al abrir el frasco en un día pesado.
  const sweet = useMemo(() => jar.filter((m) => !soundsLikeRisk(m.text)), [jar])
  const shown = jar.find((m) => m.id === drawn)

  const keep = (e: FormEvent) => {
    e.preventDefault()
    const v = text.trim()
    if (!v) {
      onStep('Puede ser algo muy chiquito: un sabor, una voz, la luz de la tarde.', false)
      return
    }
    const m = addMoment(v)
    setText('')
    setDrawn(null)
    setFresh(still ? null : m.id)
    onStep(
      soundsLikeRisk(v)
        ? 'Lo guardé. Eso que escribiste pesa mucho: abajo tienes con quién hablar ahora mismo.'
        : `Guardé «${v}» en tu frasco. No hace falta que se haya sentido bonito para que cuente.`,
      true,
    )
  }

  const open = () => {
    const others = sweet.length > 1 ? sweet.filter((m) => m.id !== drawn) : sweet
    if (others.length) setDrawn(pick(others).id)
  }

  return (
    <section className="card ns-step" id="ns-frasco" aria-labelledby="ns-frasco-t">
      <StepTitle id="ns-frasco-t" n={2} done={savedToday}>
        Un momento que guardo
      </StepTitle>
      <div className="ns-jar-row">
        <Jar ids={jar.map((m) => m.id)} fresh={fresh} open={!!shown} />
        <form className="ns-jar-form" onSubmit={keep}>
          <label className="muted small" htmlFor="ns-moment">
            Algo de hoy, aunque sea muy chiquito.
          </label>
          <input
            id="ns-moment"
            type="text"
            maxLength={80}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="El café de la mañana, una voz, el sol…"
            autoComplete="off"
          />
          <button type="submit" className="btn small">
            Guardarlo en el frasco
          </button>
        </form>
      </div>
      {risky && <RiskNotice />}
      {sweet.length > 0 && (
        <div className="ns-jar-open">
          {shown ? (
            <div className="ns-papelito" role="status">
              <p>«{shown.text}»</p>
              <span className="muted small">Lo guardaste el {fmtDay(shown.date)}.</span>
            </div>
          ) : (
            <p className="muted small">Para un día pesado: abre el frasco y sale uno de tus momentos.</p>
          )}
          <div className="row">
            <button type="button" className="btn ghost small" onClick={open}>
              {shown ? 'Sacar otro' : 'Abrir el frasco'}
            </button>
            {shown && (
              <button type="button" className="ns-link" onClick={() => setDrawn(null)}>
                Guardarlo otra vez
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/* ---------- 3. La carta de hoy ---------- */

export function Carta({ onStep }: { onStep: OnStep }) {
  const [answers] = useCardAnswers()
  const { card, question } = cardOfDay()
  const mine = answers.find((a) => a.date === today())
  const [flipped, setFlipped] = useState(!!mine)

  const choose = (answer: string, pass: boolean) => {
    const counted = mine && !mine.pass
    answerCard(card.path, question.q, answer, pass)
    if (pass) onStep('Está bien. La carta se queda aquí para otro día.', false)
    else onStep('Guardada en tu lotería. Hoy esto tuvo un poquito de sentido.', !counted)
  }

  return (
    <section className="card ns-step" id="ns-carta" aria-labelledby="ns-carta-t">
      <StepTitle id="ns-carta-t" n={3} done={!!mine && !mine.pass}>
        La carta de hoy
      </StepTitle>
      <p className="muted small">Una sola pregunta, chiquita. «Hoy solo aguanté» también cuenta.</p>
      <button
        type="button"
        className={`ns-lot${flipped ? ' flip' : ''}`}
        aria-pressed={flipped}
        aria-label={flipped ? `Carta ${card.number}, ${card.name}: ${question.q}` : `Carta ${card.number}, ${card.name}. Tócala para voltearla.`}
        onClick={() => setFlipped((f) => !f)}
      >
        <span className="ns-lot-in">
          <span className="ns-face">
            <span className="ns-lot-num">{card.number}</span>
            <CartaArte path={card.path} />
            <span className="ns-lot-name">{card.name}</span>
          </span>
          <span className="ns-face ns-back">
            <span className="ns-lot-num">
              {card.number} · {card.name}
            </span>
            <span className="ns-lot-q">{question.q}</span>
            <span className="ns-lot-hint">{question.hint}</span>
          </span>
        </span>
      </button>
      {flipped && (
        <div className="ns-answers">
          <div className="chips" role="radiogroup" aria-label={question.q}>
            {[...card.answers, card.pass].map((a) => {
              const on = mine?.answer === a
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`chip${on ? ' selected' : ''}`}
                  onClick={() => choose(a, a === card.pass)}
                >
                  {a}
                </button>
              )
            })}
          </div>
          {mine && (
            <p className="ns-saved" role="status">
              {mine.pass ? 'La carta se queda para otro día.' : 'Guardada en tu lotería.'}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
