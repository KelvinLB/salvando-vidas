# Voces para «Para escuchar»

Genera las reflexiones en audio con una voz clonada a partir de una grabación de 6 a 12 segundos de
una persona que dio su permiso por escrito. Corre en la Mac, sin internet y sin costo. Los audios
salen a `public/audio/escuchar/` y la app los guarda en el teléfono para escucharlos sin conexión.

| Pieza | Para qué | Licencia |
|---|---|---|
| [Qwen3-TTS 0.6B Base](https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16) | Clona la voz y lee el guion | Apache 2.0 |
| [Whisper large-v3-turbo](https://huggingface.co/mlx-community/whisper-large-v3-turbo-asr-4bit) | Revisa que cada frase diga lo que dice el guion | MIT |
| [mlx-audio](https://github.com/Blaizzy/mlx-audio) 0.6.3 | Corre los dos modelos en el chip de la Mac | MIT |

## Antes de empezar

1. Que la persona firme el [permiso](CONSENTIMIENTO.md).
2. Que grabe siguiendo [la guía](GRABACION.md).
3. Que una psicóloga o un psicólogo revise cada guion de `guiones/`.

## Instalar (una vez)

Solo Mac con chip Apple, Python 3.14 y ffmpeg (`brew install ffmpeg`).

```sh
cd tools/voces
python3 -m venv .venv
.venv/bin/pip install --require-hashes --only-binary=:all: -r requirements.lock
```

`requirements.lock` fija cada paquete a la huella (SHA-256) del archivo que se revisó el
30-oct-2026. Si alguien cambia un paquete en PyPI, pip se niega a instalarlo. Antes de subir una
versión, repite la revisión: huellas contra PyPI, avisos en [OSV](https://osv.dev), código contra
GitHub y que no haya archivos `.pth`.

Los modelos (2.3 GB y 446 MB) se bajan solos a `.modelos/` la primera vez, y solo en formatos
`.safetensors` y `.json`, que no ejecutan código.

## Generar

```sh
.venv/bin/python -I generar.py guiones/hoy-pesa.txt guiones/cuando-no-puedo-llorar.txt
```

- Cada frase se genera, Whisper la escucha y, si entiende menos del 90 % de las palabras, se vuelve
  a generar (hasta 3 veces). Las que sigan dudosas se avisan al final para escucharlas.
- Tarda unos 8 minutos por minuto de audio en una M1 con 8 GB. Se hace una vez por reflexión.
- Cada audio sale en AAC mono a 48 kbps, con el volumen normalizado a −16 LUFS: unos 360 KB por
  minuto.
- **Escucha cada audio completo con audífonos antes de publicarlo.** Whisper revisa las palabras, no
  el tono.

## Escribir un guion

Un archivo `.txt` por reflexión en `guiones/`. Las líneas que empiezan con `#` son notas y no se
leen. `[pausa]` deja 0.7 segundos de silencio, `[pausa larga]` 1.6 y `[silencio]` 5 (para
recorridos lentos, como el del cuerpo). Los «…» se leen como una pausa
corta dentro de la frase.

## Lo que no se sube

`.gitignore` deja fuera `.venv/`, `.modelos/` y `voz/`. La carpeta `voz/` tiene la grabación de quien
prestó su voz, que es un dato personal: nunca va al repositorio.

En la app, la sección tiene que decir que es una voz generada con permiso, con el nombre de la
persona o «una voz prestada», según lo que haya elegido en el permiso.
