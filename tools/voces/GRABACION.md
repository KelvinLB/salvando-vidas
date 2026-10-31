# Cómo grabar la voz

Esta guía es para la persona que presta su voz. Antes de grabar, tiene que haber firmado el
[permiso](CONSENTIMIENTO.md). Se graba una sola vez, en unos 15 minutos.

La voz clonada copia el timbre y también el tono de la grabación. Si la grabación suena tensa o
apurada, todas las reflexiones van a sonar así. Por eso importa más el cómo que el equipo.

## Antes de grabar

- **Lugar:** un cuarto chico con cosas suaves (cortinas, cama, ropa). Un clóset abierto lleno de ropa
  funciona muy bien. Evita baños, cocinas y cuartos vacíos, porque hacen eco.
- **Silencio:** apaga ventilador, aire acondicionado y refrigerador si se oye. Pon el teléfono en
  modo avión para que no suene.
- **Teléfono:** basta con la app de grabación que trae.
  - iPhone: Notas de voz. Antes, en Ajustes › Apps › Notas de voz › Calidad de audio, elige
    **Sin compresión**.
  - Android: la grabadora del teléfono, en la mejor calidad que ofrezca.
- **Distancia:** sostén el teléfono a unos 20 o 30 cm, a la altura del pecho, un poco de lado
  para que la «p» y la «b» no golpeen el micrófono.
- **Agua a la mano.** Nada de café justo antes.

## Cómo leer

- Imagina que le hablas a **una sola persona** que quieres y que hoy está teniendo un día difícil.
  No es un anuncio ni un audiolibro.
- Lento, más lento de lo que parece natural. En los puntos y en los «…» toma aire con calma.
- Media sonrisa. No hace falta actuar ninguna emoción.
- Si te equivocas, haz una pausa y repite la frase completa. No hace falta empezar de nuevo.
- Lee el texto **dos veces** completo, con un descanso entre una y otra.

## El texto

> Hola. Qué bueno que estás aquí.
>
> No tienes que hacer nada en especial, ni sentir nada en especial. Solo quedarte un momento.
>
> A veces el día pesa desde que abrimos los ojos. La cabeza va rápido, el cuerpo va lento, y todo
> parece cuesta arriba. Si hoy es uno de esos días, está bien que lo sea.
>
> Vamos a respirar juntos, sin prisa. El aire entra por la nariz… y sale despacio, como un suspiro
> largo. Otra vez. Entra… y sale.
>
> ¿Notas los hombros? ¿La mandíbula? Si están apretados, puedes aflojarlos un poquito. Nada más un
> poquito.
>
> Lo que sientes tiene sentido, aunque ahorita no sepas explicarlo. No le debes a nadie una razón
> para sentirte así. Y tampoco tienes que cargarlo todo hoy.
>
> Piensa en algo pequeño que te haga bien: un vaso de agua, abrir la ventana, mandarle un mensaje a
> alguien de confianza. Una sola cosa. Eso cuenta.
>
> Aquí sigo contigo. Respira una vez más… despacio. Gracias por quedarte.

## Después de grabar

1. Pasa el archivo a la computadora **por cable o AirDrop**. Por WhatsApp no: lo comprime y le
   quita calidad.
2. Escucha la grabación y elige un pedazo de **6 a 12 segundos** que suene tranquilo, con frases
   completas, sin respiraciones fuertes ni ruidos. «Hola. Qué bueno que estás aquí. No tienes que
   hacer nada en especial…» suele funcionar bien.
3. Recórtalo con ffmpeg (aquí, del segundo 3 al 13):

   ```sh
   ffmpeg -i grabacion.m4a -ss 3 -t 10 -ac 1 voz/referencia.wav
   ```

4. Escribe en `voz/referencia.txt` las palabras **exactas** de ese pedazo, con sus puntos y comas.
   Si no lo escribes, `generar.py` lo transcribe la primera vez para que lo revises.
5. Genera una reflexión de prueba y escúchala completa con audífonos antes de generar las demás.

## Privacidad

La grabación es un dato personal de quien prestó su voz, y en México la voz puede contar como dato
biométrico. Por eso:

- Vive solo en `tools/voces/voz/`, que git ignora. Nunca se sube al repositorio ni a la nube.
- Lo único que se publica en la app son las reflexiones ya generadas.
- Si la persona retira su permiso, se borran su grabación y los audios hechos con su voz.
