import type { MissionId } from '../../data/barrio'
import type { MissionFlow } from '../types'
import Agua from './Agua'
import Banca from './Banca'
import Carta from './Carta'
import Cinco from './Cinco'
import HuecoMision from './HuecoMision'
import Kiosco from './Kiosco'
import Mandado from './Mandado'
import Mercado from './Mercado'
import Taller from './Taller'

// Cada misión del barrio con su plática. La página la pone dentro del panel, debajo del mundo.
export const FLOWS: Record<MissionId, MissionFlow> = {
  mandado: Mandado,
  kiosco: Kiosco,
  cinco: Cinco,
  agua: Agua,
  mercado: Mercado,
  taller: Taller,
  banca: Banca,
  carta: Carta,
  hueco: HuecoMision,
}
