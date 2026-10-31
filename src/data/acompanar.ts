// «Cuando alguien que quieres está mal»: una guía corta para quien quiere ayudar a un familiar,
// a una amistad o a alguien que escribió en un grupo. Sale de lo que se vio en los grupos de
// apoyo: muchas respuestas llegan con cariño, pero algunas empujan más hondo a quien ya está mal.
// Pendiente de revisión con psicóloga: todos los textos de este archivo.
// Fuentes: OMS, «Prevención del suicidio: un instrumento para…» (preguntar directamente por el
// suicidio no lo provoca); Dazzi et al. 2014, Psychol Med (misma conclusión, revisión sistemática);
// Línea de la Vida (CONASAMA) para México.

import type { Country } from './helplines'

export const ACOMPANA: { frase: string; porque: string }[] = [
  { frase: '«Aquí estoy. Me importas.»', porque: 'Decirlo así, sin más, ya baja la soledad.' },
  {
    frase: '«¿Quieres contarme qué pasa? Te escucho.»',
    porque: 'Escuchar sin corregir ni dar consejos de inmediato.',
  },
  {
    frase: '«A mí también me pasó algo parecido y fui saliendo poco a poco.»',
    porque: 'Contar tu historia corta, sin quitarle el lugar a la suya.',
  },
  {
    frase: '«¿Te ayudo a buscar a alguien con quien hablar?»',
    porque: 'Nombrar ayuda concreta: una línea, terapia o una persona de confianza.',
  },
  { frase: '«No tienes que sentirte mejor ya.»', porque: 'Sin juzgar y sin prisa.' },
]

export const LASTIMA: { frase: string; porque: string }[] = [
  {
    frase: 'Amenazar: «te vas a ir al infierno».',
    porque: 'Suma miedo y culpa a alguien que ya no puede con lo que carga.',
  },
  {
    frase: 'Culpar: «tal vez tú seas el problema», «deja de hacerte la víctima».',
    porque: 'Confirma lo que su mente ya le está diciendo.',
  },
  {
    frase: 'Comparar: «hay gente que quisiera tener lo que tú tienes».',
    porque: 'Le dice que su dolor no cuenta.',
  },
  {
    frase: 'Minimizar: «échale ganas», «la vida es bella», «todo pasa».',
    porque: 'Si pudiera echarle ganas, ya lo habría hecho.',
  },
  { frase: 'Decir que a nadie le importaría.', porque: 'Nunca, ni en broma ni para «hacerle reaccionar».' },
  {
    frase: 'Extraños que piden «escríbeme en privado» o recomiendan a alguien que «cura».',
    porque: 'En los grupos hay quien se aprovecha: piden dinero, fotos o secretos.',
  },
]

/** Mensajes listos para mandar. Llevan la línea del país elegido en Ayuda. */
export function mensajes(country: Country): { id: string; titulo: string; texto: string }[] {
  const linea = country.lines[0]
  // Algunas líneas ya traen el número en el nombre («988 Línea de…»): no se repite.
  const ayuda = !linea
    ? `Si en algún momento sientes que no puedes más, llama al ${country.emergency}.`
    : linea.name.includes(linea.number)
      ? `Si en algún momento sientes que no puedes más, en la ${linea.name} contestan gratis.`
      : `Si en algún momento sientes que no puedes más, en la ${linea.name} contestan gratis: ${linea.number}.`
  return [
    {
      id: 'aqui',
      titulo: 'Para alguien cercano',
      texto: `Vi lo que escribiste y me importas. No tienes que explicarme nada si no quieres; solo quiero que sepas que aquí estoy. ${ayuda}`,
    },
    {
      id: 'grupo',
      titulo: 'Para responder en un grupo',
      texto: `Gracias por animarte a escribirlo. Lo que sientes importa y no tienes que pasarlo a solas. ${ayuda} Hablar con alguien ayuda, aunque ahora no lo parezca.`,
    },
    {
      id: 'pregunta',
      titulo: 'Para preguntar directo',
      texto: `Te noto muy mal y quiero preguntarte algo con cariño: ¿estás pensando en quitarte la vida? Puedes decirme la verdad; no me voy a asustar ni a enojar. ${ayuda}`,
    },
    {
      id: 'despues',
      titulo: 'Para seguir ahí, días después',
      texto: `Me acordé de ti. ¿Cómo has estado estos días? Sigo aquí si quieres platicar, o si prefieres que solo te acompañe un rato.`,
    },
  ]
}
