import type { NeighborId } from './barrio'

// Las historias de los vecinos: cada uno cuenta, en capítulos cortos, cómo salió adelante de
// algo. Son personajes escritos, no personas ni un chat. Son historias con esperanza y sin
// promesas: nadie «se cura» de un día para otro, hay días buenos y pesados, y pedir ayuda
// aparece como algo normal. Sin detalles fuertes ni nada sobre hacerse daño.
// Los capítulos se abren con lo que la persona hace en el barrio y nunca se cierran otra vez.
// Los textos quedan pendientes de revisión de un psicólogo.

/**
 * Cuándo se abre un capítulo: siempre; al hacer la misión de ese vecino; al haber probado
 * cierto número de misiones distintas; o cuando lleve ese número de semanas en el barrio.
 */
export type Unlock = { always: true } | { own: true } | { missions: number } | { weeks: number }

export type Chapter = { text: string; unlock: Unlock }

export const STORIES: Record<NeighborId, Chapter[]> = {
  tere: [
    {
      unlock: { always: true },
      text: 'Hace unos años cerré la tiendita un tiempo. No pasó nada grave: nomás un día ya no me daban ganas de nada, ni de subir la cortina.',
    },
    {
      unlock: { own: true },
      text: 'Mi comadre me dijo: «No abras toda la tienda, nomás barre la entrada». Lo hice. Al otro día acomodé un estante. Poquito, pero era algo.',
    },
    {
      unlock: { missions: 3 },
      text: 'También fui con una doctora del centro de salud. Me dio pena, pero me ayudó a entender lo que me pasaba y qué podía hacer.',
    },
    {
      unlock: { weeks: 3 },
      text: 'Ahora hay días buenos y otros pesados. En los pesados abro más tarde, y está bien. La tiendita sigue aquí, y yo también.',
    },
  ],
  chema: [
    {
      unlock: { always: true },
      text: 'Fui chofer muchos años. Un día, en pleno tráfico, sentí que el corazón se me salía. Me espanté mucho.',
    },
    {
      unlock: { own: true },
      text: 'El doctor me revisó y me dijo que el corazón estaba bien, que eran los nervios. Me enseñó a respirar despacito, contando.',
    },
    {
      unlock: { missions: 3 },
      text: 'Al principio me daba pena respirar así enfrente de la gente. Luego vi que nadie se fijaba, y a mí sí me servía.',
    },
    {
      unlock: { weeks: 2 },
      text: 'Por eso prendo el kiosco despacito, foco por foco. Los nervios todavía me visitan, pero ya sé qué hacer cuando llegan.',
    },
  ],
  nico: [
    {
      unlock: { always: true },
      text: 'Cuando llegamos al barrio no conocía a nadie. En la escuela me ponía tan nervioso que se me olvidaba todo.',
    },
    {
      unlock: { own: true },
      text: 'Mi abuela me enseñó un juego: cuando me siento raro, busco cinco cosas a mi alrededor. Luego respiro.',
    },
    {
      unlock: { missions: 4 },
      text: 'Un día le conté a mi maestra. Me dijo que a mucha gente le pasa, hasta a los grandes. Me sentí menos solo.',
    },
    {
      unlock: { weeks: 4 },
      text: 'Ya tengo dos amigos. Todavía me pongo nervioso a veces, pero el juego de las cinco cosas lo puedo jugar donde sea.',
    },
  ],
  lupe: [
    {
      unlock: { always: true },
      text: 'Cuidé muchos años a mi mamá. Vivía para ella y me olvidé de mí: comía de pie, dormía poquito, ni agua tomaba.',
    },
    {
      unlock: { own: true },
      text: 'Un día me mareé en el puesto. Mi hija me sentó y me dio un vaso de agua de jamaica. Me dijo: «Tú también cuentas, ma».',
    },
    {
      unlock: { missions: 3 },
      text: 'Empecé por cosas chiquitas: un vaso de agua, sentarme a comer, pedirles a mis hermanos que nos turnáramos.',
    },
    {
      unlock: { weeks: 3 },
      text: 'Todavía se me olvida a veces. Pero ahora le sirvo el primer vaso a quien llegue, y el segundo es para mí.',
    },
  ],
  beto: [
    {
      unlock: { always: true },
      text: 'Aunque no lo creas, me daba mucho miedo hablar con la gente. Si alguien me preguntaba algo, sentía la cara caliente y me quería ir.',
    },
    {
      unlock: { own: true },
      text: 'Mi papá tenía un puesto aquí. Empecé nomás acomodando la fruta, sin hablar. Luego, a decir «buenos días».',
    },
    {
      unlock: { missions: 4 },
      text: 'Cada semana, un pasito más: dar el precio, luego platicar del clima. El miedo subía, pero si me quedaba tantito, bajaba solito.',
    },
    {
      unlock: { weeks: 4 },
      text: 'Hoy le digo «¡pásele, marchante!» a todo el mercado. Hay días que todavía me cuesta, y esos días voy más despacio.',
    },
  ],
  ramiro: [
    {
      unlock: { always: true },
      text: 'Cuando me quedé sin trabajo en la fábrica, mi cabeza no paraba: «ya no sirves», «a tu edad nadie te va a contratar».',
    },
    {
      unlock: { own: true },
      text: 'Un amigo me preguntó: «¿Y eso es cierto, o es lo que te dice la tristeza?». Me quedé pensando.',
    },
    {
      unlock: { missions: 3 },
      text: 'Empecé a revisar lo que pensaba como reviso una tabla: dónde está chueca, dónde se puede lijar. No todo era cierto.',
    },
    {
      unlock: { weeks: 3 },
      text: 'Abrí este tallercito con lo que sé hacer. Los pensamientos feos todavía llegan; ahora los reviso antes de creerles.',
    },
  ],
  rosa: [
    {
      unlock: { always: true },
      text: 'Era muy dura conmigo. Si algo me salía mal, me pasaba el día diciéndome cosas que nunca le diría a nadie.',
    },
    {
      unlock: { own: true },
      text: 'Una vez, sentada en esta banca, me pregunté: ¿qué le diría a mi hermana si le pasara esto? Algo bonito, seguro.',
    },
    {
      unlock: { missions: 3 },
      text: 'Fui a unas pláticas con una psicóloga en el centro comunitario. Aprendí que tratarme con cariño no es echarme a perder.',
    },
    {
      unlock: { weeks: 4 },
      text: 'Todavía se me sale el regaño a veces. Ahora me doy cuenta más rápido y me hablo como a alguien que quiero.',
    },
  ],
  memo: [
    {
      unlock: { always: true },
      text: 'Cuando llegué de cartero me sentía muy solo. Le llevaba cartas a todo el barrio y nadie me conocía.',
    },
    {
      unlock: { own: true },
      text: 'Un día le dejé una notita a Doña Lupe: «Gracias por saludarme diario». Al otro día me regaló un agua fresca.',
    },
    {
      unlock: { missions: 3 },
      text: 'Empecé a fijarme en los demás: quién necesitaba ayuda con la bolsa, quién estaba sentado solo en la banca.',
    },
    {
      unlock: { weeks: 2 },
      text: 'La soledad no se me quitó de un día para otro. Pero ahora, cuando me siento solo, sé que puedo tocar una puerta.',
    },
  ],
}
