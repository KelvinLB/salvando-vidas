import { useEffect, useState } from 'react'
import { Contact, Plus, X } from 'lucide-react'
import { MAX_PEOPLE, type Person, usePeople } from '../lib/people'
import { newId } from '../lib/storage'

// El selector de contactos del teléfono solo existe en Chrome para Android. La persona elige
// a alguien y solo ese nombre y ese número entran a la app; nada sale de ella.
type ContactsApi = { select: (props: string[]) => Promise<{ name?: string[]; tel?: string[] }[]> }
const contacts = () => (navigator as Navigator & { contacts?: ContactsApi }).contacts

const isEmpty = (p: Person) => !p.name.trim() && !p.phone.trim()

/** Hasta tres personas de confianza, con nombre y teléfono. Se guarda al escribir. */
export default function PeopleEditor() {
  const { people, setPeople } = usePeople()
  const [added, setAdded] = useState<string>()

  // No se quedan renglones vacíos: ni al irse ni si la app se cerró con uno a medias.
  useEffect(() => {
    const tidy = () => setPeople((all) => (all.some(isEmpty) ? all.filter((p) => !isEmpty(p)) : all))
    tidy()
    return tidy
  }, [setPeople])

  const change = (id: string, field: 'name' | 'phone', value: string) =>
    setPeople((all) => all.map((p) => (p.id === id ? { ...p, [field]: value } : p)))

  const add = (from?: { name: string; phone: string }) => {
    const person = { id: newId(), name: from?.name ?? '', phone: from?.phone ?? '' }
    setPeople((all) => (all.length >= MAX_PEOPLE ? all : [...all, person]))
    setAdded(person.id)
  }

  const pick = async () => {
    try {
      const [c] = (await contacts()?.select(['name', 'tel'])) ?? []
      if (c) add({ name: c.name?.[0] ?? '', phone: c.tel?.[0] ?? '' })
    } catch {
      // La persona cerró el selector sin elegir.
    }
  }

  return (
    <div className="people">
      {people.map((p, i) => (
        <div key={p.id} className="person">
          <span className="person-n" aria-hidden="true">
            {i + 1}
          </span>
          <div className="person-fields">
            <input
              placeholder="Nombre"
              value={p.name}
              autoFocus={p.id === added && !p.name}
              onChange={(e) => change(p.id, 'name', e.target.value)}
              aria-label={`Nombre de la persona ${i + 1}`}
              autoComplete="off"
            />
            <input
              placeholder="Teléfono, p. ej. 55 1234 5678"
              inputMode="tel"
              value={p.phone}
              onChange={(e) => change(p.id, 'phone', e.target.value)}
              aria-label={`Teléfono de ${p.name.trim() || `la persona ${i + 1}`}`}
              autoComplete="off"
            />
          </div>
          <button
            className="icon-btn"
            onClick={() => setPeople((all) => all.filter((x) => x.id !== p.id))}
            aria-label={`Quitar a ${p.name.trim() || `la persona ${i + 1}`}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      ))}

      {people.length < MAX_PEOPLE ? (
        <div className="row">
          <button className="btn small ghost" onClick={() => add()}>
            <Plus size={18} aria-hidden="true" />
            {people.length ? 'Agregar a alguien más' : 'Agregar a alguien'}
          </button>
          {contacts() && (
            <button className="btn small ghost" onClick={pick}>
              <Contact size={18} aria-hidden="true" />
              Elegir de mis contactos
            </button>
          )}
        </div>
      ) : (
        <p className="muted small">Tres está bien: son a quienes vas a buscar primero.</p>
      )}
    </div>
  )
}
