import { useEffect, useRef, useState } from 'react'

export type Recording = { blob: Blob; seconds: number }
type Status = 'idle' | 'recording' | 'denied' | 'unsupported'

const MAX_SECONDS = 5 * 60

// Safari graba en mp4 y Chrome/Firefox en webm: se usa el primero que soporte el navegador.
function mimeType(): string | undefined {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  )
}

export function useRecorder(onDone: (r: Recording) => void) {
  const supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices
  const [status, setStatus] = useState<Status>(supported ? 'idle' : 'unsupported')
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const discard = useRef(false)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (status !== 'recording') return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (seconds >= MAX_SECONDS) stop()
  }, [seconds])

  useEffect(
    () => () => {
      recorder.current?.stream.getTracks().forEach((t) => t.stop())
    },
    [],
  )

  /** Graba del micrófono que ya abrió la píldora de voz, o abre uno. */
  async function start(given?: MediaStream) {
    try {
      const stream = given ?? (await navigator.mediaDevices.getUserMedia({ audio: true }))
      const type = mimeType()
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
      const chunks: Blob[] = []
      const startedAt = Date.now()
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setStatus('idle')
        if (discard.current) return
        done.current({
          blob: new Blob(chunks, { type: rec.mimeType }),
          seconds: Math.round((Date.now() - startedAt) / 1000),
        })
      }
      discard.current = false
      rec.start()
      recorder.current = rec
      setSeconds(0)
      setStatus('recording')
    } catch {
      setStatus('denied')
    }
  }

  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }

  /** Deslizó para cancelar: se detiene sin guardar nada. */
  function cancel() {
    discard.current = true
    stop()
  }

  const denied = () => setStatus('denied')

  return { status, seconds, start, stop, cancel, denied }
}
