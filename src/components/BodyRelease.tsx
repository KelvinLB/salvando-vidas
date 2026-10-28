import { useEffect, useState } from 'react'
import { buzz } from '../lib/storage'

// Aflojar donde se siente la tensión: relajación muscular progresiva, una zona a la vez.
const ZONES = [
  { id: 'frente', emoji: '😣', label: 'La frente', tense: 'Sube las cejas lo más que puedas.', release: 'Suéltalas y siente cómo se alisa la frente.' },
  { id: 'mandibula', emoji: '😬', label: 'La mandíbula', tense: 'Aprieta los dientes, sin lastimarte.', release: 'Abre un poco la boca y deja caer la mandíbula. La lengua, suelta.' },
  { id: 'hombros', emoji: '🤷', label: 'Los hombros', tense: 'Sube los hombros hacia las orejas.', release: 'Déjalos caer y siente el peso bajar.' },
  { id: 'pecho', emoji: '🫁', label: 'El pecho', tense: 'Lleva los hombros hacia atrás y abre el pecho.', release: 'Regresa y suelta el aire despacio por la boca.' },
  { id: 'estomago', emoji: '🌀', label: 'El estómago', tense: 'Mete el ombligo y aprieta el abdomen.', release: 'Suéltalo y deja que la panza se infle al respirar.' },
  { id: 'manos', emoji: '✊', label: 'Las manos', tense: 'Cierra los puños con fuerza.', release: 'Ábrelos despacio y deja los dedos sueltos.' },
]
const TENSE_SECONDS = 5
const RELEASE_SECONDS = 10
const ROUNDS = 3

export default function BodyRelease() {
  const [zone, setZone] = useState<(typeof ZONES)[number] | null>(null)
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<'tensa' | 'suelta'>('tensa')
  const [left, setLeft] = useState(TENSE_SECONDS)
  const finished = round >= ROUNDS

  useEffect(() => {
    if (!zone || finished) return
    if (left <= 0) {
      const timer = setTimeout(() => {
        buzz(20)
        if (phase === 'tensa') {
          setPhase('suelta')
          setLeft(RELEASE_SECONDS)
        } else {
          setRound((r) => r + 1)
          setPhase('tensa')
          setLeft(TENSE_SECONDS)
        }
      }, 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [zone, finished, left, phase])

  const start = (z: (typeof ZONES)[number]) => {
    setZone(z)
    setRound(0)
    setPhase('tensa')
    setLeft(TENSE_SECONDS)
  }

  return (
    <section className="card" id="aflojar">
      <h2>¿Dónde lo sientes en el cuerpo?</h2>
      {!zone ? (
        <>
          <p className="muted">
            Las emociones se sienten en el cuerpo: la mandíbula apretada, los hombros arriba, el pecho
            cerrado. Elige dónde lo notas y lo aflojamos juntos, en un minuto.
          </p>
          <div className="grid">
            {ZONES.map((z) => (
              <button key={z.id} className="tile" onClick={() => start(z)}>
                <span className="tile-emoji" aria-hidden="true">
                  {z.emoji}
                </span>
                <strong>{z.label}</strong>
              </button>
            ))}
          </div>
        </>
      ) : finished ? (
        <div className="center stack tight">
          <p className="big-emoji">🌿</p>
          <p>
            Nota la diferencia entre la tensión y lo suelto. Puedes volver a esa sensación cuando quieras.
          </p>
          <button className="btn ghost" onClick={() => setZone(null)}>
            Otra zona
          </button>
        </div>
      ) : (
        <div className="center stack tight">
          <small className="muted">
            {zone.label} · {round + 1} de {ROUNDS}
          </small>
          <p className="relax-step" aria-live="polite">
            {phase === 'tensa' ? zone.tense : zone.release}
          </p>
          <p className={`body-count ${phase}`}>
            {phase === 'tensa' ? 'Tensa' : 'Suelta'} · {left}
          </p>
          <button className="btn ghost" onClick={() => setZone(null)}>
            Parar
          </button>
        </div>
      )}
      <p className="muted small">
        No hay un músculo para cada emoción, como dicen algunas imágenes en redes. Lo que sí ayuda es
        aflojar donde notes la tensión.
      </p>
    </section>
  )
}
