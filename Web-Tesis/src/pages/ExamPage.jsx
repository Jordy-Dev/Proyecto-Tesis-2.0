import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Brain,
  Target
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

  const loadExam = async () => {
    try {
      setLoading(true)
      
      // Cargar examen
      const examResponse = await apiService.getExam(examId)
      if (examResponse.success) {
        setExam(examResponse.data.exam)
        
        // Cargar preguntas
        const questionsResponse = await apiService.getExamQuestions(examId)
        if (questionsResponse.success) {
          setQuestions(questionsResponse.data.questions)
          
          // Inicializar respuestas
          const initialAnswers = {}
          questionsResponse.data.questions.forEach(q => {
            initialAnswers[q._id] = null
          })
          setAnswers(initialAnswers)
        }
      }
    } catch (error) {
      console.error('Error cargando examen:', error)
      toast.error('Error al cargar el examen')
      navigate('/student-dashboard')
    } finally {
      setLoading(false)
    }
  }

  const startExam = async () => {
    try {
      const response = await apiService.startExam(examId)
      if (response.success) {
        setIsStarted(true)
        setTimeLeft(exam.timeLimit * 60) // Convertir minutos a segundos
        toast.success('¡Examen iniciado!')
      }
    } catch (error) {
      console.error('Error iniciando examen:', error)
      toast.error('Error al iniciar el examen')
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
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitExam = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Preparar respuestas para enviar
      const answersToSubmit = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        selectedOption: answer,
        timeSpent: 30 // Tiempo simulado por pregunta
      }))

      const response = await apiService.submitExam(examId, answersToSubmit)
      if (response.success) {
        toast.success('¡Examen completado exitosamente!')
        navigate('/student-dashboard')
      }
    } catch (error) {
      console.error('Error enviando examen:', error)
      toast.error('Error al enviar el examen')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando examen...</p>
        </div>
      </div>
    )
  }

  if (!exam || !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Examen no encontrado</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/escudo.png" 
                alt="Escudo Colegio San Pedro" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-800">{exam.title}</h1>
                <p className="text-sm text-gray-600">Colegio San Pedro</p>
              </div>
            </div>
            
            {isStarted && (
              <div className="flex items-center gap-2 text-red-600">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isStarted ? (
          /* Pantalla de inicio */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"
          >
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-primary-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{exam.title}</h2>
            <p className="text-gray-600 mb-6">{exam.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total de preguntas</p>
                <p className="text-xl font-bold text-gray-800">{exam.totalQuestions}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Puntaje de aprobación</p>
                <p className="text-xl font-bold text-gray-800">{exam.passingScore}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Tiempo límite</p>
                <p className="text-xl font-bold text-gray-800">{exam.timeLimit} min</p>
              </div>
            </div>
            
            <button
              onClick={startExam}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Iniciar Examen
            </button>
          </motion.div>
        ) : (
          /* Examen en progreso */
          <div className="space-y-6">
            {/* Barra de progreso */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Pregunta {currentQuestion + 1} de {questions.length}
                </span>
                <span className="text-sm text-gray-500">{Math.round(progress)}% completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Pregunta actual */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                {currentQ.questionText}
              </h3>
              
              <div className="space-y-3">
                {currentQ.options?.map((option) => (
                  <label
                    key={option.letter}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      answers[currentQ._id] === option.letter
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
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
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      answers[currentQ._id] === option.letter
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQ._id] === option.letter && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </span>
                    <span className="font-medium text-gray-700 mr-3">{option.letter}.</span>
                    <span className="text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Navegación */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
              
              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      index === currentQuestion
                        ? 'bg-primary-500 text-white'
                        : answers[questions[index]._id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      Finalizar Examen
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExamPage