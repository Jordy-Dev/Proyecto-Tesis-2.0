const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'El ID del examen es requerido']
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'El ID de la pregunta es requerido']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  selectedOption: {
    type: String,
    uppercase: true,
    enum: {
      values: ['A', 'B', 'C', 'D'],
      message: 'La opción seleccionada debe ser A, B, C o D'
    }
  },
  answerText: {
    type: String,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Los puntos no pueden ser negativos']
  },
  timeSpent: {
    type: Number, // en segundos
    min: [0, 'El tiempo no puede ser negativo']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
studentAnswerSchema.index({ examId: 1 });
studentAnswerSchema.index({ userId: 1 });
studentAnswerSchema.index({ questionId: 1 });
studentAnswerSchema.index({ examId: 1, userId: 1, questionId: 1 }, { unique: true });

// Virtual para obtener el examen
studentAnswerSchema.virtual('exam', {
  ref: 'Exam',
  localField: 'examId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener la pregunta
studentAnswerSchema.virtual('question', {
  ref: 'Question',
  localField: 'questionId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener el usuario
studentAnswerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Método para verificar si la respuesta es correcta
studentAnswerSchema.methods.isCorrectAnswer = function() {
  return this.isCorrect === true;
};

// Método para verificar si la respuesta es incorrecta
studentAnswerSchema.methods.isIncorrectAnswer = function() {
  return this.isCorrect === false;
};

// Método para verificar si la respuesta no fue evaluada
studentAnswerSchema.methods.isNotEvaluated = function() {
  return this.isCorrect === null;
};

// Método para obtener el tiempo formateado
studentAnswerSchema.methods.getTimeSpentFormatted = function() {
  if (!this.timeSpent) return 'No registrado';
  
  const minutes = Math.floor(this.timeSpent / 60);
  const seconds = this.timeSpent % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Método estático para obtener respuestas por examen
studentAnswerSchema.statics.findByExam = function(examId) {
  return this.find({ examId }).sort({ createdAt: 1 });
};

// Método estático para obtener respuestas por usuario
studentAnswerSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Método estático para obtener respuestas por examen y usuario
studentAnswerSchema.statics.findByExamAndUser = function(examId, userId) {
  return this.find({ examId, userId }).sort({ createdAt: 1 });
};

// Método estático para obtener respuestas correctas
studentAnswerSchema.statics.findCorrectAnswers = function(examId = null) {
  const query = { isCorrect: true };
  if (examId) {
    query.examId = examId;
  }
  return this.find(query);
};

// Método estático para obtener respuestas incorrectas
studentAnswerSchema.statics.findIncorrectAnswers = function(examId = null) {
  const query = { isCorrect: false };
  if (examId) {
    query.examId = examId;
  }
  return this.find(query);
};

// Método estático para obtener estadísticas de respuestas por examen
studentAnswerSchema.statics.getExamStatistics = async function(examId) {
  const stats = await this.aggregate([
    { $match: { examId: mongoose.Types.ObjectId(examId) } },
    {
      $group: {
        _id: null,
        totalAnswers: { $sum: 1 },
        correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        incorrectAnswers: { $sum: { $cond: ['$isCorrect', 0, 1] } },
        totalPoints: { $sum: '$pointsEarned' },
        averageTime: { $avg: '$timeSpent' }
      }
    }
  ]);
  
  return stats[0] || {
    totalAnswers: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalPoints: 0,
    averageTime: 0
  };
};

// Middleware para validar que el examen existe
studentAnswerSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Exam = mongoose.model('Exam');
    const exam = await Exam.findById(this.examId);
    if (!exam) {
      return next(new Error('Examen no encontrado'));
    }
    
    // Verificar que el examen puede ser respondido
    if (!['pending', 'in_progress'].includes(exam.status)) {
      return next(new Error('El examen no está disponible para responder'));
    }
  }
  next();
});

// Middleware para validar que la pregunta existe
studentAnswerSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Question = mongoose.model('Question');
    const question = await Question.findById(this.questionId);
    if (!question) {
      return next(new Error('Pregunta no encontrada'));
    }
    
    // Verificar que la pregunta pertenece al examen
    if (question.examId.toString() !== this.examId.toString()) {
      return next(new Error('La pregunta no pertenece al examen'));
    }
  }
  next();
});

// Middleware para validar que el usuario existe
studentAnswerSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (!user) {
      return next(new Error('Usuario no encontrado'));
    }
    
    // Verificar que el usuario es estudiante
    if (user.userType !== 'student') {
      return next(new Error('Solo los estudiantes pueden responder preguntas'));
    }
  }
  next();
});

// Middleware para validar que la opción seleccionada es válida
studentAnswerSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('selectedOption')) {
    if (this.selectedOption) {
      const QuestionOption = mongoose.model('QuestionOption');
      const option = await QuestionOption.findOne({
        questionId: this.questionId,
        optionLetter: this.selectedOption
      });
      
      if (!option) {
        return next(new Error('La opción seleccionada no es válida para esta pregunta'));
      }
    }
  }
  next();
});

// Middleware para calcular automáticamente si la respuesta es correcta
studentAnswerSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('selectedOption')) {
    if (this.selectedOption) {
      const QuestionOption = mongoose.model('QuestionOption');
      const correctOption = await QuestionOption.findOne({
        questionId: this.questionId,
        isCorrect: true
      });
      
      if (correctOption) {
        this.isCorrect = correctOption.optionLetter === this.selectedOption;
        
        // Calcular puntos si la respuesta es correcta
        if (this.isCorrect) {
          const Question = mongoose.model('Question');
          const question = await Question.findById(this.questionId);
          this.pointsEarned = question ? question.points : 0;
        } else {
          this.pointsEarned = 0;
        }
      }
    }
  }
  next();
});

const StudentAnswer = mongoose.model('StudentAnswer', studentAnswerSchema);

module.exports = StudentAnswer;


