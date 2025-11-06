const mongoose = require('mongoose');

const participationSessionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'El ID del docente es requerido'],
    ref: 'User'
  },
  teacherName: {
    type: String,
    required: [true, 'El nombre del docente es requerido'],
    trim: true
  },
  teacherGrade: {
    type: String,
    required: [true, 'El grado es requerido'],
    enum: {
      values: ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'],
      message: 'Grado inválido'
    }
  },
  section: {
    type: String,
    required: [true, 'La sección es requerida'],
    enum: {
      values: ['A', 'B'],
      message: 'La sección debe ser A o B'
    }
  },
  participationCount: {
    type: Number,
    required: [true, 'El conteo de participaciones es requerido'],
    min: [0, 'El conteo de participaciones no puede ser negativo'],
    default: 0
  },
  sessionDuration: {
    type: Number,
    required: [true, 'La duración de la sesión es requerida'],
    min: [0, 'La duración no puede ser negativa'],
    default: 0
  },
  startTime: {
    type: Date,
    required: [true, 'La hora de inicio es requerida'],
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed'],
      message: 'El estado debe ser active o completed'
    },
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar las consultas
participationSessionSchema.index({ teacherId: 1, createdAt: -1 });
participationSessionSchema.index({ teacherGrade: 1, section: 1 });
participationSessionSchema.index({ status: 1 });
participationSessionSchema.index({ createdAt: -1 });

// Método para finalizar una sesión
participationSessionSchema.methods.completeSession = function() {
  this.status = 'completed';
  this.endTime = new Date();
  return this.save();
};

// Método estático para obtener sesiones por docente
participationSessionSchema.statics.findByTeacher = function(teacherId, options = {}) {
  const query = { teacherId };
  
  if (options.grade) {
    query.teacherGrade = options.grade;
  }
  
  if (options.section) {
    query.section = options.section;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Método estático para obtener estadísticas de participación
participationSessionSchema.statics.getStatistics = async function(teacherGrade, section = null) {
  const matchStage = { teacherGrade };
  
  if (section) {
    matchStage.section = section;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          section: '$section',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        totalSessions: { $sum: 1 },
        totalParticipations: { $sum: '$participationCount' },
        totalDuration: { $sum: '$sessionDuration' },
        averageParticipations: { $avg: '$participationCount' },
        averageDuration: { $avg: '$sessionDuration' }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.section': 1 }
    }
  ]);
  
  return stats;
};

const ParticipationSession = mongoose.model('ParticipationSession', participationSessionSchema);

module.exports = ParticipationSession;

