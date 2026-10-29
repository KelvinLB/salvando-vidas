import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PetSays from '../components/PetSays'
import PracticeRun, { ExerciseArt, HealthGate, PracticeSafety } from '../components/PracticeRun'
import { EXERCISES, type ExerciseId, exerciseById } from '../data/practica'
import { fearTrend, recordsOf, suggested, useHealthOk, usePractice } from '../lib/practica'
import './nervios.css'

// Practicar con el cuerpo: escoger un ejercicio, del más suave al más intenso, y hacerlo con la
// mascota. Antes del primero, el filtro de salud. Lo que se guarda se queda en el teléfono.

export default function Practicar() {
  const { health, reset } = useHealthOk()
  const { records } = usePractice()
  const [picked, setPicked] = useState<ExerciseId | null>(null)
  const top = useRef<HTMLDivElement>(null)
  const exercise = picked ? exerciseById(picked) : undefined
  // El más suave que todavía no ha probado; si ya probó todos, ninguno se marca.
  const gentle = suggested(records)
  const fresh = !recordsOf(records, gentle.id).length

  // Al escoger o terminar, la vista regresa arriba para no quedarse a la mitad.
  const shown = useRef(picked)
  useEffect(() => {
    if (shown.current === picked) return
    shown.current = picked
    window.scrollTo(0, 0)
    if (picked) top.current?.querySelector<HTMLElement>('.pr-card h2')?.focus({ preventScroll: true })
  }, [picked])

  return (
    <div className="stack" ref={top}>
      <PageHeader
        title="Practicar con el cuerpo"
        subtitle="Provocar a propósito, poco a poco, lo que el pánico hace sentir, para que deje de asustar."
      />
      <HealthGate>
        {exercise ? (
          <PracticeRun exercise={exercise} onDone={() => setPicked(null)} />
        ) : (
          <>
            <PetSays>
              Vamos despacio. Te sugiero empezar por el más suave, y si algo te da mucho miedo, lo dejamos para
              otro día. Aquí no hay que ganarle a nada.
            </PetSays>
            <PracticeSafety />
            <ul className="nv-exercises">
              {EXERCISES.map((e) => {
                const trend = fearTrend(records, e.id)
                return (
                  <li key={e.id}>
                    <button type="button" className="card link-card nv-exercise" onClick={() => setPicked(e.id)}>
                      <ExerciseArt id={e.id} />
                      <span className="nv-exercise-text">
                        {fresh && e.id === gentle.id && (
                          <span className="eyebrow">{records.length ? 'El que sigue' : 'Para empezar'}</span>
                        )}
                        <span className="nv-exercise-name">{e.name}</span>
                        <span className="muted small">
                          {e.seconds} segundos · suele traer {e.feels}
                        </span>
                        {trend && <span className="small nv-trend">{trend}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="muted small">
              ¿Por qué ayuda? Lo explica la lección{' '}
              <Link to="/nervios?leccion=largo-plazo">Lo que ayuda a largo plazo</Link>.
            </p>
            {health && (
              <p className="muted small">
                Contestaste las preguntas de salud el {health.date.split('-').reverse().join('/')}. Si algo cambió,{' '}
                <button type="button" className="nv-inline-btn" onClick={reset}>
                  vuelve a contestarlas
                </button>
                .
              </p>
            )}
          </>
        )}
      </HealthGate>
      <p className="disclaimer">
        No sustituye una terapia. Si tienes dudas sobre tu salud, consulta a tu médico antes de practicar.
      </p>
    </div>
  )
}
