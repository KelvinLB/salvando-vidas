import { PREFIX, newId, read, write } from './storage'

// Cuando cambia la forma de lo guardado, aquí se pasa lo de antes a lo nuevo. Corre una vez al
// abrir la app, antes de dibujarla, y no hace nada si ya no hay nada viejo. Nadie pierde nada.
// (Las «Tres cosas buenas» van al diario, que vive en IndexedDB: eso se hace en db.ts.)

const drop = (key: string) => localStorage.removeItem(PREFIX + key)

export function migrate() {
  try {
    // Una sola persona de confianza → «Mis personas», que son hasta tres.
    const contact = read<{ name?: string; phone?: string } | null>('contact', null)
    if (contact) {
      const people = read<unknown[] | null>('personas', null)
      if (!people && (contact.name?.trim() || contact.phone?.trim())) {
        write('personas', [{ id: newId(), name: contact.name ?? '', phone: contact.phone ?? '' }])
      }
      drop('contact')
    }

    // El plan de seguridad era un texto por paso; ahora es una lista: cada renglón, una cosa.
    const plan = read<Record<string, unknown> | null>('plan', null)
    if (plan && Object.values(plan).some((v) => typeof v === 'string')) {
      write(
        'plan',
        Object.fromEntries(
          Object.entries(plan).map(([step, v]) => [
            step,
            typeof v === 'string' ? v.split('\n').map((line) => line.trim()).filter(Boolean) : v,
          ]),
        ),
      )
    }

    // Mi espacio ya no tiene pestañas.
    drop('mi-espacio-tab')
  } catch {
    // Sin almacenamiento (modo privado): no hay nada que pasar.
  }
}
