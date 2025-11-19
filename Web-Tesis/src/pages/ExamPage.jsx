import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Brain,
  Target,
  Home,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiService from '../services/api'

const ExamPage = () => {
  const { examId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [examResult, setExamResult] = useState(null)
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    loadExam()
  }, [examId])

  useEffect(() => {
    let timer
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isStarted, timeLeft])

  // Guardar respuestas en localStorage para persistencia
  useEffect(() => {
    if (isStarted && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam-${examId}-answers`, JSON.stringify(answers))
    }
  }, [answers, examId, isStarted])

  const loadExam = async () => {
    try {
      setLoading(true)
      
      // Cargar examen
      const examResponse = await apiService.getExam(examId)
      if (examResponse.success) {
        const examData = examResponse.data.exam
        setExam(examData)
        
        // Verificar si ya tiene resultado
        if (examData.result) {
          setExamResult(examData.result)
          setHasAttempted(true)
          
          // Cargar resultado completo
          try {
            const resultResponse = await apiService.getExamResult(examId)
            if (resultResponse.success) {
              setExamResult(resultResponse.data.result)
            }
          } catch (error) {
            console.error('Error cargando resultado:', error)
          }
        }
        
        // Verificar que el examen esté listo
        if (examData.status === 'pending' || examData.status === 'processing') {
          toast('Las preguntas se están generando. Por favor, espera unos momentos...', { icon: '⏳' })
          await waitForExamReady(examId)
        }
        
        // Cargar preguntas
        const questionsResponse = await apiService.getExamQuestions(examId)
        if (questionsResponse.success && questionsResponse.data.questions) {
          const questionsData = questionsResponse.data.questions
          
          if (questionsData.length === 0) {
            toast.error('El examen aún no tiene preguntas. Por favor, intenta más tarde.')
            navigate('/student/dashboard')
            return
          }
          
          setQuestions(questionsData)
          
          // Cargar respuestas guardadas si existen
          const savedAnswers = localStorage.getItem(`exam-${examId}-answers`)
          if (savedAnswers && !hasAttempted) {
            try {
              setAnswers(JSON.parse(savedAnswers))
            } catch (error) {
              console.error('Error cargando respuestas guardadas:', error)
            }
          } else {
            // Inicializar respuestas
            const initialAnswers = {}
            questionsData.forEach(q => {
              initialAnswers[q._id] = null
            })
            setAnswers(initialAnswers)
          }
        } else {
          toast.error('No se pudieron cargar las preguntas del examen')
          navigate('/student/dashboard')
        }
      }
    } catch (error) {
      console.error('Error cargando examen:', error)
      toast.error(error.message || 'Error al cargar el examen')
      navigate('/student/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const waitForExamReady = async (examId) => {
    let attempts = 0
    const maxAttempts = 20 // Máximo 20 intentos (reducido para evitar rate limit)
    let baseDelay = 10000 // Empezar con 10 segundos
    
    while (attempts < maxAttempts) {
      // Backoff exponencial: 10s, 15s, 20s, 25s...
      const delay = baseDelay + (attempts * 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      try {
        const examResponse = await apiService.getExam(examId)
        if (examResponse.success) {
          const examData = examResponse.data.exam
          
          if (examData.status === 'ready') {
            setExam(examData)
            toast.success('¡El examen está listo!')
            return
          } else if (examData.status === 'error') {
            throw new Error('Error generando las preguntas del examen')
          }
        }
      } catch (error) {
        // Si es error 429 (rate limit), esperar más tiempo antes de reintentar
        if (error.message?.includes('429') || error.message?.includes('Demasiadas solicitudes')) {
          console.warn('Rate limit alcanzado, esperando más tiempo...')
          await new Promise(resolve => setTimeout(resolve, 30000)) // Esperar 30 segundos adicionales
          continue
        }
        console.error('Error verificando estado del examen:', error)
      }
      
      attempts++
    }
    
    throw new Error('El examen está tomando más tiempo del esperado. Por favor, intenta más tarde.')
  }

  const startExam = async () => {
    try {
      // Verificar que el examen esté listo antes de intentar iniciarlo
      if (exam.status !== 'ready') {
        toast('El examen aún no está listo. Por favor espera...', { icon: '⏳' })
        // Intentar esperar a que esté listo
        await waitForExamReady(examId)
        // Recargar el examen después de esperar
        const examResponse = await apiService.getExam(examId)
        if (examResponse.success) {
          setExam(examResponse.data.exam)
        }
        return
      }

      const response = await apiService.startExam(examId)
      if (response.success) {
        setIsStarted(true)
        setTimeLeft(exam.timeLimit * 60) // Convertir minutos a segundos
        toast.success('¡Examen iniciado! Buena suerte.')
        
        // Limpiar respuestas guardadas anteriores
        localStorage.removeItem(`exam-${examId}-answers`)
      }
    } catch (error) {
      console.error('Error iniciando examen:', error)
      // Mostrar el mensaje de error del servidor si está disponible
      const errorMessage = error.message || 'Error al iniciar el examen'
      toast.error(errorMessage)
    }
  }

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      // Scroll suave hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      // Scroll suave hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmitExam = async () => {
    if (isSubmitting) return
    
    // Contar respuestas no respondidas (null, undefined o cadena vacía)
    const unansweredCount = questions.filter(q => {
      const answer = answers[q._id];
      return answer === null || answer === undefined || answer === '';
    }).length
    
    if (unansweredCount > 0 && !showConfirmDialog) {
      setShowConfirmDialog(true)
      return
    }
    
    setIsSubmitting(true)
    setShowConfirmDialog(false)
    
    try {
      // Preparar respuestas para enviar - solo incluir respuestas válidas
      const answersToSubmit = Object.entries(answers)
        .filter(([questionId, answer]) => {
          // Solo incluir respuestas que no sean null, undefined o cadena vacía
          return answer !== null && answer !== undefined && answer !== '';
        })
        .map(([questionId, answer]) => ({
          questionId,
          selectedOption: answer,
          timeSpent: 30 // Tiempo simulado por pregunta
        }))

      const response = await apiService.submitExam(examId, answersToSubmit)
      if (response.success) {
        // Limpiar respuestas guardadas
        localStorage.removeItem(`exam-${examId}-answers`)
        
        // Cargar resultado
        const resultResponse = await apiService.getExamResult(examId)
        if (resultResponse.success) {
          setExamResult(resultResponse.data.result)
          setHasAttempted(true)
        }
        
        setIsStarted(false)
        toast.success('¡Examen completado exitosamente!')
      }
    } catch (error) {
      console.error('Error enviando examen:', error)
      toast.error('Error al enviar el examen')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetakeExam = () => {
    setHasAttempted(false)
    setExamResult(null)
    setIsStarted(false)
    setCurrentQuestion(0)
    
    // Limpiar respuestas
    const initialAnswers = {}
    questions.forEach(q => {
      initialAnswers[q._id] = null
    })
    setAnswers(initialAnswers)
    localStorage.removeItem(`exam-${examId}-answers`)
    
    toast('Preparando nuevo intento del examen...', { icon: '🔄' })
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Contar respuestas respondidas (que no sean null, undefined o cadena vacía)
  const answeredCount = questions.filter(q => {
    const answer = answers[q._id];
    return answer !== null && answer !== undefined && answer !== '';
  }).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-xl p-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"
          />
          <p className="text-gray-600 text-lg font-medium">Cargando examen...</p>
        </motion.div>
      </div>
    )
  }

  if (!exam || !questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 text-lg font-semibold mb-2">Examen no encontrado</p>
          <p className="text-gray-600 mb-6">No se pudo cargar el examen solicitado.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            Volver al Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  // Vista de resultado
  if (examResult && hasAttempted && !isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-500 to-secondary-500 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <img 
                  src="/escudo.png" 
                  alt="Escudo Colegio San Pedro" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-white">{exam.title}</h1>
                  <p className="text-sm text-white/80">Colegio San Pedro</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Resultado Header */}
            <div className={`p-8 text-center ${examResult.passed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                {examResult.passed ? (
                  <CheckCircle2 className="w-16 h-16 text-white" />
                ) : (
                  <XCircle className="w-16 h-16 text-white" />
                )}
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {examResult.passed ? '¡Felicitaciones!' : 'Sigue Practicando'}
              </h2>
              <p className="text-white/90 text-lg">
                {examResult.passed ? 'Has aprobado el examen' : 'Necesitas mejorar tu puntaje'}
              </p>
            </div>

            {/* Estadísticas */}
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{examResult.percentageScore}%</div>
                  <div className="text-sm text-blue-700 font-medium">Puntaje</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{examResult.correctAnswers}</div>
                  <div className="text-sm text-green-700 font-medium">Correctas</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center border border-red-200">
                  <div className="text-3xl font-bold text-red-600 mb-1">{examResult.incorrectAnswers}</div>
                  <div className="text-sm text-red-700 font-medium">Incorrectas</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-gray-600 mb-1">{examResult.unanswered || 0}</div>
                  <div className="text-sm text-gray-700 font-medium">Sin Responder</div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Puntaje Total</span>
                  <span className="text-sm font-medium text-gray-700">{exam.passingScore}% para aprobar</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${examResult.percentageScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      examResult.passed 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  <Home className="w-5 h-5" />
                  Volver al Dashboard
                </button>
                <button
                  onClick={handleRetakeExam}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <RotateCcw className="w-5 h-5" />
                  Realizar de Nuevo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/escudo.png" 
                alt="Escudo Colegio San Pedro" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white">{exam.title}</h1>
                <p className="text-sm text-white/80 hidden sm:block">Colegio San Pedro</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isStarted && (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="font-mono text-lg font-bold text-white">{formatTime(timeLeft)}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                title="Volver al dashboard"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isStarted ? (
          /* Pantalla de inicio */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 lg:p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600" />
            </motion.div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{exam.title}</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{exam.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200"
              >
                <BookOpen className="w-8 h-10 sm:w-10 sm:h-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Total de preguntas</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{exam.totalQuestions}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200"
              >
                <Target className="w-8 h-10 sm:w-10 sm:h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Puntaje de aprobación</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{exam.passingScore}%</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6 border border-purple-200"
              >
                <Clock className="w-8 h-10 sm:w-10 sm:h-12 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Tiempo límite</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{exam.timeLimit} min</p>
              </motion.div>
            </div>
            
            {exam.status !== 'ready' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  {exam.status === 'pending' || exam.status === 'processing' 
                    ? 'Las preguntas se están generando. Por favor espera...'
                    : 'El examen no está disponible en este momento.'}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver Atrás
              </button>
              <button
                onClick={startExam}
                disabled={exam.status !== 'ready' || questions.length === 0}
                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  exam.status === 'ready' && questions.length > 0
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {exam.status === 'ready' && questions.length > 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Iniciar Examen
                  </>
                ) : exam.status === 'pending' || exam.status === 'processing' ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generando preguntas...
                  </>
                ) : (
                  'Examen no disponible'
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Examen en progreso */
          <div className="space-y-4 sm:space-y-6">
            {/* Barra de progreso y estadísticas */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-700">
                    Pregunta {currentQuestion + 1} de {questions.length}
                  </span>
                  <div className="mt-1 text-xs sm:text-sm text-gray-500">
                    {answeredCount} respondidas • {questions.length - answeredCount} sin responder
                  </div>
                </div>
                <span className="text-sm sm:text-base text-gray-500">{Math.round(progress)}% completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Pregunta actual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                      Pregunta {currentQ.questionNumber || currentQuestion + 1}
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 leading-relaxed">
                      {currentQ.questionText}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {currentQ.options?.map((option) => (
                    <motion.label
                      key={option.letter}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-start p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        answers[currentQ._id] === option.letter
                          ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 shadow-md'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ._id}`}
                        value={option.letter}
                        checked={answers[currentQ._id] === option.letter}
                        onChange={() => handleAnswerSelect(currentQ._id, option.letter)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 ${
                        answers[currentQ._id] === option.letter
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {answers[currentQ._id] === option.letter && (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-primary-600 mr-2 text-lg">{option.letter}.</span>
                        <span className="text-gray-700 text-base sm:text-lg">{option.text}</span>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navegación de preguntas */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              {/* Mini navegador de preguntas */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Navegación rápida:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {questions.map((q, index) => (
                    <button
                      key={q._id}
                      onClick={() => goToQuestion(index)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-all ${
                        index === currentQuestion
                          ? 'bg-primary-500 text-white shadow-lg scale-110'
                          : answers[q._id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={`Pregunta ${index + 1}${answers[q._id] ? ' - Respondida' : ' - Sin responder'}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all disabled:hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                
                <div className="text-sm text-gray-600">
                  {answeredCount} / {questions.length} respondidas
                </div>
                
                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Finalizar Examen</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diálogo de confirmación */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
            >
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">¿Finalizar examen?</h3>
              <p className="text-gray-600 text-center mb-6">
                Tienes {questions.filter(q => {
                  const answer = answers[q._id];
                  return answer === null || answer === undefined || answer === '';
                }).length} pregunta(s) sin responder.
                ¿Estás seguro de que deseas finalizar el examen?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  Sí, Finalizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamPage
