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

// Obtener progreso del estudiante (para docentes)
const getStudentProgress = async (req, res, next) => {
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

    const progress = await StudentProgress.findOne({ userId: studentId });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progreso no encontrado'
      });
    }

    // Obtener estadísticas detalladas
    const statistics = await ExamResult.getUserStatistics(studentId);

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

// Obtener progreso del estudiante autenticado (para estudiantes)
const getMyProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Verificar que el usuario es estudiante
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Solo los estudiantes pueden acceder a su progreso'
      });
    }

    // Obtener o crear progreso del estudiante
    let progress = await StudentProgress.findOne({ userId });
    
    if (!progress) {
      // Crear progreso inicial si no existe
      progress = new StudentProgress({
        userId,
        totalExamsTaken: 0,
        totalExamsPassed: 0,
        averageScore: 0,
        currentStreak: 0
      });
      await progress.save();
    }

    // Obtener estadísticas detalladas
    let statistics = {};
    try {
      statistics = await ExamResult.getUserStatistics(userId);
    } catch (statError) {
      console.error('Error obteniendo estadísticas:', statError);
      // Continuar sin estadísticas si hay error
    }

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
  getMyProgress,
  getStudentExams,
  getStatistics,
  getRanking
};


