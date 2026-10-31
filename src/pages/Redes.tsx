import { Link } from 'react-router-dom'
import Capitulos, { useCapitulo } from '../components/Capitulos'
import Filas from '../components/Filas'
import PageHeader from '../components/PageHeader'
import { MYTHS, type Myth } from '../data/myths'
import './redes.css'

// Lo que circula en los grupos, en pocos temas: cada uno abre en su pantalla con lo que se dice
// y lo que se sabe, ya a la vista, sin tener que abrir uno por uno.
const TEMAS = [
  { id: 'medico', emoji: '🩺', title: 'Análisis y médico', text: 'Cortisol, vitaminas, hormonas y el sueño de día', ids: ['cortisol', 'vitaminas', 'hormonas', 'sueno'] },
  { id: 'remedios', emoji: '🌿', title: 'Remedios y suplementos', text: 'Desparasitarse, suplementos y tés', ids: ['parasitos', 'suplementos', 'te'] },
  { id: 'ganas', emoji: '🌱', title: 'Ganas, ejercicio y fe', text: '«Échale ganas», «haz ejercicio» y «si tuvieras fe»', ids: ['ejercicio', 'obligarse', 'fe'] },
  { id: 'cuerpo', emoji: '💓', title: 'Lo que se siente en el cuerpo', text: 'El enojo, los músculos y el corazón a mil', ids: ['ira', 'musculos', 'infarto'] },
]

// Si algún día se agrega algo a la lista y no tiene tema, va al último para que no se pierda.
const sinTema = MYTHS.filter((m) => !TEMAS.some((t) => t.ids.includes(m.id)))

function Mito({ m }: { m: Myth }) {
  return (
    <article className="card myth">
      <h3>{m.said}</h3>
      <p>{m.known}</p>
      {m.to && (
        <Link to={m.to} className="btn small ghost">
          {m.action}
        </Link>
      )}
    </article>
  )
}

export default function Redes() {
  const capitulo = useCapitulo()

  return (
    <div className="stack redes">
      <Capitulos
        label="Temas de lo que se dice en redes"
        antes={
          <PageHeader
            title="Lo que se dice en redes"
            subtitle="En los grupos se comparte mucho, y casi siempre con cariño. Aquí está lo que se sabe de cada cosa, para que decidas con información."
          />
        }
        capitulos={TEMAS.map((t, i) => ({
          id: t.id,
          emoji: t.emoji,
          title: t.title,
          text: t.text,
          content: [...MYTHS.filter((m) => t.ids.includes(m.id)), ...(i === TEMAS.length - 1 ? sinTema : [])].map((m) => (
            <Mito key={m.id} m={m} />
          )),
        }))}
      />

      {!capitulo && (
        <Filas
          label="Si alguien está mal"
          filas={[
            {
              to: '/acompanar',
              emoji: '💛',
              title: '¿Alguien escribió en el grupo que está mal?',
              text: 'Qué contestarle, qué evitar y mensajes listos que llevan la línea de ayuda.',
            },
          ]}
        />
      )}

      <p className="disclaimer">
        Si algo de lo que leíste te hizo dudar de tu tratamiento, no lo dejes por tu cuenta: llévale la
        duda a tu médico. Esa pregunta también cabe en tu consulta.
      </p>
    </div>
  )
}
