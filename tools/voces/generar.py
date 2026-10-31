"""Genera las reflexiones de «Para escuchar» con la voz clonada de quien prestó su voz.

Uso (desde tools/voces):
  .venv/bin/python -I generar.py guiones/hoy-pesa.txt [más guiones…] [--salida DIR]

Necesita voz/referencia.wav (de 6 a 12 segundos de la grabación) y voz/referencia.txt (sus palabras
exactas). Si falta el .txt, se transcribe con Whisper para que se revise a mano. Cada frase se revisa
con Whisper y se vuelve a generar si no dice lo que dice el guion. Todo corre en la Mac, sin internet,
después de la primera descarga de los modelos.
"""
import argparse, difflib, os, re, subprocess, sys, tempfile, time, unicodedata, wave
from pathlib import Path

AQUI = Path(__file__).resolve().parent
MODELOS = AQUI / '.modelos'
VOZ = AQUI / 'voz'
SALIDA = AQUI.parent.parent / 'public' / 'audio' / 'escuchar'

# Modelos (solo .safetensors y .json: formatos que no ejecutan código)
TTS = ('mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16', 'Qwen3-TTS-12Hz-0.6B-Base-bf16')
STT = ('mlx-community/whisper-large-v3-turbo-asr-4bit', 'whisper-large-v3-turbo-asr-4bit')
SEGUROS = ['*.json', '*.safetensors', '*.txt', '*.model', '*.tiktoken', '*.jinja', 'README.md']

PAUSA, PAUSA_LARGA, SILENCIO, AL_INICIO, AL_FINAL = 0.7, 1.6, 5.0, 0.4, 0.8
INTENTOS, MINIMO = 3, 0.9  # se acepta una frase si Whisper entiende al menos el 90 % de sus palabras


def modelo_local(repo, carpeta):
    destino = MODELOS / carpeta
    if not (destino / 'config.json').exists():
        os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
        from huggingface_hub import snapshot_download
        print(f'Bajando {repo} (solo la primera vez)…')
        snapshot_download(repo, local_dir=destino, allow_patterns=SEGUROS)
    return destino


def leer_guion(ruta: Path):
    """[(frase, silencio_después)]. Las líneas que empiezan con # son notas y no se leen."""
    texto = ' '.join(l for l in ruta.read_text().splitlines() if not l.lstrip().startswith('#'))
    partes = re.split(r'\s*\[(pausa(?: larga)?|silencio)\]\s*', texto.strip())
    frases = []
    for i in range(0, len(partes), 2):
        frase = partes[i].replace('…', ',').strip()
        marca = partes[i + 1] if i + 1 < len(partes) else None
        if frase:
            silencio = {'pausa': PAUSA, 'pausa larga': PAUSA_LARGA, 'silencio': SILENCIO}.get(marca, 0.0)
            frases.append((frase, silencio))
    return frases


def palabras(texto):
    t = unicodedata.normalize('NFD', texto.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn' or c == '̃')
    return re.findall(r'[a-zñ]+', unicodedata.normalize('NFC', t))


def parecido(a, b):
    return difflib.SequenceMatcher(None, palabras(a), palabras(b)).ratio()


def escribir_wav(ruta, audio, sr):
    import numpy as np
    pcm = (np.clip(audio, -1, 1) * 32767).astype('<i2')
    with wave.open(str(ruta), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('guiones', nargs='+', type=Path)
    ap.add_argument('--salida', type=Path, default=SALIDA)
    args = ap.parse_args()

    ref_wav, ref_txt = VOZ / 'referencia.wav', VOZ / 'referencia.txt'
    if not ref_wav.exists():
        sys.exit(f'Falta {ref_wav}. Lee GRABACION.md para prepararla.')

    import numpy as np
    from mlx_audio.stt.utils import load_model as cargar_stt
    from mlx_audio.tts.utils import load_model as cargar_tts
    stt = cargar_stt(modelo_local(*STT))
    tmp = Path(tempfile.mkdtemp())

    def oir(audio, sr):
        f = tmp / 'frase.wav'
        escribir_wav(f, audio, sr)
        return stt.generate(str(f), language='es').text.strip()

    # La referencia, limpia: mono, 24 kHz y volumen parejo
    ref = tmp / 'referencia-24k.wav'
    ffmpeg('-i', str(ref_wav), '-af', 'loudnorm=I=-16:TP=-1.5', '-ac', '1', '-ar', '24000', str(ref))
    if not ref_txt.exists():
        ref_txt.write_text(stt.generate(str(ref), language='es').text.strip() + '\n')
        sys.exit(f'Escribí {ref_txt} con lo que entendió Whisper. Revísalo palabra por palabra y vuelve a correr.')
    texto_ref = ref_txt.read_text().strip()

    tts = cargar_tts(modelo_local(*TTS))
    args.salida.mkdir(parents=True, exist_ok=True)

    for guion in args.guiones:
        t0, piezas, sr, dudas = time.time(), [], tts.sample_rate, []
        frases = leer_guion(guion)
        for n, (frase, silencio) in enumerate(frases, 1):
            mejor = (-1.0, None, '')
            for _ in range(INTENTOS):
                r = list(tts.generate(text=frase, ref_audio=str(ref), ref_text=texto_ref, lang_code='spanish', temperature=0.7))
                audio = np.concatenate([np.array(x.audio, dtype=np.float32) for x in r])
                oido = oir(audio, sr)
                p = parecido(frase, oido)
                if p > mejor[0]:
                    mejor = (p, audio, oido)
                if p >= MINIMO:
                    break
            if mejor[0] < MINIMO:
                dudas.append((n, frase, mejor[2]))
            print(f'  {guion.stem} {n}/{len(frases)} · {100 * mejor[0]:.0f} %', flush=True)
            piezas += [mejor[1], np.zeros(int(sr * silencio), np.float32)]

        todo = np.concatenate([np.zeros(int(sr * AL_INICIO), np.float32), *piezas, np.zeros(int(sr * AL_FINAL), np.float32)])
        crudo, final = tmp / f'{guion.stem}.wav', args.salida / f'{guion.stem}.m4a'
        escribir_wav(crudo, todo, sr)
        # −16 LUFS para que todas suenen al mismo volumen; AAC mono a 48 kbps (~0.36 MB por minuto)
        ffmpeg('-i', str(crudo), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-ac', '1',
               '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', str(final))
        print(f'{final.name}: {len(todo) / sr:.0f} s, {final.stat().st_size // 1024} KB, {time.time() - t0:.0f} s de trabajo')
        for n, frase, oido in dudas:
            print(f'  ⚠ frase {n} sigue dudosa. Guion: «{frase}» · Whisper oyó: «{oido}». Escúchala antes de usarla.')


if __name__ == '__main__':
    main()
