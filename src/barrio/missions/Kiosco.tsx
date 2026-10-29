import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FlowProps } from '../types'
import { Flow, NotNow, Says, Thanks } from './parts'

// Don Chema y los foquitos del kiosco (respiración): 4 segundos para tomar aire y 6 para
// soltarlo, tres veces (una en un día pesado). Cada respiración prende foquitos en la plaza.
// «Ya, con esto» siempre está y cuenta como hecha: aquí nada se tiene que completar.

type Breath = { phase: 'in' | 'out'; count: number; round: number }

const IN = 4
const OUT = 6
const BULBS = 8

export default function Kiosco({ petName, heavy, onDone, onClose, onGlow }: FlowProps) {
  const rounds = heavy ? 1 : 3
  const [stage, setStage] = useState<'intro' | 'breathe' | 'end'>('intro')
  const [breath, setBreath] = useState<Breath>({ phase: 'in', count: IN, round: 1 })

  // Lo que lleva respirado, de 0 a 1.
  const elapsed = (breath.round - 1) * (IN + OUT) + (breath.phase === 'in' ? IN - breath.count : IN + OUT - breath.count)
  const progress = stage === 'end' ? 1 : stage === 'breathe' ? elapsed / (rounds * (IN + OUT)) : 0
  const lit = Math.round(progress * BULBS)

  useEffect(() => {
    if (stage !== 'intro') onGlow?.(progress)
  }, [progress, stage])

  useEffect(() => {
    if (stage !== 'breathe') return
    const timer = setTimeout(() => {
      if (breath.count > 1) return setBreath({ ...breath, count: breath.count - 1 })
      if (breath.phase === 'in') return setBreath({ ...breath, phase: 'out', count: OUT })
      if (breath.round < rounds) return setBreath({ phase: 'in', count: IN, round: breath.round + 1 })
      setStage('end')
    }, 1000)
    return () => clearTimeout(timer)
  }, [breath, stage])

  const start = () => {
    setBreath({ phase: 'in', count: IN, round: 1 })
    setStage('breathe')
  }

  return (
    <Flow label="Prender el kiosco con Don Chema">
      <Says who="chema">
        {stage === 'intro' && (
          <p>
            Buenas. Se me apagaron los foquitos del kiosco, y aquí se prenden respirando despacio. Cuando el aire sale
            más lento de lo que entra, el cuerpo entiende que puede bajarle tantito. ¿Me echas la mano? {petName} ya se
            sentó a respirar.
            {heavy && ' Hoy con una sola respiración basta.'}
          </p>
        )}
        {stage === 'breathe' && (
          <p>
            {breath.phase === 'in' ? 'Toma aire por la nariz…' : 'Suéltalo despacio, por la boca…'}{' '}
            <span className="bm-count">{breath.count}</span>
          </p>
        )}
        {stage === 'end' && <p>¡Mira nomás qué bonito quedó! Eso lo hiciste tú, con puro aire.</p>}
      </Says>

      {stage !== 'intro' && (
        <div className="bm-kiosco" aria-hidden="true">
          {stage === 'breathe' && (
            <span key={`${breath.round}-${breath.phase}`} className={`bm-ring ${breath.phase}`}>
              <span className="bm-ring-word">{breath.phase === 'in' ? 'Toma' : 'Suelta'}</span>
            </span>
          )}
          <span className="bm-bulbs">
            {Array.from({ length: BULBS }, (_, i) => (
              <i key={i} className={i < lit ? 'on' : ''} />
            ))}
          </span>
        </div>
      )}

      {stage === 'intro' && (
        <div className="row">
          <button type="button" className="btn" onClick={start}>
            Va, respiramos
          </button>
          <NotNow onClose={onClose} />
        </div>
      )}

      {stage === 'breathe' && (
        <div className="row spread">
          {rounds > 1 && (
            <span className="muted small">
              Respiración {breath.round} de {rounds}
            </span>
          )}
          <button type="button" className="btn ghost" onClick={() => setStage('end')}>
            Ya, con esto
          </button>
        </div>
      )}

      {stage === 'end' && (
        <>
          <p className="small">
            Si quieres seguir respirando, en <Link to="/calma">Calma</Link> hay más.
          </p>
          <Thanks to="Don Chema" onDone={onDone} />
        </>
      )}
    </Flow>
  )
}
