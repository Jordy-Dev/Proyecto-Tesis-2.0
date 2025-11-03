const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'El ID del examen es requerido']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'El total de preguntas es requerido'],
    min: [1, 'Debe haber al menos 1 pregunta']
  },
  correctAnswers: {
    type: Number,
    required: [true, 'El número de respuestas correctas es requerido'],
    default: 0,
    min: [0, 'Las respuestas correctas no pueden ser negativas']
  },
  incorrectAnswers: {
    type: Number,
    required: [true, 'El número de respuestas incorrectas es requerido'],
    default: 0,
    min: [0, 'Las respuestas incorrectas no pueden ser negativas']
  },
  unanswered: {
    type: Number,
    required: [true, 'El número de preguntas sin responder es requerido'],
    default: 0,
    min: [0, 'Las preguntas sin responder no pueden ser negativas']
  },
  totalPoints: {
    type: Number,
    required: [true, 'El total de puntos es requerido'],
    min: [0, 'El total de puntos no puede ser negativo']
  },
  pointsEarned: {
    type: Number,
    required: [true, 'Los puntos obtenidos son requeridos'],
    default: 0,
    min: [0, 'Los puntos obtenidos no pueden ser negativos']
  },
  percentageScore: {
    type: Number,
    required: [true, 'El porcentaje de puntuación es requerido'],
    default: 0,
    min: [0, 'El porcentaje no puede ser menor a 0'],
    max: [100, 'El porcentaje no puede ser mayor a 100']
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    default: 'F'
  },
  passed: {
    type: Boolean,
    required: [true, 'Debe especificar si aprobó el examen'],
    default: false
  },
  timeTaken: {
    type: Number, // en minutos
    min: [0, 'El tiempo no puede ser negativo']
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
examResultSchema.index({ examId: 1 });
examResultSchema.index({ userId: 1 });
examResultSchema.index({ percentageScore: 1 });
examResultSchema.index({ completedAt: -1 });
examResultSchema.index({ examId: 1, userId: 1 }, { unique: true });

// Virtual para obtener el examen
examResultSchema.virtual('exam', {
  ref: 'Exam',
  localField: 'examId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener el usuario
examResultSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Método para obtener la calificación en letra
examResultSchema.methods.getLetterGrade = function() {
  if (this.percentageScore >= 90) return 'A';
  if (this.percentageScore >= 80) return 'B';
  if (this.percentageScore >= 70) return 'C';
  if (this.percentageScore >= 60) return 'D';
  return 'F';
};

// Método para verificar si aprobó
examResultSchema.methods.didPass = function() {
  return this.percentageScore >= 70; // Puntaje de aprobación por defecto
};

// Método para obtener el tiempo formateado
examResultSchema.methods.getTimeTakenFormatted = function() {
  if (!this.timeTaken) return 'No registrado';
  
  const hours = Math.floor(this.timeTaken / 60);
  const minutes = this.timeTaken % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Método para obtener el feedback personalizado
examResultSchema.methods.getPersonalizedFeedback = function() {
  if (this.percentageScore >= 90) {
    return '¡Excelente trabajo! Has demostrado una comprensión excepcional del contenido.';
  } else if (this.percentageScore >= 80) {
    return '¡Muy bien! Has mostrado una buena comprensión del material.';
  } else if (this.percentageScore >= 70) {
    return 'Buen trabajo. Has alcanzado el nivel de aprobación.';
  } else if (this.percentageScore >= 60) {
    return 'Estás cerca de aprobar. Revisa el material y vuelve a intentarlo.';
  } else {
    return 'Necesitas estudiar más el material. Te recomendamos revisar el contenido antes de volver a intentar.';
  }
};

// Método estático para obtener resultados por usuario
examResultSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ completedAt: -1 });
};

// Método estático para obtener resultados por examen
examResultSchema.statics.findByExam = function(examId) {
  return this.find({ examId }).sort({ completedAt: -1 });
};

// Método estático para obtener resultados aprobados
examResultSchema.statics.findPassed = function(userId = null) {
  const query = { passed: true };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query).sort({ completedAt: -1 });
};

// Método estático para obtener resultados reprobados
examResultSchema.statics.findFailed = function(userId = null) {
  const query = { passed: false };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query).sort({ completedAt: -1 });
};

// Método estático para obtener estadísticas de un usuario
examResultSchema.statics.getUserStatistics = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        passedExams: { $sum: { $cond: ['$passed', 1, 0] } },
        failedExams: { $sum: { $cond: ['$passed', 0, 1] } },
        averageScore: { $avg: '$percentageScore' },
        highestScore: { $max: '$percentageScore' },
        lowestScore: { $min: '$percentageScore' },
        totalPoints: { $sum: '$pointsEarned' },
        averageTime: { $avg: '$timeTaken' }
      }
    }
  ]);
  
  return stats[0] || {
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalPoints: 0,
    averageTime: 0
  };
};

// Método estático para obtener ranking de estudiantes
examResultSchema.statics.getStudentRanking = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$userId',
        averageScore: { $avg: '$percentageScore' },
        totalExams: { $sum: 1 },
        passedExams: { $sum: { $cond: ['$passed', 1, 0] } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.userType': 'student'
      }
    },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        grade: '$user.grade',
        section: '$user.section',
        averageScore: { $round: ['$averageScore', 2] },
        totalExams: 1,
        passedExams: 1,
        passRate: { $round: [{ $multiply: [{ $divide: ['$passedExams', '$totalExams'] }, 100] }, 2] }
      }
    },
    { $sort: { averageScore: -1 } },
    { $limit: limit }
  ]);
};

// Middleware para validar que el examen existe
examResultSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Exam = mongoose.model('Exam');
    const exam = await Exam.findById(this.examId);
    if (!exam) {
      return next(new Error('Examen no encontrado'));
    }
    
    // Verificar que el examen está completado
    if (exam.status !== 'completed') {
      return next(new Error('El examen debe estar completado para generar un resultado'));
    }
  }
  next();
});

// Middleware para validar que el usuario existe
examResultSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (!user) {
      return next(new Error('Usuario no encontrado'));
    }
    
    // Verificar que el usuario es estudiante
    if (user.userType !== 'student') {
      return next(new Error('Solo los estudiantes pueden tener resultados de examen'));
    }
  }
  next();
});

// Middleware para calcular automáticamente la calificación y si aprobó
examResultSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('percentageScore')) {
    // Calcular calificación en letra
    this.grade = this.getLetterGrade();
    
    // Determinar si aprobó
    this.passed = this.didPass();
    
    // Generar feedback personalizado si no existe
    if (!this.feedback) {
      this.feedback = this.getPersonalizedFeedback();
    }
  }
  next();
});

// Middleware para validar consistencia de datos
examResultSchema.pre('save', function(next) {
  // Verificar que la suma de respuestas no exceda el total
  const totalAnswered = this.correctAnswers + this.incorrectAnswers + this.unanswered;
  if (totalAnswered !== this.totalQuestions) {
    return next(new Error('La suma de respuestas no coincide con el total de preguntas'));
  }
  
  // Verificar que el porcentaje sea consistente
  const calculatedPercentage = (this.correctAnswers / this.totalQuestions) * 100;
  if (Math.abs(this.percentageScore - calculatedPercentage) > 0.01) {
    return next(new Error('El porcentaje de puntuación no es consistente con las respuestas correctas'));
  }
  
  next();
});

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult;


