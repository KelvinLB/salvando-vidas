import type { ReactNode } from 'react'
import { HAIR_COLORS, type Hair, type Yo } from '../../data/desdeAfuera'
import * as F from './figura'
import type { View } from './figura'

// El dibujo de la figura: la piel (con su luz y su sombra), la ropa y el pelo del muñequito
// si la persona se hizo uno en Desde afuera, y los órganos. Los efectos y las zonas que se
// tocan los pone BodyModel encima. Las clases (b-lung, b-heart, b-stomach…) son las que
// mueve src/lib/bodyfx.ts, así que se repiten igual en las tres vistas.

const MIRROR = 'matrix(-1 0 0 1 200 0)'

/** Una parte de piel: el color y, encima, la sombra que le da volumen. */
function Part({ d, className }: { d: string; className?: string }) {
  return (
    <>
      <path className={`b-part${className ? ` ${className}` : ''}`} d={d} />
      <path className="b-vol" d={d} />
    </>
  )
}

type Shapes = { head: string; ears: string[]; neck: string; torso: string; arms: string[]; hands: string[]; legs: string[]; feet: string[] }

const SHAPES: Record<View, Shapes> = {
  frente: {
    head: F.HEAD,
    ears: F.both(F.EAR),
    neck: F.NECK,
    torso: F.TORSO,
    arms: F.both(F.ARM),
    hands: F.both(F.HAND),
    legs: F.both(F.LEG),
    feet: F.both(F.FOOT),
  },
  espalda: {
    head: F.HEAD,
    ears: F.both(F.EAR),
    neck: F.NECK,
    torso: F.TORSO,
    arms: F.both(F.ARM),
    hands: F.both(F.HAND),
    legs: F.both(F.LEG),
    feet: F.both(F.FOOT),
  },
  lado: {
    head: F.S_HEAD,
    ears: [F.S_EAR],
    neck: F.S_NECK,
    torso: F.S_TORSO,
    arms: [F.S_ARM],
    hands: [F.S_HAND],
    // La pierna de atrás se asoma un poco.
    legs: [F.S_LEG],
    feet: [F.S_FOOT],
  },
}

/** La piel de la figura, con la ropa del muñequito si la hay. */
export function Skin({ view, g, yo }: { view: View; g: string; yo?: Yo | null }) {
  const s = SHAPES[view]
  const side = view === 'lado'
  const lines = view === 'frente' ? F.FRONT_LINES : view === 'espalda' ? F.BACK_LINES : F.S_LINES

  return (
    <>
      <g className="b-legs">
        {side && (
          <g className="b-far" transform="translate(5 0)">
            <Part d={F.S_LEG} />
            <Part d={F.S_FOOT} />
          </g>
        )}
        {[...s.legs, ...s.feet].map((d) => (
          <Part key={d} d={d} />
        ))}
      </g>
      {/* De lado, el brazo va encima del cuerpo; de frente y de espalda, a los lados. */}
      {!side && <Arms s={s} yo={yo} g={g} />}
      <g className="b-skin">
        <Part d={s.neck} />
        <Part d={s.torso} />
        {s.ears.map((d) => (
          <Part key={d} d={d} />
        ))}
        <Part d={s.head} />
      </g>
      {yo && (
        <g className="b-clothes" aria-hidden="true">
          <clipPath id={`${g}-shirt`}>
            <rect x="0" y={F.SHIRT_Y[0]} width="200" height={F.SHIRT_Y[1] - F.SHIRT_Y[0]} />
          </clipPath>
          <clipPath id={`${g}-pants`}>
            <rect x="0" y={F.PANTS_Y[0]} width="200" height={F.PANTS_Y[1] - F.PANTS_Y[0]} />
          </clipPath>
          <g className="b-pants" clipPath={`url(#${g}-pants)`}>
            {side && <path d={F.S_LEG} transform="translate(5 0)" />}
            {s.legs.map((d) => (
              <path key={d} d={d} />
            ))}
            <path d={s.torso} />
          </g>
          <clipPath id={`${g}-sleeve`}>
            <rect x="0" y={F.SHIRT_Y[0]} width="200" height={F.SLEEVE_Y - F.SHIRT_Y[0]} />
          </clipPath>
          <g className="b-shirt" clipPath={`url(#${g}-shirt)`}>
            <path d={s.torso} />
          </g>
        </g>
      )}
      {side && <Arms s={s} yo={yo} g={g} />}
      {lines.map((d) => (
        <path key={d} className="b-contour" d={d} />
      ))}
      {yo && <HairArt view={view} hair={yo.hair} color={HAIR_COLORS[yo.hcol][0]} />}
    </>
  )
}

function Arms({ s, yo, g }: { s: Shapes; yo?: Yo | null; g?: string }) {
  return (
    <g className="b-arms">
      {s.arms.map((d) => (
        <Part key={d} d={d} />
      ))}
      {/* La manga va con el brazo, que se mueve con la tensión (y de lado queda encima). */}
      {yo && g && (
        <g className="b-shirt" clipPath={`url(#${g}-sleeve)`}>
          {s.arms.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      )}
      {s.hands.map((d) => (
        <g key={d} className="b-hand">
          <Part d={d} />
        </g>
      ))}
    </g>
  )
}

/** El pelo del muñequito, por vista. Se dibuja sobre la cabeza y debajo del cerebro. */
function HairArt({ view, hair, color }: { view: View; hair: Hair; color: string }) {
  if (hair === 'sin') return null
  const fill = { fill: color }
  const parts: ReactNode[] = []
  if (view === 'lado') {
    parts.push(<path key="cap" d="M81.5 82 C77 66 86 51 99 51 C110 51 118 57 120.5 67 C112 61.5 104 62 98.5 66 C96.5 72 96 80 92 86 C88 88 84 87 81.5 82 Z" />)
    if (hair === 'largo') parts.push(<path key="l" d="M81.5 80 C79 96 80 112 86 124 L95 122 C90 110 89 98 91 86 Z" />)
    if (hair === 'chongo') parts.push(<circle key="c" cx="82" cy="62" r="8" />)
    if (hair === 'trenzas') parts.push(...[0, 1, 2, 3].map((i) => <circle key={i} cx={88 - i * 0.5} cy={92 + i * 8} r={4.4 - i * 0.3} />))
    if (hair === 'rizos') parts.push(...[60, 70, 80, 90].map((y, i) => <circle key={y} cx={82 - (i % 2)} cy={y - 4} r="6" />))
  } else if (view === 'espalda') {
    const nape = hair === 'largo' ? 'M80 72 C79 58 88 50 100 50 C112 50 121 58 120 72 C121 92 120 112 116 124 L84 124 C80 112 79 92 80 72 Z' : 'M80 73 C79 58 88 50 100 50 C112 50 121 58 120 73 C120 85 116.5 94 110 99 L90 99 C83.5 94 80 85 80 73 Z'
    parts.push(<path key="b" d={nape} />)
    // El chongo se asoma arriba de la cabeza, para que no lo tape el cerebro.
    if (hair === 'chongo') parts.push(<circle key="c" cx="100" cy="49" r="8.5" />)
    if (hair === 'trenzas') parts.push(...[-1, 1].flatMap((sgn) => [0, 1, 2, 3].map((i) => <circle key={`${sgn}${i}`} cx={100 + sgn * 6} cy={104 + i * 8} r={4.6 - i * 0.3} />)))
    if (hair === 'rizos') parts.push(...[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={82 + i * 6} cy={i % 2 ? 94 : 97} r="5.5" />))
  } else {
    parts.push(<path key="cap" d="M80 77 C78.5 60 88 50 100 50 C112 50 121.5 60 120 77 C117 66 110 60.5 100 61 C90 60.5 83 66 80 77 Z" />)
    if (hair === 'largo') parts.push(...F.both('M80.5 72 C77.5 90 78.5 106 82.5 116 L88.5 114 C85.5 104 84.5 92 84.5 80 Z').map((d) => <path key={d} d={d} />))
    if (hair === 'chongo') parts.push(<circle key="c" cx="100" cy="48" r="7" />)
    if (hair === 'trenzas') parts.push(...[-1, 1].flatMap((sgn) => [0, 1, 2, 3, 4].map((i) => <circle key={`${sgn}${i}`} cx={100 + sgn * 21} cy={88 + i * 7.5} r={4.4 - i * 0.3} />)))
    if (hair === 'rizos') {
      for (let a = 190; a <= 350; a += 20) {
        const r = (a * Math.PI) / 180
        parts.push(<circle key={a} cx={(100 + 21 * Math.cos(r)).toFixed(1)} cy={(74 + 23 * Math.sin(r)).toFixed(1)} r="6.5" />)
      }
    }
  }
  return (
    <g className="b-hair" style={fill} aria-hidden="true">
      {parts}
    </g>
  )
}

/** Los órganos de una vista. De espalda se ven los mismos, reflejados, y la columna y los riñones al frente. */
export function Organs({ view, g }: { view: View; g: string }) {
  if (view === 'lado') return <SideOrgans g={g} />
  const back = view === 'espalda'
  return (
    <g className={`b-organs${back ? ' back' : ''}`}>
      <g transform={back ? MIRROR : undefined}>
        <path className="b-liver" d={F.LIVER} fill={`url(#${g}-o-liver)`} />
        <g className="b-kidneys">
          {F.both(F.KIDNEY).map((d) => (
            <path key={d} className="b-kidney" d={d} fill={`url(#${g}-o-kidney)`} />
          ))}
        </g>
        <g className="b-stomach">
          <path className="b-stomach-shape" d={F.STOMACH} fill={`url(#${g}-o-gut)`} />
          <path className="b-fold" d={F.STOMACH_FOLDS} />
        </g>
        <path className="b-colon" d={F.COLON} />
        <path className="b-colon-in" d={F.COLON} />
        <path className="b-gut" d={F.SMALL_GUT} />
        <path className="b-gut-in" d={F.SMALL_GUT} />
        <g className="b-lungs">
          <g className="b-lung">
            <path className="b-lung-shape" d={F.LUNG_R} fill={`url(#${g}-o-lung)`} />
            <path className="b-airway" d={F.BRONCHIOLES[0]} />
            <path className="b-fold" d={F.LUNG_LINES[0]} />
          </g>
          <g className="b-lung">
            <path className="b-lung-shape" d={F.LUNG_L} fill={`url(#${g}-o-lung)`} />
            <path className="b-airway" d={F.BRONCHIOLES[1]} />
            <path className="b-fold" d={F.LUNG_LINES[1]} />
          </g>
        </g>
        <path className="b-trachea" d={F.TRACHEA} />
        <path className="b-fold" d={F.TRACHEA_RINGS} />
        <path className="b-airway thick" d={F.BRONCHI} />
        <path className="b-fold" d={F.DIAPHRAGM} />
        <path className="b-vessel" d={F.AORTA} />
        <g className="b-heart">
          <path className="b-heart-shape" d={F.HEART} fill={`url(#${g}-o-heart)`} />
          <path className="b-fold" d={F.HEART_GROOVE} />
        </g>
        {F.both(F.ADRENAL).map((d) => (
          <path key={d} className="b-adrenal" d={d} />
        ))}
      </g>
      {back && <Spine />}
      <path className="b-brain" d={F.BRAIN} fill={`url(#${g}-o-brain)`} />
      {back ? <path className="b-brain-part" d={F.CEREBELLUM} /> : <path className="b-brain-part" d={F.BRAINSTEM} />}
      <path className="b-fold" d={F.GYRI.join(' ')} />
      <path className="b-fold" d="M100 57.5 L100 87" />
      <circle className="b-amygdala" cx="100" cy="82" r="3.6" />
    </g>
  )
}

/** De espalda, la columna: de la nuca a la cadera, sin más huesos. */
function Spine() {
  return (
    <g className="b-spine">
      {F.VERTEBRAE.map(({ y, w }) => (
        <rect key={y} x={100 - w} y={y} width={w * 2} height="5.2" rx="2" />
      ))}
    </g>
  )
}

function SideOrgans({ g }: { g: string }) {
  return (
    <g className="b-organs side">
      <path className="b-spine-edge" d={F.S_SPINE} />
      <path className="b-spine-line" d={F.S_SPINE} />
      <path className="b-kidney" d={F.S_KIDNEY} fill={`url(#${g}-o-kidney)`} />
      <g className="b-stomach">
        <path className="b-stomach-shape" d={F.S_STOMACH} fill={`url(#${g}-o-gut)`} />
      </g>
      <path className="b-colon" d={F.S_COLON} />
      <path className="b-colon-in" d={F.S_COLON} />
      <path className="b-gut" d={F.S_GUT} />
      <path className="b-gut-in" d={F.S_GUT} />
      <g className="b-lungs">
        <g className="b-lung">
          <path className="b-lung-shape" d={F.S_LUNG} fill={`url(#${g}-o-lung)`} />
          <path className="b-fold" d={F.S_LUNG_LINES[0]} />
        </g>
      </g>
      <path className="b-trachea" d={F.S_TRACHEA} />
      <path className="b-fold" d={F.S_DIAPHRAGM} />
      <path className="b-vessel" d={F.S_AORTA} />
      <g className="b-heart">
        <path className="b-heart-shape" d={F.S_HEART} fill={`url(#${g}-o-heart)`} />
        <path className="b-fold" d={F.S_HEART_GROOVE} />
      </g>
      <path className="b-adrenal" d={F.S_ADRENAL} />
      <path className="b-brain" d={F.S_BRAIN} fill={`url(#${g}-o-brain)`} />
      <path className="b-brain-part" d={F.S_CEREBELLUM} />
      <path className="b-brain-part" d={F.S_BRAINSTEM} />
      <path className="b-fold" d={F.S_GYRI} />
      <circle className="b-amygdala" cx="103" cy="81" r="3.4" />
    </g>
  )
}

/** La forma del corazón y cómo se acomoda en cada vista (para el anillo del latido). */
export const heartOf = (view: View) =>
  view === 'lado' ? { d: F.S_HEART } : { d: F.HEART, transform: view === 'espalda' ? MIRROR : undefined }
