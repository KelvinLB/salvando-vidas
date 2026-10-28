import { useId } from 'react'
import { type CompanionLook, type CompanionMood, MOOD_STATES } from '../data/companion'

// La mascota se dibuja con figuras simples en un lienzo de 200×200. Todo lo que
// cambia (cara, accesorios, halo) se acomoda alrededor de la cara en (100, 122).

const INK = '#2b2b33'
const BLUE = '#8fb3e8'
const AMBER = '#f2c46d'
const GREEN = '#a6dcc6'
const NAVY = '#3d4a6b'
// Los colores de los alebrijes, los listones y el rebozo.
const ROSA = '#e4007c'
const TURQUESA = '#00a3a3'
const NARANJA = '#ff7a1a'
const MORADO = '#7b3fa0'
const AMARILLO = '#ffc21a'
const HAIR = '#3a2a26'

/** Mezcla dos colores hex: t = 0 es a, t = 1 es b. */
function mix(a: string, b: string, t: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t))
  return `#${out.map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

/** Sin ganas de nada, lo que es del cuerpo (como el alebrije) también se apaga. */
const soft = (hex: string, dull: boolean) => (dull ? mix(hex, '#b5b5b5', 0.6) : hex)
/** Refleja lo dibujado del lado izquierdo al derecho. */
const MIRROR = 'translate(200 0) scale(-1 1)'

/** Altura de la parte de arriba de la cabeza, para poner gorros y flores. */
const TOP: Record<CompanionLook['species'], number> = {
  nube: 62,
  gota: 40,
  brote: 66,
  michi: 66,
  osito: 66,
  conejito: 66,
  perrito: 66,
  xolo: 66,
  ajolote: 66,
  colibri: 66,
}

/** Dónde va un moño o una flor, de lado sobre la cabeza. */
const SIDE: Record<CompanionLook['species'], [number, number]> = {
  nube: [134, 72],
  gota: [120, 76],
  brote: [132, 76],
  michi: [132, 76],
  osito: [132, 76],
  conejito: [132, 76],
  perrito: [132, 76],
  xolo: [132, 76],
  ajolote: [132, 76],
  colibri: [132, 76],
}

/** Una ramita de branquia de ajolote: el tallo y sus plumitas a los dos lados. */
function Frond({ from, to, fill }: { from: [number, number]; to: [number, number]; fill: string }) {
  const [x1, y1] = from
  const [x2, y2] = to
  const len = Math.hypot(x2 - x1, y2 - y1)
  const [nx, ny] = [-(y2 - y1) / len, (x2 - x1) / len]
  return (
    <g fill={fill}>
      <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={fill} strokeWidth="6" strokeLinecap="round" />
      {[0.42, 0.62, 0.82].flatMap((t) =>
        [1, -1].map((side) => (
          <circle
            key={`${t}${side}`}
            cx={(x1 + (x2 - x1) * t + nx * 5 * side).toFixed(1)}
            cy={(y1 + (y2 - y1) * t + ny * 5 * side).toFixed(1)}
            r="3.6"
          />
        )),
      )}
      <circle cx={x2} cy={y2} r="5" />
    </g>
  )
}

/** Lo que va detrás del cuerpo: orejas, las branquias del ajolote o las alas del colibrí. */
function Ears({
  species,
  color,
  alebrije,
  dull,
}: {
  species: CompanionLook['species']
  color: string
  alebrije: boolean
  dull: boolean
}) {
  const inner = alebrije ? soft(ROSA, dull) : mix(color, '#ffffff', 0.45)
  if (species === 'michi') {
    return (
      <g>
        <path d="M50 96 L58 40 L96 74 Z" fill={color} />
        <path d="M150 96 L142 40 L104 74 Z" fill={color} />
        <path d="M60 84 L64 56 L84 74 Z" fill={inner} />
        <path d="M140 84 L136 56 L116 74 Z" fill={inner} />
      </g>
    )
  }
  if (species === 'osito') {
    return (
      <g>
        <circle cx="56" cy="78" r="22" fill={color} />
        <circle cx="144" cy="78" r="22" fill={color} />
        <circle cx="56" cy="78" r="11" fill={inner} />
        <circle cx="144" cy="78" r="11" fill={inner} />
      </g>
    )
  }
  if (species === 'conejito') {
    return (
      <g>
        <ellipse cx="76" cy="48" rx="14" ry="38" fill={color} transform="rotate(-10 76 48)" />
        <ellipse cx="124" cy="48" rx="14" ry="38" fill={color} transform="rotate(10 124 48)" />
        <ellipse cx="76" cy="50" rx="6" ry="26" fill={inner} transform="rotate(-10 76 50)" />
        <ellipse cx="124" cy="50" rx="6" ry="26" fill={inner} transform="rotate(10 124 50)" />
      </g>
    )
  }
  if (species === 'brote') {
    return (
      <g>
        <path d="M100 68 C100 56 100 48 100 40" stroke="#5aa469" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M100 46 C82 26 62 32 66 46 C76 54 92 52 100 46 Z" fill="#6cc07a" />
        <path d="M100 42 C118 22 140 28 134 42 C124 50 108 48 100 42 Z" fill="#7fcf8a" />
      </g>
    )
  }
  if (species === 'xolo') {
    // Orejas grandes y paradas, como de murciélago.
    const ear = 'M54 104 C40 76 36 46 42 18 C62 28 86 52 98 78 Z'
    const fold = 'M60 90 C52 70 50 50 52 34 C66 44 80 60 88 78 Z'
    return (
      <g>
        <path d={ear} fill={color} />
        <path d={ear} fill={color} transform={MIRROR} />
        <path d={fold} fill={inner} />
        <path d={fold} fill={inner} transform={MIRROR} />
      </g>
    )
  }
  if (species === 'ajolote') {
    // Las branquias de afuera: tres ramitas esponjadas de cada lado.
    const gill = soft(mix(color, '#ff5c8a', 0.45), dull)
    const fills = alebrije ? [ROSA, TURQUESA, AMARILLO].map((c) => soft(c, dull)) : [gill, gill, gill]
    const fronds: [number, number, number, number][] = [
      [54, 92, 22, 60],
      [48, 108, 8, 96],
      [46, 124, 10, 140],
    ]
    return (
      <g>
        {fronds.map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <Frond from={[x1, y1]} to={[x2, y2]} fill={fills[i]} />
            <Frond from={[200 - x1, y1]} to={[200 - x2, y2]} fill={fills[i]} />
          </g>
        ))}
      </g>
    )
  }
  if (species === 'colibri') {
    // Alas abiertas a los lados, como cuando se queda quieto en el aire frente a una flor:
    // tres plumas largas que se abren en abanico.
    const shades = alebrije
      ? [TURQUESA, MORADO, ROSA].map((c) => soft(c, dull))
      : [0.3, 0.2, 0.1].map((t) => mix(color, INK, t))
    const wing = (
      <g>
        {[18, 36, 54].map((a, i) => {
          const t = (a * Math.PI) / 180
          const [cx, cy] = [(40 - 18 * Math.cos(t)).toFixed(1), (126 - 18 * Math.sin(t)).toFixed(1)]
          return <ellipse key={a} cx={cx} cy={cy} rx={24 - i * 2} ry="6.5" fill={shades[i]} transform={`rotate(${a} ${cx} ${cy})`} />
        })}
      </g>
    )
    return (
      <g>
        {wing}
        <g transform={MIRROR}>{wing}</g>
      </g>
    )
  }
  return null
}

/** La silueta de cada forma, sin color: con ella se pinta el cuerpo y se recortan el alebrije y el pelo. */
function outline(species: CompanionLook['species']) {
  if (species === 'nube') {
    return [
      <circle key="izq" cx="66" cy="118" r="36" />,
      <circle key="arriba" cx="102" cy="100" r="42" />,
      <circle key="der" cx="136" cy="118" r="36" />,
      <ellipse key="abajo" cx="100" cy="146" rx="70" ry="38" />,
    ]
  }
  if (species === 'gota') {
    return [<path key="gota" d="M100 32 C118 62 162 94 162 134 C162 168 134 186 100 186 C66 186 38 168 38 134 C38 94 82 62 100 32 Z" />]
  }
  return [<ellipse key="cuerpo" cx="100" cy="126" rx="66" ry="60" />]
}

/** La panza, un poco más clara: centro y tamaño según la forma. */
const BELLY: Partial<Record<CompanionLook['species'], [number, number, number]>> = {
  nube: [156, 40, 20],
  gota: [160, 36, 20],
}

function Body({ species, color }: { species: CompanionLook['species']; color: string }) {
  const [cy, rx, ry] = BELLY[species] ?? [158, 36, 22]
  return (
    <g>
      <g fill={color}>{outline(species)}</g>
      <ellipse cx="100" cy={cy} rx={rx} ry={ry} fill={mix(color, '#ffffff', 0.35)} />
    </g>
  )
}

/** Figuras de alebrije recortadas al cuerpo, lejos de los ojos y la boca. */
function Alebrije({ clip, dull }: { clip: string; dull: boolean }) {
  const c = (hex: string) => soft(hex, dull)
  const zigzag = 'M38 94 L50 104 L38 114 L50 124 L38 134 L50 144 L38 154 L50 164 L40 174'
  const swirl = 'M56 92 C65 92 67 103 58 105 C51 106 49 98 55 96 C58 95 60 99 57 100'
  const flower = (x: number, y: number, petal: string) => (
    <g key={x}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={(x + 6 * Math.cos((a * Math.PI) / 180)).toFixed(1)}
          cy={(y + 6 * Math.sin((a * Math.PI) / 180)).toFixed(1)}
          r="4"
          fill={c(petal)}
        />
      ))}
      <circle cx={x} cy={y} r="3.2" fill={c(AMARILLO)} />
    </g>
  )
  const ray = (a: number, r: number) => {
    const t = (a * Math.PI) / 180
    return `${(100 + r * Math.cos(t)).toFixed(1)} ${(170 + r * Math.sin(t)).toFixed(1)}`
  }
  return (
    <g clipPath={`url(#${clip})`}>
      <g fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d={zigzag} stroke={c(TURQUESA)} />
        <path d={zigzag} stroke={c(NARANJA)} transform={MIRROR} />
        <path d={swirl} stroke={c(MORADO)} strokeWidth="3" />
        <path d={swirl} stroke={c(MORADO)} strokeWidth="3" transform={MIRROR} />
      </g>
      {[
        [66, 84],
        [83, 76],
        [100, 73],
        [117, 76],
        [134, 84],
      ].map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r="3.6" fill={c(i % 2 ? ROSA : AMARILLO)} />
      ))}
      {flower(62, 166, ROSA)}
      {flower(138, 166, MORADO)}
      {/* Un solecito en la panza. */}
      <g stroke={c(NARANJA)} strokeWidth="3" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d={`M${ray(a, 9)} L${ray(a, 13)}`} />
        ))}
      </g>
      <circle cx="100" cy="170" r="6.5" fill={c(AMARILLO)} />
    </g>
  )
}

/** Lo que va sobre el cuerpo según la forma: hocico y nariz, orejas caídas, copete o la coronilla del colibrí. */
function Front({
  species,
  color,
  alebrije,
  dull,
  clip,
}: {
  species: CompanionLook['species']
  color: string
  alebrije: boolean
  dull: boolean
  clip: string
}) {
  const muzzle = <ellipse cx="100" cy="137" rx="22" ry="14" fill={mix(color, '#ffffff', 0.5)} />
  const nose = <path d="M93 127 Q100 123 107 127 Q104 135 100 135 Q96 135 93 127 Z" fill={INK} />
  if (species === 'perrito') {
    // Orejas caídas, más oscuras, y una mancha alrededor de un ojo.
    const ear = alebrije ? soft(MORADO, dull) : mix(color, '#7a4b2a', 0.4)
    return (
      <g>
        <ellipse cx="46" cy="112" rx="15" ry="35" fill={ear} transform="rotate(16 46 112)" />
        <ellipse cx="46" cy="112" rx="15" ry="35" fill={ear} transform={`${MIRROR} rotate(16 46 112)`} />
        <circle cx="121" cy="114" r="15" fill={ear} opacity="0.5" />
        {muzzle}
        {nose}
      </g>
    )
  }
  if (species === 'xolo') {
    // El xoloitzcuintle casi no tiene pelo: solo un copetito arriba.
    return (
      <g>
        <path d="M91 72 L94 56 L99 68 L103 52 L107 68 L111 57 L112 73 Z" fill={mix(color, INK, 0.45)} />
        {muzzle}
        {nose}
      </g>
    )
  }
  if (species === 'colibri') {
    // La coronilla de plumas que brillan con el sol. Va arriba y no en la garganta: ahí
    // parecería una boca abierta.
    const jewel = soft(alebrije ? MORADO : mix(color, '#138a83', 0.6), dull)
    return (
      <g clipPath={`url(#${clip})`}>
        <path d="M0 0 L200 0 L200 98 C164 84 132 79 100 79 C68 79 36 84 0 98 Z" fill={jewel} />
        <path d="M70 76 C84 70 116 70 130 76" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  return null
}

// El pico del colibrí hace de boca: con alegría apunta hacia arriba; con tristeza se cae.
const BEAK_TIP: Record<CompanionMood, number> = { feliz: 134, calma: 146, triste: 164, cansado: 158, nervios: 150, apagado: 160 }

function Beak({ mood }: { mood: CompanionMood }) {
  const tip = BEAK_TIP[mood]
  return (
    <path
      d={`M97 127 Q136 ${(127 + tip) / 2 - 3} 170 ${tip} Q136 ${(134 + tip) / 2 + 1} 99 134 Z`}
      fill="#4a4452"
      strokeLinejoin="round"
    />
  )
}

function Eyes({ mood, blink }: { mood: CompanionMood; blink?: boolean }) {
  const stroke = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' }
  if (blink) {
    return (
      <g {...stroke}>
        <path d="M73 118 L87 118" />
        <path d="M113 118 L127 118" />
      </g>
    )
  }
  if (mood === 'feliz') {
    return (
      <g {...stroke}>
        <path d="M72 120 Q80 110 88 120" />
        <path d="M112 120 Q120 110 128 120" />
      </g>
    )
  }
  if (mood === 'cansado') {
    return (
      <g {...stroke}>
        <path d="M72 118 Q80 124 88 118" />
        <path d="M112 118 Q120 124 128 118" />
      </g>
    )
  }
  const worried = mood === 'triste' || mood === 'nervios'
  const r = mood === 'nervios' ? 8 : mood === 'apagado' ? 5 : 7
  const y = mood === 'triste' ? 120 : 117
  return (
    <g>
      {worried && (
        <g {...stroke} strokeWidth={3}>
          <path d="M71 104 L87 99" />
          <path d="M113 99 L129 104" />
        </g>
      )}
      <circle cx="80" cy={y} r={r} fill={INK} />
      <circle cx="120" cy={y} r={r} fill={INK} />
      {mood !== 'apagado' && (
        <g fill="#fff">
          <circle cx="82.5" cy={y - 2.5} r="2.2" />
          <circle cx="122.5" cy={y - 2.5} r="2.2" />
        </g>
      )}
    </g>
  )
}

const MOUTHS: Record<CompanionMood, string> = {
  feliz: 'M88 136 Q100 150 112 136',
  calma: 'M92 138 Q100 145 108 138',
  triste: 'M90 146 Q100 137 110 146',
  cansado: 'M95 141 Q100 143 105 141',
  nervios: 'M86 142 Q90 138 94 142 T102 142 T110 142',
  apagado: 'M92 141 L108 141',
}

// Dónde van los brillitos de la alegría, para que no se pierdan entre branquias u orejas grandes.
const SPARKS: Partial<Record<CompanionLook['species'], [number, number, number][]>> = {
  ajolote: [
    [64, 46, 8],
    [140, 40, 7],
  ],
  xolo: [
    [22, 80, 8],
    [180, 94, 7],
  ],
}
// Las branquias del ajolote llegan arriba: su nube y sus zetas van un poco más alto.
const EXTRAS_TOP: Partial<Record<CompanionLook['species'], number>> = { ajolote: 46 }

function Extras({ mood, top, species }: { mood: CompanionMood; top: number; species: CompanionLook['species'] }) {
  if (mood === 'feliz') {
    const spark = (x: number, y: number, s: number) =>
      `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`
    const sparks = SPARKS[species] ?? [
      [36, 70, 9],
      [166, 82, 7],
    ]
    return (
      <g fill={AMBER}>
        {sparks.map(([x, y, size]) => (
          <path key={x} d={spark(x, y, size)} />
        ))}
      </g>
    )
  }
  if (mood === 'triste') {
    return (
      <g>
        <g fill="#b8c2cc">
          <circle cx="150" cy={top - 14} r="11" />
          <circle cx="163" cy={top - 18} r="13" />
          <circle cx="176" cy={top - 12} r="10" />
          <rect x="146" y={top - 14} width="34" height="12" rx="6" />
        </g>
        <g stroke={BLUE} strokeWidth="3" strokeLinecap="round">
          <path d={`M154 ${top + 4} l-2 6`} />
          <path d={`M166 ${top + 4} l-2 6`} />
          <path d={`M178 ${top + 4} l-2 6`} />
        </g>
      </g>
    )
  }
  if (mood === 'cansado') {
    return (
      <g fill="#8a94a6" fontWeight="800" fontFamily="system-ui, sans-serif">
        <text x="148" y={top + 2} fontSize="20">z</text>
        <text x="164" y={top - 12} fontSize="14">z</text>
      </g>
    )
  }
  if (mood === 'nervios') {
    return <path d="M150 92 C146 100 144 104 148 108 C152 111 157 107 155 101 C154 98 152 95 150 92 Z" fill={BLUE} />
  }
  return null
}

function Head({ head, species, clip }: { head: CompanionLook['head']; species: CompanionLook['species']; clip: string }) {
  const top = TOP[species]
  const [x, y] = SIDE[species]
  if (head === 'sombrero') {
    // De palma, con una cinta bordada de colores.
    const b = top + 10
    const zigzag = Array.from({ length: 9 }, (_, i) => `l5 ${i % 2 ? 3 : -3}`).join(' ')
    return (
      <g>
        <ellipse cx="100" cy={b + 3} rx="76" ry="15" fill="#c2924a" />
        <ellipse cx="100" cy={b} rx="76" ry="15" fill="#e8c47f" />
        <ellipse cx="100" cy={b} rx="62" ry="10" fill="none" stroke={ROSA} strokeWidth="2.4" strokeDasharray="0.1 8" strokeLinecap="round" />
        <path d={`M72 ${b} C70 ${b - 34} 82 ${b - 46} 100 ${b - 46} C118 ${b - 46} 130 ${b - 34} 128 ${b} Z`} fill="#e8c47f" />
        <path d={`M73 ${b - 11} Q100 ${b - 5} 127 ${b - 11} L128 ${b - 1} Q100 ${b + 5} 72 ${b - 1} Z`} fill={ROSA} />
        <path d={`M78 ${b - 4} ${zigzag}`} stroke={AMARILLO} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      </g>
    )
  }
  if (head === 'trenzas') {
    // Pelo con raya en medio y dos trenzas con listones de colores.
    const braid = (
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [cx, cy] = [40 - i * 1.2, 124 + i * 10]
          return (
            <ellipse key={i} cx={cx} cy={cy} rx="8.5" ry="7" fill={i % 2 ? '#4d3832' : HAIR} transform={`rotate(${i % 2 ? 22 : -22} ${cx} ${cy})`} />
          )
        })}
        <path d="M33 186 L27 197 M33 186 L39 197" stroke={TURQUESA} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="26" cy="184" rx="8" ry="5" fill={ROSA} transform="rotate(-25 26 184)" />
        <ellipse cx="40" cy="184" rx="8" ry="5" fill={ROSA} transform="rotate(25 40 184)" />
        <circle cx="33" cy="185" r="3.5" fill={AMARILLO} />
      </g>
    )
    return (
      <g>
        <path
          clipPath={`url(#${clip})`}
          d="M0 150 L0 0 L200 0 L200 150 C186 120 160 98 132 93 C116 90 106 86 100 77 C94 86 84 90 68 93 C40 98 14 120 0 150 Z"
          fill={HAIR}
        />
        {braid}
        <g transform={MIRROR}>{braid}</g>
      </g>
    )
  }
  if (head === 'gorro') {
    return (
      <g>
        <path d={`M60 ${top + 22} C60 ${top - 26} 140 ${top - 26} 140 ${top + 22} Z`} fill="#e56b6f" />
        <rect x="54" y={top + 12} width="92" height="16" rx="8" fill="#c4545a" />
        <circle cx="100" cy={top - 18} r="9" fill="#fff4f0" />
      </g>
    )
  }
  if (head === 'mono') {
    return (
      <g fill="#ff7aa2">
        <path d={`M${x} ${y} L${x - 16} ${y - 11} L${x - 16} ${y + 11} Z`} />
        <path d={`M${x} ${y} L${x + 16} ${y - 11} L${x + 16} ${y + 11} Z`} />
        <circle cx={x} cy={y} r="5" fill="#e55a86" />
      </g>
    )
  }
  if (head === 'flor') {
    return (
      <g>
        {[0, 72, 144, 216, 288].map((a) => (
          <circle
            key={a}
            cx={x + 9 * Math.cos((a * Math.PI) / 180)}
            cy={y + 9 * Math.sin((a * Math.PI) / 180)}
            r="7"
            fill="#fff"
            stroke="#f0d6e0"
          />
        ))}
        <circle cx={x} cy={y} r="5.5" fill={AMBER} />
      </g>
    )
  }
  if (head === 'audifonos') {
    return (
      <g>
        <path d={`M40 116 C40 ${top - 26} 160 ${top - 26} 160 116`} stroke="#4a4f5c" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="28" y="102" width="20" height="34" rx="9" fill="#4a4f5c" />
        <rect x="152" y="102" width="20" height="34" rx="9" fill="#4a4f5c" />
      </g>
    )
  }
  if (head === 'boina') {
    return (
      <g transform={`rotate(-10 100 ${top + 4})`}>
        <path d={`M100 ${top - 10} l2 -8`} stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="100" cy={top + 4} rx="46" ry="15" fill={NAVY} />
        <ellipse cx="100" cy={top + 11} rx="38" ry="5" fill="#2f3a57" />
      </g>
    )
  }
  if (head === 'corona') {
    const y = top + 6
    return (
      <g>
        <path
          d={`M68 ${y} L72 ${y - 26} L86 ${y - 12} L100 ${y - 30} L114 ${y - 12} L128 ${y - 26} L132 ${y} Z`}
          fill={AMBER}
          stroke="#d9a440"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="68" y={y - 4} width="64" height="8" rx="3" fill="#e9b452" />
        <circle cx="72" cy={y - 26} r="4" fill="#fff4f0" />
        <circle cx="100" cy={y - 30} r="4.5" fill="#e56b6f" />
        <circle cx="128" cy={y - 26} r="4" fill="#fff4f0" />
      </g>
    )
  }
  if (head === 'hojas') {
    return (
      <g fill="#6cc07a">
        {[-36, -18, 0, 18, 36].map((dx, i) => (
          <ellipse
            key={dx}
            cx={100 + dx}
            cy={top + 4 + Math.abs(dx) / 4}
            rx="6"
            ry="12"
            transform={`rotate(${dx * 1.2} ${100 + dx} ${top + 4 + Math.abs(dx) / 4})`}
            fill={i % 2 ? '#7fcf8a' : '#5aa469'}
          />
        ))}
      </g>
    )
  }
  return null
}

function Face({ face }: { face: CompanionLook['face'] }) {
  if (face === 'lentes') {
    return (
      <g stroke={INK} strokeWidth="3" fill="rgb(255 255 255 / 0.18)">
        <circle cx="80" cy="118" r="14" />
        <circle cx="120" cy="118" r="14" />
        <path d="M94 117 Q100 112 106 117" fill="none" />
      </g>
    )
  }
  if (face === 'pecas') {
    return (
      <g fill="#b8735a" opacity="0.55">
        {[
          [64, 134],
          [70, 140],
          [74, 133],
          [126, 133],
          [130, 140],
          [136, 134],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
        ))}
      </g>
    )
  }
  if (face === 'sol') {
    return (
      <g>
        <rect x="62" y="106" width="36" height="22" rx="10" fill={INK} />
        <rect x="102" y="106" width="36" height="22" rx="10" fill={INK} />
        <path d="M97 113 Q100 109 103 113" stroke={INK} strokeWidth="4" fill="none" />
        <g stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round">
          <path d="M70 112 L79 112" />
          <path d="M110 112 L119 112" />
        </g>
      </g>
    )
  }
  if (face === 'bigote') {
    return (
      <path
        d="M100 130 C96 124 86 123 79 131 C84 136 93 135 100 132 C107 135 116 136 121 131 C114 123 104 124 100 130 Z"
        fill="#4a3b33"
      />
    )
  }
  return null
}

// Lo que tapa los ojos o la boca va encima de la cara; lo demás, debajo.
const ON_TOP: CompanionLook['face'][] = ['sol', 'bigote']

function Neck({ neck }: { neck: CompanionLook['neck'] }) {
  if (neck === 'rebozo') {
    // Rebozo de rayitas finas: rodea los hombros y una punta cuelga con sus flecos.
    const base = '#c2185b'
    return (
      <g>
        <path d="M40 150 Q100 182 160 150 L163 170 Q100 204 37 170 Z" fill={base} />
        <g fill="none" strokeWidth="1.6">
          <path d="M39 156 Q100 189 161 156" stroke={AMARILLO} />
          <path d="M38 163 Q100 197 162 163" stroke={TURQUESA} />
        </g>
        <path d="M116 172 L144 164 L150 186 L122 193 Z" fill={base} />
        <path d="M118 177 L145 169" stroke={AMARILLO} strokeWidth="1.6" />
        <g stroke={base} strokeWidth="2" strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${124 + i * 5} ${(192.5 - i * 1.25).toFixed(1)} l0 5`} />
          ))}
        </g>
      </g>
    )
  }
  if (neck === 'bufanda') {
    return (
      <g fill="#e56b6f">
        <path d="M50 158 Q100 180 150 158 L150 172 Q100 194 50 172 Z" />
        <path d="M118 172 L134 170 L132 198 L116 196 Z" fill="#c4545a" />
      </g>
    )
  }
  if (neck === 'collar') {
    return (
      <g>
        <path d="M62 158 Q100 178 138 158" stroke={AMBER} strokeWidth="3" fill="none" />
        <circle cx="100" cy="171" r="6" fill={AMBER} />
      </g>
    )
  }
  if (neck === 'paliacate') {
    return (
      <g>
        <path d="M54 156 Q100 176 146 156 L140 166 Q100 184 60 166 Z" fill="#c8453c" />
        <path d="M78 168 Q100 176 122 168 L100 198 Z" fill="#c8453c" />
        <g fill="#fff" opacity="0.85">
          {[
            [70, 164],
            [88, 176],
            [100, 186],
            [112, 176],
            [130, 164],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />
          ))}
        </g>
      </g>
    )
  }
  if (neck === 'corbatin') {
    return (
      <g>
        <path d="M100 170 L80 159 Q76 170 80 181 Z" fill={NAVY} />
        <path d="M100 170 L120 159 Q124 170 120 181 Z" fill={NAVY} />
        <rect x="94" y="164" width="12" height="12" rx="4" fill="#2f3a57" />
      </g>
    )
  }
  return null
}

export default function CompanionView({
  look,
  mood = 'calma',
  size = 160,
  aura,
  name,
  gaze,
  blink,
}: {
  look: CompanionLook
  mood?: CompanionMood
  size?: number
  /** La mezcla de lo que carga: 0 a 1 de ánimo bajo y de nervios; calm pinta todo de verde. */
  aura?: { dep: number; anx: number; calm: boolean }
  name?: string
  /** Hacia dónde mira, de -1 a 1 en cada eje: la mascota flotante sigue el dedo. */
  gaze?: { x: number; y: number }
  blink?: boolean
}) {
  const id = useId()
  const top = TOP[look.species]
  // Sin ganas de nada: el color se apaga un poco, como se siente.
  const dull = mood === 'apagado'
  const color = dull ? mix(look.color, '#b5b5b5', 0.6) : look.color
  const alebrije = look.pattern === 'alebrije'
  const clip = `${id}-cuerpo`
  const state = MOOD_STATES.find((m) => m.id === mood)!.label.toLowerCase()

  const dep = aura?.dep ?? 0
  const anx = aura?.anx ?? 0
  const split = dep + anx > 0 ? dep / (dep + anx) : 0.5

  return (
    <svg
      className="companion"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={name ? `${name}, ${state}` : `Tu mascota, ${state}`}
    >
      {aura && (
        <>
          <defs>
            <radialGradient id={`${id}-glow`}>
              <stop offset="55%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id={`${id}-mask`}>
              <circle cx="100" cy="118" r="98" fill={`url(#${id}-glow)`} />
            </mask>
            <linearGradient id={`${id}-mix`} x1="0" y1="0" x2="1" y2="1">
              {aura.calm ? (
                <stop offset="0" stopColor={GREEN} />
              ) : (
                <>
                  <stop offset={Math.max(0, split - 0.2)} stopColor={BLUE} />
                  <stop offset={Math.min(1, split + 0.2)} stopColor={AMBER} />
                </>
              )}
            </linearGradient>
          </defs>
          <circle cx="100" cy="118" r="98" fill={`url(#${id}-mix)`} mask={`url(#${id}-mask)`} opacity="0.75" />
        </>
      )}
      <defs>
        <clipPath id={clip}>{outline(look.species)}</clipPath>
      </defs>
      <ellipse cx="100" cy="190" rx="52" ry="7" fill={INK} opacity="0.1" />
      <g className={`companion-body ${mood}`}>
        <Ears species={look.species} color={color} alebrije={alebrije} dull={dull} />
        <Body species={look.species} color={color} />
        {alebrije && <Alebrije clip={clip} dull={dull} />}
        <Front species={look.species} color={color} alebrije={alebrije} dull={dull} clip={clip} />
        <Neck neck={look.neck} />
        {mood !== 'apagado' && (
          <g fill="#ff8a8a" opacity="0.35">
            <ellipse cx="66" cy="134" rx="9" ry="5.5" />
            <ellipse cx="134" cy="134" rx="9" ry="5.5" />
          </g>
        )}
        {!ON_TOP.includes(look.face) && <Face face={look.face} />}
        <g transform={gaze ? `translate(${(gaze.x * 5).toFixed(1)} ${(gaze.y * 3.5).toFixed(1)})` : undefined}>
          <Eyes mood={mood} blink={blink} />
        </g>
        {look.species === 'colibri' ? (
          <Beak mood={mood} />
        ) : (
          <path d={MOUTHS[mood]} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {ON_TOP.includes(look.face) && <Face face={look.face} />}
        <Head head={look.head} species={look.species} clip={clip} />
      </g>
      <Extras mood={mood} top={EXTRAS_TOP[look.species] ?? top} species={look.species} />
    </svg>
  )
}
