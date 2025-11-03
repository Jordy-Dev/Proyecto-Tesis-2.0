import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Configuración del detector temporal en navegador usando MediaPipe Hands.
// Cuando se integre el backend con YOLO (yolo11n-pose.pt), se reemplazará este proveedor por el servicio Python.

function angleBetweenPoints(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.atan2(dy, dx) // radianes
}

function distance(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.hypot(dx, dy)
}

// Heurística de "mano vertical":
// - Dedo medio por encima de la muñeca
// - Vector muñeca->dedo medio casi vertical (|dx| pequeño, dy negativo pronunciado)
// - Mano relativamente extendida (distancia muñeca->dedo medio por encima de umbral relativo al cuadro)
function isHandVertical(landmarks, width, height) {
  if (!landmarks || landmarks.length < 21) return false
  // Índices MediaPipe Hands
  const WRIST = 0
  const MIDDLE_TIP = 12

  const wrist = {
    x: landmarks[WRIST].x * width,
    y: landmarks[WRIST].y * height,
  }
  const middleTip = {
    x: landmarks[MIDDLE_TIP].x * width,
    y: landmarks[MIDDLE_TIP].y * height,
  }

  const dy = middleTip.y - wrist.y
  const dx = middleTip.x - wrist.x
  const ang = angleBetweenPoints(wrist, middleTip) // hacia arriba ~ -90° (o 270°)

  const dist = distance(wrist, middleTip)
  const minDist = Math.min(width, height) * 0.18 // umbral empírico

  const verticalish = Math.abs(dx) < Math.max(12, width * 0.03) && dy < -Math.max(12, height * 0.03)
  const angleIsVertical = Math.abs(Math.abs(ang) - Math.PI / 2) < 0.45 // ± ~26°

  return verticalish && angleIsVertical && dist > minDist
}

export default function HandParticipation() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [isRunning, setIsRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const timerRef = useRef(null)
  const [status, setStatus] = useState('Listo')
  const coolDownRef = useRef(0)
  const lastVerticalRef = useRef(false)
  const resizeHandlerRef = useRef(null)

  // Inicializa MediaPipe Hands desde el global (cargado por CDN en index.html)
  const hands = useMemo(() => {
    if (typeof window === 'undefined' || !window.Hands) return null
    const h = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })
    h.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    })
    return h
  }, [])

  const draw = useCallback((results) => {
    const canvasEl = canvasRef.current
    const videoEl = videoRef.current
    if (!canvasEl || !videoEl) return
    const ctx = canvasEl.getContext('2d')
    const { width, height } = canvasEl
    ctx.clearRect(0, 0, width, height)

    // Dibuja el frame del video como fondo del canvas para overlays nítidos
    ctx.drawImage(videoEl, 0, 0, width, height)

    if (results && results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // Dibujo de puntos de la mano
        ctx.fillStyle = 'rgba(0, 150, 255, 0.9)'
        landmarks.forEach((lm) => {
          const x = lm.x * width
          const y = lm.y * height
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        })

        // Verifica condición de mano vertical
        const vertical = isHandVertical(landmarks, width, height)

        if (vertical) {
          ctx.strokeStyle = 'rgba(50, 205, 50, 0.95)'
          ctx.lineWidth = 4
        } else {
          ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)'
          ctx.lineWidth = 2
        }

        // Caja aproximada de la mano
        const xs = landmarks.map((p) => p.x * width)
        const ys = landmarks.map((p) => p.y * height)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        ctx.strokeRect(minX - 8, minY - 8, (maxX - minX) + 16, (maxY - minY) + 16)
      }
    }
  }, [])

  const onResults = useCallback((results) => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    draw(results)

    const width = canvasEl.width
    const height = canvasEl.height

    // Lógica de conteo por transición (no vertical -> vertical)
    let anyVertical = false
    if (results && results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        if (isHandVertical(landmarks, width, height)) {
          anyVertical = true
          break
        }
      }
    }

    const now = performance.now()
    const cooldownActive = now < coolDownRef.current

    if (anyVertical && !lastVerticalRef.current && !cooldownActive) {
      setCount((c) => c + 1)
      coolDownRef.current = now + 1200 // 1.2s de cooldown por evento
    }
    lastVerticalRef.current = anyVertical
  }, [draw])

  // Bucle de captura de frames para MediaPipe
  const processFrame = useCallback(async () => {
    if (!isRunning) return
    if (!hands) return
    const videoEl = videoRef.current
    if (videoEl && videoEl.readyState >= 2) {
      try {
        await hands.send({ image: videoEl })
      } catch (e) {
        // Evita detener toda la UI ante errores intermitentes
      }
    }
    animationRef.current = requestAnimationFrame(processFrame)
  }, [hands, isRunning])

  // Inicialización de cámara
  const startCamera = useCallback(async () => {
    const videoEl = videoRef.current
    const canvasEl = canvasRef.current
    if (!videoEl || !canvasEl) return

    // Ajusta el canvas al tamaño visible para nitidez a pantalla grande
    const setCanvasToDisplaySize = () => {
      const rect = canvasEl.getBoundingClientRect()
      canvasEl.width = Math.max(640, Math.floor(rect.width))
      canvasEl.height = Math.max(360, Math.floor(rect.height))
    }
    setCanvasToDisplaySize()
    resizeHandlerRef.current = setCanvasToDisplaySize

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      videoEl.srcObject = stream
      await videoEl.play()
      setCanvasToDisplaySize()
      window.addEventListener('resize', resizeHandlerRef.current)
      setStatus('Cámara activa')
    } catch (e) {
      setStatus('Permiso de cámara denegado o no disponible')
    }
  }, [])

  const stopCamera = useCallback(() => {
    const videoEl = videoRef.current
    if (videoEl && videoEl.srcObject) {
      const tracks = videoEl.srcObject.getTracks()
      tracks.forEach((t) => t.stop())
      videoEl.srcObject = null
    }
  }, [])

  const startSession = useCallback(async () => {
    if (!hands) {
      setStatus('Inicializando detector...')
      return
    }
    hands.onResults(onResults)
    await startCamera()
    setIsRunning(true)
    setStatus('Detectando manos...')
    timerRef.current = window.setInterval(() => {
      setSessionSeconds((s) => s + 1)
    }, 1000)
  }, [hands, onResults, startCamera])

  const stopSession = useCallback(() => {
    setIsRunning(false)
    cancelAnimationFrame(animationRef.current)
    stopCamera()
    window.clearInterval(timerRef.current)
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current)
    }
    setStatus('Detenido')
  }, [stopCamera])

  const resetCounter = useCallback(() => {
    setCount(0)
    setSessionSeconds(0)
    lastVerticalRef.current = false
    coolDownRef.current = 0
  }, [])

  useEffect(() => {
    if (!isRunning) return
    animationRef.current = requestAnimationFrame(processFrame)
    return () => cancelAnimationFrame(animationRef.current)
  }, [isRunning, processFrame])

  useEffect(() => {
    return () => {
      stopSession()
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current)
      }
    }
  }, [stopSession])

  const minutes = Math.floor(sessionSeconds / 60).toString().padStart(2, '0')
  const seconds = (sessionSeconds % 60).toString().padStart(2, '0')

  return (
    <div className="sp-container">
      <div className="sp-card-box">
        <header className="sp-header">
          <div className="sp-brand">
            <div className="sp-logo">SP</div>
            <div className="sp-title">
              <h1>Colegio San Pedro</h1>
              <p>Detección de participación en clase</p>
            </div>
          </div>
          <div className="sp-status">
            <span className={`sp-badge ${isRunning ? 'live' : 'idle'}`}>{isRunning ? 'En vivo' : 'Listo'}</span>
            <span className="sp-sub">{status}</span>
          </div>
        </header>
      </div>
      <div className="sp-card-box">
        <main className="sp-main">
          <section className="sp-stage">
            <div className="sp-video-wrap">
              <video ref={videoRef} className="sp-video" playsInline muted></video>
              <canvas ref={canvasRef} className="sp-canvas"></canvas>
            </div>
            <div className="sp-overlay-info">
              <div className="sp-metric">
                <div className="sp-metric-label">Participaciones</div>
                <div className="sp-metric-value">{count}</div>
              </div>
              <div className="sp-metric">
                <div className="sp-metric-label">Tiempo</div>
                <div className="sp-metric-value">{minutes}:{seconds}</div>
              </div>
            </div>
          </section>
          <aside className="sp-controls">
            <div className="sp-cta">
              {!isRunning ? (
                <button className="sp-btn primary" onClick={startSession}>Iniciar detección</button>
              ) : (
                <button className="sp-btn danger" onClick={stopSession}>Detener</button>
              )}
              <button className="sp-btn ghost" onClick={resetCounter} disabled={isRunning && count === 0}>Reiniciar contador</button>
            </div>
            <div className="sp-hint">
              <p>
                Para contar una participación, levanta la mano de forma vertical (mano extendida, dedo medio por encima de la muñeca).
              </p>
              <p className="sp-note">
                Nota: Actualmente se usa un detector en el navegador (MediaPipe) solo para demos. Se integrará el modelo YOLO (`yolo11n-pose.pt`) en Python sin cambiar esta interfaz.
              </p>
            </div>
          </aside>
        </main>
      </div>
      <footer className="sp-footer">
        <span>© {new Date().getFullYear()} Colegio San Pedro</span>
        <span className="sp-sep">·</span>
        <span>Versión demo sin guardado de datos</span>
      </footer>
    </div>
  )
}


