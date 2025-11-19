const Exam = require('../models/Exam');
const Question = require('../models/Question');
const QuestionOption = require('../models/QuestionOption');
const StudentAnswer = require('../models/StudentAnswer');
const ExamResult = require('../models/ExamResult');
const StudentProgress = require('../models/StudentProgress');
const geminiService = require('../services/geminiService');

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

    // Crear examen con estado 'processing' mientras se generan las preguntas
    const exam = new Exam({
      documentId,
      userId,
      title,
      description,
      totalQuestions,
      passingScore,
      timeLimit,
      status: 'processing'
    });

    await exam.save();

    // Generar preguntas con Gemini de forma asíncrona
    generateQuestions(exam._id, document._id, totalQuestions || 10)
      .then(() => {
        console.log(`✅ Preguntas generadas exitosamente para examen ${exam._id}`);
      })
      .catch(error => {
        console.error(`❌ Error generando preguntas para examen ${exam._id}:`, error);
      });

    res.status(201).json({
      success: true,
      message: 'Examen creado exitosamente. Las preguntas se están generando...',
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

// Generar preguntas con Gemini
const generateQuestions = async (examId, documentId, totalQuestions = 10) => {
  try {
    // Obtener el documento
    const Document = require('../models/Document');
    const document = await Document.findById(documentId);

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    if (!document.contentText) {
      throw new Error('El documento no tiene contenido procesado');
    }

    // Generar preguntas con Gemini
    const generatedQuestions = await geminiService.generateQuestionsWithGemini(
      document.contentText,
      totalQuestions
    );

    // Guardar preguntas en la base de datos
    const questions = [];
    const pointsPerQuestion = Math.floor(100 / totalQuestions);

    for (let i = 0; i < generatedQuestions.length; i++) {
      const generatedQ = generatedQuestions[i];
      
      const question = new Question({
        examId,
        questionNumber: generatedQ.questionNumber || i + 1,
        questionText: generatedQ.questionText,
        questionType: 'multiple_choice',
        points: pointsPerQuestion,
        difficulty: generatedQ.difficulty || 'medium',
        aiReasoning: generatedQ.explanation || 'Pregunta generada con Gemini'
      });

      await question.save();
      questions.push(question);

      // Guardar opciones para cada pregunta
      if (generatedQ.options && Array.isArray(generatedQ.options)) {
        for (let j = 0; j < generatedQ.options.length; j++) {
          const opt = generatedQ.options[j];
          const option = new QuestionOption({
            questionId: question._id,
            optionLetter: opt.letter,
            optionText: opt.text,
            isCorrect: opt.isCorrect === true,
            orderNumber: j + 1
          });

          await option.save();
        }
      }
    }

    // Actualizar el estado del examen a 'ready'
    const exam = await Exam.findById(examId);
    if (exam) {
      exam.status = 'ready';
      await exam.save();
    }

    console.log(`✅ Generadas ${questions.length} preguntas para el examen ${examId} usando Gemini`);
    return questions;
  } catch (error) {
    console.error('Error generando preguntas con Gemini:', error);
    
    // Marcar el examen como error si falla la generación
    const exam = await Exam.findById(examId);
    if (exam) {
      exam.status = 'error';
      await exam.save();
    }
    
    throw error;
  }
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

    // Verificar acceso - comparar como strings para evitar problemas de tipo
    const examUserId = exam.userId ? exam.userId.toString() : null;
    const currentUserId = userId ? userId.toString() : null;
    
    if (req.user.userType === 'student' && examUserId && currentUserId && examUserId !== currentUserId) {
      console.error(`Acceso denegado: exam.userId=${examUserId}, userId=${currentUserId}`);
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

    // Verificar acceso - comparar como strings para evitar problemas de tipo
    const examUserId = exam.userId ? exam.userId.toString() : null;
    const currentUserId = userId ? userId.toString() : null;
    
    if (examUserId && currentUserId && examUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    // Verificar que el examen puede ser iniciado
    const canStart = exam.canBeStarted();
    console.log(`Intentando iniciar examen ${examId}: status=${exam.status}, canBeStarted=${canStart}, isExpired=${exam.isExpired()}`);
    
    if (!canStart) {
      // Proporcionar un mensaje más descriptivo
      let reason = 'El examen no puede ser iniciado';
      if (exam.status === 'processing') {
        reason = 'El examen aún está generando las preguntas. Por favor espera unos momentos.';
      } else if (exam.status === 'completed') {
        reason = 'Este examen ya ha sido completado.';
      } else if (exam.status === 'in_progress') {
        reason = 'Este examen ya está en progreso.';
      } else if (exam.isExpired()) {
        reason = 'Este examen ha expirado.';
      } else if (exam.status !== 'ready' && exam.status !== 'pending') {
        reason = `El examen está en estado '${exam.status}' y no puede ser iniciado. Debe estar en estado 'ready' o 'pending'.`;
      }
      
      return res.status(400).json({
        success: false,
        message: reason
      });
    }

    // Iniciar examen
    try {
      await exam.start();
    } catch (error) {
      // Si el método start() lanza un error, proporcionar un mensaje más claro
      console.error('Error en exam.start():', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'El examen no puede ser iniciado en este momento'
      });
    }

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

    // Verificar acceso - comparar como strings para evitar problemas de tipo
    const examUserId = exam.userId ? exam.userId.toString() : null;
    const currentUserId = userId ? userId.toString() : null;
    
    if (examUserId && currentUserId && examUserId !== currentUserId) {
      console.error(`Acceso denegado al enviar: exam.userId=${examUserId}, userId=${currentUserId}`);
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este examen'
      });
    }

    if (!exam.canBeCompleted()) {
      // Proporcionar un mensaje más descriptivo
      let reason = 'El examen no puede ser completado';
      if (exam.status === 'pending' || exam.status === 'processing' || exam.status === 'ready') {
        reason = 'El examen debe ser iniciado antes de poder completarlo.';
      } else if (exam.status === 'completed') {
        reason = 'Este examen ya ha sido completado.';
      } else if (exam.isExpired()) {
        reason = 'Este examen ha expirado.';
      }
      
      return res.status(400).json({
        success: false,
        message: reason
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

    // Verificar acceso - comparar como strings para evitar problemas de tipo
    const examUserId = exam.userId ? exam.userId.toString() : null;
    const currentUserId = userId ? userId.toString() : null;
    
    if (req.user.userType === 'student' && examUserId && currentUserId && examUserId !== currentUserId) {
      console.error(`Acceso denegado a preguntas: exam.userId=${examUserId}, userId=${currentUserId}`);
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

    // Verificar acceso - comparar como strings para evitar problemas de tipo
    const examUserId = exam.userId ? exam.userId.toString() : null;
    const currentUserId = userId ? userId.toString() : null;
    
    if (req.user.userType === 'student' && examUserId && currentUserId && examUserId !== currentUserId) {
      console.error(`Acceso denegado a preguntas: exam.userId=${examUserId}, userId=${currentUserId}`);
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


