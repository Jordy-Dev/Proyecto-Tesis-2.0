// Servicio para seguimiento de progreso y calificaciones
// Maneja el almacenamiento y análisis de datos de estudiantes

class ProgressService {
  constructor() {
    this.storageKey = 'asistente_lectura_data'
    this.initializeStorage()
  }

  // Inicializar almacenamiento local
  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        students: {},
        teachers: {},
        exams: {},
        results: {},
        statistics: {}
      }
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
    }
  }

  // Obtener todos los datos
  getAllData() {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : null
  }

  // Guardar datos
  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  // Guardar resultado de examen
  saveExamResult(studentId, examId, result) {
    const data = this.getAllData()
    
    if (!data.results[studentId]) {
      data.results[studentId] = []
    }

    // Verificar si ya existe un resultado para este examen
    const existingIndex = data.results[studentId].findIndex(r => r.examId === examId)
    
    const examResult = {
      examId,
      studentId,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      completedAt: result.completedAt,
      answers: result.answers,
      timeSpent: result.timeSpent || 0,
      attempts: result.attempts || 1
    }

    if (existingIndex >= 0) {
      // Actualizar resultado existente
      examResult.attempts = (data.results[studentId][existingIndex].attempts || 1) + 1
      data.results[studentId][existingIndex] = examResult
    } else {
      // Agregar nuevo resultado
      data.results[studentId].push(examResult)
    }

    this.saveData(data)
    this.updateStudentStatistics(studentId)
    return examResult
  }

  // Obtener resultados de un estudiante
  getStudentResults(studentId) {
    const data = this.getAllData()
    return data.results[studentId] || []
  }

  // Obtener estadísticas de un estudiante
  getStudentStatistics(studentId) {
    const data = this.getAllData()
    return data.statistics[studentId] || this.calculateStudentStatistics(studentId)
  }

  // Calcular estadísticas de un estudiante
  calculateStudentStatistics(studentId) {
    const results = this.getStudentResults(studentId)
    
    if (results.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalTimeSpent: 0,
        averageTimePerExam: 0,
        improvementTrend: 0,
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    }

    const scores = results.map(r => r.score)
    const times = results.map(r => r.timeSpent).filter(t => t > 0)
    
    const totalExams = results.length
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalExams)
    const bestScore = Math.max(...scores)
    const worstScore = Math.min(...scores)
    const totalTimeSpent = times.reduce((sum, time) => sum + time, 0)
    const averageTimePerExam = times.length > 0 ? Math.round(totalTimeSpent / times.length) : 0

    // Calcular tendencia de mejora (últimos 5 exámenes vs primeros 5)
    let improvementTrend = 0
    if (results.length >= 5) {
      const recentScores = results.slice(-5).map(r => r.score)
      const earlyScores = results.slice(0, 5).map(r => r.score)
      const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
      const earlyAvg = earlyScores.reduce((sum, score) => sum + score, 0) / earlyScores.length
      improvementTrend = Math.round(recentAvg - earlyAvg)
    }

    // Analizar fortalezas y debilidades
    const strengths = this.analyzeStrengths(results)
    const weaknesses = this.analyzeWeaknesses(results)
    const recommendations = this.generateRecommendations(averageScore, improvementTrend, weaknesses)

    const statistics = {
      totalExams,
      averageScore,
      bestScore,
      worstScore,
      totalTimeSpent,
      averageTimePerExam,
      improvementTrend,
      strengths,
      weaknesses,
      recommendations,
      lastUpdated: new Date().toISOString()
    }

    // Guardar estadísticas calculadas
    const data = this.getAllData()
    data.statistics[studentId] = statistics
    this.saveData(data)

    return statistics
  }

  // Actualizar estadísticas de estudiante
  updateStudentStatistics(studentId) {
    const statistics = this.calculateStudentStatistics(studentId)
    const data = this.getAllData()
    data.statistics[studentId] = statistics
    this.saveData(data)
    return statistics
  }

  // Analizar fortalezas del estudiante
  analyzeStrengths(results) {
    const strengths = []
    
    // Análisis de puntuaciones altas
    const highScores = results.filter(r => r.score >= 90)
    if (highScores.length > 0) {
      strengths.push(`Excelente rendimiento en ${highScores.length} examen(es)`)
    }

    // Análisis de mejora
    if (results.length >= 3) {
      const recentScores = results.slice(-3).map(r => r.score)
      const isImproving = recentScores.every((score, index) => 
        index === 0 || score >= recentScores[index - 1]
      )
      if (isImproving) {
        strengths.push('Tendencia de mejora constante')
      }
    }

    // Análisis de tiempo
    const fastExams = results.filter(r => r.timeSpent > 0 && r.timeSpent < 300) // Menos de 5 minutos
    if (fastExams.length > results.length * 0.5) {
      strengths.push('Completación rápida de exámenes')
    }

    return strengths.length > 0 ? strengths : ['Necesita más datos para análisis']
  }

  // Analizar debilidades del estudiante
  analyzeWeaknesses(results) {
    const weaknesses = []
    
    // Análisis de puntuaciones bajas
    const lowScores = results.filter(r => r.score < 70)
    if (lowScores.length > 0) {
      weaknesses.push(`Dificultades en ${lowScores.length} examen(es)`)
    }

    // Análisis de tiempo excesivo
    const slowExams = results.filter(r => r.timeSpent > 600) // Más de 10 minutos
    if (slowExams.length > 0) {
      weaknesses.push('Tiempo excesivo en algunos exámenes')
    }

    // Análisis de regresión
    if (results.length >= 3) {
      const recentScores = results.slice(-3).map(r => r.score)
      const isDeclining = recentScores.every((score, index) => 
        index === 0 || score <= recentScores[index - 1]
      )
      if (isDeclining) {
        weaknesses.push('Tendencia de declive en el rendimiento')
      }
    }

    return weaknesses.length > 0 ? weaknesses : ['Rendimiento estable']
  }

  // Generar recomendaciones
  generateRecommendations(averageScore, improvementTrend, weaknesses) {
    const recommendations = []

    if (averageScore < 70) {
      recommendations.push('Practicar más ejercicios de comprensión lectora')
      recommendations.push('Revisar conceptos básicos antes de los exámenes')
    } else if (averageScore < 85) {
      recommendations.push('Enfocarse en mejorar la precisión en las respuestas')
      recommendations.push('Tomarse más tiempo para leer cuidadosamente')
    } else {
      recommendations.push('Mantener el excelente rendimiento')
      recommendations.push('Explorar temas más avanzados')
    }

    if (improvementTrend < 0) {
      recommendations.push('Identificar áreas específicas de dificultad')
      recommendations.push('Solicitar ayuda adicional si es necesario')
    }

    if (weaknesses.includes('Tiempo excesivo en algunos exámenes')) {
      recommendations.push('Practicar técnicas de lectura rápida')
      recommendations.push('Mejorar la gestión del tiempo')
    }

    return recommendations
  }

  // Obtener datos para dashboard de profesor
  getTeacherDashboardData(grade, section) {
    const data = this.getAllData()
    const students = Object.values(data.students).filter(student => 
      student.grade === grade && student.section === section
    )

    const dashboardData = students.map(student => {
      const results = this.getStudentResults(student.id)
      const statistics = this.getStudentStatistics(student.id)
      
      return {
        ...student,
        results,
        statistics,
        lastActivity: results.length > 0 ? 
          Math.max(...results.map(r => new Date(r.completedAt).getTime())) : 
          new Date(student.createdAt).getTime()
      }
    })

    return dashboardData
  }

  // Obtener estadísticas generales de la clase
  getClassStatistics(grade, section) {
    const students = this.getTeacherDashboardData(grade, section)
    
    if (students.length === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        totalExams: 0,
        activeStudents: 0,
        topPerformers: [],
        needsAttention: []
      }
    }

    const allResults = students.flatMap(s => s.results)
    const totalExams = allResults.length
    const averageScore = totalExams > 0 ? 
      Math.round(allResults.reduce((sum, r) => sum + r.score, 0) / totalExams) : 0
    
    const activeStudents = students.filter(s => 
      s.results.length > 0 && 
      new Date(s.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
    ).length

    const topPerformers = students
      .filter(s => s.statistics.averageScore >= 85)
      .sort((a, b) => b.statistics.averageScore - a.statistics.averageScore)
      .slice(0, 3)

    const needsAttention = students
      .filter(s => s.statistics.averageScore < 70 || s.statistics.improvementTrend < -5)
      .sort((a, b) => a.statistics.averageScore - b.statistics.averageScore)

    return {
      totalStudents: students.length,
      averageScore,
      totalExams,
      activeStudents,
      topPerformers,
      needsAttention
    }
  }

  // Exportar datos de estudiante
  exportStudentData(studentId) {
    const student = this.getStudentResults(studentId)
    const statistics = this.getStudentStatistics(studentId)
    
    return {
      studentId,
      results: student,
      statistics,
      exportedAt: new Date().toISOString()
    }
  }

  // Limpiar datos antiguos (más de 1 año)
  cleanupOldData() {
    const data = this.getAllData()
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    
    Object.keys(data.results).forEach(studentId => {
      data.results[studentId] = data.results[studentId].filter(result => 
        new Date(result.completedAt) > oneYearAgo
      )
    })

    this.saveData(data)
  }
}

// Instancia singleton del servicio
const progressService = new ProgressService()

export default progressService
