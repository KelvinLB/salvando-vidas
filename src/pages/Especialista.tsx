import { type ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PinPad from '../components/PinPad'
import './especialista.css'
import { ANSWERS } from '../data/companion'
import { MOODS } from '../data/content'
import { feelingLabel } from '../data/feelings'
import { SENSE_CARDS, WORDS } from '../data/sentido'
import { useBarrio } from '../lib/barrio'
import { SUMMARY_TITLE, summaryLines } from '../lib/barrioNoticed'
import { noteWhere } from '../components/cuerpo-siento/TusPalabras'
import { type BodyNote, type BodyRecord, sensationById, spotLines } from '../lib/bodyCheck'
import { GAD_CLINICAL, GAD_MAX, PHQ_CLINICAL, PHQ_MAX, type Review, gadLevel, phqLevel, scores } from '../lib/companion'
import { type Thought, listThoughts } from '../lib/db'
import { useDiaryLock } from '../lib/lock'
import { type PanicEntry, fearSummary, usePanicLog } from '../lib/panico'
import { firstName, usePeople, whatsappOf } from '../lib/people'
import { type CardAnswer, type Compass, INCLUDE_KEY, type WordsEntry, useCardAnswers, useCompass, useWords } from '../lib/sentido'
import {
  type JournalEntry,
  type Medication,
  type MoodEntry,
  localDate,
  useStored,
} from '../lib/storage'

// La ansiedad hace que "ir al doctor" se sienta como una montaña. Aquí se parte
// en pasos tan pequeños que cada uno se pueda dar en un mal día. Se ve abierto solo el que
// sigue; los demás quedan como renglones que se abren con un toque.

const SCRIPT =
  'Hola, quisiera agendar una cita. Me he sentido muy mal emocionalmente desde hace un tiempo (tristeza, ansiedad, vacío) y me recomendaron buscar ayuda. ¿Qué días tienen disponibles?'

const SUGGESTED_QUESTIONS = [
  '¿Que no pueda llorar es parte de la depresión o efecto del medicamento?',
  '¿Cuánto tarda el tratamiento en hacer efecto?',
  '¿Qué hago si un día me siento mucho peor?',
  '¿Me conviene también ir a terapia psicológica?',
  '¿Qué puedo hacer cuando nada me entretiene?',
  'Me da mucho sueño de día, ¿puede ser el medicamento?',
  '¿Me conviene hacerme análisis (tiroides, anemia, vitaminas)?',
  '¿Los cambios hormonales pueden estar influyendo en cómo me siento?',
]

const DAYS = 30

type SummaryInput = {
  moods: MoodEntry[]
  thoughts: Thought[]
  meds: Medication[]
  taken: string[]
  changes: JournalEntry[]
  reviews: Review[]
  body: BodyRecord[]
  treatment: string
  questions: string
  includeNotes: boolean
  /** Lo del barrio que la persona dejó tal cual (sin lo corregido ni lo borrado), si eligió incluirlo. */
  barrio: string[]
  /** Lo que anotó al terminar la guía de pánico, si eligió incluirlo. */
  panic: PanicEntry[]
  /** Sus notas sobre el cuerpo («Tus palabras»), si eligió incluirlas. */
  bodyNotes: BodyNote[]
  /** Lo de «Lo que no sale» (palabras, cartas y brújula), si eligió incluirlo. */
  sentido: { words: WordsEntry[]; cards: CardAnswer[]; compass: Compass } | null
}

// «Lo que no sale» va con sus palabras tal cual: lo que eligió, lo que contestó y lo pequeño
// que se propuso. Los «hoy no» van como los dijo, sin contarlos ni marcarlos como faltas.
// Pendiente de revisión con psicóloga.
function sentidoLines({ words, cards, compass }: NonNullable<SummaryInput['sentido']>, sinceDate: string) {
  const day = (d: string) => new Date(d + 'T12:00').toLocaleDateString('es')
  const wordLabel = (id: string) => WORDS.find((w) => w.id === id)?.label ?? id
  const lines: string[] = []
  const recentWords = words.filter((w) => w.date >= sinceDate && w.words.length).slice(-5)
  if (recentWords.length) {
    lines.push('Las palabras que elegí para lo que siento:')
    recentWords.forEach((w) => lines.push(`- [${day(w.date)}] ${w.words.map(wordLabel).join(', ')}`))
  }
  const recentCards = cards.filter((c) => c.date >= sinceDate).slice(-8)
  if (recentCards.length) {
    lines.push('La pregunta de cada día y lo que contesté:')
    recentCards.forEach((c) => {
      const answer = c.answer.trim() || (c.pass ? SENSE_CARDS.find((k) => k.path === c.path)?.pass : '') || ''
      lines.push(`- [${day(c.date)}] ${c.question}${answer ? ` — ${answer}` : ''}`)
    })
  }
  const action = compass.action
  if (action?.text.trim() && action.date >= sinceDate) {
    lines.push(`Lo pequeño que me propuse hacer (${day(action.date)}): ${action.text.trim()}${action.done ? '. Lo hice.' : ''}`)
  }
  return lines
}

function buildSummary({ moods, thoughts, meds, taken, changes, reviews, body, treatment, questions, includeNotes, barrio, panic, bodyNotes, sentido }: SummaryInput) {
  const since = new Date()
  since.setDate(since.getDate() - DAYS)
  const sinceDate = localDate(since)

  const recentMoods = moods.filter((m) => m.date >= sinceDate)
  const recentThoughts = thoughts.filter((t) => t.createdAt.slice(0, 10) >= sinceDate)

  const counts = new Map<string, number>()
  recentThoughts.forEach((t) => t.feelings.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1)))
  const topFeelings = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  const lines = [`MI RESUMEN PARA LA CONSULTA (últimos ${DAYS} días)`, `Fecha: ${new Date().toLocaleDateString('es')}`, '']

  lines.push('ÁNIMO')
  if (recentMoods.length) {
    const avg = recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length
    lines.push(`Días registrados: ${recentMoods.length}. Promedio: ${avg.toFixed(1)} de 5.`)
    MOODS.forEach((m) => {
      const n = recentMoods.filter((r) => r.mood === m.value).length
      if (n) lines.push(`- ${m.label}: ${n} ${n === 1 ? 'día' : 'días'}`)
    })
  } else {
    lines.push('Sin registros todavía.')
  }

  lines.push('', 'LO QUE MÁS HE SENTIDO')
  if (topFeelings.length) {
    topFeelings.forEach(([id, n]) => lines.push(`- ${feelingLabel(id)} (${n} ${n === 1 ? 'vez' : 'veces'})`))
  } else {
    lines.push('Sin registros todavía.')
  }

  const recentReviews = reviews.filter((r) => r.date >= sinceDate).slice(0, 3)
  if (recentReviews.length) {
    lines.push('', 'CUESTIONARIOS (PHQ-9 y GAD-7, respondidos en la app)')
    recentReviews.forEach((r) => {
      const s = scores(r.answers)
      const date = new Date(r.date + 'T12:00').toLocaleDateString('es')
      lines.push(
        `[${date}] PHQ-9: ${s.phq} de ${PHQ_MAX} (${PHQ_CLINICAL[phqLevel(s.phq)]}). GAD-7: ${s.gad} de ${GAD_MAX} (${GAD_CLINICAL[gadLevel(s.gad)]}).`,
      )
      if (s.risk) {
        lines.push(`Pensamientos de morir o de hacerme daño: ${ANSWERS[r.answers.dano].label.toLowerCase()}.`)
      }
    })
    lines.push('Los respondí por mi cuenta: orientan, no son un diagnóstico.')
  }

  const recentBody = body.filter((r) => r.date >= sinceDate)
  if (recentBody.length) {
    lines.push('', 'LO QUE SIENTO EN EL CUERPO (marcado en la app)')
    lines.push(`Lo marqué ${recentBody.length} ${recentBody.length === 1 ? 'vez' : 'veces'}.`)
    const times = new Map<string, number>()
    recentBody.forEach((r) => r.ids.forEach((id) => times.set(id, (times.get(id) ?? 0) + 1)))
    for (const [id, n] of [...times.entries()].sort((a, b) => b[1] - a[1])) {
      const s = sensationById.get(id)
      if (s) lines.push(`- ${s.label}${s.red ? ' (señal de alarma)' : ''}: ${n} ${n === 1 ? 'vez' : 'veces'}`)
    }
    const rated = recentBody.filter((r) => r.intensity !== null)
    if (rated.length) {
      const avg = (list: number[]) => (list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)
      const afters = rated.filter((r) => r.after !== null)
      lines.push(
        `Qué tan fuerte (1 a 5): ${avg(rated.map((r) => r.intensity!))} en promedio` +
          (afters.length ? `; después de respirar un minuto, ${avg(afters.map((r) => r.after!))}.` : '.'),
      )
    }
    // Dónde exacto, de las últimas veces que lo marcó con el dedo.
    const marked = recentBody.filter((r) => r.spots?.length).slice(0, 3)
    if (marked.length) {
      lines.push('Dónde exacto lo marqué:')
      marked.forEach((r) =>
        spotLines(r.spots!).forEach((l) => lines.push(`- [${new Date(r.date + 'T12:00').toLocaleDateString('es')}] ${l}`)),
      )
    }
  }

  if (bodyNotes.length) {
    lines.push('', 'CÓMO LO DIGO YO (notas sobre mi cuerpo)')
    bodyNotes.forEach((n) => lines.push(`- ${noteWhere(n)}: «${n.text}»`))
  }

  const notSaid = sentido ? sentidoLines(sentido, sinceDate) : []
  if (notSaid.length) lines.push('', 'LO QUE NO SALE (con mis palabras)', ...notSaid)

  if (meds.length) {
    lines.push('', 'MEDICAMENTOS')
    meds.forEach((m) => lines.push(`- ${[m.name, m.dose, m.when].filter(Boolean).join(', ')}`))
    const days = taken.filter((d) => d >= sinceDate).length
    lines.push(`Marqué que lo tomé ${days} de los últimos ${DAYS} días.`)
  }
  const recentChanges = changes.filter((c) => c.date >= sinceDate)
  if (recentChanges.length) {
    lines.push('', 'CAMBIOS Y EFECTOS QUE NOTÉ')
    recentChanges.forEach((c) => lines.push(`[${new Date(c.date + 'T12:00').toLocaleDateString('es')}] ${c.text}`))
  }

  const recentPanic = panic.filter((e) => e.date >= sinceDate)
  if (recentPanic.length) {
    lines.push('', 'ATAQUES DE PÁNICO (anotados en la app)')
    lines.push(`Anoté ${recentPanic.length} ${recentPanic.length === 1 ? 'vez' : 'veces'} qué temía y si pasó.`)
    fearSummary(recentPanic, 'yo').forEach((l) => lines.push(`- ${l.text}`))
  }

  // El barrio va como contexto que la persona misma registró, nunca como diagnóstico.
  if (barrio.length) {
    lines.push('', SUMMARY_TITLE)
    barrio.forEach((l) => lines.push(`- ${l}`))
  }

  if (treatment.trim()) lines.push('', 'SOBRE MI TRATAMIENTO', treatment.trim())
  if (questions.trim()) lines.push('', 'MIS PREGUNTAS', questions.trim())

  if (includeNotes) {
    // Los recuerdos y las cartas que no se mandan son de la persona, no del resumen: solo van
    // lo que siente y lo que pasó.
    const withText = recentThoughts.filter((t) => t.text && t.kind !== 'recuerdo' && t.kind !== 'carta')
    if (withText.length) {
      lines.push('', 'MIS NOTAS')
      withText.forEach((t) =>
        lines.push(`[${new Date(t.createdAt).toLocaleDateString('es')}] ${t.kind === 'paso' ? 'Algo que pasó: ' : ''}${t.text}`),
      )
    }
  }

  return lines.join('\n')
}

export default function Especialista() {
  const [done, setDone] = useStored<Record<string, boolean>>('camino', {})
  const [treatment, setTreatment] = useStored('consulta-tratamiento', '')
  const [questions, setQuestions] = useStored('consulta-preguntas', '')
  const [includeNotes, setIncludeNotes] = useStored('consulta-incluir-notas', false)
  const { reachable, country } = usePeople()
  const person = reachable[0]
  const [moods] = useStored<MoodEntry[]>('moods', [])
  const [meds] = useStored<Medication[]>('meds', [])
  const [taken] = useStored<string[]>('meds-tomados', [])
  const [changes] = useStored<JournalEntry[]>('meds-cambios', [])
  const [reviews] = useStored<Review[]>('mascota-revisiones', [])
  const [body] = useStored<BodyRecord[]>('cuerpo-registros', [])
  const { barrio, patch: patchBarrio } = useBarrio()
  const barrioLines = summaryLines(barrio)
  const panicLog = usePanicLog()
  const [includePanic, setIncludePanic] = useStored('consulta-incluir-panico', false)
  const [bodyNotes] = useStored<BodyNote[]>('cuerpo-notas', [])
  const [includeBody, setIncludeBody] = useStored('consulta-incluir-cuerpo', false)
  const [words] = useWords()
  const [cards] = useCardAnswers()
  const [compass] = useCompass()
  const [includeSentido, setIncludeSentido] = useStored(INCLUDE_KEY, false)
  const hasSentido = words.length > 0 || cards.length > 0 || !!compass.action?.text.trim()
  // Cuántas cosas extra eligió llevar, para verlo sin abrir la lista.
  const incluidos = [includeNotes, barrioLines.length > 0 && barrio.inSummary, panicLog.length > 0 && includePanic, bodyNotes.length > 0 && includeBody, hasSentido && includeSentido].filter(Boolean).length
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  // Si el diario tiene clave, sus notas entran al resumen solo después de escribirla.
  const { locked, unlock } = useDiaryLock(true)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    listThoughts().then(setThoughts)
  }, [])

  const summary = buildSummary({ moods, thoughts, meds, taken, changes, reviews, body, treatment, questions, includeNotes: includeNotes && !locked, barrio: barrio.inSummary ? barrioLines : [], panic: includePanic ? panicLog : [], bodyNotes: includeBody ? bodyNotes : [], sentido: includeSentido ? { words, cards, compass } : null })

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // El portapapeles puede estar bloqueado; el texto sigue visible para copiarlo a mano.
    }
  }

  const share = () => {
    if (navigator.share) navigator.share({ title: 'Mi resumen para la consulta', text: summary }).catch(() => {})
    else copy('resumen', summary)
  }

  // Los cinco pasos, cada uno con lo que trae adentro. Solo uno se ve abierto a la vez.
  const pasos: { key: string; title: string; content: ReactNode }[] = [
    {
      key: 'quien',
      title: '1. Elegir a quién ir',
      content: (
        <ul className="plain">
          <li><strong>Psiquiatra:</strong> es médico; diagnostica y receta o ajusta medicamentos. Si ya tomas alguno y notas efectos raros, es a quien hay que ir.</li>
          <li><strong>Psicólogo:</strong> da terapia para entender lo que pasa y aprender a manejarlo. Funciona muy bien junto con el psiquiatra.</li>
          <li><strong>Médico general:</strong> un buen primer paso si no sabes por dónde empezar; puede canalizarte.</li>
          <li>Las <Link to="/ayuda">líneas de ayuda</Link> también te orientan sobre dónde atenderte, incluso gratis.</li>
        </ul>
      ),
    },
    {
      key: 'compania',
      title: '2. Pedir compañía',
      content: (
        <>
          <p className="muted">No tienes que hacerlo sin ayuda. Pídele a alguien que haga la llamada contigo, o por ti.</p>
          {person ? (
            <a
              className="btn ghost"
              href={whatsappOf(person.phone, country, 'Hola, ¿me ayudas a agendar una cita con el doctor? Me está costando mucho hacerlo.')}
              target="_blank"
              rel="noreferrer"
            >
              Pedirle ayuda a {firstName(person)}
            </a>
          ) : (
            <Link to="/mi-espacio/personas" className="btn ghost">Agregar a mis personas de confianza</Link>
          )}
        </>
      ),
    },
    {
      key: 'agendar',
      title: '3. Agendar la cita',
      content: (
        <>
          <p className="muted">Si llamar te paraliza, lee esto tal cual o mándalo por mensaje:</p>
          <blockquote className="script">{SCRIPT}</blockquote>
          <button className="btn ghost" onClick={() => copy('guion', SCRIPT)}>
            {copied === 'guion' ? '¡Copiado!' : 'Copiar mensaje'}
          </button>
        </>
      ),
    },
    {
      key: 'preparar',
      title: '4. Preparar la consulta',
      content: (
        <>
          <label className="field">
            <strong>Sobre mi tratamiento</strong>
            <small className="muted">
              Lo que quieras contarle. Tus medicamentos y los cambios que anotaste en{' '}
              <Link to="/mi-espacio/medicamentos">Mis medicamentos</Link> se agregan solos.
            </small>
            <textarea rows={3} value={treatment} onChange={(e) => setTreatment(e.target.value)} />
          </label>
          <label className="field">
            <strong>Mis preguntas</strong>
            <textarea rows={3} value={questions} onChange={(e) => setQuestions(e.target.value)} />
          </label>
          {/* Las ideas de preguntas y lo que se puede sumar al resumen, a un toque: no estorban al escribir. */}
          <details className="es-mas">
            <summary>Ideas de preguntas</summary>
            <div className="chips">
              {SUGGESTED_QUESTIONS.filter((q) => !questions.includes(q)).map((q) => (
                <button key={q} className="chip" onClick={() => setQuestions((prev) => (prev.trim() ? `${prev.trim()}\n${q}` : q))}>
                  + {q}
                </button>
              ))}
            </div>
          </details>
          <details className="es-mas">
            <summary>Qué más llevar en el resumen{incluidos ? ` (${incluidos} elegido${incluidos === 1 ? '' : 's'})` : ''}</summary>
            <label className="toggle">
              <input type="checkbox" role="switch" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} />
              Incluir lo que escribí en «Mi diario»
            </label>
            {includeNotes &&
              locked &&
              (asking ? (
                <PinPad
                  title="La clave de tu diario"
                  onSubmit={(pin) => (unlock(pin) ? setAsking(false) : 'Esa no es. Intenta otra vez.')}
                  onCancel={() => setAsking(false)}
                />
              ) : (
                <div className="callout info no-print">
                  <p>Tu diario tiene clave: escríbela para agregar tus notas al resumen.</p>
                  <button className="btn small ghost" onClick={() => setAsking(true)}>
                    Escribir la clave
                  </button>
                </div>
              ))}
            {barrioLines.length > 0 && (
              <label className="toggle">
                <input type="checkbox" role="switch" checked={barrio.inSummary} onChange={(e) => patchBarrio({ inSummary: e.target.checked })} />
                Incluir lo del barrio (contexto, no diagnóstico)
              </label>
            )}
            {panicLog.length > 0 && (
              <label className="toggle">
                <input type="checkbox" role="switch" checked={includePanic} onChange={(e) => setIncludePanic(e.target.checked)} />
                Incluir lo que temí en mis ataques de pánico y si pasó
              </label>
            )}
            {bodyNotes.length > 0 && (
              <label className="toggle">
                <input type="checkbox" role="switch" checked={includeBody} onChange={(e) => setIncludeBody(e.target.checked)} />
                Incluir mis notas sobre el cuerpo («Tus palabras»)
              </label>
            )}
            {hasSentido && (
              <label className="toggle">
                <input type="checkbox" role="switch" checked={includeSentido} onChange={(e) => setIncludeSentido(e.target.checked)} />
                Incluir lo de «Lo que no sale» (mis palabras, mis cartas del día y lo que me propuse)
              </label>
            )}
          </details>
          <pre className="summary printable">{summary}</pre>
          <div className="row no-print">
            <button className="btn" onClick={share}>{copied === 'resumen' ? '¡Copiado!' : 'Compartir'}</button>
            <button className="btn ghost" onClick={() => window.print()}>Imprimir</button>
          </div>
          <p className="muted small">Puedes enseñárselo al especialista desde tu teléfono. Está bien leer de ahí; muchas personas lo hacen.</p>
        </>
      ),
    },
    {
      key: 'dia',
      title: '5. El día de la cita',
      content: (
        <ul className="plain">
          <li>Si puedes, ve con alguien de confianza.</li>
          <li>Lleva tu resumen. No tienes que acordarte de todo.</li>
          <li>Di la verdad aunque dé pena: los especialistas escuchan esto todos los días y no te van a juzgar.</li>
          <li>Ir ya es un logro enorme. Date crédito por eso.</li>
        </ul>
      ),
    },
  ]

  const completed = Object.values(done).filter(Boolean).length
  const pendiente = (desde = -1) => pasos.find((p, i) => i > desde && !done[p.key])?.key ?? pasos.find((p) => !done[p.key])?.key ?? null

  // Lo que se abre al llegar es el siguiente paso pendiente; si ya los diste todos, ninguno.
  const [abierto, setAbierto] = useState<string | null>(() => pendiente())
  const abrir = (key: string | null) => {
    setAbierto(key)
    // Al cerrarse el de arriba, el que se abrió se movería: se lleva a la vista para no perderlo.
    if (key) requestAnimationFrame(() => document.getElementById(`paso-${key}`)?.scrollIntoView({ block: 'start' }))
  }

  return (
    <div className="stack">
      <PageHeader
        title="Camino al especialista"
        subtitle="Saber que tienes que ir y no poder dar el paso es parte de la ansiedad, no falta de voluntad. Vamos en pasos muy pequeños, uno a la vez."
      />

      <p className="muted small no-print">
        {completed === 0 ? 'Marca cada paso cuando lo des. No hay prisa.' : `Llevas ${completed} de 5 pasos. Cada uno cuenta.`}
      </p>

      {pasos.map((p, i) => {
        const open = abierto === p.key
        const siguiente = done[p.key] ? pendiente(i) : null
        return (
          <section key={p.key} id={`paso-${p.key}`} className={`card step es-paso ${done[p.key] ? 'done' : ''} ${open ? 'abierto' : ''}`}>
            <div className="es-paso-cabeza">
              <input
                type="checkbox"
                aria-label={`Ya di este paso: ${p.title}`}
                checked={!!done[p.key]}
                onChange={(e) => setDone((d) => ({ ...d, [p.key]: e.target.checked }))}
              />
              <h2>
                <button type="button" className="es-paso-titulo" aria-expanded={open} aria-controls={`paso-${p.key}-cuerpo`} onClick={() => abrir(open ? null : p.key)}>
                  {p.title}
                </button>
              </h2>
            </div>
            {open && (
              <div id={`paso-${p.key}-cuerpo`} className="stack tight es-paso-cuerpo">
                {p.content}
                {siguiente && (
                  <button type="button" className={`btn ${p.key === 'preparar' ? 'ghost' : ''} es-siguiente no-print`} onClick={() => abrir(siguiente)}>
                    Siguiente: {pasos.find((x) => x.key === siguiente)?.title}
                  </button>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
