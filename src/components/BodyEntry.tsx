import { Suspense, lazy, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LevelMeter } from './BodyFrame'
import { AREAS, BANDS } from '../data/bodyCheck'
import { type BodyNow, EMPTY_NOW, freshNow, readBody } from '../lib/bodyCheck'
import { useStored } from '../lib/storage'

// La entrada a «Tu cuerpo por dentro» desde Inicio y Calma, para que nadie tenga que
// saber que existe: la figura invita a tocar donde se siente y abre esa zona lista para
// marcar. Si hace poco marcó algo, lo retoma donde se quedó.
// La figura (con sus animaciones) se baja aparte: Inicio y Calma abren sin esperarla, y mientras
// llega se guarda su lugar para que nada brinque.
const BodyModel = lazy(() => import('./BodyModel'))

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function BodyEntry() {
  const navigate = useNavigate()
  const [saved] = useStored<BodyNow>('cuerpo-ahora', EMPTY_NOW)
  const [still] = useState(prefersStill)
  const now = freshNow(saved)
  const reading = readBody(now.ids, now.intensity)
  const marked = now.ids.length > 0
  const crisis = reading.red.includes('crisis')
  const medical = reading.red.some((r) => r !== 'crisis')
  const areas = AREAS.filter((a) => reading.picked.some((s) => s.area === a.id)).map((a) => a.label)

  return (
    <section className="card body-entry">
      <Suspense fallback={<div className="body-entry-espera" aria-hidden="true" />}>
        <BodyModel
          fx={marked ? reading.fx : ['breath-slow', 'heart-calm']}
          tone={reading.tone}
          heat={reading.heat}
          tour={!marked}
          still={still}
          onRegion={(region) => navigate(`/cuerpo?zona=${region}`)}
        />
      </Suspense>

      {marked ? (
        <div className="stack tight">
          <p className="eyebrow">Hace un rato marcaste</p>
          <h2>{areas.join(' · ')}</h2>
          {crisis ? (
            <p>Marcaste que piensas en hacerte daño. No tienes que cargarlo a solas.</p>
          ) : medical ? (
            <p>Una de las cosas que marcaste conviene revisarla con un médico. Ahí te decimos qué hacer.</p>
          ) : (
            <>
              <p className="muted">{BANDS[reading.band].text[reading.feel]}</p>
              <LevelMeter level={reading.level} band={reading.band} />
            </>
          )}
          {crisis ? (
            <Link to="/ayuda" className="btn small">
              Hablar con alguien
            </Link>
          ) : (
            <Link to="/cuerpo" className="btn small">
              {medical ? 'Ver qué hacer' : 'Seguir donde me quedé'}
            </Link>
          )}
        </div>
      ) : (
        <div className="stack tight">
          <p className="eyebrow">Tu cuerpo ahora</p>
          <h2>¿Dónde lo sientes?</h2>
          <p className="muted">Toca la figura. Te decimos qué puede estar pasando y lo bajamos juntos.</p>
          <Link to="/cuerpo" className="btn small">
            Marcar lo que siento
          </Link>
        </div>
      )}
    </section>
  )
}
