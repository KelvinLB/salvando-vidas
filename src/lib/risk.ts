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
  // «Nada tiene sentido» y «para qué seguir»: la falta de sentido de vida va de la mano con
  // pensamientos de no querer vivir (metaanálisis 2024 y 2025). Ojo: «sin sentido» solo, como
  // lo dice un psiquiatra, no basta para avisar; sí cuando es la vida o todo lo que no lo tiene.
  // Pendiente de revisión con psicóloga.
  /(ya )?nada (tiene|tenga|le encuentro|me hace) (ningun )?sentido/,
  /(la|mi|esta) vida (ya )?no tiene (ningun )?(sentido|caso)/,
  /no (le )?encuentro (ningun )?sentido a (la|mi) vida/,
  /(vivir|seguir|existir) (ya )?no tiene (ningun )?(sentido|caso)/,
  /no tiene (ningun )?(sentido|caso) (seguir|vivir|existir|estar aqui)/,
  /(ya )?nada tiene caso/,
  /pa(ra)? que (seguir|sigo|vivir|vivo|existir|existo|despertar|despierto)\b/,
  /pa(ra)? que estoy( aqui| viv[ao]| en este mundo)?\s*([?.!,]|$)/,
  /ya nada importa/,
  /nada importa ya/,
  /ya no (me )?importa nada/,
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
