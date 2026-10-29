import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NEIGHBORS, type NeighborId } from '../../data/barrio'
import { firstName, usePeople, whatsappOf } from '../../lib/people'
import type { FlowProps } from '../types'
import { Flow, NotNow, OwnText, Says, Thanks, nameOf } from './parts'

// Memo el cartero (bondad, sin desconocidos). Dos caminos: una cartita para un vecino del barrio,
// que se queda en el teléfono y el vecino contesta con cariño (es un personaje, no una persona);
// o una tarjeta ya escrita para una de sus personas de confianza, por WhatsApp. El enlace solo se
// abre si la persona lo toca, y solo se manda si ella lo envía. La carta no se guarda.

type Neighbor = Exclude<NeighborId, 'memo'>

const REPLIES: Record<Neighbor, string> = {
  tere: '¡Ay, qué bonito! La voy a pegar junto a la caja para leerla diario. Gracias por acordarte de mí.',
  chema: 'Mire nomás… Hace mucho que nadie me escribía. La guardo en la bolsa de la camisa, junto al corazón.',
  nico: '¡Una carta para mí! Se la voy a enseñar a mi mamá. ¡Gracias, gracias!',
  lupe: 'Ay, qué detalle. Esto me alegró la tarde más que cualquier agua fresca.',
  beto: '¡Órale! Ya me hiciste el día. Pásale cuando quieras, aquí siempre hay un saludo para ti.',
  ramiro: 'Gracias. Las palabras buenas también se quedan, como la madera que dura.',
  rosa: 'Gracias… Justo hoy lo necesitaba. Me hiciste sentir menos sola.',
  chayo: 'Ay, qué bonito. La voy a guardar entre mis rebozos, para que se quede calientita.',
}

/** Si lo que escribió sonó a riesgo, el vecino no contesta como si nada. */
const CARE_REPLY = 'Gracias por confiarme esto. Me importa cómo estás. Ojalá hoy platiques con alguien que te pueda escuchar.'

const STARTERS = ['Gracias por…', 'Me acordé de ti porque…', 'Que tengas un bonito día.']

const CARDS = [
  'Me acordé de ti y quise mandarte un saludo. Gracias por estar.',
  'Hola, nomás quería decirte que te quiero mucho.',
  'Que tengas un bonito día. Me dio gusto acordarme de ti.',
  'Gracias por todo lo que haces por mí.',
]

type Stage = 'intro' | 'who' | 'write' | 'delivered' | 'person' | 'sent' | 'end'

export default function Carta({ petName, onDone, onLater, onClose }: FlowProps) {
  const { people, reachable, country } = usePeople()
  const [stage, setStage] = useState<Stage>('intro')
  const [to, setTo] = useState<Neighbor | null>(null)
  const [cared, setCared] = useState(false)
  const [personId, setPersonId] = useState<string | null>(null)
  const [card, setCard] = useState(CARDS[0])
  const [opened, setOpened] = useState(false)

  const neighbors = NEIGHBORS.filter((n): n is (typeof NEIGHBORS)[number] & { id: Neighbor } => n.id !== 'memo')
  const person = reachable.find((p) => p.id === personId) ?? (reachable.length === 1 ? reachable[0] : undefined)
  const named = people.filter((p) => p.name.trim())

  return (
    <Flow label="Una carta con Memo">
      {stage === 'delivered' && to ? (
        <Says who={to}>
          <p>{cared ? CARE_REPLY : REPLIES[to]}</p>
        </Says>
      ) : (
        <Says who="memo">
          {stage === 'intro' && (
            <p>
              ¡Buenas! ¿Mandamos algo bonito hoy? Un detalle chiquito le alegra el día a alguien, y a quien lo manda
              también. Puede ser una cartita para alguien del barrio, o una tarjeta para una de tus personas.
            </p>
          )}
          {stage === 'who' && <p>¿Para quién es la carta? Yo se la llevo, con {petName} de ayudante.</p>}
          {stage === 'write' && to && (
            <p>Escríbele a {nameOf(to)} algo cortito. Se queda aquí, en tu teléfono: no sale a ningún lado.</p>
          )}
          {stage === 'person' &&
            (reachable.length ? (
              <p>Escoge a quién y qué tarjeta. Se abre WhatsApp con el mensaje, y solo se manda si tú le das enviar.</p>
            ) : (
              <p>
                Para mandarle una tarjeta a alguien de confianza, primero hay que anotar su teléfono. Si quieres, mientras,
                le escribimos a alguien del barrio.
              </p>
            ))}
          {stage === 'sent' && <p>¿Ya la mandaste? Sin prisa: si no, se puede otro día.</p>}
          {stage === 'end' && <p>¡Entregada! Un detalle así se queda con quien lo recibe. Gracias por mandarlo.</p>}
        </Says>
      )}

      {stage === 'intro' && (
        <div className="stack tight">
          <div className="row">
            <button type="button" className="btn" onClick={() => setStage('who')}>
              Escribirle a un vecino
            </button>
            <button type="button" className="btn ghost" onClick={() => setStage('person')}>
              Una tarjeta para alguien de confianza
            </button>
          </div>
          <div className="row">
            <NotNow onClose={onClose} />
          </div>
        </div>
      )}

      {stage === 'who' && (
        <div className="chips">
          {neighbors.map((n) => (
            <button
              key={n.id}
              type="button"
              className="chip"
              onClick={() => {
                setTo(n.id)
                setStage('write')
              }}
            >
              {n.name}
            </button>
          ))}
        </div>
      )}

      {stage === 'write' && to && (
        <OwnText
          label={`Tu carta para ${nameOf(to)}`}
          placeholder="Querido vecino…"
          starters={STARTERS}
          submit="Que Memo la lleve"
          maxLength={280}
          multiline
          onCancel={() => setStage('who')}
          onSubmit={(_text, risk) => {
            setCared(risk)
            setStage('delivered')
          }}
        />
      )}

      {stage === 'delivered' && (
        <div className="row">
          {cared && (
            <Link to="/ayuda" className="btn ghost">
              Hablar con alguien ahora
            </Link>
          )}
          <button type="button" className="btn" onClick={() => setStage('end')}>
            Qué bonito
          </button>
        </div>
      )}

      {stage === 'person' &&
        (reachable.length ? (
          <>
            {reachable.length > 1 && (
              <div className="chips" role="group" aria-label="A quién">
                {reachable.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip${person?.id === p.id ? ' selected' : ''}`}
                    aria-pressed={person?.id === p.id}
                    onClick={() => setPersonId(p.id)}
                  >
                    {firstName(p)}
                  </button>
                ))}
              </div>
            )}
            <div className="bm-options" role="group" aria-label="La tarjeta">
              {CARDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`bm-option${card === c ? ' selected' : ''}`}
                  aria-pressed={card === c}
                  onClick={() => setCard(c)}
                >
                  <span>{c}</span>
                </button>
              ))}
            </div>
            {person ? (
              <div className="row">
                <a
                  className="btn"
                  href={whatsappOf(person.phone, country, card)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    setOpened(true)
                    setStage('sent')
                  }}
                >
                  Abrir WhatsApp para {firstName(person)}
                </a>
              </div>
            ) : (
              <p className="muted small">Escoge a quién se la mandas.</p>
            )}
            <div className="row">
              <button type="button" className="btn small ghost" onClick={() => setStage('who')}>
                Mejor a un vecino
              </button>
            </div>
          </>
        ) : (
          <div className="row">
            <Link to="/mi-espacio/personas" className="btn">
              {named.length ? `Anotar el teléfono de ${firstName(named[0])}` : 'Anotar a alguien de confianza'}
            </Link>
            <button type="button" className="btn ghost" onClick={() => setStage('who')}>
              Mejor a un vecino
            </button>
          </div>
        ))}

      {stage === 'sent' && (
        <div className="row">
          <button type="button" className="btn" onClick={() => setStage('end')}>
            Sí, ya la mandé
          </button>
          {opened && person && (
            <a className="btn ghost" href={whatsappOf(person.phone, country, card)} target="_blank" rel="noreferrer">
              Abrirlo otra vez
            </a>
          )}
          <button type="button" className="btn ghost" onClick={onLater}>
            Hoy no
          </button>
        </div>
      )}

      {stage === 'end' && <Thanks to="Memo" onDone={onDone} />}
    </Flow>
  )
}
