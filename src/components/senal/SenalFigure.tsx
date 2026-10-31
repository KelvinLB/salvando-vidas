import { memo, type MouseEvent } from 'react'
import type { SenalLayer, SenalPartId } from '../../data/senal'
import {
  ADRENAL, AORTA, AORTA_ARCH, ARM, ARM_V, ATRIUM, BRAIN, BRAINSTEM, BRONCHI, BRONCHIOLES, BRONCHIOLES_R,
  CAROTID, CAVITY, CLAVICLE, COLON, CORD, CORONARY, DIAPHRAGM, ESOPHAGUS, FISSURES, GYRI, HEAD, HEART,
  HEART_SHADE, KIDNEY, LEG, LEG_V, LIVER, LUNG_L, LUNG_R, MASSETER, MASS_FIB, PA, PELVIS, PFC, PFC_LINK,
  PULM_TRUNK, R1, R2, RIBS, RUGAE, SCM, SKIN, SMALL, STERNUM, STOMACH, TEMPORAL, TORSO, TRAP, VAGUS_L,
  VAGUS_R, VENA, both, mirror,
} from './figure'

// El dibujo de «Sigue la señal». React lo pinta una vez; el motor (engine.ts) solo cambia
// opacidades y transformaciones, así que aquí no va ningún estilo que el motor toque.
// Los degradados llevan id fijo con el prefijo «sg-»: en la pantalla hay un solo dibujo.

type Props = {
  /** Capas apagadas. */
  off: Record<SenalLayer, boolean>
  /** Con una parte abierta, su capa se ve completa y las demás se desvanecen. */
  near: SenalLayer | null
  /** El anillo punteado de la parte abierta. */
  ring: [number, number, number, number] | null
  /** La amígdala y el hipotálamo encendidos durante la alarma. */
  amy: boolean
  hypo: boolean
  onPart: (id: SenalPartId) => void
}

const P = ({ d, c }: { d: string; c: string }) => <path className={c} d={d} />

/** Sombra suave, corrida un poco hacia abajo a la derecha. */
const Shadow = ({ ds }: { ds: string[] }) => (
  <g className="sg-shadow" transform="translate(1.3 1.9)">
    {ds.map((d, i) => (
      <path key={i} d={d} />
    ))}
  </g>
)

/** Una ruta por donde viaja la señal: estela, pulso y una cabecita de luz. */
const Route = ({ id, d, kind }: { id: string; d: string; kind: 'amber' | 'blue' }) => (
  <g className={`sg-route ${kind}`} data-route={id}>
    <path className="sg-trail-glow" d={d} />
    <path className="sg-trail" d={d} />
    <path className="sg-pulse-glow" d={d} />
    <path className="sg-pulse" d={d} />
    <circle className="sg-head" r="1.9" />
  </g>
)

const stop = (offset: string, color: string, opacity?: number) => (
  <stop offset={offset} style={{ stopColor: `var(${color})` }} stopOpacity={opacity} />
)

const BODY = [HEAD, TORSO, ...both(ARM), ...both(LEG)]

function SenalFigure({ off, near, ring, amy, hypo, onPart }: Props) {
  // Clases de una capa: apagada, o la cercana cuando hay una parte abierta.
  const L = (layer: SenalLayer) => ` sg-layer${off[layer] ? ' sg-off' : ''}${near && near !== layer ? ' sg-far' : ''}`

  const click = (e: MouseEvent<SVGSVGElement>) => {
    const hit = (e.target as Element).closest?.('[data-part]')
    if (hit) onPart(hit.getAttribute('data-part') as SenalPartId)
  }

  return (
    <svg
      className={`sg-svg${amy ? ' sg-on-amy' : ''}${hypo ? ' sg-on-hypo' : ''}`}
      data-sg="svg"
      viewBox="0 0 220 400"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Cuerpo de frente, visto por dentro: cerebro, nervios, glándulas, pulmones, corazón, estómago y músculos del cuello y la mandíbula"
      onClick={click}
    >
      <defs>
        <linearGradient id="sg-skinG" gradientUnits="userSpaceOnUse" x1="40" y1="10" x2="190" y2="400">
          {stop('0', '--sg-skin-1')}
          {stop('1', '--sg-skin-2')}
        </linearGradient>
        <linearGradient id="sg-cyl" x1="0" y1="0" x2="1" y2="0">
          {stop('0', '--sg-shade', 0.34)}
          {stop('.3', '--sg-hi', 0.5)}
          {stop('.62', '--sg-hi', 0)}
          {stop('1', '--sg-shade', 0.42)}
        </linearGradient>
        <radialGradient id="sg-vol" cx=".34" cy=".28" r=".78">
          {stop('0', '--sg-hi', 0.62)}
          {stop('.5', '--sg-hi', 0)}
          {stop('1', '--sg-shade', 0.38)}
        </radialGradient>
        <radialGradient id="sg-cav" cx=".5" cy=".42" r=".6">
          {stop('0', '--sg-cavity', 0.95)}
          {stop('1', '--sg-cavity', 0.25)}
        </radialGradient>
        <radialGradient id="sg-gWarm">
          {stop('0', '--sg-warm', 0.85)}
          {stop('.55', '--sg-warm', 0.32)}
          {stop('1', '--sg-warm', 0)}
        </radialGradient>
        <radialGradient id="sg-gBlue">
          {stop('0', '--sg-vagus-glow', 0.8)}
          {stop('.55', '--sg-vagus-glow', 0.28)}
          {stop('1', '--sg-vagus-glow', 0)}
        </radialGradient>
        <radialGradient id="sg-gGold">
          {stop('0', '--sg-sig-glow', 0.95)}
          {stop('.5', '--sg-sig', 0.35)}
          {stop('1', '--sg-sig', 0)}
        </radialGradient>
        <radialGradient id="sg-gGround">
          {stop('0', '--sg-ground', 0.55)}
          {stop('1', '--sg-ground', 0)}
        </radialGradient>
        <linearGradient id="sg-sheen" gradientUnits="userSpaceOnUse" x1="60" y1="20" x2="170" y2="300">
          {stop('0', '--sg-hi', 0.55)}
          {stop('.45', '--sg-hi', 0.08)}
          {stop('1', '--sg-shade', 0.22)}
        </linearGradient>
      </defs>

      <ellipse cx="110" cy="396" rx="58" ry="6.5" fill="url(#sg-gGround)" />
      <g className="sg-skin">
        {SKIN.map((d, i) => (
          <P key={i} d={d} c="sg-skin-p" />
        ))}
        {BODY.map((d, i) => (
          <P key={i} d={d} c="sg-cyl" />
        ))}
      </g>
      <P d={CAVITY} c="sg-cavity" />
      <g className="sg-bones">
        {both(CLAVICLE).map((d, i) => (
          <P key={i} d={d} c="sg-bone-l" />
        ))}
        {both(PELVIS).map((d, i) => (
          <P key={i} d={d} c="sg-bone-l thin" />
        ))}
      </g>

      {/* Sangre, debajo de los órganos. */}
      <g className={`sg-vessels${L('sangre')}`} data-sg="vessels">
        <path className="sg-vessel big" d={AORTA} />
        <path className="sg-vessel" d={ARM_V} data-path="armL" />
        <path className="sg-vessel" d={mirror(ARM_V)} data-path="armR" />
        <path className="sg-vessel" d={LEG_V} data-path="legL" />
        <path className="sg-vessel" d={mirror(LEG_V)} data-path="legR" />
        {both(CAROTID).map((d, i) => (
          <P key={i} d={d} c="sg-vessel thin" />
        ))}
      </g>

      {/* La alarma: médula y cadena de nervios a los lados. */}
      <g className={`sg-cord${L('alarma')}`}>
        <P d={CORD} c="sg-cord-l" />
        {Array.from({ length: 12 }, (_, i) => 94 + i * 12).map((y) => (
          <g key={y}>
            <circle className="sg-gang" cx="104.6" cy={y} r="1.15" />
            <circle className="sg-gang" cx="115.4" cy={y} r="1.15" />
          </g>
        ))}
      </g>

      {/* La panza. */}
      <g className={`sg-gutg${L('panza')}`}>
        <Shadow ds={[LIVER, STOMACH]} />
        <P d={LIVER} c="sg-liver" />
        <P d={LIVER} c="sg-volp" />
        <P d={ESOPHAGUS} c="sg-eso" />
        <ellipse className="sg-gut-bed" cx="110" cy="239" rx="25" ry="18" />
        <g className="sg-shadow-s" transform="translate(1.2 1.8)">
          <P d={COLON} c="w9" />
          <P d={SMALL} c="w6" />
        </g>
        <P d={COLON} c="sg-colon-o" />
        <P d={COLON} c="sg-colon" />
        <P d={COLON} c="sg-colon-h" />
        <P d={SMALL} c="sg-small-o" />
        <P d={SMALL} c="sg-small" />
        <P d={SMALL} c="sg-small-h" />
        <g className="sg-stomach-g" data-sg="stomach">
          <P d={STOMACH} c="sg-stomach" />
          <P d={STOMACH} c="sg-volp" />
          {RUGAE.map((d, i) => (
            <P key={i} d={d} c="sg-rugae" />
          ))}
        </g>
        {/* Con la alarma la panza se frena: se pinta más apagada. */}
        <g className="sg-gutdim" data-sg="gutdim">
          <P d={STOMACH} c="sg-dim" />
          <ellipse className="sg-dim" cx="110" cy="239" rx="32" ry="24" />
        </g>
      </g>

      <g className={`sg-kidneys${L('alarma')}`}>
        {both(KIDNEY).map((d, i) => (
          <g key={i}>
            <P d={d} c="sg-kidney" />
            <P d={d} c="sg-volp" />
          </g>
        ))}
      </g>

      {/* La respiración. */}
      <g className={`sg-resp${L('respiracion')}`}>
        <g data-sg="lungs">
          <Shadow ds={[LUNG_L, LUNG_R]} />
          <P d={LUNG_L} c="sg-lung" />
          <P d={LUNG_R} c="sg-lung" />
          <P d={LUNG_L} c="sg-volp" />
          <P d={LUNG_R} c="sg-volp" />
          {FISSURES.map((d, i) => (
            <P key={i} d={d} c="sg-fissure" />
          ))}
          {[...BRONCHIOLES, ...BRONCHIOLES_R].map((d, i) => (
            <P key={i} d={d} c="sg-bronchiole" />
          ))}
        </g>
        <rect className="sg-trachea" x="107.4" y="72" width="5.2" height="33" rx="2.4" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} className="sg-ring" d={`M107.6 ${75 + i * 3.6} L112.4 ${75 + i * 3.6}`} />
        ))}
        {BRONCHI.map((d, i) => (
          <P key={i} d={d} c="sg-bronchus" />
        ))}
        <path className="sg-diaphragm" d={DIAPHRAGM} data-sg="diaphragm" />
      </g>

      <g className="sg-ribs">
        {[...RIBS, ...RIBS.map(mirror)].map((d, i) => (
          <P key={i} d={d} c="sg-rib" />
        ))}
        <P d={STERNUM} c="sg-sternum" />
      </g>

      <g className={`sg-vagus-g${L('alarma')}`}>
        <P d={VAGUS_L} c="sg-vagus" />
        <P d={VAGUS_R} c="sg-vagus" />
      </g>

      {/* El corazón, encima de los pulmones. Late suave y sin números. */}
      <g className={`sg-heartg${L('sangre')}`}>
        <P d={VENA} c="sg-vein" />
        <P d={AORTA_ARCH} c="sg-arch" />
        <P d={PULM_TRUNK} c="sg-pulm" />
        <g data-sg="heart">
          <circle className="sg-halo" data-sg="halo-warm" cx="116" cy="155" r="40" fill="url(#sg-gWarm)" />
          <circle className="sg-halo" data-sg="halo-blue" cx="116" cy="155" r="40" fill="url(#sg-gBlue)" />
          <Shadow ds={[HEART]} />
          <P d={HEART} c="sg-heart" />
          <P d={HEART_SHADE} c="sg-heart-shade" />
          <P d={ATRIUM} c="sg-atrium" />
          <P d={HEART} c="sg-volp" />
          {CORONARY.map((d, i) => (
            <P key={i} d={d} c="sg-coronary" />
          ))}
        </g>
      </g>

      {/* Los músculos que se tensan: hombros, cuello y mandíbula. */}
      <g className={`sg-muscles${L('musculos')}`}>
        {both(TRAP).map((d, i) => (
          <g key={i}>
            <P d={d} c="sg-muscle" />
            <P d={d} c="sg-volp" />
          </g>
        ))}
        {both(SCM).map((d, i) => (
          <P key={i} d={d} c="sg-scm" />
        ))}
        {both(MASSETER).map((d, i) => (
          <g key={i}>
            <P d={d} c="sg-muscle" />
            <P d={d} c="sg-volp" />
          </g>
        ))}
        {[...MASS_FIB, ...MASS_FIB.map(mirror)].map((d, i) => (
          <P key={i} d={d} c="sg-fiber" />
        ))}
        <g className="sg-tense-glow" data-sg="tense">
          <ellipse cx="97.5" cy="62" rx="8" ry="10" fill="url(#sg-gWarm)" />
          <ellipse cx="122.5" cy="62" rx="8" ry="10" fill="url(#sg-gWarm)" />
          <ellipse cx="86" cy="89" rx="20" ry="10" fill="url(#sg-gWarm)" />
          <ellipse cx="134" cy="89" rx="20" ry="10" fill="url(#sg-gWarm)" />
        </g>
      </g>

      {/* El cerebro: la amígdala (alarma), el hipotálamo y la corteza prefrontal (quien calma). */}
      <g className={`sg-brain-g${L('alarma')}`}>
        <P d={BRAINSTEM} c="sg-brainstem" />
        <Shadow ds={[BRAIN]} />
        <P d={BRAIN} c="sg-brain" />
        {both(TEMPORAL).map((d, i) => (
          <P key={i} d={d} c="sg-temporal" />
        ))}
        <path className="sg-pfc" d={PFC} data-sg="pfc" />
        {[...GYRI, ...GYRI.map(mirror)].map((d, i) => (
          <P key={i} d={d} c="sg-gyrus" />
        ))}
        <P d="M110 19 L110 50.5" c="sg-midline" />
        <P d={BRAIN} c="sg-volp" />
        {both(PFC_LINK).map((d, i) => (
          <P key={i} d={d} c="sg-pfclink" />
        ))}
        <path className="sg-stalk" d="M110 50.5 L110 53" />
        <circle className="sg-pit" cx="110" cy="54.4" r="1.6" />
        <ellipse className="sg-hypo" cx="110" cy="48.6" rx="3" ry="2" />
        <ellipse className="sg-amy" cx="101" cy="48" rx="2.7" ry="1.75" transform="rotate(-20 101 48)" />
        <ellipse className="sg-amy" cx="119" cy="48" rx="2.7" ry="1.75" transform="rotate(20 119 48)" />
        <circle className="sg-amy-ring" data-sg="amy-ring" cx="101" cy="48" r="3" />
        <circle className="sg-amy-ring" data-sg="amy-ring" cx="119" cy="48" r="3" />
      </g>

      <g className={`sg-adrenals${L('alarma')}`}>
        <circle className="sg-adr-glow" cx="85" cy="198" r="12" fill="url(#sg-gGold)" />
        <circle className="sg-adr-glow" cx="135" cy="198" r="12" fill="url(#sg-gGold)" />
        {both(ADRENAL).map((d, i) => (
          <g key={i}>
            <P d={d} c="sg-adrenal" />
            <P d={d} c="sg-volp" />
          </g>
        ))}
      </g>

      {/* Por donde viaja la señal: ámbar la alarma, azul el freno. */}
      <g className={`sg-routes${L('alarma')}`}>
        <Route id="r1L" d={R1} kind="amber" />
        <Route id="r1R" d={mirror(R1)} kind="amber" />
        <Route id="r2L" d={R2} kind="amber" />
        <Route id="r2R" d={mirror(R2)} kind="amber" />
        <Route id="vL" d={VAGUS_L} kind="blue" />
        <Route id="vR" d={VAGUS_R} kind="blue" />
      </g>

      {/* Adrenalina en la sangre y flechas: la sangre se va a brazos y piernas. */}
      <g className={`sg-blood${L('sangre')}`}>
        <path className="sg-hidden-route" d={PA} data-path="paL" />
        <path className="sg-hidden-route" d={mirror(PA)} data-path="paR" />
        {Array.from({ length: 18 }, (_, i) => (
          <g key={i} className="sg-part" data-sg="particle">
            <circle className="sg-part-g" r="3.4" />
            <circle className="sg-part-c" r="1.5" />
          </g>
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} className="sg-arrow" data-sg="arrow" d="M-2.6 -2.4 L0.4 0 L-2.6 2.4" />
        ))}
      </g>

      <g className="sg-sheen">
        {BODY.map((d, i) => (
          <P key={i} d={d} c="sg-sheen-p" />
        ))}
      </g>

      {ring && (
        <ellipse className="sg-focus-ring" cx={ring[0]} cy={ring[1]} rx={ring[2]} ry={ring[3]} />
      )}

      {/* Zonas que se pueden tocar (invisibles, encima). Con teclado se usa la fila de partes. */}
      <g className="sg-hits">
        <g className="sg-hit" data-part="intestino">
          <ellipse cx="110" cy="238" rx="31" ry="23" />
        </g>
        {/* El vago va abajo: donde cruza el corazón o el estómago, gana el órgano. */}
        <g className="sg-hit" data-part="vago">
          <path className="sg-hit-line" d={VAGUS_L} />
          <path className="sg-hit-line" d={VAGUS_R} />
        </g>
        <g className="sg-hit" data-part="estomago">
          <path d={STOMACH} />
        </g>
        <g className="sg-hit" data-part="pulmones">
          <path d={LUNG_L} />
          <path d={LUNG_R} />
        </g>
        <g className="sg-hit" data-part="corazon">
          <path d={HEART} />
          <circle cx="116" cy="155" r="13" />
        </g>
        <g className="sg-hit" data-part="suprarrenales">
          <circle cx="85" cy="196" r="8" />
          <circle cx="135" cy="196" r="8" />
        </g>
        <g className="sg-hit" data-part="hombros">
          {both(TRAP).map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g className="sg-hit" data-part="pfc">
          <path d={PFC} />
          <rect x="92" y="20" width="36" height="10" rx="5" />
        </g>
        <g className="sg-hit" data-part="mandibula">
          <circle cx="97.5" cy="62" r="6.5" />
          <circle cx="122.5" cy="62" r="6.5" />
        </g>
        <g className="sg-hit" data-part="amigdala">
          <circle cx="101" cy="47.5" r="5" />
          <circle cx="119" cy="47.5" r="5" />
        </g>
        <g className="sg-hit" data-part="hipotalamo">
          <circle cx="110" cy="51" r="4.2" />
        </g>
      </g>
    </svg>
  )
}

export default memo(SenalFigure)
