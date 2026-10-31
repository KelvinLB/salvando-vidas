import { VIEWS, type View } from './figura'

// De frente, de espalda o de lado: tres botones que cambian la vista de la figura. Si en
// una vista hay marcas que no se ven desde la actual, el botón lleva un puntito.

export default function ViewSwitch({
  view,
  onChange,
  marks = {},
}: {
  view: View
  onChange: (view: View) => void
  marks?: Partial<Record<View, number>>
}) {
  return (
    <div className="body-views" role="group" aria-label="Cómo ver la figura">
      {VIEWS.map((v) => {
        const n = v.id === view ? 0 : (marks[v.id] ?? 0)
        return (
          <button
            key={v.id}
            type="button"
            className="body-view-btn"
            aria-pressed={v.id === view}
            aria-label={n > 0 ? `${v.label} (${n} ${n === 1 ? 'marca' : 'marcas'})` : v.label}
            onClick={() => onChange(v.id)}
          >
            {v.short}
            {n > 0 && (
              <span className="body-view-dot" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}
