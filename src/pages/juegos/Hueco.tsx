import { useEffect, useRef, useState } from 'react'
import { ChevronDown, HandHelping, Heart, type LucideIcon, Split, Star, Tag, Users, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'
import FaroScene from '../../components/FaroScene'
import FarolesScene from '../../components/FarolesScene'
import HoleScene from '../../components/HoleScene'
import PageHeader from '../../components/PageHeader'
import PetSays from '../../components/PetSays'
import { type CompanionMood, DEFAULT_COMPANION, companionName } from '../../data/companion'
import {
  BREATHS,
  HEAVY_HINT,
  type HoleState,
  JAR_MINE,
  JAR_NOT_MINE,
  MISS_YOU,
  NAME_ASK,
  OWN_WORRY,
  PLACE,
  PLACES,
  REMEMBER,
  REMEMBER_ASK,
  SCENES,
  STEP_ORDER,
  type SceneId,
  type Step,
  WORRIES,
  WORRY_ASK,
  jarAsk,
  namedSays,
  rememberSays,
  sortedSays,
} from '../../data/hueco'
import { PLAN_STEPS } from '../../data/plan'
import { useCompanion } from '../../lib/companion'
import { type Climb, EXITS_KEY, type HoleExit, type HoleReading, readHole, useClimb } from '../../lib/hueco'
import { markMoment, useMoments } from '../../lib/moments'
import { firstName, usePeople, whatsappOf } from '../../lib/people'
import { usePlan } from '../../lib/plan'
import { type JournalEntry, pick, read, store, today, useStored } from '../../lib/storage'

// Salir del hueco: su mascota está en un lugar que se parece a lo que trae hoy (el hueco, la
// niebla del faro o la calle de los faroles), y salen adelante un paso a la vez. No hay vidas,
// reloj, puntos ni rachas: nada se pierde ni se cae, y lo que construye se queda aunque salga de
// la pantalla. Cada paso puede volverse algo de verdad (escribirle a alguien, seguir respirando
// en Calma, abrir su plan), siempre si la persona quiere. Con señales de riesgo, la ayuda va
// primero.

const ICONS: Record<SceneId, Record<Step, LucideIcon>> = {
  hueco: { respirar: Wind, nombrar: Tag, razon: Star, mano: HandHelping },
  faro: { respirar: Wind, nombrar: Split, razon: Star, mano: HandHelping },
  faroles: { respirar: Wind, nombrar: Heart, razon: Star, mano: Users },
}

type Breath = { phase: 'in' | 'out'; count: number; round: number }

export default function Hueco() {
  const { companion, mood } = useCompanion()
  const look = companion ?? DEFAULT_COMPANION
  const name = companionName(look)
  const [climb, update] = useClimb()
  const [reading, setReading] = useState<HoleReading | null>(null)
  const [reasons] = useStored<JournalEntry[]>('razones', [])
  const { people, reachable, message, country } = usePeople()
  const { has: planHas } = usePlan()
  const { got } = useMoments()
  const [picking, setPicking] = useState(false)
  // El segundo paso abre su elección: lo que siente, un «¿y si…?» o de quién se acuerda.
  const [choosing, setChoosing] = useState(false)
  const [worry, setWorry] = useState<string | null>(null)
  const [last, setLast] = useState<Step | null>(null)
  const [breath, setBreath] = useState<Breath | null>(null)
  const [fresh, setFresh] = useState<number | null>(null)
  const [firstOut, setFirstOut] = useState(false)
  // Si vuelve a media subida, la mascota le recuerda que lo que hizo sigue ahí.
  const resumed = useRef(climb.built.length > 0 && !climb.out)

  useEffect(() => {
    let live = true
    void readHole(name, mood).then((r) => live && setReading(r))
    return () => {
      live = false
    }
  }, [name, mood])

  const auto = reading?.state ?? null
  const state: HoleState = climb.state ?? auto ?? 'animo'
  const place = PLACE[state]
  const scene = SCENES[place.scene]
  const n = climb.built.length
  const out = !!climb.out
  const risk = !!reading?.risk
  const heavy = !!reading?.heavy
  const breaths = heavy ? BREATHS.heavy : BREATHS.light
  const face: CompanionMood = out ? 'feliz' : breath || n >= 2 ? 'calma' : place.mood
  const reason = reasons.find((r) => r.id === climb.reason)

  // Quien baja la cuerda: de preferencia alguien a quien se le puede escribir.
  const helper = reachable.find((p) => p.name.trim()) ?? reachable[0] ?? people.find((p) => p.name.trim())
  const helperName = helper?.name.trim() ? firstName(helper) : null
  const planned = PLAN_STEPS.some((s) => s.key !== 'personas' && planHas(s.key))

  // Lo que va en el segundo paso de cada lugar.
  const sorted = climb.sorted ?? []
  const lastSorted = sorted.at(-1)
  const worriesLeft = WORRIES.filter((w) => !sorted.some((s) => s.worry === w))
  const rememberedPerson = people.find((p) => climb.remembered === `persona:${p.id}`)
  const rememberedOption = REMEMBER.find((r) => r.id === climb.remembered)
  const rememberedTag = rememberedPerson ? firstName(rememberedPerson) : (rememberedOption?.tag ?? (climb.remembered ? 'alguien' : undefined))

  const build = (step: Step, patch: Partial<Climb> = {}) => {
    update({ ...patch, built: [...climb.built, step] })
    setLast(step)
    setChoosing(false)
    setWorry(null)
    setFresh(climb.built.length)
    resumed.current = false
  }

  // En el faro, cada «¿y si…?» va al frasco que la persona elige. El primero ya es un tramo; los
  // demás, si quiere acomodar más, solo llenan los frascos.
  const sort = (mine: boolean) => {
    if (!worry) return
    const next = [...sorted, { worry, mine }]
    if (!climb.built.includes('nombrar')) return build('nombrar', { sorted: next })
    update({ sorted: next })
    setLast('nombrar')
    setChoosing(false)
    setWorry(null)
  }

  // Con los cuatro pasos, llegan. Si la persona se va justo antes, llegan al volver. Lo que
  // ofrecía el último paso se queda a la mano: si pidió una mano, todavía puede escribirle.
  useEffect(() => {
    if (n < 4 || out) return
    const timer = setTimeout(() => {
      const moment = PLACE[state].scene
      setFirstOut(!got[moment])
      store(EXITS_KEY, [...read<HoleExit[]>(EXITS_KEY, []), { date: today(), state }].slice(-60))
      markMoment(moment)
      update({ out: true })
    }, 1400)
    return () => clearTimeout(timer)
  }, [n, out])

  // Respirar: 4 segundos para tomar aire y 6 para soltarlo, una vez o tres según el día.
  useEffect(() => {
    if (!breath) return
    const timer = setTimeout(() => {
      if (breath.count > 1) return setBreath({ ...breath, count: breath.count - 1 })
      if (breath.phase === 'in') return setBreath({ ...breath, phase: 'out', count: 6 })
      if (breath.round < breaths) return setBreath({ phase: 'in', count: 4, round: breath.round + 1 })
      setBreath(null)
      build('respirar')
    }, 1000)
    return () => clearTimeout(timer)
  }, [breath])

  const act = (step: Step) => {
    if (out || breath || climb.built.includes(step)) return
    setLast(null)
    setWorry(null)
    if (step === 'respirar') {
      setChoosing(false)
      setBreath({ phase: 'in', count: 4, round: 1 })
    } else if (step === 'nombrar') {
      setChoosing(true)
    } else if (step === 'razon') {
      build('razon', { reason: reasons.length ? pick(reasons).id : undefined })
    } else {
      build('mano')
    }
  }

  // Respirar una vez ya cuenta: puede terminar cuando quiera.
  const enough = () => {
    setBreath(null)
    build('respirar')
  }

  const choose = (next: HoleState) => {
    update({ state: next === auto ? undefined : next })
    setPicking(false)
    setChoosing(false)
    setWorry(null)
    setLast(null)
    setFresh(null)
    resumed.current = n > 0
  }

  const again = () => {
    update({ built: [], named: undefined, sorted: undefined, remembered: undefined, reason: undefined, out: false })
    setLast(null)
    setFresh(null)
    setFirstOut(false)
    resumed.current = false
  }

  const ask =
    place.scene === 'faro' ? (worry ? jarAsk(worry) : WORRY_ASK) : place.scene === 'faroles' ? REMEMBER_ASK : NAME_ASK
  const secondSays =
    place.scene === 'faro'
      ? sortedSays(!!lastSorted?.mine)
      : place.scene === 'faroles'
        ? rememberedPerson
          ? rememberSays(firstName(rememberedPerson))
          : (rememberedOption?.says ?? rememberSays('esa persona'))
        : namedSays(climb.named ?? '')
  const says = breath
    ? breath.phase === 'in'
      ? `Toma aire… ${breath.count}`
      : `Suéltalo despacio… ${breath.count}`
    : out
      ? scene.outSays
      : choosing
        ? ask
        : last === 'respirar'
          ? scene.afterBreath(place.weather)
          : last === 'nombrar'
            ? secondSays
            : last === 'razon'
              ? scene.reasonSays(!!reason)
              : last === 'mano'
                ? scene.handSays(helperName ?? 'Alguien de confianza')
                : risk
                  ? scene.riskHello
                  : resumed.current
                    ? scene.stillHere(n)
                    : place.hello
  const idle = !breath && !out && !choosing && !last && !resumed.current

  const common = { look, name, place, built: climb.built, out, rope: risk, breath: breath?.phase ?? null, face, fresh }

  return (
    <div className="stack">
      <PageHeader title="Salir del hueco" subtitle={`${name} y tú, un paso a la vez. Aquí nada se pierde ni se cae.`} />

      {!reading ? (
        <div className="card hole-card" aria-busy="true">
          <div className="hole-wait" />
        </div>
      ) : (
        <section className="card hole-card" aria-label={`Salir del hueco con ${name}`}>
          {/* Con señales de riesgo, la ayuda va antes que el juego. */}
          {risk && !out && (
            <div className="callout warm hole-help">
              <p>Si ahorita sientes que no puedes con esto, hay alguien que puede escucharte en este momento.</p>
              <Link to="/ayuda" className="btn danger">
                Hablar con alguien ahora
              </Link>
            </div>
          )}

          <div className="hole-today">
            <span id="hole-q">¿Así te sientes hoy?</span>
            <button
              type="button"
              className="chip hole-place"
              aria-expanded={picking}
              aria-controls="hole-places"
              onClick={() => setPicking(!picking)}
            >
              <span className={`hole-dot ${state}`} aria-hidden="true" />
              {place.label}
              <span className="visually-hidden">. Cambiar</span>
              <ChevronDown className="hole-chevron" size={16} aria-hidden="true" />
            </button>
          </div>
          {picking && (
            <div className="chips hole-places" id="hole-places" role="radiogroup" aria-labelledby="hole-q">
              {PLACES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === state}
                  className={`chip${p.id === state ? ' selected' : ''}`}
                  onClick={() => choose(p.id)}
                >
                  <span className={`hole-dot ${p.id}`} aria-hidden="true" />
                  {p.label}
                  {p.id === auto && <small className="hole-auto">según tus registros</small>}
                </button>
              ))}
            </div>
          )}

          {/* Si el segundo paso lo hizo en otro lugar, su letrero dice lo que hizo allá */}
          {place.scene === 'faro' ? (
            <FaroScene {...common} sorted={sorted} />
          ) : place.scene === 'faroles' ? (
            <FarolesScene {...common} remembered={rememberedTag ?? climb.named?.toLowerCase() ?? (sorted.length ? 'acomodaste' : undefined)} />
          ) : (
            <HoleScene {...common} named={climb.named ?? (sorted.length ? 'acomodaste' : climb.remembered ? 'te acordaste' : undefined)} />
          )}

          <PetSays mood={face} compact>
            <p aria-live="polite">{says}</p>
            {breath && (
              <div className="row hole-breath">
                {breaths > 1 && (
                  <span className="muted small">
                    Respiración {breath.round} de {breaths}
                  </span>
                )}
                <button type="button" className="btn small ghost" onClick={enough}>
                  Ya, con esto
                </button>
              </div>
            )}

            {/* El segundo paso: lo que siente, un «¿y si…?» o de quién se acuerda */}
            {choosing && place.scene === 'hueco' && (
              <div className="chips hole-feelings">
                {(place.feelings ?? []).map((f) => (
                  <button key={f} type="button" className="chip" onClick={() => build('nombrar', { named: f })}>
                    {f}
                  </button>
                ))}
              </div>
            )}
            {choosing && place.scene === 'faro' && !worry && (
              <div className="chips hole-feelings">
                {[...worriesLeft, OWN_WORRY].map((w) => (
                  <button key={w} type="button" className="chip" onClick={() => setWorry(w)}>
                    {w}
                  </button>
                ))}
              </div>
            )}
            {choosing && place.scene === 'faro' && worry && (
              <div className="row hole-jars">
                <button type="button" className="btn small" onClick={() => sort(true)}>
                  {JAR_MINE}
                </button>
                <button type="button" className="btn small ghost" onClick={() => sort(false)}>
                  {JAR_NOT_MINE}
                </button>
              </div>
            )}
            {choosing && place.scene === 'faroles' && (
              <div className="chips hole-feelings">
                {people
                  .filter((p) => p.name.trim())
                  .map((p) => (
                    <button key={p.id} type="button" className="chip" onClick={() => build('nombrar', { remembered: `persona:${p.id}` })}>
                      {firstName(p)}
                    </button>
                  ))}
                {REMEMBER.map((r) => (
                  <button key={r.id} type="button" className="chip" onClick={() => build('nombrar', { remembered: r.id })}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Cada paso puede volverse algo de verdad, si la persona quiere */}
            {last === 'respirar' && (
              <Link to="/calma" className="btn small ghost">
                Seguir respirando en Calma
              </Link>
            )}
            {last === 'nombrar' && place.scene === 'faro' && (lastSorted?.mine || (worriesLeft.length > 0 && !out)) && (
              <div className="row hole-more">
                {lastSorted?.mine && (
                  <Link to="/mi-dia" className="btn small ghost">
                    Anotar un pasito en Mi día
                  </Link>
                )}
                {worriesLeft.length > 0 && !out && (
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => {
                      setChoosing(true)
                      setWorry(null)
                    }}
                  >
                    Acomodar otro
                  </button>
                )}
              </div>
            )}
            {last === 'nombrar' && rememberedPerson && reachable.includes(rememberedPerson) && (
              <>
                <a className="btn small" href={whatsappOf(rememberedPerson.phone, country, MISS_YOU)} target="_blank" rel="noreferrer">
                  Escribirle a {firstName(rememberedPerson)}
                </a>
                <p className="muted small">Se abre WhatsApp con «{MISS_YOU}». Solo se manda si tú lo envías.</p>
              </>
            )}
            {last === 'razon' &&
              (reason ? (
                <>
                  <p className="hole-reason">{reason.text}</p>
                  <p className="muted small">La guardaste en tu caja de esperanza.</p>
                  <Link to="/mi-espacio/caja" className="btn small ghost">
                    Abrir mi caja de esperanza
                  </Link>
                </>
              ) : (
                <Link to="/mi-espacio/caja" className="btn small ghost">
                  Guardar una razón para seguir
                </Link>
              ))}
            {last === 'mano' &&
              (helper && reachable.includes(helper) ? (
                <>
                  <a className="btn small" href={whatsappOf(helper.phone, country, message)} target="_blank" rel="noreferrer">
                    Mandarle un WhatsApp a {helperName ?? 'tu persona de confianza'}
                  </a>
                  <p className="muted small">Se abre WhatsApp con tu mensaje: «{message}». Solo se manda si tú lo envías.</p>
                </>
              ) : (
                <Link to="/mi-espacio/personas" className="btn small ghost">
                  {helperName ? `Anotar el teléfono de ${helperName}` : 'Anotar a alguien de confianza'}
                </Link>
              ))}
            {last === 'mano' && planned && (
              <Link to="/mi-espacio/plan" className="btn small ghost">
                Ver mi plan para días difíciles
              </Link>
            )}

            {idle && risk && <p className="muted small">{scene.riskHint}</p>}
            {idle && heavy && !risk && <p className="muted small">{HEAVY_HINT}</p>}
            {out && (
              <>
                {firstOut && companion && (
                  <p className="muted small">
                    Este día se guardó en «Nuestros momentos», y en el rincón de {name} ya hay {scene.keepsake}.
                  </p>
                )}
                {!companion && <p className="muted small">Si creas tu mascota, será quien salga contigo.</p>}
                <div className="row">
                  <button type="button" className="btn small" onClick={again}>
                    Volver a jugar
                  </button>
                  <Link to="/mascota" className="btn small ghost">
                    {companion ? `Ver el rincón de ${name}` : 'Crear mi mascota'}
                  </Link>
                </div>
              </>
            )}
          </PetSays>

          {!out && (
            <div className="hole-actions">
              {STEP_ORDER.map((id) => {
                const Icon = ICONS[place.scene][id]
                const done = climb.built.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`hole-act${done ? ' done' : ''}${choosing && id === 'nombrar' ? ' active' : ''}`}
                    disabled={done || !!breath}
                    onClick={() => act(id)}
                  >
                    <span className="hole-ico" aria-hidden="true">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span>{scene.steps[id]}</span>
                    {done && <span className="visually-hidden">, hecho</span>}
                  </button>
                )
              })}
            </div>
          )}

          <div className="hole-foot">
            <span className="hole-steps" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={i < n ? 'on' : ''} />
              ))}
            </span>
            <span className="muted small">{out ? scene.end : n === 0 ? scene.start : `${n} de 4 ${scene.unit}`}</span>
          </div>
        </section>
      )}

      {reading && (
        <details className="card hole-why">
          <summary>¿Por qué se ve así?</summary>
          <ul>
            {climb.state && <li>Hoy lo cambiaste a «{place.label}».</li>}
            {reading.why.length ? (
              reading.why.map((w) => <li key={w}>{w}</li>)
            ) : (
              <li>
                Todavía no hay registros de estos días{climb.state ? '' : ', así que empezamos con «Ánimo bajo»'}. Si hoy es otra
                cosa, cámbialo arriba.
              </li>
            )}
            {heavy && <li>Como hoy pesa, los pasos son más chiquitos: con una respiración basta.</li>}
            {reading.locked && <li>Tu diario tiene clave: lo que marcas ahí se queda ahí.</li>}
          </ul>
          <p className="muted small">Todo se lee aquí, en tu teléfono. Nada sale de él.</p>
        </details>
      )}
    </div>
  )
}
