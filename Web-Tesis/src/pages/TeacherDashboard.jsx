import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  AlertCircle,
  LogOut,
  User,
  Calendar,
  Target,
  Star,
  Eye,
  Filter,
  Download,
  BarChart3,
  PieChart,
  CheckCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiService from '../services/api'

const TeacherDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSection, setSelectedSection] = useState('A')
  const [students, setStudents] = useState([])
  const [exams, setExams] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    totalExams: 0,
    activeStudents: 0
  })

  const sections = ['A', 'B']
  const teacherGrade = user?.grade || '1er Grado'

  useEffect(() => {
    loadDashboardData()
  }, [selectedSection])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar estudiantes del grado del docente
      const studentsResponse = await apiService.getStudents(teacherGrade, selectedSection)
      if (studentsResponse.success) {
        setStudents(studentsResponse.data.students)
      }

      // Cargar exámenes del grado
      const examsResponse = await apiService.getExamsByGrade(teacherGrade, selectedSection)
      if (examsResponse.success) {
        setExams(examsResponse.data.exams)
      }

      // Cargar estadísticas
      const statsResponse = await apiService.getStatistics()
      if (statsResponse.success) {
        setStatistics(statsResponse.data)
        
        // Actualizar stats locales basado en la sección seleccionada
        const sectionStats = statsResponse.data.gradeStats.find(stat => stat.section === selectedSection)
        if (sectionStats) {
          setStats({
            totalStudents: sectionStats.totalStudents,
            averageScore: Math.round(sectionStats.averageScore || 0),
            totalExams: sectionStats.totalExams,
            activeStudents: sectionStats.activeStudents
          })
        }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'overview', label: 'Resumen General', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'students', label: 'Estudiantes', icon: <Users className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analíticas', icon: <PieChart className="w-5 h-5" /> }
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
            key={`bg-shape-teacher-${i}`}
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
                 <h1 className="text-sm sm:text-xl font-bold text-white">Panel de Docente - Colegio San Pedro</h1>
                 <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Monitoreo y seguimiento de estudiantes</p>
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
        {/* Filtros */}
        <div className="bg-gradient-to-br from-white to-primary-50 rounded-2xl p-4 sm:p-6 shadow-sm border border-primary-100 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Mi grado asignado:</h3>
              <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-semibold">
                {teacherGrade}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-600">Filtrar por sección:</h3>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {sections.map(section => (
                  <option key={section} value={section}>Sección {section}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            Como docente de {teacherGrade}, tienes acceso a ambas secciones (A y B) de tu grado.
          </p>
        </div>

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
                <p className="text-xs sm:text-sm text-gray-600">Total Estudiantes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                <p className="text-xs sm:text-sm text-gray-600">Promedio General</p>
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
                <p className="text-xs sm:text-sm text-gray-600">Total Exámenes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalExams}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                <p className="text-xs sm:text-sm text-gray-600">Estudiantes Activos</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.activeStudents}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-sm border border-primary-100">
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
            {/* Tab: Resumen General */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Resumen General - {teacherGrade}, Sección {selectedSection}
                  </h2>
                  <p className="text-gray-600">
                    Vista general del rendimiento académico de los estudiantes del Colegio San Pedro
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Estudiantes que necesitan atención */}
                  <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <h3 className="font-semibold text-red-800 text-lg">Estudiantes que necesitan atención</h3>
                    </div>
                    <ul className="space-y-3">
                      {statistics?.studentsNeedingAttention?.filter(s => s.averageScore < 70).map((student) => (
                        <li key={student.userId} className="flex items-center justify-between text-gray-700">
                          <span>{student.name}</span>
                          <span className="font-semibold text-red-600">{student.averageScore}%</span>
                        </li>
                      ))}
                      {(!statistics?.studentsNeedingAttention || statistics.studentsNeedingAttention.filter(s => s.averageScore < 70).length === 0) && (
                        <p className="text-gray-500 text-center">¡Todos los estudiantes están bien!</p>
                      )}
                    </ul>
                  </div>

                  {/* Estudiantes destacados */}
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <h3 className="font-semibold text-green-800 text-lg">Estudiantes destacados</h3>
                    </div>
                    <ul className="space-y-3">
                      {statistics?.studentsNeedingAttention?.filter(s => s.averageScore >= 90).map((student) => (
                        <li key={student.userId} className="flex items-center justify-between text-gray-700">
                          <span>{student.name}</span>
                          <span className="font-semibold text-green-600">{student.averageScore}%</span>
                        </li>
                      ))}
                      {(!statistics?.studentsNeedingAttention || statistics.studentsNeedingAttention.filter(s => s.averageScore >= 90).length === 0) && (
                        <p className="text-gray-500 text-center">No hay estudiantes destacados en este momento.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Lista de Estudiantes */}
            {activeTab === 'students' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Lista de Estudiantes
                    </h2>
                    <p className="text-gray-600">
                      {teacherGrade}, Sección {selectedSection} - {students.length} estudiantes
                    </p>
                  </div>
                  <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estudiante
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Promedio
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exámenes
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Última Actividad
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={student.avatarUrl} 
                                alt={student.name}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.section}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (student.progress?.averageScore || 0) >= 80 
                                ? 'bg-green-100 text-green-800' 
                                : (student.progress?.averageScore || 0) >= 70 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.progress?.averageScore || 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.progress?.totalExamsTaken || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.progress?.lastActivityAt 
                              ? formatDate(student.progress.lastActivityAt)
                              : 'Sin actividad'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Tab: Analíticas */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Analíticas y Reportes
                  </h2>
                  <p className="text-gray-600">
                    Análisis detallado del rendimiento académico de los estudiantes
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ranking de estudiantes */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Top 10 Estudiantes</h3>
                    {statistics?.ranking && statistics.ranking.length > 0 ? (
                      <div className="space-y-3">
                        {statistics.ranking.slice(0, 10).map((student, index) => (
                          <div key={student.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{student.name}</span>
                            </div>
                            <span className="font-semibold text-gray-800">{student.averageScore}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No hay datos de ranking disponibles.</p>
                    )}
                  </div>

                  {/* Estadísticas por sección */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Estadísticas por Sección</h3>
                    {statistics?.gradeStats && statistics.gradeStats.length > 0 ? (
                      <div className="space-y-4">
                        {statistics.gradeStats.map((sectionStat) => (
                          <div key={sectionStat.section} className="border-l-4 border-primary-500 pl-4">
                            <h4 className="font-medium text-gray-800">Sección {sectionStat.section}</h4>
                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-600">Estudiantes:</span>
                                <span className="ml-2 font-semibold">{sectionStat.totalStudents}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Promedio:</span>
                                <span className="ml-2 font-semibold">{Math.round(sectionStat.averageScore || 0)}%</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Exámenes:</span>
                                <span className="ml-2 font-semibold">{sectionStat.totalExams}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Activos:</span>
                                <span className="ml-2 font-semibold">{sectionStat.activeStudents}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No hay estadísticas disponibles.</p>
                    )}
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

export default TeacherDashboard