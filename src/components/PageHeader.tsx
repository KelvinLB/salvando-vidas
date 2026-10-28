import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useBack } from '../lib/sections'

/** «Volver» lleva a donde la persona estaba, y dice a dónde, para que nadie se pierda. */
export function BackLink() {
  const back = useBack()
  if (!back) return null
  return (
    <button type="button" className="back" onClick={back.go}>
      <ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" />
      {back.label ? `Volver a ${back.label}` : 'Volver'}
    </button>
  )
}

type Props = {
  title: string
  subtitle?: ReactNode
  /** Un botón al lado del título, como el de los ajustes. */
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="page-header">
      <BackLink />
      {action ? (
        <div className="page-title-row">
          <h1>{title}</h1>
          {action}
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  )
}
