import type { ArtId } from '../data/nervios'

// Los dibujos de «Entender mis nervios»: formas sencillas con los colores de la app, sin texto
// adentro. Lo poco que se mueve se queda en su recuadro y se apaga con movimiento reducido.

const Person = ({ x, y, s = 1, tone = 'nv-body' }: { x: number; y: number; s?: number; tone?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle className="nv-skin" cx="0" cy="-30" r="11" />
    <path className={tone} d="M-16 14 v-18 a16 16 0 0 1 32 0 v18 z" />
  </g>
)

export default function NerviosArt({ art }: { art: ArtId }) {
  return (
    <svg viewBox="0 0 240 140" className={`nv-art nv-art-${art}`} aria-hidden="true">
      {art === 'alarma' && (
        <>
          <rect className="nv-stone" x="0" y="0" width="240" height="12" />
          <ellipse className="nv-paper" cx="120" cy="20" rx="30" ry="10" />
          <circle className="nv-alarm" cx="120" cy="22" r="4" />
          <g className="nv-ring">
            <path className="nv-stroke-alarm" d="M80 30 q-10 10 -6 24 M160 30 q10 10 6 24" />
            <path className="nv-stroke-alarm" d="M66 28 q-14 14 -8 32 M174 28 q14 14 8 32" />
          </g>
          <rect className="nv-stone" x="88" y="96" width="64" height="34" rx="10" />
          <rect className="nv-toast" x="100" y="82" width="16" height="20" rx="5" />
          <rect className="nv-toast" x="124" y="82" width="16" height="20" rx="5" />
          <path className="nv-smoke" d="M108 76 q-6 -8 0 -14 q6 -6 0 -14 M132 76 q6 -8 0 -14 q-6 -6 0 -14" />
        </>
      )}
      {art === 'adrenalina' && (
        <>
          <path className="nv-heart nv-beat" d="M120 112 l-34 -32 c-16 -16 -4 -42 18 -38 c8 2 12 8 16 14 c4 -6 8 -12 16 -14 c22 -4 34 22 18 38 z" />
          <path className="nv-bolt" d="M126 50 l-16 26 h12 l-6 22 l18 -28 h-12 z" />
          <path className="nv-stroke-calm" d="M14 120 h40 l8 -14 l10 26 l8 -12 h28 M144 120 h28 l8 -14 l10 26 l8 -12 h28" />
        </>
      )}
      {art === 'ola' && (
        <>
          <path className="nv-wave-fill" d="M10 124 C 60 124, 80 30, 110 30 C 140 30, 160 124, 230 124 Z" />
          <path className="nv-stroke-calm" d="M10 124 C 60 124, 80 30, 110 30 C 140 30, 160 124, 230 124" />
          <circle className="nv-accent" cx="110" cy="30" r="6" />
          <path className="nv-stroke-soft" d="M10 128 h220" />
        </>
      )}
      {art === 'personas' && (
        <>
          <Person x={40} y={112} s={0.95} tone="nv-body-a" />
          <Person x={84} y={104} tone="nv-body-b" />
          <Person x={128} y={114} s={0.9} />
          <Person x={170} y={102} s={1.05} tone="nv-body-c" />
          <Person x={210} y={114} s={0.85} tone="nv-body-a" />
        </>
      )}
      {(art === 'circulo' || art === 'romper') && (
        <>
          <path
            className={art === 'romper' ? 'nv-stroke-soft nv-thick' : 'nv-stroke-alarm nv-thick nv-spin'}
            d={art === 'romper' ? 'M150 40 A44 44 0 1 1 92 44' : 'M120 26 A44 44 0 1 1 76 70 A44 44 0 0 1 120 26'}
          />
          {art === 'circulo' && <path className="nv-arrowhead" d="M116 18 l12 8 l-12 8 z" />}
          {art === 'romper' && <path className="nv-leaf" d="M112 40 c10 -16 30 -16 36 -6 c-10 14 -28 16 -36 6 z" />}
          <circle className={art === 'romper' ? 'nv-calm' : 'nv-alarm'} cx="120" cy="70" r="12" />
        </>
      )}
      {art === 'sensaciones' && (
        <>
          <path className="nv-arm" d="M92 80 l-26 38 M148 80 l26 38" />
          <circle className="nv-skin" cx="120" cy="30" r="18" />
          <path className="nv-body" d="M88 132 v-58 a32 32 0 0 1 64 0 v58 z" />
          <circle className="nv-dot nv-pulse" cx="128" cy="84" r="6" />
          <circle className="nv-dot nv-pulse nv-d2" cx="110" cy="96" r="5" />
          <circle className="nv-dot nv-pulse nv-d3" cx="120" cy="22" r="5" />
          <circle className="nv-dot nv-pulse nv-d4" cx="66" cy="118" r="5" />
          <circle className="nv-dot nv-pulse nv-d2" cx="174" cy="118" r="5" />
        </>
      )}
      {art === 'mochila' && (
        <>
          <path className="nv-stroke-soft nv-thick" d="M100 44 v-12 a20 20 0 0 1 40 0 v12" />
          <rect className="nv-pack" x="76" y="40" width="88" height="92" rx="24" />
          <rect className="nv-pack-pocket" x="92" y="86" width="56" height="34" rx="12" />
          <rect className="nv-bottle" x="176" y="70" width="22" height="58" rx="8" />
          <rect className="nv-stone" x="181" y="60" width="12" height="12" rx="3" />
          <rect className="nv-pill" x="36" y="108" width="30" height="14" rx="7" transform="rotate(-20 51 115)" />
        </>
      )}
      {art === 'guardar' && (
        <>
          <rect className="nv-jar" x="82" y="40" width="76" height="90" rx="18" />
          <rect className="nv-stone" x="78" y="30" width="84" height="16" rx="6" />
          <path className="nv-cloud" d="M100 100 a14 14 0 0 1 6 -27 a18 18 0 0 1 32 -2 a13 13 0 0 1 6 29 z" />
        </>
      )}
      {art === 'boton' && (
        <>
          <rect className="nv-phone" x="88" y="10" width="64" height="122" rx="14" />
          <rect className="nv-paper" x="96" y="24" width="48" height="92" rx="6" />
          <circle className="nv-ring-soft nv-beat" cx="120" cy="70" r="20" />
          <circle className="nv-calm" cx="120" cy="70" r="12" />
          <Person x={190} y={124} s={0.9} />
          <path className="nv-stroke-calm" d="M168 92 q-12 -10 -26 -14" />
        </>
      )}
      {art === 'escalera' && (
        <>
          <path className="nv-steps" d="M20 132 h40 v-22 h40 v-22 h40 v-22 h40 v-22 h40 v88 z" />
          <Person x={80} y={108} s={0.8} />
          <path className="nv-flag-pole" d="M206 44 v-34" />
          <path className="nv-accent" d="M206 10 l22 8 l-22 8 z" />
        </>
      )}
      {art === 'practicar' && (
        <>
          <circle className="nv-skin" cx="120" cy="28" r="14" />
          <rect className="nv-body" x="106" y="46" width="28" height="44" rx="12" />
          <rect className="nv-body nv-leg nv-leg-a" x="106" y="86" width="12" height="40" rx="6" />
          <rect className="nv-body nv-leg nv-leg-b" x="122" y="86" width="12" height="40" rx="6" />
          <path className="nv-stroke-calm" d="M70 58 h18 M64 74 h22 M70 90 h18" />
          <path className="nv-heart" d="M170 54 c-6 -8 -18 -2 -12 8 l12 11 l12 -11 c6 -10 -6 -16 -12 -8 z" />
        </>
      )}
      {art === 'balanza' && (
        <>
          {/* Lo que temías pesa poco frente a lo que pasó de verdad. */}
          <path className="nv-stroke-soft nv-thick" d="M120 26 v100 M88 130 h64 M50 38 L190 58" />
          <path className="nv-stroke-soft" d="M50 38 l-20 38 M50 38 l20 38 M190 58 l-20 38 M190 58 l20 38" />
          <path className="nv-pan" d="M26 76 h48 a24 12 0 0 1 -48 0 z" />
          <path className="nv-pan" d="M166 96 h48 a24 12 0 0 1 -48 0 z" />
          <path className="nv-cloud-dark" d="M36 72 a9 9 0 0 1 4 -17 a12 12 0 0 1 21 -1 a8 8 0 0 1 4 18 z" />
          <circle className="nv-accent" cx="190" cy="84" r="11" />
        </>
      )}
      {art === 'platica' && (
        <>
          <Person x={70} y={124} />
          <Person x={170} y={124} tone="nv-body-b" />
          <path className="nv-bubble" d="M60 18 h56 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-36 l-12 10 v-10 h-8 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 z" />
          <path className="nv-bubble-b" d="M130 32 h54 a10 10 0 0 1 10 10 v16 a10 10 0 0 1 -10 10 h-6 v10 l-12 -10 h-36 a10 10 0 0 1 -10 -10 v-16 a10 10 0 0 1 10 -10 z" />
        </>
      )}
      {art === 'cuidarse' && (
        <>
          <path className="nv-moon" d="M70 30 a30 30 0 1 0 30 44 a24 24 0 1 1 -30 -44 z" />
          <path className="nv-shoe" d="M120 104 h40 l10 -14 c10 4 22 6 34 8 a10 10 0 0 1 8 10 v8 h-92 z" />
          <path className="nv-stroke-calm" d="M140 64 q10 -10 0 -20 M156 64 q10 -10 0 -20" />
        </>
      )}
      {art === 'senales' && (
        <>
          <path className="nv-stroke-alarm" d="M10 112 q16 -40 32 0 q16 -30 32 0 q16 -46 32 0" />
          <path className="nv-house" d="M140 72 l40 -34 l40 34 v58 h-80 z" />
          <rect className="nv-door" x="168" y="94" width="24" height="36" rx="4" />
          <circle className="nv-stone" cx="186" cy="113" r="2.5" />
        </>
      )}
      {art === 'consulta' && (
        <>
          <rect className="nv-paper nv-edge" x="78" y="20" width="84" height="110" rx="10" />
          <rect className="nv-stone" x="100" y="12" width="40" height="16" rx="6" />
          <path className="nv-stroke-soft" d="M94 52 h52 M94 70 h52 M94 88 h34" />
          <path className="nv-stroke-calm nv-thick" d="M180 40 v34 a18 18 0 0 1 -36 0" fill="none" />
          <circle className="nv-calm" cx="180" cy="40" r="7" />
        </>
      )}
      {art === 'ayuda' && (
        <>
          <path className="nv-hand" d="M40 120 c30 0 50 -10 70 -24 l10 -8 c6 -4 2 -14 -6 -10 l-24 12" />
          <path className="nv-hand" d="M200 120 c-30 0 -50 -10 -70 -24 l-10 -8 c-6 -4 -2 -14 6 -10 l24 12" />
          <path className="nv-heart nv-beat" d="M120 86 l-22 -20 c-10 -10 -2 -26 12 -24 c4 1 8 4 10 8 c2 -4 6 -7 10 -8 c14 -2 22 14 12 24 z" />
        </>
      )}
    </svg>
  )
}
