const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido'],
    unique: true
  },
  totalExamsTaken: {
    type: Number,
    required: [true, 'El total de exámenes realizados es requerido'],
    default: 0,
    min: [0, 'El total de exámenes no puede ser negativo']
  },
  totalExamsPassed: {
    type: Number,
    required: [true, 'El total de exámenes aprobados es requerido'],
    default: 0,
    min: [0, 'El total de exámenes aprobados no puede ser negativo']
  },
  averageScore: {
    type: Number,
    required: [true, 'El promedio de calificaciones es requerido'],
    default: 0,
    min: [0, 'El promedio no puede ser menor a 0'],
    max: [100, 'El promedio no puede ser mayor a 100']
  },
  highestScore: {
    type: Number,
    required: [true, 'La calificación más alta es requerida'],
    default: 0,
    min: [0, 'La calificación más alta no puede ser menor a 0'],
    max: [100, 'La calificación más alta no puede ser mayor a 100']
  },
  lowestScore: {
    type: Number,
    min: [0, 'La calificación más baja no puede ser menor a 0'],
    max: [100, 'La calificación más baja no puede ser mayor a 100']
  },
  totalDocumentsUploaded: {
    type: Number,
    required: [true, 'El total de documentos subidos es requerido'],
    default: 0,
    min: [0, 'El total de documentos no puede ser negativo']
  },
  totalStudyTime: {
    type: Number, // en minutos
    required: [true, 'El tiempo total de estudio es requerido'],
    default: 0,
    min: [0, 'El tiempo de estudio no puede ser negativo']
  },
  currentStreak: {
    type: Number,
    required: [true, 'La racha actual es requerida'],
    default: 0,
    min: [0, 'La racha no puede ser negativa']
  },
  longestStreak: {
    type: Number,
    required: [true, 'La racha más larga es requerida'],
    default: 0,
    min: [0, 'La racha más larga no puede ser negativa']
  },
  lastActivityAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
studentProgressSchema.index({ userId: 1 }, { unique: true });
studentProgressSchema.index({ averageScore: 1 });
studentProgressSchema.index({ lastActivityAt: -1 });
studentProgressSchema.index({ currentStreak: -1 });

// Virtual para obtener el usuario
studentProgressSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Método para calcular el porcentaje de aprobación
studentProgressSchema.methods.getPassRate = function() {
  if (this.totalExamsTaken === 0) return 0;
  return Math.round((this.totalExamsPassed / this.totalExamsTaken) * 100);
};

// Método para obtener el tiempo de estudio formateado
studentProgressSchema.methods.getStudyTimeFormatted = function() {
  const hours = Math.floor(this.totalStudyTime / 60);
  const minutes = this.totalStudyTime % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Método para verificar si el estudiante está activo
studentProgressSchema.methods.isActive = function() {
  if (!this.lastActivityAt) return false;
  
  const daysSinceLastActivity = (Date.now() - this.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastActivity <= 7; // Activo si ha tenido actividad en los últimos 7 días
};

// Método para verificar si el estudiante necesita atención
studentProgressSchema.methods.needsAttention = function() {
  return this.averageScore < 70 || this.totalExamsTaken === 0 || !this.isActive();
};

// Método para obtener el nivel de rendimiento
studentProgressSchema.methods.getPerformanceLevel = function() {
  if (this.averageScore >= 90) return 'Excelente';
  if (this.averageScore >= 80) return 'Muy Bueno';
  if (this.averageScore >= 70) return 'Bueno';
  if (this.averageScore >= 60) return 'Regular';
  return 'Necesita Mejora';
};

// Método para actualizar la racha
studentProgressSchema.methods.updateStreak = function(passed) {
  if (passed) {
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else {
    this.currentStreak = 0;
  }
  return this.save();
};

// Método para actualizar estadísticas después de un examen
studentProgressSchema.methods.updateAfterExam = async function(examResult) {
  this.totalExamsTaken += 1;
  
  if (examResult.passed) {
    this.totalExamsPassed += 1;
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else {
    this.currentStreak = 0;
  }
  
  // Actualizar calificaciones
  if (examResult.percentageScore > this.highestScore) {
    this.highestScore = examResult.percentageScore;
  }
  
  if (!this.lowestScore || examResult.percentageScore < this.lowestScore) {
    this.lowestScore = examResult.percentageScore;
  }
  
  // Recalcular promedio
  await this.recalculateAverage();
  
  // Actualizar última actividad
  this.lastActivityAt = new Date();
  
  return this.save();
};

// Método para recalcular el promedio
studentProgressSchema.methods.recalculateAverage = async function() {
  const ExamResult = mongoose.model('ExamResult');
  const results = await ExamResult.find({ userId: this.userId });
  
  if (results.length > 0) {
    const totalScore = results.reduce((sum, result) => sum + result.percentageScore, 0);
    this.averageScore = Math.round((totalScore / results.length) * 100) / 100;
  } else {
    this.averageScore = 0;
  }
  
  return this;
};

// Método estático para obtener progreso por usuario
studentProgressSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId });
};

// Método estático para obtener estudiantes por grado
studentProgressSchema.statics.findByGrade = function(grade) {
  return this.aggregate([
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
        'user.grade': grade
      }
    },
    {
      $project: {
        userId: 1,
        name: '$user.name',
        grade: '$user.grade',
        section: '$user.section',
        totalExamsTaken: 1,
        totalExamsPassed: 1,
        averageScore: 1,
        currentStreak: 1,
        lastActivityAt: 1
      }
    },
    { $sort: { averageScore: -1 } }
  ]);
};

// Método estático para obtener estudiantes que necesitan atención
studentProgressSchema.statics.findNeedingAttention = function(grade = null) {
  const pipeline = [
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
        $or: [
          { averageScore: { $lt: 70 } },
          { totalExamsTaken: 0 },
          { lastActivityAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      }
    }
  ];
  
  if (grade) {
    pipeline[2].$match['user.grade'] = grade;
  }
  
  pipeline.push({
    $project: {
      userId: 1,
      name: '$user.name',
      grade: '$user.grade',
      section: '$user.section',
      averageScore: 1,
      totalExamsTaken: 1,
      lastActivityAt: 1
    }
  });
  
  pipeline.push({ $sort: { averageScore: 1 } });
  
  return this.aggregate(pipeline);
};

// Método estático para obtener ranking de estudiantes
studentProgressSchema.statics.getRanking = function(grade = null, limit = 10) {
  const pipeline = [
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
        totalExamsTaken: { $gt: 0 }
      }
    }
  ];
  
  if (grade) {
    pipeline[2].$match['user.grade'] = grade;
  }
  
  pipeline.push({
    $project: {
      userId: 1,
      name: '$user.name',
      grade: '$user.grade',
      section: '$user.section',
      averageScore: 1,
      totalExamsTaken: 1,
      totalExamsPassed: 1,
      currentStreak: 1,
      passRate: {
        $round: [
          { $multiply: [{ $divide: ['$totalExamsPassed', '$totalExamsTaken'] }, 100] },
          2
        ]
      }
    }
  });
  
  pipeline.push({ $sort: { averageScore: -1 } });
  pipeline.push({ $limit: limit });
  
  return this.aggregate(pipeline);
};

// Middleware para validar que el usuario existe y es estudiante
studentProgressSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (!user) {
      return next(new Error('Usuario no encontrado'));
    }
    if (user.userType !== 'student') {
      return next(new Error('Solo los estudiantes pueden tener progreso'));
    }
  }
  next();
});

// Middleware para validar consistencia de datos
studentProgressSchema.pre('save', function(next) {
  // Verificar que los exámenes aprobados no excedan el total
  if (this.totalExamsPassed > this.totalExamsTaken) {
    return next(new Error('Los exámenes aprobados no pueden exceder el total de exámenes'));
  }
  
  // Verificar que la racha actual no exceda la más larga
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  next();
});

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;


