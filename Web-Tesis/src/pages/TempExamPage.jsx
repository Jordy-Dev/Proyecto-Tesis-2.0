import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, BookOpen, CheckCircle, ArrowLeft, ArrowRight, Brain, Target } from 'lucide-react'
import toast from 'react-hot-toast'

const TempExamPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { exam, questions } = location.state || {}

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(exam?.timeLimit ? exam.timeLimit * 60 : 0)
  const [isStarted, setIsStarted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!exam || !questions || !questions.length) {
      toast.error('Datos de examen no disponibles')
      navigate('/student/dashboard')
    }
  }, [exam, questions, navigate])

  useEffect(() => {
    let timer
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isStarted, timeLeft])

  if (!exam || !questions || !questions.length) {
    return null
  }

  const startExam = () => {
    setIsStarted(true)
    if (!timeLeft && exam.timeLimit) {
      setTimeLeft(exam.timeLimit * 60)
    }
  }

  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
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

  const handleSubmitExam = () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const total = questions.length
    let correct = 0

    questions.forEach((q, index) => {
      const selected = answers[index]
      const correctOption = q.options?.find(o => o.isCorrect)
      if (selected && correctOption && selected === correctOption.letter) {
        correct += 1
      }
    })

    const percentage = total ? Math.round((correct / total) * 100) : 0

    toast.success(`Examen finalizado. Puntaje: ${percentage}% (${correct}/${total})`)
    navigate('/student/dashboard')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/escudo.png" alt="Escudo Colegio San Pedro" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">{exam.title}</h1>
                <p className="text-sm text-gray-600">Examen temporal (no se guarda en la base de datos)</p>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"
          >
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{exam.title}</h2>
            <p className="text-gray-600 mb-6">Examen generado automáticamente con IA (no se guarda en la base de datos).</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total de preguntas</p>
                <p className="text-xl font-bold text-gray-800">{questions.length}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Puntaje de aprobación</p>
                <p className="text-xl font-bold text-gray-800">70%</p>
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
          <div className="space-y-6">
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
                      answers[currentQuestion] === option.letter
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option.letter}
                      checked={answers[currentQuestion] === option.letter}
                      onChange={() => handleAnswerSelect(currentQuestion, option.letter)}
                      className="sr-only"
                    />
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      answers[currentQuestion] === option.letter
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion] === option.letter && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </span>
                    <span className="font-medium text-gray-700 mr-3">{option.letter}.</span>
                    <span className="text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
            </motion.div>

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
                        : answers[index]
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

export default TempExamPage
