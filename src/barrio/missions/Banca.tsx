import { useState } from 'react'
import PetSays from '../../components/PetSays'
import RiskNotice from '../../components/RiskNotice'
import { today, useAddress } from '../../lib/storage'
import type { FlowProps } from '../types'
import { Flow, NotNow, OwnText, Says, Thanks } from './parts'

// Rosa en la banca (autocompasión). Rosa se habla muy duro por un error; la persona elige o
// escribe lo que le diría a una amiga, y luego su mascota le da la vuelta: «¿Y si te lo dices a
// ti?», con una mano en el pecho y una respiración. Lo que escribe no se guarda.

const SCENES = [
  {
    mistake: 'Se me olvidó el cumpleaños de mi hermana.',
    harsh: '¡Qué tonta soy! Siempre hago todo mal.',
  },
  {
    mistake: 'Me equivoqué en el trabajo y todos se dieron cuenta.',
    harsh: 'No sirvo para nada. Debería darme vergüenza.',
  },
  {
    mistake: 'Le contesté feo a mi mamá.',
    harsh: 'Soy una pésima hija. Así no me van a querer.',
  },
]

const KIND = [
  'Todos nos equivocamos. Un error no dice quién eres.',
  'Se ve que te importa mucho; por eso te duele.',
  'Puedes pedir perdón y ya. Eres más que este error.',
  'Respira tantito. No tienes que ser perfecta para merecer cariño.',
]

type Stage = 'intro' | 'friend' | 'own' | 'care' | 'rosa' | 'turn' | 'end'

export default function Banca({ petName, onDone, onClose }: FlowProps) {
  const [scene] = useState(() => SCENES[Number(today().slice(-2)) % SCENES.length])
  const [stage, setStage] = useState<Stage>('intro')
  // Lo que le dijo a Rosa vive solo aquí, para devolvérselo.
  const [said, setSaid] = useState('')
  const [hard, setHard] = useState(false)
  const say = useAddress()

  const tell = (text: string) => {
    setSaid(text)
    setStage('rosa')
  }

  // Para devolvérselo a la persona sin el «perfecta» de Rosa.
  const forYou = said.replace('ser perfecta', `ser ${say('perfecta', 'perfecto', 'perfecta ni perfecto')}`)

  return (
    <Flow label="La banca con Rosa">
      {stage !== 'turn' && (
        <Says who="rosa">
          {stage === 'intro' && (
            <p>
              Ay… {scene.mistake} {scene.harsh}
            </p>
          )}
          {(stage === 'friend' || stage === 'own') && (
            <p>
              <span className="muted">{petName} se sienta junto a Rosa.</span> Si una amiga te dijera esto, ¿qué le
              dirías tú?
            </p>
          )}
          {stage === 'care' && (
            <p>
              Gracias por decírmelo. Parece que tú también traes algo muy pesado, y eso merece que alguien te escuche de
              verdad, no nomás yo.
            </p>
          )}
          {stage === 'rosa' && (
            <p>Gracias… Nunca me lo había dicho así. Se siente distinto, como si me pusieran una cobijita.</p>
          )}
          {stage === 'end' && (
            <p>
              Tratarte bien no es echarte porras de mentira. Es hablarte como le hablas a quien quieres. Gracias por
              sentarte conmigo.
            </p>
          )}
        </Says>
      )}

      {stage === 'turn' && (
        <PetSays mood="calma" compact>
          <p aria-live="polite">
            Oye… lo que le dijiste a Rosa: «{forYou}» ¿Y si te lo dices a ti? Si quieres, pon una mano en el pecho,
            toma aire despacio y dítelo bajito.
          </p>
          {hard && (
            <p className="small">
              Está bien que cueste. A mucha gente le sale más fácil ser amable con otros que consigo. Con intentarlo, ya
              cuenta.
            </p>
          )}
        </PetSays>
      )}

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('friend')}>
            Sentarme con ella
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'friend' && (
        <>
          <div className="bm-options">
            {KIND.map((k) => (
              <button key={k} type="button" className="bm-option" onClick={() => tell(k)}>
                <span>{k}</span>
              </button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn small ghost" onClick={() => setStage('own')}>
              Lo digo con mis palabras
            </button>
          </div>
        </>
      )}

      {stage === 'own' && (
        <OwnText
          label="Lo que le dirías a Rosa"
          submit="Decírselo"
          maxLength={140}
          multiline
          onCancel={() => setStage('friend')}
          // No se guarda. Si sonó a riesgo, no se le devuelve como frase: se le acompaña.
          onSubmit={(text, risk) => (risk ? setStage('care') : tell(text))}
        />
      )}

      {stage === 'care' && (
        <>
          <RiskNotice />
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => setStage('end')}>
              Sigue
            </button>
          </div>
        </>
      )}

      {stage === 'rosa' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('turn')}>
            De nada, Rosa
          </button>
        </div>
      )}

      {stage === 'turn' && (
        <>
          <div className="bm-chest" aria-hidden="true">
            <span className="bm-chest-glow" />
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => setStage('end')}>
              Ya me lo dije
            </button>
            {!hard && (
              <button type="button" className="btn ghost" onClick={() => setHard(true)}>
                Me cuesta
              </button>
            )}
            {hard && (
              <button type="button" className="btn ghost" onClick={() => setStage('end')}>
                Lo intenté
              </button>
            )}
          </div>
        </>
      )}

      {stage === 'end' && <Thanks to="Rosa" onDone={onDone} />}
    </Flow>
  )
}
