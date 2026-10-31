import type { Viz } from '../../data/bodyStories'
import Aire from './Aire'
import Alarmas from './Alarmas'
import Dolor from './Dolor'
import Inflamacion from './Inflamacion'
import Lento from './Lento'
import Panza from './Panza'
import Sueno from './Sueno'
import './cuerpo-info.css'

// Los dibujos chicos de «Cómo funciona»: cada uno enseña un proceso (la curva del cortisol, el
// CO₂ que se escapa, la escalera del sueño…), no adorna. Van en su tarjeta, con colores suaves,
// y con `still` se quedan quietos en el momento que mejor se entiende.

/** Lo que dice cada dibujo, para quien no lo ve, y la frase corta que va debajo. */
const WORDS: Record<string, [label: string, caption: string]> = {
  'alarmas:chispazo': [
    'Una línea que sube de golpe en segundos, llega a lo más alto y baja sola en unos minutos.',
    'La adrenalina: sube rápido y se gasta sola.',
  ],
  'alarmas:dia': [
    'La curva del cortisol en un día: sube al despertar, baja durante el día y queda baja en la noche.',
    'Así suele moverse el cortisol en un día, en general.',
  ],
  'alarmas:semanas': [
    'Dos curvas del cortisol: la de siempre, punteada, y la de semanas de estrés, más plana y más alta en la noche.',
    'Con semanas de estrés, la curva se aplana y de noche no baja tanto.',
  ],
  'aire:rapido': [
    'Burbujas de CO₂ que salen de la sangre y se escapan con cada respiración rápida; el nivel de CO₂ baja.',
    'Al respirar rápido, el CO₂ se escapa de más.',
  ],
  'aire:cadena': [
    'Con el CO₂ bajo, la cabeza se marea y los dedos hormiguean.',
    'Menos CO₂: cabeza ligera y hormigueo.',
  ],
  'aire:lento': [
    'Al soltar el aire despacio, las burbujas de CO₂ regresan, el nivel sube y el mareo y el hormigueo se apagan.',
    'Al soltar lento, el CO₂ regresa y todo se calma.',
  ],
  'panza:baja': [
    'Señales que bajan de la cabeza a la panza: el estómago se frena y el intestino se acelera.',
    'De la cabeza a la panza: arriba frena, abajo acelera.',
  ],
  'panza:sube': [
    'Señales que suben de la panza a la cabeza.',
    'Y de la panza a la cabeza.',
  ],
  'panza:ambas': [
    'Señales que van y vienen entre la panza y la cabeza, en los dos sentidos.',
    'Ida y vuelta, todo el tiempo.',
  ],
  'panza:calma': [
    'Las señales van y vienen despacio, y el estómago y el intestino vuelven a su ritmo.',
    'En calma, la plática va más despacio.',
  ],
  'sueno:tranquila': [
    'La escalera de una noche tranquila: bajadas largas al sueño profundo al principio y pocos despertares.',
    'Una noche tranquila: el sueño profundo llega primero.',
  ],
  'sueno:estres': [
    'La escalera de una noche con estrés: más despertares, poco sueño profundo y el de los sueños más temprano.',
    'Una noche con estrés: más cortes y menos sueño profundo.',
  ],
  'dolor:medio': [
    'Una perilla de volumen a la mitad: las señales del cuerpo pasan por ella antes de sentirse.',
    'Las señales pasan por la perilla antes de sentirse.',
  ],
  'dolor:alto': [
    'La perilla de volumen subida: la misma señal se siente más grande.',
    'Con el ánimo bajo, la perilla se queda alta.',
  ],
  'dolor:bajo': [
    'La perilla de volumen bajada: la misma señal se siente más chica.',
    'Moverte y dormir mejor le bajan el volumen.',
  ],
  'lento:lento': [
    'Una figura que camina despacio, con pasos cortos y juntos.',
    'Pasos más cortos y más lentos: no es flojera.',
  ],
  'lento:vuelve': [
    'La misma figura camina con pasos más largos: el ritmo regresa poco a poco.',
    'Con tratamiento, el ritmo regresa poco a poco.',
  ],
  'inflamacion:algunas': [
    'Cuatro siluetas; una tiene alrededor una nube muy tenue: en algunas personas, no en todas.',
    'En algunas personas, no en todas.',
  ],
}

export default function InfoViz({ viz, still }: { viz: Viz; still: boolean }) {
  const [label, caption] = WORDS[`${viz.id}:${viz.mode}`]
  return (
    <figure className={`ci-viz${still ? ' still' : ''}`} data-viz={viz.id} data-mode={viz.mode}>
      <div role="img" aria-label={label}>
        {viz.id === 'alarmas' && <Alarmas mode={viz.mode} />}
        {viz.id === 'aire' && <Aire mode={viz.mode} />}
        {viz.id === 'panza' && <Panza mode={viz.mode} />}
        {viz.id === 'sueno' && <Sueno mode={viz.mode} />}
        {viz.id === 'dolor' && <Dolor mode={viz.mode} />}
        {viz.id === 'lento' && <Lento mode={viz.mode} />}
        {viz.id === 'inflamacion' && <Inflamacion />}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
