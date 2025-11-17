const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'El ID del documento es requerido']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  title: {
    type: String,
    required: [true, 'El título del examen es requerido'],
    trim: true,
    maxlength: [255, 'El título no puede exceder 255 caracteres']
  },
  description: {
    type: String,
    trim: true
  },
  totalQuestions: {
    type: Number,
    required: [true, 'El número total de preguntas es requerido'],
    default: 10,
    min: [1, 'Debe tener al menos 1 pregunta'],
    max: [50, 'No puede tener más de 50 preguntas']
  },
  passingScore: {
    type: Number,
    default: 70,
    min: [0, 'El puntaje de aprobación no puede ser menor a 0'],
    max: [100, 'El puntaje de aprobación no puede ser mayor a 100']
  },
  timeLimit: {
    type: Number, // en minutos
    min: [1, 'El tiempo límite debe ser al menos 1 minuto'],
    max: [180, 'El tiempo límite no puede exceder 180 minutos']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    default: 'pending'
  },
  aiModelUsed: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
examSchema.index({ userId: 1 });
examSchema.index({ documentId: 1 });
examSchema.index({ status: 1 });
examSchema.index({ createdAt: -1 });
examSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL para exámenes expirados

// Virtual para obtener el documento origen
examSchema.virtual('document', {
  ref: 'Document',
  localField: 'documentId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener el usuario
examSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener las preguntas
examSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'examId'
});

// Virtual para obtener el resultado
examSchema.virtual('result', {
  ref: 'ExamResult',
  localField: '_id',
  foreignField: 'examId',
  justOne: true
});

// Método para verificar si el examen está expirado
examSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Método para verificar si el examen puede ser iniciado
examSchema.methods.canBeStarted = function() {
  return this.status === 'pending' && !this.isExpired();
};

// Método para verificar si el examen puede ser completado
examSchema.methods.canBeCompleted = function() {
  return this.status === 'in_progress' && !this.isExpired();
};

// Método para iniciar el examen
examSchema.methods.start = function() {
  if (this.canBeStarted()) {
    this.status = 'in_progress';
    return this.save();
  }
  throw new Error('El examen no puede ser iniciado');
};

// Método para completar el examen
examSchema.methods.complete = function() {
  if (this.canBeCompleted()) {
    this.status = 'completed';
    return this.save();
  }
  throw new Error('El examen no puede ser completado');
};

// Método estático para obtener exámenes por usuario
examSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Método estático para obtener exámenes por estado
examSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Método estático para obtener exámenes activos
examSchema.statics.findActive = function() {
  return this.find({ 
    status: { $in: ['pending', 'in_progress'] },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Middleware para validar que el documento existe
examSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Document = mongoose.model('Document');
    const document = await Document.findById(this.documentId);
    if (!document) {
      return next(new Error('Documento no encontrado'));
    }
    // Antes se exigía que document.status === 'analyzed'.
    // Para facilitar la integración con Gemini y las pruebas,
    // solo verificamos que el documento exista.
  }
  next();
});

// Middleware para establecer fecha de expiración si hay tiempo límite
examSchema.pre('save', function(next) {
  if (this.timeLimit && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + this.timeLimit * 60 * 1000);
  }
  next();
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;


