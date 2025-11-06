import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, LogOut, User, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import participationApiService from '../services/participationApi'

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
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [selectedSection, setSelectedSection] = useState('A')
  const sections = ['A', 'B']
  const teacherGrade = user?.grade || '1er Grado'
  const sessionIdRef = useRef(null)
  const updateIntervalRef = useRef(null)
  const countRef = useRef(0)
  const sessionSecondsRef = useRef(0)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

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
      setCount((c) => {
        const newCount = c + 1
        countRef.current = newCount
        return newCount
      })
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
    
    try {
      // Crear sesión en la base de datos
      setStatus('Creando sesión...')
      const session = await participationApiService.createSession(
        user?.name || 'Docente',
        teacherGrade,
        selectedSection
      )
      sessionIdRef.current = session._id
      setStatus('Sesión creada')
      
      // Iniciar MediaPipe
      hands.onResults(onResults)
      await startCamera()
      setIsRunning(true)
      setStatus('Detectando manos...')
      
      // Timer para contar segundos
      timerRef.current = window.setInterval(() => {
        setSessionSeconds((s) => {
          const newSeconds = s + 1
          sessionSecondsRef.current = newSeconds
          return newSeconds
        })
      }, 1000)
      
      // Actualizar sesión en la base de datos cada 5 segundos
      updateIntervalRef.current = window.setInterval(async () => {
        if (sessionIdRef.current) {
          try {
            // Usar los valores actuales de las refs
            await participationApiService.updateSession(
              sessionIdRef.current,
              countRef.current,
              sessionSecondsRef.current
            )
          } catch (error) {
            console.error('Error actualizando sesión:', error)
            // No mostrar error al usuario, solo loguear
          }
        }
      }, 5000) // Actualizar cada 5 segundos
      
    } catch (error) {
      console.error('Error al crear sesión:', error)
      setStatus(`Error: ${error.message}`)
    }
  }, [hands, onResults, startCamera, user, teacherGrade, selectedSection])

  const stopSession = useCallback(async () => {
    setIsRunning(false)
    cancelAnimationFrame(animationRef.current)
    stopCamera()
    window.clearInterval(timerRef.current)
    
    // Limpiar intervalo de actualización
    if (updateIntervalRef.current) {
      window.clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
    
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current)
    }
    
    // Finalizar sesión en la base de datos
    if (sessionIdRef.current) {
      try {
        setStatus('Finalizando sesión...')
        await participationApiService.completeSession(
          sessionIdRef.current,
          countRef.current,
          sessionSecondsRef.current
        )
        setStatus('Sesión guardada')
        sessionIdRef.current = null
      } catch (error) {
        console.error('Error al finalizar sesión:', error)
        setStatus('Sesión detenida (error al guardar)')
      }
    } else {
      setStatus('Detenido')
    }
  }, [stopCamera])

  const resetCounter = useCallback(() => {
    setCount(0)
    setSessionSeconds(0)
    countRef.current = 0
    sessionSecondsRef.current = 0
    lastVerticalRef.current = false
    coolDownRef.current = 0
    
    // Actualizar sesión en la base de datos si existe
    if (sessionIdRef.current && isRunning) {
      participationApiService.updateSession(
        sessionIdRef.current,
        0,
        0
      ).catch(error => {
        console.error('Error al reiniciar contador en sesión:', error)
      })
    }
  }, [isRunning])

  useEffect(() => {
    if (!isRunning) return
    animationRef.current = requestAnimationFrame(processFrame)
    return () => cancelAnimationFrame(animationRef.current)
  }, [isRunning, processFrame])

  useEffect(() => {
    // Cleanup solo al desmontar el componente
    return () => {
      // Limpiar intervalos al desmontar
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current)
      }
      
      // Cancelar animación
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Detener cámara
      const videoEl = videoRef.current
      if (videoEl && videoEl.srcObject) {
        const tracks = videoEl.srcObject.getTracks()
        tracks.forEach((t) => t.stop())
        videoEl.srcObject = null
      }
      
      // Limpiar resize handler
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current)
      }
      
      // Finalizar sesión si está activa
      if (sessionIdRef.current) {
        participationApiService.completeSession(
          sessionIdRef.current,
          countRef.current,
          sessionSecondsRef.current
        ).catch(error => {
          console.error('Error al finalizar sesión al desmontar:', error)
        })
      }
    }
  }, []) // Sin dependencias - solo se ejecuta al montar/desmontar

  const minutes = Math.floor(sessionSeconds / 60).toString().padStart(2, '0')
  const seconds = (sessionSeconds % 60).toString().padStart(2, '0')

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 overflow-auto">
      {/* Estrellas animadas de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-yellow-300"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Star className="w-3 h-3" />
          </motion.div>
        ))}
      </div>

      {/* Información del usuario y botón de cerrar sesión */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3 sm:gap-4">
        {/* Información del usuario */}
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name || 'Usuario'}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-white text-xs sm:text-sm font-medium">{user?.name || 'Docente'}</p>
            <p className="text-white/70 text-xs">{user?.grade || 'Grado'}</p>
          </div>
        </div>
        {/* Botón de cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 group"
          title="Cerrar sesión"
        >
          <LogOut className="w-6 h-6 sm:w-8 sm:h-8 text-white group-hover:text-white/90 transition-colors" />
          <span className="text-white text-xs sm:text-sm font-medium group-hover:text-white/90 transition-colors">Salir</span>
        </button>
      </div>

      {/* Descripción del panel de docente en la parte superior izquierda */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 max-w-xs sm:max-w-sm">
        <div className="p-4 sm:p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <h2 className="text-white text-base sm:text-lg font-bold mb-2">Panel de Docente - Colegio San Pedro</h2>
          <p className="text-white/80 text-xs sm:text-sm mb-3 leading-relaxed">
            Monitoreo de participación en tiempo real
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen p-4">
        <div className="sp-container">
          <div className="sp-card-box">
            <header className="sp-header">
              <div className="sp-brand">
                <div className="sp-logo">
                  <img 
                    src="/escudo.png" 
                    alt="Escudo Colegio San Pedro" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="sp-title">
                  <h1>Detección de participación</h1>
                  <p>Colegio San Pedro</p>
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
                {/* Filtro de grado y sección */}
                <div className="sp-section-filter">
                  <div className="sp-filter-row">
                    <div className="sp-grade-display">
                      <Filter className="sp-filter-icon" />
                      <span className="sp-filter-text">Mi grado asignado:</span>
                      <span className="sp-grade-badge">{teacherGrade}</span>
                    </div>
                    <div className="sp-section-selector">
                      <span className="sp-filter-text">Filtrar por sección:</span>
                      <select
                        id="section-select"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={isRunning}
                        className="sp-filter-select"
                      >
                        {sections.map((section) => (
                          <option key={section} value={section}>
                            Sección {section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                </div>
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
                </div>
              </aside>
            </main>
          </div>
          <footer className="sp-footer">
            <span>© {new Date().getFullYear()} Colegio San Pedro</span>
          </footer>
        </div>
      </div>
    </div>
  )
}


