import { useState } from 'react'
import { Link } from 'react-router-dom'
import RiskNotice from '../../components/RiskNotice'
import { today } from '../../lib/storage'
import type { FlowProps } from '../types'
import { Flow, NotNow, OwnText, Says, Thanks } from './parts'

// Don Ramiro y los tablones ásperos (reestructuración cognitiva, dicha sencillo). Cada tablón
// trae un pensamiento que raspa; la persona nombra qué lo hace áspero y elige una forma más
// justa de decirlo, y el tablón se lija. No se trata de pensar bonito, sino más parejo.
// Al final puede lijar un pensamiento suyo: se revisa por si suena a riesgo y no se guarda.

type TrapId = 'todo' | 'adivinar' | 'peor' | 'etiqueta' | 'malo'

/** Lo que hace áspero un pensamiento, en palabras de todos los días. */
const TRAPS: { id: TrapId; label: string; plain: string }[] = [
  { id: 'todo', label: 'Todo o nada', plain: 'Usa «siempre», «nunca», «nadie», «todo». Casi nada es tan parejo.' },
  { id: 'adivinar', label: 'Adivinar lo que otros piensan', plain: 'Da por hecho lo que los demás sienten, sin preguntarles.' },
  { id: 'peor', label: 'Ponerse en lo peor', plain: 'Brinca a que va a pasar lo peor, como si ya fuera seguro.' },
  { id: 'etiqueta', label: 'Ponerse etiquetas', plain: 'Se pone un nombre feo entero por una sola cosa.' },
  { id: 'malo', label: 'Ver solo lo malo', plain: 'Se fija en lo que salió mal y deja fuera lo que sí salió.' },
]

type Board = {
  rough: string
  /** Lo que más lo hace áspero; las demás también pueden ser. */
  traps: TrapId[]
  fair: string[]
  /** Puede rozar con el riesgo: después se menciona, con calma, que hablarlo ayuda. */
  careful?: boolean
}

const BOARDS: Board[] = [
  {
    rough: 'Siempre lo arruino',
    traps: ['todo', 'etiqueta', 'malo'],
    fair: [
      'Hay cosas que me salen mal, y otras que sí me salen.',
      'Esta vez no salió como quería. Puedo intentarlo otra vez.',
      'Me equivoco como cualquiera; no lo arruino todo.',
    ],
  },
  {
    rough: 'Nadie me quiere',
    traps: ['todo', 'adivinar', 'malo'],
    fair: [
      'Hoy me siento lejos de la gente, y eso duele.',
      'Hay personas a las que les importo, aunque hoy no lo sienta.',
      'Sentirlo así no quiere decir que sea cierto.',
    ],
  },
  {
    rough: 'Si me equivoco, todos se van a burlar',
    traps: ['adivinar', 'peor', 'todo'],
    fair: [
      'Si me equivoco, a lo mejor alguien lo nota, y luego se le pasa.',
      'Casi todos andan pensando en sus cosas, no en mí.',
      'Equivocarme es parte de aprender.',
    ],
  },
  {
    rough: 'Ya nada va a mejorar',
    traps: ['peor', 'todo', 'malo'],
    fair: [
      'Ahorita no veo cómo, pero las cosas cambian, aunque sea poquito.',
      'Hoy está muy pesado. No sé cómo va a estar mañana.',
      'He tenido días malos que luego pasaron.',
    ],
    careful: true,
  },
  {
    rough: 'Soy una carga',
    traps: ['etiqueta', 'adivinar', 'malo'],
    fair: [
      'Pedir ayuda no me hace una carga: a todos nos toca necesitar.',
      'A veces me toca necesitar a otros, como a otros les toca necesitarme.',
      'Ahorita necesito más apoyo, y eso está bien.',
    ],
    careful: true,
  },
]

/** Formas parejas para su propio pensamiento, por si no encuentra las palabras. */
const OWN_FAIR = [
  'Ahorita lo siento así, pero no es toda la historia.',
  'Es un pensamiento, no un hecho.',
  'Le diría algo más amable a alguien que quiero.',
]

const trapOf = (id: TrapId) => TRAPS.find((t) => t.id === id)!

// El tablón del día cambia solo; en un día pesado empieza por uno que no roce con el riesgo.
function firstBoard(heavy: boolean) {
  const [y, m, d] = today().split('-').map(Number)
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
  const pool = BOARDS.map((_, i) => i).filter((i) => !heavy || !BOARDS[i].careful)
  return pool[day % pool.length]
}

type Stage = 'intro' | 'trap' | 'fair' | 'sand' | 'mine-ask' | 'mine' | 'mine-care' | 'mine-fair' | 'mine-sand' | 'end'

export default function Taller({ petName, heavy, onDone, onClose }: FlowProps) {
  const [index, setIndex] = useState(() => firstBoard(heavy))
  const [stage, setStage] = useState<Stage>('intro')
  const [trap, setTrap] = useState<TrapId | null>(null)
  const [fair, setFair] = useState('')
  const [writing, setWriting] = useState(false)
  // Su propio pensamiento vive solo aquí mientras lo lija; no se guarda.
  const [mine, setMine] = useState('')
  const [mineFair, setMineFair] = useState('')
  const [sanded, setSanded] = useState(0)

  const board = BOARDS[index]
  const main = board.traps[0]

  const pickTrap = (id: TrapId) => {
    setTrap(id)
    setStage('fair')
  }

  const sand = (text: string) => {
    setFair(text)
    setWriting(false)
    setSanded(sanded + 1)
    setStage('sand')
  }

  const another = () => {
    setIndex((index + 1) % BOARDS.length)
    setTrap(null)
    setFair('')
    setStage('trap')
  }

  const trapSays = !trap
    ? ''
    : board.traps.includes(trap)
      ? trap === main
        ? `¡Eso! Ahí está la astilla: ${trapOf(trap).label.toLowerCase()}.`
        : `También puede ser. Yo le veo además ${trapOf(main).label.toLowerCase()}.`
      : `Puede ser, cada quien lo ve distinto. Yo le veo más ${trapOf(main).label.toLowerCase()}.`

  const boardText = stage === 'sand' || stage === 'mine-ask' || stage === 'end' ? fair : board.rough
  const showMine = stage === 'mine-fair' || stage === 'mine-sand'

  return (
    <Flow label="El taller de Don Ramiro">
      <Says who="ramiro">
        {stage === 'intro' && (
          <p>
            Buenas. Aquí al taller llegan tablones ásperos: pensamientos que nos decimos bien feo. Le pasa a todo mundo.
            No se trata de pensar bonito, sino de decirlo más parejo, más justo. ¿Me ayudas a lijar uno? {petName}{' '}
            sostiene el tablón.
          </p>
        )}
        {stage === 'trap' && <p>Mira este. ¿Qué crees que lo hace raspar?</p>}
        {stage === 'fair' && <p>{trapSays} ¿Cómo lo dirías más parejo?</p>}
        {stage === 'sand' && <p>Ya quedó lisito. Se sigue entendiendo lo que duele, pero ya no lastima tanto.</p>}
        {stage === 'mine-ask' && <p>¿Hay un pensamiento tuyo que quieras lijar? Nomás si quieres.</p>}
        {stage === 'mine' && <p>Escríbelo como te lo dices. Se queda aquí nomás mientras lo lijamos; no se guarda.</p>}
        {stage === 'mine-care' && (
          <p>
            Gracias por confiármelo. Ese pensamiento pesa mucho, y no es para lijarlo a solas: mereces que alguien te
            acompañe con él.
          </p>
        )}
        {stage === 'mine-fair' && <p>¿Qué crees que lo hace raspar? Y luego, ¿cómo lo dirías más parejo?</p>}
        {stage === 'mine-sand' && <p>Ese también quedó más parejo. Lo hiciste tú, con tus palabras.</p>}
        {stage === 'end' && (
          <p>
            {sanded > 1 ? 'Qué buen trabajo hicimos hoy.' : 'Gracias por la mano.'} Cuando un pensamiento raspe, ya
            sabes: se le puede pasar la lija.
          </p>
        )}
      </Says>

      {stage !== 'intro' && stage !== 'mine' && stage !== 'mine-care' && (
        <div className="bm-plank-wrap" aria-live="polite">
          <div
            key={showMine ? `mine-${stage}` : `${index}-${boardText}`}
            className={`bm-plank${stage === 'sand' || stage === 'mine-sand' ? ' sanding' : ''}${boardText === fair || stage === 'mine-sand' ? ' smooth' : ''}`}
          >
            <span className="bm-plank-text">{showMine ? (stage === 'mine-sand' ? mineFair : mine) : boardText}</span>
            {(stage === 'sand' || stage === 'mine-sand') && <span className="bm-sander" aria-hidden="true" />}
          </div>
          {(stage === 'sand' || stage === 'mine-sand') && (
            <p className="muted small bm-was">
              Antes decía: «{stage === 'sand' ? board.rough : mine}»
            </p>
          )}
        </div>
      )}

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('trap')}>
            Va, a lijar
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {(stage === 'trap' || stage === 'mine-fair') && (
        <div className="bm-options">
          {TRAPS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`bm-option${stage === 'mine-fair' && trap === t.id ? ' selected' : ''}`}
              aria-pressed={stage === 'mine-fair' ? trap === t.id : undefined}
              onClick={() => (stage === 'trap' ? pickTrap(t.id) : setTrap(trap === t.id ? null : t.id))}
            >
              <span>{t.label}</span>
              <small>{t.plain}</small>
            </button>
          ))}
        </div>
      )}
      {stage === 'trap' && (
        <div className="row">
          <button type="button" className="btn small ghost" onClick={another}>
            Otro tablón
          </button>
        </div>
      )}

      {stage === 'fair' &&
        (writing ? (
          <OwnText
            label="Dilo más parejo, con tus palabras"
            submit="Lijar"
            maxLength={120}
            onCancel={() => setWriting(false)}
            // Lo que escribe aquí no se guarda; si sonó a riesgo, ya vio el aviso.
            onSubmit={(text) => sand(text)}
          />
        ) : (
          <>
            <div className="bm-options">
              {board.fair.map((f) => (
                <button key={f} type="button" className="bm-option" onClick={() => sand(f)}>
                  <span>{f}</span>
                </button>
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn small ghost" onClick={() => setWriting(true)}>
                Con mis palabras
              </button>
            </div>
          </>
        ))}

      {stage === 'sand' && (
        <>
          {board.careful && (
            <p className="callout warm small">
              Si este pensamiento se te hace muy cierto estos días, platicarlo con alguien ayuda mucho.{' '}
              <Link to="/ayuda">Hablar con alguien</Link>
            </p>
          )}
          <div className="row">
            <button type="button" className="btn" onClick={() => setStage('mine-ask')}>
              Sigue
            </button>
            <button type="button" className="btn ghost" onClick={another}>
              Otro tablón
            </button>
          </div>
        </>
      )}

      {stage === 'mine-ask' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('mine')}>
            Sí, uno mío
          </button>
          <button type="button" className="btn ghost" onClick={() => setStage('end')}>
            Por hoy así está bien
          </button>
        </div>
      )}

      {stage === 'mine' && (
        <OwnText
          label="Tu pensamiento áspero"
          placeholder="Por ejemplo: no sirvo para esto"
          submit="Ponerlo en el banco"
          maxLength={120}
          onCancel={() => setStage('end')}
          onSubmit={(text, risk) => {
            // Si suena a riesgo, no se lija: se acompaña.
            if (risk) return setStage('mine-care')
            setMine(text)
            setTrap(null)
            setStage('mine-fair')
          }}
        />
      )}

      {stage === 'mine-fair' && (
        <OwnText
          label="Más parejo sería…"
          submit="Lijar"
          maxLength={120}
          onCancel={() => setStage('end')}
          onSubmit={(text) => {
            setMineFair(text)
            setSanded(sanded + 1)
            setStage('mine-sand')
          }}
        >
          <p className="muted small">Si no encuentras las palabras, empieza con una de estas:</p>
          <div className="chips">
            {OWN_FAIR.map((f) => (
              <button
                key={f}
                type="button"
                className="chip"
                onClick={() => {
                  setMineFair(f)
                  setSanded(sanded + 1)
                  setStage('mine-sand')
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </OwnText>
      )}

      {stage === 'mine-care' && (
        <>
          <RiskNotice />
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => setStage('end')}>
              Sigue
            </button>
          </div>
        </>
      )}
      {stage === 'mine-sand' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('end')}>
            Sigue
          </button>
        </div>
      )}

      {stage === 'end' && <Thanks to="Don Ramiro" onDone={onDone} />}
    </Flow>
  )
}
