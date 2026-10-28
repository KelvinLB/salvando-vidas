import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBlobUrl } from '../lib/diary'
import { type Gift, type GiftContent, giftContent } from '../lib/gifts'
import { still } from '../lib/petfx'
import { localDate } from '../lib/storage'

// Lo que la mascota trajo hoy, ya abierto: una razón para seguir o un recuerdo del diario,
// con el día en que la persona lo guardó. «Gracias» lo cierra hasta el próximo regalo.

const longDate = (date: string) => new Date(date + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })

type Props = {
  gift: Gift
  name: string
  /** Se acaba de abrir: la tarjeta se asoma completa en la pantalla. */
  reveal?: boolean
  onThanks: () => void
}

export default function PetGift({ gift, name, reveal, onThanks }: Props) {
  const [content, setContent] = useState<GiftContent | null>()
  const self = useRef<HTMLElement>(null)

  useEffect(() => {
    let alive = true
    void giftContent(gift).then((c) => alive && setContent(c))
    return () => {
      alive = false
    }
    // Solo se vuelve a buscar si es otro regalo.
  }, [gift.ref])

  useEffect(() => {
    if (content && reveal) self.current?.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'nearest' })
  }, [content, reveal])

  const photo = useBlobUrl(content?.kind === 'recuerdo' ? content.memory.photo : undefined)
  // Si mientras tanto lo borró, no hay nada que mostrar.
  if (!content) return null

  const memory = content.kind === 'recuerdo'
  const text = (memory ? content.memory.text : content.reason.text).trim()
  const date = memory ? localDate(new Date(content.memory.createdAt)) : content.reason.date

  return (
    <section className="card gift-card" ref={self}>
      <p className="eyebrow">🎁 Lo que te trajo {name}</p>
      <h2>¿Te acuerdas?</h2>
      <p className="muted">
        {memory
          ? `El ${longDate(date)} guardaste este recuerdo en tu diario.`
          : `Es una de tus razones para seguir. La guardaste el ${longDate(date)}.`}
      </p>
      {photo && (
        <figure className="polaroid gift-photo">
          <img src={photo} alt="La foto de tu recuerdo" />
        </figure>
      )}
      {text && (
        <div className="letter gift-letter">
          <p>{text}</p>
        </div>
      )}
      <div className="row">
        <button className="btn" onClick={onThanks}>
          Gracias, {name}
        </button>
        <Link to={memory ? '/diario' : '/mi-espacio/caja'} className="btn ghost">
          {memory ? 'Abrir mi diario' : 'Ver mi caja de esperanza'}
        </Link>
      </div>
    </section>
  )
}
