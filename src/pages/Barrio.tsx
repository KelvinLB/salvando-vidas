import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { LifeBuoy, Maximize2, Minimize2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pose, SceneHandle, View } from '../components/barrio/IsoScene'
import HousePanel from '../components/barrio/HousePanel'
import { type PlazaSpot, WORLD_FROM_HOUSE, WORLD_LINES, WORLD_START, ZONES, type ZoneId, zoneAt } from '../components/barrio/layout'
import Minimap, { type MinimapHandle, type Zone } from '../components/barrio/Minimap'
import Plaza from '../components/barrio/Plaza'
import Room from '../components/barrio/Room'
import { inventory } from '../components/barrio/unlocks'
import '../components/barrio/barrio.css'
import PageHeader from '../components/PageHeader'
import PetSays from '../components/PetSays'
import Loteria, { CardReveal } from '../barrio/Loteria'
import { FLOWS } from '../barrio/missions'
import { Says } from '../barrio/missions/parts'
import Notado from '../barrio/Notado'
import Rumbos from '../barrio/Rumbos'
import type { MissionFlow } from '../barrio/types'
import { NeighborStory } from '../barrio/Vecinos'
import { ITEMS, type ItemId, MISSIONS, type MissionId, NEIGHBORS, type NeighborId, missionById } from '../data/barrio'
import { DEFAULT_COMPANION, companionName } from '../data/companion'
import { DEFAULT_HOUSE, type House, emptyBarrio, finishMission, missionLater, readBarrio, updateBarrio, useBarrio, visit } from '../lib/barrio'
import { pickBoard } from '../lib/barrioBoard'
import { currentSeason } from '../lib/barrioSeason'
import { useCompanion } from '../lib/companion'
import { type HoleReading, readHole } from '../lib/hueco'
import { useMoments } from '../lib/moments'
import { still } from '../lib/petfx'
import { localDate, today, useAddress } from '../lib/storage'

// El barrio de su mascota: un mundo abierto para pasear (la plaza, el mercado, la alameda, su
// calle…), vecinos con misiones chiquitas basadas en técnicas que sí ayudan, y su propia casa
// para hacerla suya. La mascota es la guía: la primera vez que llegan a una zona, se la
// presenta. Nada se vence ni se pierde: «Hoy no» siempre vale y la mascota nunca se pone triste
// por eso. Con señales de riesgo, la ayuda va primero, arriba de todo, y «Necesito ayuda» se
// alcanza siempre, también en pantalla completa. Todo se queda en este teléfono.

type Act = { label: string; onClick?: () => void; to?: string; main?: boolean }

type Talk =
  | { kind: 'hello' }
  | { kind: 'pet'; text: string; acts?: Act[] }
  | { kind: 'npc'; npc: NeighborId }
  | { kind: 'story'; npc: NeighborId }
  | { kind: 'flow'; mission: MissionId }
  | { kind: 'done'; mission: MissionId }

/** Lo que dice cada vecino cuando hoy no tiene misión para la persona. */
const NPC_LINES: Record<NeighborId, (pet: string, address: ReturnType<typeof useAddress>) => string> = {
  tere: (pet) => `¡Hola, ${pet}! Hoy no te tengo encargo, pero aquí ando por si se te ofrece algo.`,
  chema: () => 'Buenas. El kiosco aquí sigue, para cuando quieras respirar un rato.',
  nico: (pet) => `¡${pet}! Estoy contando palomas. Llevo tres… o cuatro. Ya me hice bolas.`,
  lupe: (_, address) => `${address('Pásale, mija.', 'Pásale, mijo.', 'Pásale.')} Hoy hay de jamaica y de horchata, de mentiritas pero bien fresquitas.`,
  beto: () => '¡Qué tal, marchante! Hoy el mercado está tranquilo. Aquí andamos.',
  ramiro: () => 'Aquí, lija y lija. Las cosas quedan bonitas poco a poco, no de un jalón.',
  rosa: () => 'Siéntate tantito, si quieres. Desde esta banca se ve pasar la tarde.',
  memo: () => 'Hoy no traigo cartas para ti, pero el buzón sigue aquí para cuando quieras escribir una.',
  chayo: (pet) => `¡Pásale, ${pet}! Aquí ando, hilo por hilo. Los rebozos no salen de prisa, y por eso salen bonitos.`,
}

/** Lo que dice la mascota al tocar las cosas de la plaza. */
const SPOT_LINES: Partial<Record<PlazaSpot, string>> = {
  gato: 'Shhh, está dormido. Se ve tan a gusto…',
  paloma: 'Hola, palomita. ¿Tú también das la vuelta?',
  globo: 'Un globo rojo. Se mueve con el aire, sin prisa.',
  florA: 'Flores de cempasúchil. Qué naranja tan bonito.',
  florB: 'Flores de cempasúchil junto a tu casa. Huelen rico.',
  farolA: 'Este farol se prende solito cuando oscurece.',
  farolB: 'Este farol se prende solito cuando oscurece.',
}

/** Lo que dice la mascota la primera vez que llegan a cada zona: una línea, como guía. */
const ZONE_HELLO: Record<ZoneId, string> = {
  plaza: 'Esta es la plaza, el corazón del barrio. Aquí siempre hay alguien con quien platicar.',
  mercado: '¡El mercado! Cuántos colores. Aquí se viene a comprar sin prisa y a saludar.',
  oficios: 'La calle de los oficios: aquí las cosas se arreglan poco a poco, como todo.',
  alameda: 'La alameda. Árboles, sombrita y bancas para sentarse tantito.',
  micalle: 'Tu calle. Aquí está tu casa, para cuando quieras entrar, y la casita de los juegos.',
  orilla: 'La orilla. Allá lejos está el faro, prendido para quien vaya buscando el camino.',
  milpa: 'La milpa: maíz, frijol y calabaza, creciendo a su ritmo. Como tú.',
}

/** Lo que se acerca o se aleja el mundo según el ancho: en el teléfono, un poco más lejos. */
const zoomFor = (width: number) => Math.min(1, Math.max(0.75, width / 520))

const POSES: { id: Pose; label: string; says: string }[] = [
  { id: 'hop', label: 'Saludar', says: 'Hola. Qué gusto andar por aquí contigo.' },
  { id: 'dance', label: 'Bailar', says: 'Un bailecito suave, nomás porque sí.' },
  { id: 'sit', label: 'Sentarse', says: 'Me siento tantito. Aquí no hay prisa.' },
  { id: 'breathe', label: 'Respirar', says: 'Inflo la pancita… y la suelto despacio. ¿Me acompañas?' },
]

const neighborName = (id: string) => NEIGHBORS.find((n) => n.id === id)?.name
const missionOf = (npc: NeighborId) => MISSIONS.find((m) => m.npc === npc)
const flowOf = (id: MissionId): MissionFlow | undefined => (FLOWS as Partial<Record<MissionId, MissionFlow>>)[id]

export default function Barrio() {
  const { companion, mood } = useCompanion()
  const look = companion ?? DEFAULT_COMPANION
  const name = companionName(look)
  const { barrio: saved, patch } = useBarrio()
  // Lo guardado por una versión anterior puede venir sin algún campo: se completa con lo de siempre.
  const barrio = useMemo(() => ({ ...emptyBarrio(), ...saved, house: { ...DEFAULT_HOUSE, ...saved.house } }), [saved])
  const { got } = useMoments()
  const address = useAddress()

  const [reading, setReading] = useState<HoleReading | null>(null)
  const [scene, setScene] = useState<'plaza' | 'casa'>('plaza')
  const [start, setStart] = useState<[number, number]>(WORLD_START)
  const [talk, setTalk] = useState<Talk>({ kind: 'hello' })
  const [glow, setGlow] = useState(0)
  const [picking, setPicking] = useState<ItemId | null>(null)
  const [reveal, setReveal] = useState<MissionId | null>(null)
  const [rumbos, setRumbos] = useState(false)
  const [album, setAlbum] = useState(false)
  const [away, setAway] = useState(0)
  const world = useRef<SceneHandle>(null)
  const worldCard = useRef<HTMLElement>(null)
  const talkBox = useRef<HTMLDivElement>(null)
  const below = useRef<HTMLDivElement>(null)
  const visited = useRef(false)
  const map = useRef<MinimapHandle>(null)
  const viewBox = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const fullBtn = useRef<HTMLButtonElement>(null)
  const [full, setFull] = useState(false)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const [cover, setCover] = useState(0)
  const [zone, setZone] = useState<ZoneId | null>(null)
  const [banner, setBanner] = useState<{ zone: Zone; n: number } | null>(null)
  /** El primer paso al llegar al mundo (al abrir o al salir de la casa) no interrumpe la plática. */
  const quiet = useRef(true)
  const here = useRef<ZoneId | null>(null)
  const talkNow = useRef<Talk['kind']>('hello')

  useEffect(() => {
    let live = true
    void readHole(name, mood).then((r) => live && setReading(r))
    return () => {
      live = false
    }
  }, [name, mood])

  // Una visita por entrada. Si pasaron días, la mascota solo se alegra: nunca «te perdiste».
  // La temporada de hoy deja su adorno en la casa; la ofrenda espera a que diga que sí.
  useEffect(() => {
    if (visited.current) return
    visited.current = true
    setAway(visit())
    const season = currentSeason()
    if (season && season !== 'muertos')
      updateBarrio((b) => (b.seasonsSeen.includes(season) ? {} : { seasonsSeen: [...b.seasonsSeen, season] }))
  }, [])

  // El tamaño del mundo en pantalla: la cámara ve tanto como cabe, un poco más lejos en el teléfono.
  useEffect(() => {
    const el = viewBox.current
    if (!el || scene !== 'plaza') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBox((b) => (b && Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [scene])

  // En pantalla completa, la plática va encima del mundo: lo que tapa, la cámara lo evita.
  useEffect(() => {
    const el = sheet.current
    if (!el || !full) return setCover(0)
    const observer = new ResizeObserver(() => setCover(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [full])

  // Pantalla completa: sin mover la página de atrás, Escape sale y el foco no se escapa.
  useEffect(() => {
    if (!full) return
    const root = document.documentElement
    const was = [root.style.overflow, document.body.style.overflow]
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    fullBtn.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') return setFull(false)
      if (e.key !== 'Tab' || !worldCard.current) return
      const all = [...worldCard.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => el.getClientRects().length > 0,
      )
      if (!all.length) return
      const first = all[0]
      const last = all[all.length - 1]
      const inside = worldCard.current.contains(document.activeElement)
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = was[0]
      document.body.style.overflow = was[1]
      document.removeEventListener('keydown', onKey)
    }
  }, [full])

  // El letrero de la zona se va solo, despacito.
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 3200)
    return () => clearTimeout(t)
  }, [banner])

  const view = useMemo<View | undefined>(() => {
    if (!box) return undefined
    const k = zoomFor(box.w)
    return { width: Math.round(box.w / k), height: Math.round(box.h / k), cover: Math.round((full ? cover : 0) / k) }
  }, [box, full, cover])

  const season = currentSeason()
  const askOfrenda = season === 'muertos' && !barrio.seasonsSeen.includes('muertos') && !barrio.hiddenSeasons.includes('muertos')
  const shownSeason = season && !barrio.hiddenSeasons.includes(season) && barrio.seasonsSeen.includes(season) ? season : null

  const hour = new Date().getHours()
  const board = useMemo(() => {
    const b = pickBoard(barrio, { reading, hour })
    return { missions: b.missions.slice(0, 3), why: b.why }
  }, [barrio, reading, hour])
  const stock = useMemo(() => inventory(barrio, got), [barrio, got])

  const risk = !!reading?.risk
  const heavy = !!reading?.heavy
  const pet = { look, mood, name }
  const house = barrio.house

  const doneToday = (id: MissionId) =>
    barrio.events.some((e) => e.kind === 'mision' && e.mission === id && e.result === 'hecha' && localDate(new Date(e.at)) === today())

  const show = (ref: { current: HTMLElement | null }) =>
    requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' }))

  const say = (text: string, acts?: Act[]) => setTalk({ kind: 'pet', text, acts })
  talkNow.current = talk.kind

  // Cada paso de la mascota: el puntito del mapa y, al cambiar de zona, su letrero. La primera
  // vez que llegan a una zona, se guarda y la mascota la presenta (salvo a media misión).
  const onStep = (r: number, c: number) => {
    map.current?.setPet(r, c)
    const id = zoneAt(r, c)
    const silent = quiet.current
    quiet.current = false
    if (!id || id === here.current) return
    here.current = id
    setZone(id)
    const z = ZONES.find((zz) => zz.id === id)
    if (z) setBanner((b) => ({ zone: z, n: (b?.n ?? 0) + 1 }))
    if (readBarrio().zonesSeen.includes(id)) return
    updateBarrio((b) => (b.zonesSeen.includes(id) ? {} : { zonesSeen: [...b.zonesSeen, id] }))
    if (!silent && talkNow.current !== 'flow') say(ZONE_HELLO[id])
  }

  const goZone = (z: Zone) => {
    setReveal(null)
    world.current?.goToTile(z.door[0], z.door[1])
  }

  const openMission = (id: MissionId) => {
    setReveal(null)
    setTalk({ kind: 'flow', mission: id })
    show(talkBox)
  }

  const onNeighbor = (npc: NeighborId) => {
    const m = missionOf(npc)
    if (m && board.missions.includes(m.id)) return openMission(m.id)
    setReveal(null)
    setTalk({ kind: 'npc', npc })
  }

  const enterHouse = () => {
    setFull(false)
    setScene('casa')
    setTalk({ kind: 'pet', text: `${address('¡Bienvenida a tu casa!', '¡Bienvenido a tu casa!', '¡Te damos la bienvenida a tu casa!')} Abajo puedes cambiarle el nombre, los colores y lo que hay en tu cuarto.` })
  }

  const onSpot = (spot: PlazaSpot) => {
    setReveal(null)
    if (spot === 'casa') return enterHouse()
    if (spot === 'hueco') return openMission('hueco')
    if (spot === 'juegos')
      return say('Aquí están los juegos tranquilos: memorama, burbujas, la pizarra y más. Para cuando la cabeza necesite algo chiquito.', [
        { label: 'Ir a los juegos', to: '/distraer', main: true },
      ])
    if (spot === 'rumbos') {
      setRumbos(true)
      say('Cada calle va hacia algo que te importa. Si eliges por dónde caminar, el tablero sigue ese rumbo.')
      return show(below)
    }
    if (spot === 'tablero')
      return board.missions.length
        ? say(`Hoy hay ${board.missions.length === 1 ? 'una cosita' : `${board.missions.length} cositas`} en el tablero. Ninguna se vence: si hoy no, se queda para otro día.`, board.missions.map((id) => ({ label: missionById(id).title, onClick: () => goMission(id) })))
        : say('Hoy el tablero está tranquilo. Podemos nomás pasear.')
    const line = SPOT_LINES[spot] ?? WORLD_LINES[spot]
    if (line) say(line)
  }

  // Desde el tablero: la mascota camina hasta quien la ofrece y empieza la plática.
  const goMission = (id: MissionId) => {
    const npc = missionById(id).npc
    if (scene !== 'plaza') return openMission(id)
    world.current?.goTo(npc === 'lumi' ? 'hueco' : npc)
    show(viewBox)
  }

  const flowDone = (id: MissionId) => {
    finishMission(id)
    setReveal(id)
    setTalk({ kind: 'done', mission: id })
  }
  const flowLater = (id: MissionId) => {
    missionLater(id)
    say('No pasa nada, se queda aquí para otro día. Aquí nada se vence, y yo sigo contigo.')
  }
  const flowClose = () => say('Aquí andamos. Cuando quieras, seguimos.')

  const gesture = (p: (typeof POSES)[number]) => {
    world.current?.pose(p.id)
    if (talk.kind !== 'flow') say(p.says)
  }

  const setHouse = (next: Partial<House>) => patch((b) => ({ house: { ...b.house, ...next } }))

  const onSeason = (id: string, showIt: boolean) =>
    patch((b) => ({
      hiddenSeasons: showIt ? b.hiddenSeasons.filter((s) => s !== id) : [...new Set([...b.hiddenSeasons, id])],
      seasonsSeen: showIt && id === season && !b.seasonsSeen.includes(id) ? [...b.seasonsSeen, id] : b.seasonsSeen,
    }))

  const pick = (item: ItemId | null) => {
    setPicking(item)
    if (item) {
      say('¿Dónde lo ponemos? Toca el piso de tu cuarto.')
      show(viewBox)
    }
  }

  const talking: NeighborId | 'lumi' | null =
    talk.kind === 'flow' ? (missionById(talk.mission).npc as NeighborId | 'lumi') : talk.kind === 'npc' || talk.kind === 'story' ? talk.npc : null

  const lit = talk.kind === 'flow' && talk.mission === 'kiosco' ? glow : barrio.done.kiosco ? 1 : glow

  const hello = () => {
    if (away >= 3) return '¡Qué gusto verte! Todo sigue como lo dejaste. ¿Damos una vuelta?'
    const greet = hour < 12 && hour >= 5 ? 'Buenos días.' : hour < 19 && hour >= 12 ? 'Buenas tardes.' : 'Buenas noches.'
    const late = hour >= 22 || hour < 5 ? ' Ya es tarde: si quieres, nomás nos sentamos tantito.' : ''
    return `${greet} ¿Damos una vuelta? Toca el piso para caminar o a un vecino para platicar; arrastra para mirar alrededor. El mapa de la esquina nos lleva a cualquier parte.${late}`
  }

  const actions = (acts?: Act[]) =>
    acts?.length ? (
      <div className="row b-acts">
        {acts.map((a) =>
          a.to ? (
            <Link key={a.label} to={a.to} className={`btn small${a.main ? '' : ' ghost'}`}>
              {a.label}
            </Link>
          ) : (
            <button key={a.label} type="button" className={`btn small${a.main ? '' : ' ghost'}`} onClick={a.onClick}>
              {a.label}
            </button>
          ),
        )}
      </div>
    ) : null

  const talkPanel = () => {
    if (talk.kind === 'flow') {
      const Flow = flowOf(talk.mission)
      const m = missionById(talk.mission)
      if (!Flow)
        return (
          <PetSays compact mood={mood}>
            <p>«{m.title}» todavía se está preparando. Pronto la podremos hacer aquí.</p>
            {actions([{ label: 'Va', onClick: flowClose }])}
          </PetSays>
        )
      return (
        <Flow
          key={talk.mission}
          petName={name}
          heavy={heavy}
          onDone={() => flowDone(talk.mission)}
          onLater={() => flowLater(talk.mission)}
          onClose={flowClose}
          onGlow={setGlow}
        />
      )
    }
    if (talk.kind === 'npc') {
      const m = missionOf(talk.npc)
      return (
        <>
          <Says who={talk.npc}>
            <p>{NPC_LINES[talk.npc](name, address)}</p>
          </Says>
          {actions([
            ...(m ? [{ label: barrio.done[m.id] ? `Hacer «${m.title}» otra vez` : 'Hacerla de todos modos', onClick: () => openMission(m.id) }] : []),
            { label: '¿Cómo te ha ido?', onClick: () => setTalk({ kind: 'story', npc: talk.npc }) },
          ])}
        </>
      )
    }
    if (talk.kind === 'story')
      return (
        <>
          <NeighborStory npc={talk.npc} />
          {actions([{ label: 'Seguir paseando', onClick: () => say('¿A dónde vamos ahora?') }])}
        </>
      )
    if (talk.kind === 'done') {
      const reward = ITEMS.find((i) => i.id === missionById(talk.mission).reward)
      return (
        <PetSays compact mood="feliz">
          <p>¡Lo hicimos!{reward ? ` Para tu casa: ${reward.label.toLowerCase()}.` : ''}</p>
          {reward && scene === 'plaza' && actions([{ label: 'Ir a verlo', onClick: () => world.current?.goTo('casa') }])}
        </PetSays>
      )
    }
    const text = talk.kind === 'pet' ? talk.text : hello()
    return (
      <PetSays compact mood={talk.kind === 'hello' && away >= 3 ? 'feliz' : mood}>
        <p>{text}</p>
        {talk.kind === 'pet' && actions(talk.acts)}
      </PetSays>
    )
  }

  const extras = (
    <>
      {reveal && <CardReveal mission={reveal} onClose={() => setReveal(null)} />}
      {rumbos && <Rumbos onClose={() => setRumbos(false)} />}
    </>
  )

  return (
    <div className="stack barrio">
      <PageHeader title="El barrio" subtitle={`${name} y tú, de paseo por el barrio. Aquí nada se vence ni se pierde.`} />

      {/* Con señales de riesgo, la ayuda va antes que el paseo. */}
      {risk && (
        <section className="callout warm b-help" aria-label="Primero, la ayuda">
          <p>Antes de pasear: si ahorita sientes que no puedes con esto, hay alguien que puede escucharte en este momento.</p>
          <div className="row">
            <Link to="/ayuda" className="btn danger">
              Hablar con alguien ahora
            </Link>
            <Link to="/mi-espacio/plan" className="btn small ghost">
              Ver mi plan para días difíciles
            </Link>
          </div>
          <p className="muted small">El barrio sigue aquí, sin prisa, para cuando quieras.</p>
        </section>
      )}

      {askOfrenda && (
        <section className="card b-ask" aria-label="Temporada de ofrendas">
          <p>Es temporada de ofrendas. En la plaza hay papel picado y caminitos de cempasúchil. ¿Quieres verla en la plaza?</p>
          <div className="row">
            <button type="button" className="btn small" onClick={() => patch((b) => ({ seasonsSeen: [...b.seasonsSeen, 'muertos'] }))}>
              Sí
            </button>
            <button type="button" className="btn small ghost" onClick={() => patch((b) => ({ hiddenSeasons: [...b.hiddenSeasons, 'muertos'] }))}>
              Prefiero no
            </button>
          </div>
          <p className="muted small">Lo puedes cambiar cuando quieras desde tu casa.</p>
        </section>
      )}

      <section
        className={`card b-world${full ? ' full' : ''}`}
        ref={worldCard}
        aria-label={scene === 'plaza' ? 'El barrio' : `Tu casa, ${house.name.trim() || 'Mi casita'}`}
        {...(full ? { role: 'dialog', 'aria-modal': true } : {})}
      >
        <div className="b-top">
          <span className="b-place">{scene === 'plaza' ? (ZONES.find((z) => z.id === zone)?.name ?? 'El barrio') : house.name.trim() || 'Mi casita'}</span>
          <div className="b-top-acts">
            {/* En pantalla completa la barra de la app queda tapada: la ayuda viene aquí también. */}
            {full && (
              <Link to="/ayuda" className="sos b-sos">
                <LifeBuoy size={18} strokeWidth={2} aria-hidden="true" />
                Necesito ayuda
              </Link>
            )}
            {scene === 'plaza' && (
              <button
                ref={fullBtn}
                type="button"
                className="btn small ghost b-full-btn"
                aria-label={full ? 'Salir de pantalla completa' : 'Pantalla completa'}
                onClick={() => setFull(!full)}
              >
                {full ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
                <span>{full ? 'Salir' : 'Pantalla completa'}</span>
              </button>
            )}
            {scene === 'casa' && (
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  quiet.current = true
                  setScene('plaza')
                  setStart(WORLD_FROM_HOUSE)
                  setPicking(null)
                  say('De vuelta en la calle. ¿A dónde vamos?')
                }}
              >
                Salir a la calle
              </button>
            )}
          </div>
        </div>

        <div
          ref={viewBox}
          className={scene === 'plaza' ? 'b-view' : 'b-view room'}
          style={full ? ({ '--b-cover': `${cover}px` } as CSSProperties) : undefined}
        >
          {scene === 'plaza' ? (
            <>
              <Plaza
                key="plaza"
                ref={world}
                house={house}
                values={barrio.values.length}
                board={board.missions}
                talking={talking}
                glow={lit}
                season={shownSeason}
                pet={pet}
                start={start}
                view={view}
                onStep={onStep}
                onNeighbor={onNeighbor}
                onSpot={onSpot}
              />
              {banner && (
                <div key={banner.n} className="b-banner" role="status">
                  <strong>{banner.zone.name}</strong>
                  <span>{banner.zone.hint}</span>
                </div>
              )}
              <Minimap ref={map} seen={barrio.zonesSeen} petName={name} onGo={goZone} />
            </>
          ) : (
            <Room
              key="casa"
              ref={world}
              house={house}
              picking={picking}
              owned={stock.owned}
              pet={pet}
              onPlace={(item, at) => {
                setHouse({ placed: { ...house.placed, [item]: at } })
                setPicking(null)
                say('¡Quedó bonito ahí!')
              }}
              onNoRoom={() => say('Ahí no cabe, o me taparía el paso. Prueba en otro cuadrito.')}
              onPutAway={(item) => {
                const placed = { ...house.placed }
                delete placed[item]
                setHouse({ placed })
                say('Lo guardé. Ponlo donde quieras.')
              }}
            />
          )}
        </div>

        <div className="b-sheet" ref={sheet}>
          <div className="b-gestures" role="group" aria-label={`Lo que puede hacer ${name}`}>
            {POSES.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => gesture(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="b-talk" ref={talkBox} aria-live={talk.kind === 'flow' ? undefined : 'polite'}>
            {talkPanel()}
          </div>

          {/* En pantalla completa, la estampita y los rumbos salen aquí mismo, sobre el mundo. */}
          {full && (reveal || rumbos) && (
            <div ref={below} className="stack b-extras">
              {extras}
            </div>
          )}
        </div>
      </section>

      <p className="muted small b-note">Los vecinos son personajes escritos para el barrio: no son personas reales ni un chat.</p>

      {!full && (
        <div ref={below} className="stack">
          {extras}
        </div>
      )}

      {scene === 'casa' ? (
        <HousePanel
          house={house}
          onHouse={setHouse}
          stock={stock}
          picking={picking}
          onPick={pick}
          hidden={barrio.hiddenSeasons}
          onSeason={onSeason}
          petName={name}
          hasPet={!!companion}
        />
      ) : (
        <section className="card b-board" aria-labelledby="b-board-title">
          <h2 id="b-board-title">Hoy en el tablero</h2>
          {board.missions.length ? (
            <ul className="b-missions">
              {board.missions.map((id) => {
                const m = missionById(id)
                const who = m.npc === 'lumi' ? name : neighborName(m.npc)
                const status = doneToday(id) ? 'Hoy ya la hiciste' : barrio.later[id] ? 'La dejaste para otro día, y sigue aquí' : `Con ${who}`
                return (
                  <li key={id}>
                    <span>
                      <strong>{m.title}</strong>
                      <small>{status}</small>
                    </span>
                    <button type="button" className="btn small ghost" onClick={() => goMission(id)} aria-label={`Ir: ${m.title}, con ${who}`}>
                      {doneToday(id) ? 'Otra vez' : 'Ir'}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">Hoy el tablero está tranquilo. Pueden nomás pasear.</p>
          )}
          <p className="muted small">Ninguna se vence. «Hoy no» siempre vale, y lo que haces se queda.</p>
          <details className="b-why">
            <summary>¿Por qué estas?</summary>
            <ul>
              {board.why.length ? board.why.map((w) => <li key={w}>{w}</li>) : <li>Son cositas chiquitas para empezar. Con lo que vayas haciendo, el tablero se acomoda a ti.</li>}
            </ul>
            <p className="muted small">Todo se lee aquí, en tu teléfono. Nada sale de él.</p>
          </details>
        </section>
      )}

      <Notado petName={name} />

      <div className="row">
        <button type="button" className="btn ghost" aria-expanded={album} onClick={() => setAlbum(!album)}>
          {album ? 'Cerrar mi lotería' : 'Ver mi lotería de dichos'}
        </button>
      </div>
      {album && <Loteria />}
    </div>
  )
}

