import { useRef, useState } from 'react'
import { Download, LockKeyhole, Send, Upload } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import PinPad from '../../components/PinPad'
import ReminderCard from '../../components/ReminderCard'
import { COUNTRIES, guessCountry } from '../../data/helplines'
import { type Backup, backupContents, canShareFile, download, makeBackup, readBackup, restoreBackup } from '../../lib/backup'
import { howLongAgo } from '../../lib/diary'
import { makeKey, useDiaryLock } from '../../lib/lock'
import { SOUNDS_KEY } from '../../lib/petfx'
import { type Address, clearAll, today, useStored } from '../../lib/storage'

// Ajustes: cómo te acompaña la app y qué pasa con tus datos. Ya no está al mismo nivel que lo
// personal: se llega por el engrane de Mi espacio.

const RESTORED = 'sv:copia-recuperada'

type KeyStep = 'nueva' | 'pista' | 'cambiar' | 'quitar' | null

function DiaryKeyCard() {
  const { key, setKey, matches } = useDiaryLock()
  const [step, setStep] = useState<KeyStep>(null)
  const [first, setFirst] = useState('')
  const [pin, setPin] = useState('')
  const [hint, setHint] = useState('')
  const [note, setNote] = useState('')

  const reset = (message = '') => {
    setStep(null)
    setFirst('')
    setPin('')
    setHint('')
    setNote(message)
  }

  return (
    <section className="card field">
      <strong>
        <LockKeyhole size={18} aria-hidden="true" /> Clave para mi diario
      </strong>
      <small className="muted">
        Cuatro números que se piden al abrir tu diario, para que nadie que tome tu teléfono lo lea. No hay forma de
        recuperarla si la olvidas, así que elige una que recuerdes.
      </small>

      {step === 'nueva' && (
        <PinPad
          title={first ? 'Escríbelos otra vez' : 'Elige 4 números'}
          hint={first ? 'Para estar seguros de que son esos.' : undefined}
          onSubmit={(p) => {
            if (!first) return setFirst(p)
            if (p !== first) {
              setFirst('')
              return 'No coinciden. Elige otra vez 4 números.'
            }
            setPin(p)
            setStep('pista')
          }}
          onCancel={() => reset()}
        />
      )}

      {step === 'pista' && (
        <>
          <label className="field">
            Una pista para ti (si quieres)
            <input value={hint} onChange={(e) => setHint(e.target.value)} maxLength={60} placeholder="Algo que solo tú entiendas" autoFocus />
          </label>
          <small className="muted">Se ve al pedir la clave: no escribas los números.</small>
          <div className="row">
            <button
              className="btn"
              onClick={() => {
                setKey(makeKey(pin, hint))
                reset('Listo. Tu diario va a pedir la clave cada vez que lo abras.')
              }}
            >
              Guardar la clave
            </button>
            <button className="btn ghost" onClick={() => reset()}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {(step === 'cambiar' || step === 'quitar') && (
        <PinPad
          title="Escribe tu clave de ahora"
          hint={key?.hint && `Tu pista: ${key.hint}`}
          onSubmit={(p) => {
            if (!matches(p)) return 'Esa no es. Intenta otra vez.'
            if (step === 'quitar') {
              setKey(null)
              return reset('Listo. Tu diario ya no pide clave.')
            }
            setStep('nueva')
          }}
          onCancel={() => reset()}
        />
      )}

      {!step && (
        <>
          {note && (
            <p className="small" role="status">
              {note}
            </p>
          )}
          {key ? (
            <div className="row">
              <button className="btn small ghost" onClick={() => setStep('cambiar')}>
                Cambiar la clave
              </button>
              <button className="btn small ghost" onClick={() => setStep('quitar')}>
                Quitar la clave
              </button>
            </div>
          ) : (
            <button className="btn ghost" onClick={() => setStep('nueva')}>
              Ponerle clave a mi diario
            </button>
          )}
        </>
      )}
    </section>
  )
}

function BackupCard() {
  const [last, setLast] = useStored<string | null>('copia-fecha', null)
  const [working, setWorking] = useState(false)
  const [found, setFound] = useState<Backup | null>(null)
  const [error, setError] = useState('')
  const [restored] = useState(() => {
    try {
      const date = sessionStorage.getItem(RESTORED)
      sessionStorage.removeItem(RESTORED)
      return date
    } catch {
      return null
    }
  })
  const picker = useRef<HTMLInputElement>(null)
  const contents = found && backupContents(found)
  const ago = last && howLongAgo(last)

  const save = async (share: boolean) => {
    setWorking(true)
    setLast(today())
    try {
      const file = await makeBackup()
      if (share && canShareFile(file)) await navigator.share({ files: [file], title: 'Mi copia de Salvando Vidas' }).catch(() => {})
      else download(file)
    } finally {
      setWorking(false)
    }
  }

  const open = async (file?: File) => {
    setError('')
    if (!file) return
    const backup = await readBackup(file)
    if (!backup) setError('Ese archivo no es una copia de Salvando Vidas.')
    setFound(backup)
    if (picker.current) picker.current.value = ''
  }

  const restore = async () => {
    if (!found || !contents) return
    setWorking(true)
    try {
      await restoreBackup(found)
      sessionStorage.setItem(RESTORED, contents.date)
    } catch {
      setWorking(false)
      return setError('No se pudo recuperar. Lo que tenías sigue igual.')
    }
    location.reload()
  }

  return (
    <section className="card field">
      <strong>Tu copia de seguridad</strong>
      <small className="muted">
        Todo en un archivo: tu diario con sus fotos y audios, tu plan, tu caja de esperanza, tu mascota. Sirve para
        cambiar de teléfono o por si se borra la app. No pasa por ningún servidor: el archivo es tuyo.
      </small>
      {restored && (
        <p className="callout info" role="status">
          Listo: recuperaste tu copia del {restored}.
        </p>
      )}
      <p className="small">
        {last ? `Tu última copia: ${ago ? ago.toLowerCase() : `el ${new Date(last + 'T12:00').toLocaleDateString('es')}`}.` : 'Todavía no has guardado ninguna.'}
      </p>
      <div className="row">
        <button className="btn" onClick={() => save(false)} disabled={working}>
          <Download size={18} aria-hidden="true" />
          Descargar mi copia
        </button>
        {'canShare' in navigator && (
          <button className="btn ghost" onClick={() => save(true)} disabled={working}>
            <Send size={18} aria-hidden="true" />
            Mandarla a…
          </button>
        )}
      </div>
      <small className="muted">
        El archivo no lleva contraseña: guárdalo donde solo tú lo abras. Tampoco lleva la clave de tu diario.
      </small>

      {found && contents ? (
        <div className="callout warm">
          <p>
            <strong>Copia del {contents.date}.</strong> Trae{' '}
            {[
              `${contents.entries} ${contents.entries === 1 ? 'nota' : 'notas'} del diario` +
                (contents.photos ? ` (${contents.photos} con foto)` : ''),
              contents.plan && 'tu plan de seguridad',
              contents.reasons > 0 && `${contents.reasons} ${contents.reasons === 1 ? 'razón' : 'razones'}`,
              contents.people > 0 && `${contents.people} ${contents.people === 1 ? 'persona' : 'personas'}`,
              contents.pet && 'tu mascota',
            ]
              .filter(Boolean)
              .join(', ')}
            .
          </p>
          <p className="small">Lo que hay ahora en este teléfono se cambia por lo de la copia.</p>
          <div className="row">
            <button className="btn" onClick={restore} disabled={working}>
              Sí, recuperar esta copia
            </button>
            <button className="btn ghost" onClick={() => setFound(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <label className="btn ghost photo-add">
          <Upload size={18} aria-hidden="true" />
          Recuperar desde una copia
          <input ref={picker} type="file" accept=".json,application/json" className="visually-hidden" onChange={(e) => open(e.target.files?.[0])} />
        </label>
      )}
      {error && (
        <p className="small" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default function Ajustes() {
  const [address, setAddress] = useStored<Address>('trato', 'ambos')
  const [faith, setFaith] = useStored('fe', false)
  const [floating, setFloating] = useStored('mascota-flotante', true)
  const [sounds, setSounds] = useStored(SOUNDS_KEY, true)
  const [country, setCountry] = useStored('country', guessCountry)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="stack">
      <PageHeader title="Ajustes" />

      <h2 className="section-title">Cómo te acompaña la app</h2>
      <label className="card field">
        <strong>¿Cómo prefieres que te hablemos?</strong>
        <select value={address} onChange={(e) => setAddress(e.target.value as Address)}>
          <option value="ambos">No estás sola, no estás solo</option>
          <option value="femenino">En femenino: no estás sola</option>
          <option value="masculino">En masculino: no estás solo</option>
        </select>
      </label>

      <label className="card field">
        <strong>Mi país</strong>
        <small className="muted">Para mostrarte las líneas de ayuda correctas y completar los números de WhatsApp.</small>
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="card field">
        <strong>Contenido de fe</strong>
        <small className="muted">Mensajes, música y reflexiones espirituales, para quien le ayudan.</small>
        <span className="toggle">
          <input type="checkbox" role="switch" checked={faith} onChange={(e) => setFaith(e.target.checked)} />
          Mostrar contenido de fe
        </span>
      </label>

      <label className="card field">
        <strong>Tu mascota flotando</strong>
        <small className="muted">
          Te acompaña en todas las pantallas, menos en las de crisis. Puedes moverla, esconderla un rato o apagarla aquí.
        </small>
        <span className="toggle">
          <input type="checkbox" role="switch" checked={floating} onChange={(e) => setFloating(e.target.checked)} />
          Mostrarla en toda la app
        </span>
      </label>

      <label className="card field">
        <strong>Los sonidos de tu mascota</strong>
        <small className="muted">
          Cuando le haces cariño, el michi ronronea y los demás se ríen bajito; en Android también vibra. En iPhone no
          suena si el teléfono está en silencio.
        </small>
        <span className="toggle">
          <input type="checkbox" role="switch" checked={sounds} onChange={(e) => setSounds(e.target.checked)} />
          Con sonidos
        </span>
      </label>

      <ReminderCard
        kind="animo"
        title="Un recordatorio para ti"
        text="Un aviso diario en tu calendario para marcar cómo te sientes. Los recordatorios del medicamento están en «Mis medicamentos»."
      />

      <h2 className="section-title">Tu privacidad</h2>
      <DiaryKeyCard />
      <BackupCard />

      <section className="card">
        <strong>Todo se queda en este teléfono</strong>
        <p className="muted">
          No hay cuentas ni servidores: nadie más puede leer lo que escribes. Solo sale lo que tú decides mandar, como tu
          opinión o un mensaje de WhatsApp.
        </p>
        {confirming ? (
          <div className="row">
            <button
              className="btn danger"
              onClick={() => {
                clearAll()
                location.reload()
              }}
            >
              Sí, borrar todo
            </button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className="btn ghost" onClick={() => setConfirming(true)}>
            Borrar todos mis datos
          </button>
        )}
      </section>
    </div>
  )
}
