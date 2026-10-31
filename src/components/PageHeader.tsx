import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: ReactNode
  /** Un botón al lado del título, como el de los ajustes. */
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="page-header">
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
