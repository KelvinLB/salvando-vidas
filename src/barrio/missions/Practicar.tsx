import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import PracticeRun, { HealthGate, PracticeSafety } from '../../components/PracticeRun'
import type { CompanionMood } from '../../data/companion'
import type { ExerciseId } from '../../data/practica'
import { suggested, useHealthOk, usePractice } from '../../lib/practica'
import type { FlowProps } from '../types'
import { Flow, NotNow, Says, Thanks } from './parts'

// Don Chema y la práctica del kiosco: un ejercicio de Practicar con el cuerpo (exposición
// interoceptiva), el más suave que todavía no ha probado, con Don Chema y su mascota haciéndolo
// también. Antes va el filtro de salud; si marcó algo, no se ofrece ninguno: «Platicamos nomás»
// la da por hecha sin pedir nada, y «Hoy no» la deja para otro día. El tablero no la pone con
// señales de riesgo, de noche ni en un día pesado (src/lib/barrioBoard.ts). Los textos quedan
// pendientes de revisión de un psicólogo y un médico.

/** Cómo lo invita Don Chema, según el ejercicio: siempre desde el kiosco y el danzón. */
const INVITE: Record<ExerciseId, string> = {
  cabeza:
    'En el kiosco a veces da vueltas la cabeza de tanto bailar danzón… ¿Practicamos que el mareo no asusta? Sentaditos, movemos la cabeza de lado a lado, como diciendo que no.',
  girar:
    'En el kiosco a veces da vueltas la cabeza de tanto bailar danzón… ¿Practicamos que el mareo no asusta? Damos vueltitas despacio, junto a algo firme.',
  correr:
    'Después de un danzón de los rapiditos, el corazón me va a mil. ¿Practicamos que el corazón rápido no asusta? Corremos en nuestro lugar, cada quien a su ritmo.',
  aguantar:
    'Bailando danzón a veces me quedo sin aire, y antes eso me espantaba. ¿Practicamos que esa sensación no asusta? Aguantamos la respiración tantito, sentados.',
  popote:
    'Bailando danzón a veces siento que no me entra el aire. ¿Practicamos que esa sensación no asusta? Respiramos por un popote, sentaditos.',
}

type Stage = 'intro' | 'practica' | 'platica' | 'end'

export default function Practicar({ petName, heavy, onDone, onLater, onClose }: FlowProps) {
  const { records } = usePractice()
  const { checked, ok } = useHealthOk()
  // El ejercicio se elige al llegar y no cambia a media práctica.
  const [exercise] = useState(() => suggested(records))
  const [stage, setStage] = useState<Stage>('intro')

  // Don Chema acompaña el ejercicio; mientras dura, recuerda que lo hacen juntos.
  const speak = (text: string, mood?: CompanionMood): ReactNode => (
    <Says who="chema">
      <p>{text}</p>
      {mood !== 'feliz' && <p className="muted small">{petName} y yo lo hacemos contigo.</p>}
    </Says>
  )

  return (
    <Flow label="Practicar en el kiosco con Don Chema">
      {stage === 'intro' && (
        <>
          <Says who="chema">
            <p>
              {INVITE[exercise.id]} {petName} ya se puso junto a mí para hacerlo también. Es sentir a propósito,
              poquito y con cuidado, algo parecido a los nervios, para que el cuerpo aprenda que se va solo. Se para
              cuando quieras.
              {heavy && ' Si hoy el día pesa, también está bien dejarlo para otro día.'}
            </p>
          </Says>
          <PracticeSafety />
          <div className="row">
            <button type="button" className="btn" onClick={() => setStage('practica')}>
              Va, practicamos
            </button>
            <NotNow onClose={onClose} />
          </div>
        </>
      )}

      {stage === 'practica' && (
        <>
          {!checked && (
            <Says who="chema">
              <p>Antes, una pregunta para cuidarte. Así sabemos si hoy sí, o si mejor nomás platicamos.</p>
            </Says>
          )}
          <div className="bm-practice">
            <HealthGate>
              <PracticeRun exercise={exercise} speak={speak} onDone={(r) => (r ? setStage('end') : onLater())} />
            </HealthGate>
          </div>
          {checked && !ok && (
            <>
              <Says who="chema">
                <p>Qué bueno que lo dijiste. Entonces hoy no hacemos ejercicio: si quieres, platicamos nomás un rato.</p>
              </Says>
              <div className="row">
                <button type="button" className="btn" onClick={() => setStage('platica')}>
                  Platicamos nomás
                </button>
                <button type="button" className="btn ghost" onClick={onLater}>
                  Hoy no
                </button>
              </div>
            </>
          )}
        </>
      )}

      {stage === 'platica' && (
        <>
          <Says who="chema">
            <p>
              Yo, cuando me mareo en el kiosco, me siento en la banca, me agarro de algo firme y dejo que se pase
              solito. Hoy bailamos con la pura música, {petName} y yo, y eso también cuenta. Si un día tu médico te dice
              que sí, aquí sigue el kiosco. Cuidarte así también es practicar.
            </p>
          </Says>
          <Thanks to="Don Chema" onDone={onDone} />
        </>
      )}

      {stage === 'end' && (
        <>
          <Says who="chema">
            <p>
              ¡Eso! Lo sentimos los tres y se fue solito. {petName} ya se está riendo. Así se aprende: poquito a poquito,
              con cuidado, y luego a bailar danzón tranquilos.
            </p>
          </Says>
          <p className="small">
            Si quieres practicar otro, en <Link to="/nervios/practicar">Practicar con el cuerpo</Link> están todos.
          </p>
          <Thanks to="Don Chema" onDone={onDone} />
        </>
      )}
    </Flow>
  )
}
