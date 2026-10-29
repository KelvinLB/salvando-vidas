// Las fiestas del barrio a lo largo del año. Cada temporada pone adornos ligeros en la plaza y,
// la primera vez que le toca a la persona, deja su cosa en la casa para siempre. Ninguna se
// pierde ni se vence: si un año no entró, la siguiente vez que coincida la vuelve a encontrar.
// Cualquiera se puede ocultar desde la casa; la de Día de Muertos pregunta antes de mostrarse.

export type Season = 'posadas' | 'candelaria' | 'primavera' | 'patrias' | 'muertos' | 'lluvias'

export const SEASONS: { id: Season; label: string; when: string }[] = [
  { id: 'posadas', label: 'Las posadas', when: 'del 16 de diciembre al 6 de enero' },
  { id: 'candelaria', label: 'La Candelaria', when: 'a principios de febrero' },
  { id: 'primavera', label: 'La primavera', when: 'a finales de marzo' },
  { id: 'lluvias', label: 'Las lluvias', when: 'de mediados de junio a septiembre' },
  { id: 'patrias', label: 'Las fiestas patrias', when: 'en la primera mitad de septiembre' },
  { id: 'muertos', label: 'Día de Muertos', when: 'de finales de octubre al 3 de noviembre' },
]

export const seasonLabel = (id: string) => SEASONS.find((s) => s.id === id)?.label ?? id

/** Mes (1 a 12) y día como un número comparable: 1216 es el 16 de diciembre. */
const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate()

/** La temporada de esa fecha, o nada. Las fiestas patrias ganan a las lluvias. */
export function currentSeason(date = new Date()): Season | null {
  const n = md(date)
  if (n >= 1216 || n <= 106) return 'posadas'
  if (n >= 131 && n <= 203) return 'candelaria'
  if (n >= 319 && n <= 324) return 'primavera'
  if (n >= 901 && n <= 917) return 'patrias'
  if (n >= 1028 && n <= 1103) return 'muertos'
  if (n >= 615 && n <= 930) return 'lluvias'
  return null
}
