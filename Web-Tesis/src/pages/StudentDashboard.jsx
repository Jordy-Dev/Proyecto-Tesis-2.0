import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Clock, 
  Award, 
  FileText,
  LogOut,
  User,
  Calendar,
  Target,
  Star,
  Lightbulb,
  History,
  ArrowRight
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import DocumentUpload from '../components/DocumentUpload'
import toast from 'react-hot-toast'
import apiService from '../services/api'

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upload')
  const [exams, setExams] = useState([])
  const [documents, setDocuments] = useState([])
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    completedExams: 0,
    currentStreak: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar exámenes del usuario
      const examsResponse = await apiService.getUserExams()
      if (examsResponse.success) {
        setExams(examsResponse.data.exams)
      }

      // Cargar documentos del usuario
      const documentsResponse = await apiService.getUserDocuments()
      if (documentsResponse.success) {
        setDocuments(documentsResponse.data.documents)
      }

      // Cargar estadísticas del usuario (sin pasar ID, usa el usuario autenticado)
      const progressResponse = await apiService.getStudentProgress()
      if (progressResponse.success) {
        const progress = progressResponse.data.progress
        setStats({
          totalExams: progress.totalExamsTaken || 0,
          averageScore: Math.round(progress.averageScore || 0),
          completedExams: progress.totalExamsPassed || 0,
          currentStreak: progress.currentStreak || 0
        })
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
      toast.error('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      toast.success('Sesión cerrada correctamente')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  const handleDocumentProcessed = async (documentData) => {
    try {
      // Verificar que el documento esté completamente analizado
      if (documentData.status !== 'analyzed') {
        console.warn('Documento no está completamente analizado:', documentData.status)
        toast.info('Esperando a que el documento esté completamente procesado...')
        return
      }

      // Crear examen automáticamente después de procesar el documento
      const examData = {
        documentId: documentData.id || documentData._id,
        title: `Examen de ${documentData.fileName}`,
        description: `Examen generado automáticamente basado en ${documentData.fileName}`,
        totalQuestions: 10,
        passingScore: 70,
        timeLimit: 30
      }

      const response = await apiService.createExam(examData)
      if (response.success) {
        toast.success('¡Documento procesado y examen creado exitosamente!')
        
        // Redirigir automáticamente a la página del examen
        const examId = response.data.exam.id
        navigate(`/exam/${examId}`)
      }
    } catch (error) {
      console.error('Error creando examen:', error)
      toast.error(error.message || 'Error al crear el examen')
    }
  }

  const tabs = [
    { id: 'upload', label: 'Subir Documento', icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'exams', label: 'Mis Exámenes', icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'progress', label: 'Mi Progreso', icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 overflow-hidden">
      {/* Fondo animado sutil */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`bg-shape-${i}`}
            className="absolute rounded-full bg-indigo-300/20 blur-xl"
            animate={{
              x: [0, (i % 2 === 0 ? 1 : -1) * (55 + i * 6), 0],
              y: [0, (i % 3 === 0 ? -1 : 1) * (40 + i * 5), 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 14 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${140 + Math.random() * 120}px`,
              height: `${140 + Math.random() * 120}px`
            }}
          />
        ))}
      </div>
       {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-primary-500 to-secondary-500 shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center h-14 sm:h-16">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                 <img 
                   src="/escudo.png" 
                   alt="Escudo Colegio San Pedro" 
                   className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                 />
               </div>
               <div>
                 <h1 className="text-sm sm:text-xl font-bold text-white">Colegio San Pedro</h1>
                 <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Estudiante - {user?.grade}, Sección {user?.section}</p>
               </div>
             </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src={user?.avatarUrl} 
                  alt={user?.name}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                />
                <span className="text-white font-medium text-sm sm:text-base hidden sm:inline">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 sm:p-2 text-white/80 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-primary-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Exámenes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalExams}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-secondary-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Promedio</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.averageScore}%</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-secondary-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Completados</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.completedExams}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-purple-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Racha Actual</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.currentStreak}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-sm border border-primary-100 mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Tab: Subir Documento */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Sube tu documento
                  </h2>
                  <p className="text-gray-600">
                    Arrastra o selecciona un archivo para que la IA del Colegio San Pedro genere un examen personalizado
                  </p>
                </div>
                <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
              </motion.div>
            )}

            {/* Tab: Mis Exámenes */}
            {activeTab === 'exams' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Mis Exámenes
                  </h2>
                  <p className="text-gray-600">
                    Revisa tu historial de exámenes y resultados académicos
                  </p>
                </div>

                <div className="space-y-4">
                  {exams.map((exam) => (
                    <motion.div
                      key={exam._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg">{exam.title}</h3>
                        <p className="text-sm text-gray-500">
                          Fecha: {new Date(exam.createdAt).toLocaleDateString()} | 
                          Puntaje: {exam.result ? `${exam.result.percentageScore}%` : 'Pendiente'}
                        </p>
                      </div>
                      <Link
                        to={`/exam/${exam._id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                      >
                        {exam.result ? 'Ver Examen' : 'Realizar Examen'}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  ))}
                  {exams.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No has realizado ningún examen aún.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab: Mi Progreso */}
            {activeTab === 'progress' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Mi Progreso Académico
                  </h2>
                  <p className="text-gray-600">
                    Visualiza tu evolución en comprensión lectora en el Colegio San Pedro
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de progreso simulado */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Evolución de Calificaciones</h3>
                    {exams.length > 0 ? (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                        {/* Placeholder for a chart library like Recharts or Chart.js */}
                        Gráfico de progreso aquí (ej. línea de calificaciones)
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No hay datos de progreso para mostrar.</p>
                    )}
                  </div>

                  {/* Resumen de habilidades */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Resumen de Habilidades</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-gray-700">
                        <Award className="w-5 h-5 text-green-500" />
                        Comprensión General: <span className="font-semibold">
                          {stats.averageScore >= 90 ? 'Excelente' : 
                           stats.averageScore >= 80 ? 'Muy Bueno' : 
                           stats.averageScore >= 70 ? 'Bueno' : 
                           stats.averageScore >= 60 ? 'Regular' : 'Necesita Mejora'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <Lightbulb className="w-5 h-5 text-blue-500" />
                        Identificación de Ideas Principales: <span className="font-semibold">Bueno</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <History className="w-5 h-5 text-purple-500" />
                        Retención de Detalles: <span className="font-semibold">En Mejora</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard