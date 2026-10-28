import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import PinPad from '../../components/PinPad'
import { type Thought, listThoughts, saveThought } from '../../lib/db'
import { dayOf, shrinkPhoto, useBlobUrl } from '../../lib/diary'
import { useDiaryLock } from '../../lib/lock'
import { type JournalEntry, type Letter, type MoodEntry, newId, today, useAddress, useStored } from '../../lib/storage'

// Mi caja de esperanza: lo que sostiene a la persona, guardado para los días en que cuesta
// recordarlo. Sus razones, las fotos de sus recuerdos y una carta escrita en un día bueno para
// leerla en uno malo. Se basa en la «caja de esperanza» que se usa en terapia; los textos
// deben pasar por la revisión de un psicólogo.

const REASON_IDEAS = ['Mi familia', 'Mi mascota', 'Ver crecer a ', 'Un lugar que quiero conocer: ', 'Algo que quiero aprender: ', 'Una persona que me quiere: ']

const LETTER_STARTERS = [
  'Si estás leyendo esto, es porque hoy pesa.',
  'Recuerda que…',
  'Lo que me ayudó la última vez fue…',
  'Las personas que te quieren son…',
  'Ya has salido de días así:',
]

function Box({ reasons, photos, letter }: { reasons: number; photos: number; letter: boolean }) {
  const inside = [
    reasons && (reasons === 1 ? '1 razón' : `${reasons} razones`),
    photos && (photos === 1 ? '1 foto' : `${photos} fotos`),
    letter && 'tu carta',
  ].filter(Boolean)
  return (
    <section className="card hope-hero">
      <div className="hope-box" aria-hidden="true">
        <span className="hope-sparks">
          <i>💛</i>
          <i>🌼</i>
          <i>✨</i>
        </span>
        <svg viewBox="0 0 160 112" width="150" height="105">
          <rect className="hope-base" x="22" y="50" width="116" height="58" rx="9" />
          <rect className="hope-ribbon" x="71" y="50" width="18" height="58" />
          <g className="hope-lid">
            <rect x="14" y="32" width="132" height="22" rx="7" />
            <rect className="hope-ribbon" x="71" y="32" width="18" height="22" />
            <path className="hope-ribbon" d="M80 32c-14-16-30-8-18 0zM80 32c14-16 30-8 18 0z" />
          </g>
        </svg>
      </div>
      <p className="muted">{inside.length ? `Aquí guardas ${inside.join(' · ')}.` : 'Todavía está vacía. Empieza por una razón, aunque sea pequeña.'}</p>
    </section>
  )
}

function Reasons() {
  const [reasons, setReasons] = useStored<JournalEntry[]>('razones', [])
  const [faith] = useStored('fe', false)
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const ideas = faith ? [...REASON_IDEAS, 'Mi fe'] : REASON_IDEAS

  const add = () => {
    if (!text.trim()) return
    setReasons((r) => [{ id: newId(), date: today(), text: text.trim() }, ...r])
    setText('')
  }

  return (
    <section className="card field">
      <h2>💛 Mis razones para seguir</h2>
      <p className="muted">
        Las cosas, personas y sueños que hacen que valga la pena seguir. Pueden ser grandes o muy
        pequeñas: el café de la mañana, ver crecer a mi sobrina, una serie que no he terminado.
      </p>
      <div className="chips">
        {ideas.map((idea) => (
          <button
            key={idea}
            className="chip"
            onClick={() => {
              setText(idea)
              requestAnimationFrame(() => input.current?.focus())
            }}
          >
            {idea.trim().replace(/:$/, '')}…
          </button>
        ))}
      </div>
      <div className="row add-own">
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Una razón para seguir…"
          aria-label="Nueva razón"
          maxLength={140}
        />
        <button className="btn small" onClick={add} disabled={!text.trim()}>
          Guardar
        </button>
      </div>
      {reasons.length > 0 && (
        <ul className="reasons">
          {reasons.map((r) => (
            <li key={r.id}>
              <span>💛 {r.text}</span>
              <button className="icon-btn" onClick={() => setReasons((all) => all.filter((x) => x.id !== r.id))} aria-label={`Quitar «${r.text}»`}>
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Photo({ memory }: { memory: Thought }) {
  const url = useBlobUrl(memory.photo)
  const caption = memory.text.split('\n')[0]
  const date = new Date(dayOf(memory) + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })
  return (
    <figure className="polaroid hope-photo">
      {url && <img src={url} alt={caption || `Foto del ${date}`} loading="lazy" />}
      <figcaption>{caption || date}</figcaption>
    </figure>
  )
}

/** Las fotos son los recuerdos con foto del diario: si el diario tiene clave, también se piden aquí. */
function Photos({ onCount }: { onCount: (n: number) => void }) {
  const { locked, unlock } = useDiaryLock(true)
  const [photos, setPhotos] = useState<Thought[]>([])
  const [asking, setAsking] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    listThoughts().then((all) => setPhotos(all.filter((t) => t.photo)))
  }, [])
  useEffect(() => onCount(photos.length), [photos.length, onCount])

  const add = async (file?: File) => {
    if (!file) return
    const memory: Thought = { id: newId(), createdAt: new Date().toISOString(), kind: 'recuerdo', text: '', feelings: [], photo: await shrinkPhoto(file) }
    await saveThought(memory)
    setPhotos((all) => [memory, ...all])
    setAdded(true)
  }

  return (
    <section className="card field">
      <h2>📷 Fotos que me hacen bien</h2>
      <p className="muted">
        Las personas, los lugares y los momentos que quieres tener a la mano. Son los recuerdos con foto
        de tu diario; las que agregues aquí también quedan en él, en la página de hoy.
      </p>

      {locked && photos.length > 0 ? (
        asking ? (
          <PinPad
            title="La clave de tu diario"
            onSubmit={(pin) => (unlock(pin) ? setAsking(false) : 'Esa no es. Intenta otra vez.')}
            onCancel={() => setAsking(false)}
          />
        ) : (
          <div className="callout info">
            <p>
              {photos.length === 1 ? 'Tienes 1 foto' : `Tienes ${photos.length} fotos`}. Viven en tu diario, que tiene
              clave.
            </p>
            <button className="btn small ghost" onClick={() => setAsking(true)}>
              Ver mis fotos
            </button>
          </div>
        )
      ) : (
        photos.length > 0 && (
          <div className="hope-photos">
            {photos.map((p) => (
              <Photo key={p.id} memory={p} />
            ))}
          </div>
        )
      )}

      {added && locked && (
        <p className="muted small" role="status">
          Guardada en tu diario.
        </p>
      )}
      <label className="btn ghost photo-add">
        <ImagePlus size={18} aria-hidden="true" />
        Agregar una foto
        <input type="file" accept="image/*" className="visually-hidden" onChange={(e) => add(e.target.files?.[0])} />
      </label>
    </section>
  )
}

function LetterCard({ low }: { low: boolean }) {
  const [letter, setLetter] = useStored<Letter | null>('carta', null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)
  const say = useAddress()

  const start = (starter: string) => {
    setDraft((d) => (d.trim() ? d.trimEnd() + '\n' : '') + starter.replace('…', ' '))
    requestAnimationFrame(() => {
      const el = area.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    })
  }

  if (letter && !editing) {
    return (
      <section className={`card field letter-card ${low ? 'today' : ''}`}>
        <h2>💌 Una carta para mí</h2>
        {low && <p>Hoy es un día pesado. Esto te lo escribiste para un día así:</p>}
        <blockquote className="letter">
          <p className="pre">{letter.text}</p>
          <footer>
            Te la escribiste el {new Date(letter.date + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </footer>
        </blockquote>
        <div className="row">
          <button
            className="btn small ghost"
            onClick={() => {
              setDraft(letter.text)
              setEditing(true)
            }}
          >
            Cambiarla
          </button>
          <button className="btn small ghost" onClick={() => setLetter(null)}>
            Borrarla
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card field letter-card">
      <h2>💌 Una carta para mí</h2>
      <p className="muted">
        Escríbela en un día bueno, para leerla en uno difícil. Cuéntate lo que hoy sabes y ese día quizá
        se te olvide: lo que te ha ayudado, quién te quiere, que ya has salido de días así.
      </p>
      {low && <p className="small">Si hoy es un día pesado, no tiene que ser hoy. Aquí te espera.</p>}
      <div className="starters" aria-label="Frases para empezar">
        {LETTER_STARTERS.map((s) => (
          <button key={s} className="starter" onClick={() => start(s)}>
            {s}
          </button>
        ))}
      </div>
      <textarea
        ref={area}
        className="letter-paper"
        rows={8}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={say('Querida yo de un día difícil:', 'Querido yo de un día difícil:', 'Para mí, en un día difícil:')}
        aria-label="Tu carta"
      />
      <div className="row">
        <button
          className="btn"
          disabled={!draft.trim()}
          onClick={() => {
            setLetter({ text: draft.trim(), date: today() })
            setEditing(false)
          }}
        >
          Guardar mi carta
        </button>
        {editing && (
          <button className="btn ghost" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        )}
      </div>
      <p className="muted small">Cuando marques que te sientes mal, la app te la va a ofrecer.</p>
    </section>
  )
}

export default function Caja() {
  const [reasons] = useStored<JournalEntry[]>('razones', [])
  const [letter] = useStored<Letter | null>('carta', null)
  const [moods] = useStored<MoodEntry[]>('moods', [])
  const [photos, setPhotos] = useState(0)
  const mood = moods.find((m) => m.date === today())?.mood
  // En un día pesado, la carta va primero.
  const low = mood !== undefined && mood <= 2

  return (
    <div className="stack">
      <PageHeader title="Mi caja de esperanza" subtitle="Lo que te sostiene, guardado para los días en que cuesta recordarlo." />
      <Box reasons={reasons.length} photos={photos} letter={!!letter} />
      {low && letter && <LetterCard low />}
      <Reasons />
      <Photos onCount={setPhotos} />
      {!(low && letter) && <LetterCard low={low} />}
    </div>
  )
}
