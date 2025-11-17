const User = require('../models/User');
const StudentProgress = require('../models/StudentProgress');
const ExamResult = require('../models/ExamResult');
const Exam = require('../models/Exam');

// Obtener estudiantes por grado y sección
const getStudents = async (req, res, next) => {
  try {
    const { grade, section } = req.query;
    const teacherGrade = req.user.grade;

    // Verificar que el docente puede acceder a este grado
    if (grade && grade !== teacherGrade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a estudiantes de tu grado asignado'
      });
    }

    // Construir filtro
    const filter = { userType: 'student' };
    if (grade) {
      filter.grade = grade;
    } else {
      filter.grade = teacherGrade;
    }
    if (section) {
      filter.section = section;
    }

    // Obtener estudiantes con progreso
    const students = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'studentprogresses',
          localField: '_id',
          foreignField: 'userId',
          as: 'progress'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          grade: 1,
          section: 1,
          avatarUrl: 1,
          status: 1,
          createdAt: 1,
          progress: { $arrayElemAt: ['$progress', 0] }
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        students
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estudiante específico
const getStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const teacherGrade = req.user.grade;

    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Verificar que el estudiante pertenece al grado del docente
    if (student.grade !== teacherGrade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a estudiantes de tu grado asignado'
      });
    }

    // Obtener progreso del estudiante
    const progress = await StudentProgress.findOne({ userId: studentId });

    res.json({
      success: true,
      data: {
        student: student.toPublicJSON(),
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener progreso del estudiante
const getStudentProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Reglas de acceso:
    // - Si es docente, solo puede ver estudiantes de su grado
    // - Si es estudiante, solo puede ver su propio progreso
    if (req.user.userType === 'teacher') {
      const teacherGrade = req.user.grade;
      if (student.grade !== teacherGrade) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a estudiantes de tu grado asignado'
        });
      }
    } else if (req.user.userType === 'student') {
      if (student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tu propio progreso'
        });
      }
    }

    // Obtener estadísticas reales desde ExamResult
    const stats = await ExamResult.getUserStatistics(studentId);

    // Contar exámenes totales y completados para el estudiante
    const totalExams = await Exam.countDocuments({ userId: studentId });
    const completedExams = await Exam.countDocuments({ userId: studentId, status: 'completed' });

    // Obtener último examen completado para la fecha
    const lastResult = await ExamResult.findOne({ userId: studentId })
      .sort({ completedAt: -1 })
      .select('completedAt');

    // Calcular racha actual de exámenes aprobados (consecutivos desde el más reciente)
    const resultsForStreak = await ExamResult.find({ userId: studentId }).sort({ completedAt: -1 });
    let currentStreak = 0;
    let longestStreak = 0;

    for (const r of resultsForStreak) {
      if (r.passed) {
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        // Rompe la racha actual pero seguimos buscando la más larga
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        currentStreak = 0;
      }
    }

    const progress = {
      userId: studentId,
      totalExamsTaken: totalExams,
      totalExamsPassed: stats.passedExams || 0,
      totalExamsFailed: stats.failedExams || 0,
      averageScore: stats.averageScore || 0,
      currentStreak,
      longestStreak,
      lastExamDate: lastResult ? lastResult.completedAt : null
    };

    const statistics = {
      totalExams: stats.totalExams || 0,
      passedExams: stats.passedExams || 0,
      failedExams: stats.failedExams || 0,
      averageScore: stats.averageScore || 0,
      highestScore: stats.highestScore || 0,
      lowestScore: stats.lowestScore || 0,
      totalPoints: stats.totalPoints || 0,
      averageTime: stats.averageTime || 0
    };

    res.json({
      success: true,
      data: {
        progress,
        statistics
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener exámenes del estudiante
const getStudentExams = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const teacherGrade = req.user.grade;

    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Verificar que el estudiante pertenece al grado del docente
    if (student.grade !== teacherGrade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a estudiantes de tu grado asignado'
      });
    }

    // Calcular paginación
    const skip = (page - 1) * limit;

    // Obtener exámenes del estudiante
    const exams = await Exam.find({ userId: studentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('document', 'fileName')
      .populate('result', 'percentageScore passed completedAt');

    // Contar total
    const total = await Exam.countDocuments({ userId: studentId });

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas generales
const getStatistics = async (req, res, next) => {
  try {
    const teacherGrade = req.user.grade;

    // Obtener estadísticas por grado
    const gradeStats = await User.aggregate([
      {
        $match: {
          userType: 'student',
          grade: teacherGrade
        }
      },
      {
        $lookup: {
          from: 'studentprogresses',
          localField: '_id',
          foreignField: 'userId',
          as: 'progress'
        }
      },
      {
        $group: {
          _id: '$section',
          totalStudents: { $sum: 1 },
          averageScore: { $avg: { $arrayElemAt: ['$progress.averageScore', 0] } },
          totalExams: { $sum: { $arrayElemAt: ['$progress.totalExamsTaken', 0] } },
          activeStudents: {
            $sum: {
              $cond: [
                { $gt: [{ $arrayElemAt: ['$progress.lastActivityAt', 0] }, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          section: '$_id',
          totalStudents: 1,
          averageScore: { $round: ['$averageScore', 2] },
          totalExams: 1,
          activeStudents: 1,
          _id: 0
        }
      }
    ]);

    // Obtener estudiantes que necesitan atención
    const studentsNeedingAttention = await StudentProgress.findNeedingAttention(teacherGrade);

    // Obtener ranking de estudiantes
    const ranking = await StudentProgress.getRanking(teacherGrade, 10);

    res.json({
      success: true,
      data: {
        gradeStats,
        studentsNeedingAttention,
        ranking
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener ranking de estudiantes
const getRanking = async (req, res, next) => {
  try {
    const { grade, section, limit = 10 } = req.query;
    const teacherGrade = req.user.grade;

    // Verificar que el docente puede acceder a este grado
    if (grade && grade !== teacherGrade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a estudiantes de tu grado asignado'
      });
    }

    // Obtener ranking
    const ranking = await StudentProgress.getRanking(grade || teacherGrade, parseInt(limit));

    res.json({
      success: true,
      data: {
        ranking
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudent,
  getStudentProgress,
  getStudentExams,
  getStatistics,
  getRanking
};


