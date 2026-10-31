// «¿Y la inflamación?», la capa opcional: cuatro siluetas y solo una con una nube muy tenue,
// para que se lea «en algunas personas, no en todas». Nunca roja ni alarmante. Fuentes: Osimo
// et al. 2019, Psychol Med (más o menos 1 de cada 4 personas con depresión tiene inflamación
// leve); metaanálisis de marcadores inflamatorios en la depresión, Brain Behav Immun 2020.

const PEOPLE = [52, 124, 196, 268]

export default function Inflamacion() {
  return (
    <svg className="ci-svg ci-people" viewBox="0 0 320 96">
      {PEOPLE.map((x, i) => (
        <g key={x} transform={`translate(${x} 0)`}>
          {i === 2 && (
            <g className="ci-haze">
              <circle cy="52" r="38" />
              <circle cy="52" r="28" />
              <circle cy="52" r="18" />
            </g>
          )}
          <circle className="ci-person" cy="30" r="10" />
          <path className="ci-person" d="M-20 86 C-20 60 -12 46 0 46 C12 46 20 60 20 86 Z" />
        </g>
      ))}
    </svg>
  )
}
