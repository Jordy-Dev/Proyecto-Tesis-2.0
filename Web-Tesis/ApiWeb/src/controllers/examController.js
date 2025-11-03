const Exam = require('../models/Exam');
const Question = require('../models/Question');
const QuestionOption = require('../models/QuestionOption');
const StudentAnswer = require('../models/StudentAnswer');
const ExamResult = require('../models/ExamResult');
const StudentProgress = require('../models/StudentProgress');

// Crear examen
const createExam = async (req, res, next) => {
  try {
    const { documentId, title, description, totalQuestions, passingScore, timeLimit } = req.body;
    const userId = req.user._id;

    // Verificar que el documento existe y está analizado
    const Document = require('../models/Document');
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    if (document.status !== 'analyzed') {
      return res.status(400).json({
        success: false,
        message: 'El documento debe estar analizado para generar un examen'
      });
    }

    // Crear examen
    const exam = new Exam({
      documentId,
      userId,
      title,
      description,
      totalQuestions,
      passingScore,
      timeLimit,
      status: 'pending'
    });

    await exam.save();

    // Generar preguntas simuladas
    await generateQuestions(exam._id, totalQuestions);

    res.status(201).json({
      success: true,
      message: 'Examen creado exitosamente',
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
          status: exam.status,
          createdAt: exam.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generar preguntas simuladas
const generateQuestions = async (examId, totalQuestions) => {
  const questions = [];
  
  for (let i = 1; i <= totalQuestions; i++) {
    const question = new Question({
      examId,
      questionNumber: i,
      questionText: `Pregunta ${i}: ¿Cuál es la respuesta correcta?`,
      questionType: 'multiple_choice',
      points: 10,
      difficulty: 'medium',
      aiReasoning: 'Pregunta generada automáticamente por IA'
    });

    await question.save();
    questions.push(question);

    // Generar opciones para cada pregunta
    const options = [
      { letter: 'A', text: 'Opción A', isCorrect: true },
      { letter: 'B', text: 'Opción B', isCorrect: false },
      { letter: 'C', text: 'Opción C', isCorrect: false },
      { letter: 'D', text: 'Opción D', isCorrect: false }
    ];

    for (let j = 0; j < options.length; j++) {
      const option = new QuestionOption({
        questionId: question._id,
        optionLetter: options[j].letter,
        optionText: options[j].text,
        isCorrect: options[j].isCorrect,
        orderNumber: j + 1
      });

      await option.save();
    }
  }

  return questions;
};

// Obtener exámenes del usuario
const getUserExams = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    // Construir filtro
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Calcular paginación
    const skip = (page - 1) * limit;

    // Obtener exámenes
    const exams = await Exam.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('document', 'fileName')
      .populate('result', 'percentageScore passed completedAt');

    // Contar total
    const total = await Exam.countDocuments(filter);

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

// Obtener exámenes por grado (para docentes)
const getExamsByGrade = async (req, res, next) => {
  try {
    const { grade, section } = req.query;
    const teacherGrade = req.user.grade;

    // Verificar que el docente puede acceder a este grado
    if (grade && grade !== teacherGrade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a exámenes de tu grado asignado'
      });
    }

    // Obtener exámenes con información del usuario
    const exams = await Exam.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.userType': 'student',
          'user.grade': grade || teacherGrade,
          ...(section && { 'user.section': section })
        }
      },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document'
        }
      },
      {
        $lookup: {
          from: 'examresults',
          localField: '_id',
          foreignField: 'examId',
          as: 'result'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          totalQuestions: 1,
          status: 1,
          createdAt: 1,
          'user.name': 1,
          'user.grade': 1,
          'user.section': 1,
          'document.fileName': 1,
          result: { $arrayElemAt: ['$result', 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        exams
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener examen por ID
const getExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(examId)
      .populate('document', 'fileName')
      .populate('user', 'name grade section');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examen no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && exam.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    res.json({
      success: true,
      data: {
        exam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Iniciar examen
const startExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examen no encontrado'
      });
    }

    // Verificar que el usuario puede iniciar el examen
    if (exam.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    if (!exam.canBeStarted()) {
      return res.status(400).json({
        success: false,
        message: 'El examen no puede ser iniciado'
      });
    }

    // Iniciar examen
    await exam.start();

    res.json({
      success: true,
      message: 'Examen iniciado exitosamente',
      data: {
        exam: {
          id: exam._id,
          status: exam.status,
          startedAt: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Enviar examen
const submitExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examen no encontrado'
      });
    }

    // Verificar que el usuario puede completar el examen
    if (exam.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    if (!exam.canBeCompleted()) {
      return res.status(400).json({
        success: false,
        message: 'El examen no puede ser completado'
      });
    }

    // Guardar respuestas
    for (const answer of answers) {
      const studentAnswer = new StudentAnswer({
        examId: exam._id,
        questionId: answer.questionId,
        userId,
        selectedOption: answer.selectedOption,
        timeSpent: answer.timeSpent || 0
      });

      await studentAnswer.save();
    }

    // Completar examen
    await exam.complete();

    // Calcular resultado
    const result = await calculateExamResult(exam._id, userId);

    // Actualizar progreso del estudiante
    const progress = await StudentProgress.findOne({ userId });
    if (progress) {
      await progress.updateAfterExam(result);
    }

    res.json({
      success: true,
      message: 'Examen completado exitosamente',
      data: {
        result: {
          id: result._id,
          percentageScore: result.percentageScore,
          grade: result.grade,
          passed: result.passed,
          completedAt: result.completedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Calcular resultado del examen
const calculateExamResult = async (examId, userId) => {
  const exam = await Exam.findById(examId);
  const answers = await StudentAnswer.find({ examId, userId });
  const questions = await Question.find({ examId });

  const totalQuestions = questions.length;
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  const incorrectAnswers = answers.filter(answer => answer.isCorrect === false).length;
  const unanswered = totalQuestions - answers.length;

  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const pointsEarned = answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
  const percentageScore = Math.round((pointsEarned / totalPoints) * 100);

  const result = new ExamResult({
    examId,
    userId,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unanswered,
    totalPoints,
    pointsEarned,
    percentageScore,
    passed: percentageScore >= exam.passingScore,
    completedAt: new Date()
  });

  await result.save();
  return result;
};

// Obtener preguntas del examen
const getExamQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examen no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && exam.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    // Obtener preguntas con opciones
    const questions = await Question.find({ examId }).sort({ questionNumber: 1 });
    const questionsWithOptions = [];

    for (const question of questions) {
      const options = await QuestionOption.find({ questionId: question._id }).sort({ orderNumber: 1 });
      questionsWithOptions.push({
        ...question.toObject(),
        options: options.map(option => ({
          letter: option.optionLetter,
          text: option.optionText,
          isCorrect: option.isCorrect
        }))
      });
    }

    res.json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
          timeLimit: exam.timeLimit,
          status: exam.status
        },
        questions: questionsWithOptions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener resultado del examen
const getExamResult = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examen no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && exam.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    const result = await ExamResult.findOne({ examId, userId });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Resultado no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        result
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getUserExams,
  getExamsByGrade,
  getExam,
  startExam,
  submitExam,
  getExamQuestions,
  getExamResult
};


