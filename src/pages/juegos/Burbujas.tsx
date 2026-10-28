import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { pop } from '../../lib/audio'
import { buzz, useStored } from '../../lib/storage'

const COUNT = 35
const fresh = () => Array<boolean>(COUNT).fill(false)

export default function Burbujas() {
  const [popped, setPopped] = useState(fresh)
  const [sound, setSound] = useStored('burbujas-sonido', true)
  const [total, setTotal] = useStored('burbujas-total', 0)
  const left = popped.filter((p) => !p).length

  const burst = (i: number) => {
    if (popped[i]) return
    setPopped((prev) => prev.map((p, j) => p || j === i))
    setTotal((t) => t + 1)
    if (sound) pop()
    buzz(15)
  }

  return (
    <div className="stack">
      <PageHeader title="Burbujas" subtitle="Revienta una a una. No hay forma de hacerlo mal." />

      <div className="bubbles">
        {popped.map((p, i) => (
          <button
            key={i}
            className={`bubble ${p ? 'popped' : ''}`}
            onClick={() => burst(i)}
            aria-label={p ? 'Burbuja reventada' : 'Reventar burbuja'}
          />
        ))}
      </div>

      <div className="row spread">
        <span className="muted">Llevas {total} en total</span>
        <label className="toggle">
          <input type="checkbox" role="switch" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          Sonido
        </label>
      </div>

      {left === 0 && (
        <button className="btn big" onClick={() => setPopped(fresh())}>
          Más burbujas
        </button>
      )}
    </div>
  )
}
