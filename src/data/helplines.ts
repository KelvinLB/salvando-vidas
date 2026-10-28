// Directorio de líneas de crisis. Verificado en octubre de 2026 contra
// psyred.org/lineas-de-crisis-de-salud-mental y fuentes oficiales de cada país.
// Los números cambian: revisa esta lista al menos cada 6 meses.

export type Line = {
  name: string
  number: string
  /** Lo que se marca. Por defecto, `number` sin espacios. */
  dial?: string
  hours: string
  note?: string
  whatsapp?: string
}

export type Country = {
  code: string
  name: string
  emergency: string
  lines: Line[]
}

export const VERIFIED_ON = 'octubre de 2026'

export const COUNTRIES: Country[] = [
  {
    code: 'MX',
    name: 'México',
    emergency: '911',
    lines: [
      { name: 'Línea de la Vida', number: '800 911 2000', hours: '24 horas, todos los días' },
      { name: 'SAPTEL (Cruz Roja)', number: '55 5259 8121', hours: '24 horas, todos los días' },
    ],
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    emergency: '911',
    lines: [
      {
        name: '988 Línea de Prevención del Suicidio y Crisis',
        number: '988',
        hours: '24 horas',
        note: 'Oprime 2 para español. También puedes enviar AYUDA por mensaje al 988.',
      },
    ],
  },
  {
    code: 'PR',
    name: 'Puerto Rico',
    emergency: '911',
    lines: [
      { name: 'Línea PAS (ASSMCA)', number: '1-800-981-0023', dial: '18009810023', hours: '24 horas' },
      { name: '988', number: '988', hours: '24 horas', note: 'Oprime 2 para español.' },
    ],
  },
  {
    code: 'ES',
    name: 'España',
    emergency: '112',
    lines: [
      { name: 'Línea 024, atención a la conducta suicida', number: '024', hours: '24 horas, gratuita' },
    ],
  },
  {
    code: 'AR',
    name: 'Argentina',
    emergency: '911',
    lines: [
      { name: 'Línea nacional de salud mental', number: '0800 999 0091', hours: '24 horas' },
      { name: 'Centro de Asistencia al Suicida', number: '135', hours: '8:00 a 24:00', note: 'CABA y Gran Buenos Aires.' },
      { name: 'Centro de Asistencia al Suicida (todo el país)', number: '0800 345 1435', hours: '8:00 a 24:00' },
    ],
  },
  {
    code: 'CO',
    name: 'Colombia',
    emergency: '123',
    lines: [
      { name: 'Línea 106', number: '106', hours: '24 horas', whatsapp: '573007548933' },
    ],
  },
  {
    code: 'CL',
    name: 'Chile',
    emergency: '131',
    lines: [
      { name: 'Línea de Prevención del Suicidio', number: '*4141', hours: '24 horas, gratuita' },
      { name: 'Salud Responde (opción 2)', number: '600 360 7777', hours: '24 horas' },
    ],
  },
  {
    code: 'PE',
    name: 'Perú',
    emergency: '106',
    lines: [
      { name: 'Línea 113 Salud, opción 5', number: '113', hours: '24 horas, gratuita', whatsapp: '51955557000' },
    ],
  },
  {
    code: 'EC',
    name: 'Ecuador',
    emergency: '911',
    lines: [{ name: 'Línea 171, opción 6', number: '171', hours: '7:00 a 20:00' }],
  },
  {
    code: 'UY',
    name: 'Uruguay',
    emergency: '911',
    lines: [
      { name: 'Línea Vida (desde celular)', number: '*0767', hours: '24 horas' },
      { name: 'Línea Vida (desde fijo)', number: '0800 0767', hours: '24 horas' },
    ],
  },
  {
    code: 'PY',
    name: 'Paraguay',
    emergency: '911',
    lines: [{ name: 'Línea 155 "Te Escucha"', number: '155', hours: '24 horas' }],
  },
  {
    code: 'PA',
    name: 'Panamá',
    emergency: '911',
    lines: [{ name: 'Línea 147 "Tu Vida Importa"', number: '147', hours: '24 horas', whatsapp: '50766942747' }],
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    emergency: '911',
    lines: [
      { name: 'Línea "Aquí Estoy"', number: '800 273 7869', hours: 'L–V 14:00–22:00, sáb 9:00–16:00' },
    ],
  },
  {
    code: 'SV',
    name: 'El Salvador',
    emergency: '911',
    lines: [
      { name: '"Te Escucho" (ISSS)', number: '7071 1302', hours: '24 horas' },
      { name: 'Línea 131 (Ministerio de Salud)', number: '131', hours: 'Consulta horario' },
    ],
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    emergency: '911',
    lines: [{ name: 'Línea 811 de Salud Mental', number: '811', hours: 'Horario extendido' }],
  },
  {
    code: 'VE',
    name: 'Venezuela',
    emergency: '911',
    lines: [{ name: 'LAPSI (Federación de Psicólogos)', number: '0424 290 7338', hours: 'Vie–dom 8:00 a 20:00' }],
  },
]

export const OTHER_COUNTRIES_URL = 'https://findahelpline.com/es'

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

export function guessCountry(): string {
  const region = navigator.language.split('-')[1]?.toUpperCase()
  return region && findCountry(region) ? region : 'MX'
}

export function telHref(line: Pick<Line, 'number' | 'dial'>): string {
  return `tel:${line.dial ?? line.number.replace(/\s/g, '')}`
}
