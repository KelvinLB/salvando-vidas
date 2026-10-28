// Detecta frases que pueden indicar riesgo para ofrecer ayuda con suavidad.
// No bloquea nada ni avisa a nadie: solo muestra las líneas de apoyo.
// Es deliberadamente sensible: un falso positivo cuesta poco, uno negativo puede costar mucho.

const PATTERNS = [
  /suicid/,
  /matarme/,
  /quitarme la vida/,
  /no quiero (seguir )?vivir/,
  /(me )?quiero morir/,
  /ganas de morir/,
  /acabar con todo/,
  /acabar con mi vida/,
  /que (todo )?(esto )?(ya )?(se )?acabe/,
  /no vale la pena (seguir|vivir)/,
  /desapare[cz]\w* (de este mundo|del mundo|para siempre)/,
  /(lo mejor es|quisiera|quiero|ojala) (que )?(yo )?desapare[cz]/,
  /irme de este mundo/,
  /(no|sin) (tengo )?ganas de vivir/,
  /no quiero existir/,
  /dejar de existir/,
  /terminar con (mi vida|todo)/,
  /no (volver a )?despertar/,
  /para que seguir/,
  /hacerme dano/,
  /lastimarme/,
  /cortarme/,
  /mejor sin mi/,
  /ya no puedo mas/,
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function soundsLikeRisk(text: string): boolean {
  const t = normalize(text)
  return PATTERNS.some((p) => p.test(t))
}
