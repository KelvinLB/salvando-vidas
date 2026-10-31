import {
  Archive,
  Bandage,
  Bed,
  Bell,
  Bird,
  BookOpen,
  Bookmark,
  BrickWall,
  Brain,
  CalendarDays,
  Camera,
  Circle,
  Clapperboard,
  Clock,
  CloudRain,
  Compass,
  CookingPot,
  Dog,
  Droplet,
  Ear,
  Eye,
  Fish,
  Flame,
  Flower2,
  Footprints,
  Guitar,
  Hand,
  HandFist,
  HandHeart,
  Hash,
  Headphones,
  Heart,
  HeartHandshake,
  HeartPulse,
  Hospital,
  Hourglass,
  Laugh,
  Layers,
  Leaf,
  Library,
  LifeBuoy,
  Lightbulb,
  Link,
  Lock,
  Mail,
  Moon,
  MessageCircle,
  MessageCircleOff,
  Music,
  NotebookPen,
  Orbit,
  Paintbrush,
  Palette,
  PawPrint,
  PersonStanding,
  Phone,
  Piano,
  Pill,
  Puzzle,
  Radio,
  Repeat,
  Save,
  Scale,
  ScanFace,
  Smartphone,
  Sparkles,
  Speech,
  Spool,
  Sprout,
  Stethoscope,
  Sun,
  Sunrise,
  Tag,
  Thermometer,
  TreeDeciduous,
  Utensils,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

// Las puertas (filas, atajos, mosaicos que abren una pantalla) llevan un ícono de línea en un
// círculo suave, no un emoji: se ven parejos, tranquilos y del color de la app. Los datos siguen
// diciendo su emoji; aquí se traduce. Si alguno no está, se queda el emoji.
const ICONOS: Record<string, LucideIcon> = {
  '🫧': Wind,
  '🌬': Wind,
  '🌿': Leaf,
  '🍃': Leaf,
  '🍂': Leaf,
  '🌱': Sprout,
  '🌳': TreeDeciduous,
  '🫀': HeartPulse,
  '💓': HeartPulse,
  '🌙': Moon,
  '🧠': Brain,
  '🤸': PersonStanding,
  '🧘': PersonStanding,
  '🚶': Footprints,
  '👣': Footprints,
  '🦶': Footprints,
  '🔥': Flame,
  '🕯': Flame,
  '💧': Droplet,
  '🎧': Headphones,
  '🎵': Music,
  '🎶': Music,
  '🎹': Piano,
  '🎸': Guitar,
  '🎬': Clapperboard,
  '🧩': Puzzle,
  '🖌': Paintbrush,
  '🎨': Palette,
  '🧱': BrickWall,
  '🧵': Spool,
  '🔢': Hash,
  '🌊': Waves,
  '✋': Hand,
  '✊': HandFist,
  '🤲': HandHeart,
  '🙏': HandHeart,
  '🫶': HeartHandshake,
  '👀': Eye,
  '👂': Ear,
  '👃': Flower2,
  '💛': Heart,
  '🤍': Heart,
  '💡': Lightbulb,
  '🐾': PawPrint,
  '🐶': Dog,
  '🐠': Fish,
  '🕊': Bird,
  '🩺': Stethoscope,
  '🏥': Hospital,
  '💊': Pill,
  '🩹': Bandage,
  '📚': Library,
  '📖': BookOpen,
  '🌡': Thermometer,
  '🧭': Compass,
  '🗓': CalendarDays,
  '📅': CalendarDays,
  '✨': Sparkles,
  '⚖': Scale,
  '🏷': Tag,
  '🔖': Bookmark,
  '🌧': CloudRain,
  '🕳': Circle,
  '🆘': LifeBuoy,
  '🛟': LifeBuoy,
  '💬': MessageCircle,
  '🗣': Speech,
  '🤐': MessageCircleOff,
  '✉': Mail,
  '💌': Mail,
  '🫙': Archive,
  '🃏': Layers,
  '⏳': Hourglass,
  '🛏': Bed,
  '📝': NotebookPen,
  '🕰': Clock,
  '📞': Phone,
  '📱': Smartphone,
  '☀': Sun,
  '🌅': Sunrise,
  '🔒': Lock,
  '🔔': Bell,
  '💾': Save,
  '📷': Camera,
  '⚡': Zap,
  '🔁': Repeat,
  '🍽': Utensils,
  '🍳': CookingPot,
  '📻': Radio,
  '🪞': ScanFace,
  '🔗': Link,
  '😂': Laugh,
  '🪐': Orbit,
}

/** El ícono de línea que corresponde a un emoji de puerta, o nada si no hay uno. */
export function iconoDe(emoji: string): LucideIcon | undefined {
  return ICONOS[emoji.replace(/️/g, '')]
}

/** El círculo con el ícono de una puerta; si el emoji no tiene ícono, muestra el emoji. */
export function IconoPuerta({ emoji, className = '', size = 20 }: { emoji: string; className?: string; size?: number }) {
  const Icono = iconoDe(emoji)
  return (
    <span className={`tile-emoji ${Icono ? 'icono-puerta' : ''} ${className}`} aria-hidden="true">
      {Icono ? <Icono size={size} strokeWidth={2} /> : emoji}
    </span>
  )
}

/** El ícono de Distraer del diseño: tres cuadritos redondeados y un círculo. */
export function IconoDistraer({ size = 24, strokeWidth = 2, ...rest }: LucideProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </svg>
  )
}

/** El cuaderno de Mi diario del diseño: un cuaderno con dos renglones. */
export function IconoDiario({ size = 24, strokeWidth = 2, ...rest }: LucideProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  )
}
