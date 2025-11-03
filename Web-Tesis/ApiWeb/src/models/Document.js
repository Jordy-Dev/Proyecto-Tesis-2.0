const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  fileName: {
    type: String,
    required: [true, 'El nombre del archivo es requerido'],
    trim: true,
    maxlength: [255, 'El nombre del archivo no puede exceder 255 caracteres']
  },
  filePath: {
    type: String,
    required: [true, 'La ruta del archivo es requerida'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'El tipo de archivo es requerido'],
    enum: {
      values: ['pdf', 'docx', 'txt', 'image'],
      message: 'Tipo de archivo no soportado'
    }
  },
  fileSize: {
    type: Number,
    required: [true, 'El tamaño del archivo es requerido'],
    min: [1, 'El archivo debe tener al menos 1 byte'],
    max: [10485760, 'El archivo no puede exceder 10MB']
  },
  contentText: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'analyzed', 'error'],
    default: 'uploaded'
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
documentSchema.index({ userId: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });

// Virtual para obtener el usuario propietario
documentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener el examen generado
documentSchema.virtual('exam', {
  ref: 'Exam',
  localField: '_id',
  foreignField: 'documentId',
  justOne: true
});

// Método para obtener el tamaño del archivo en formato legible
documentSchema.methods.getFileSizeFormatted = function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Método para verificar si el archivo es una imagen
documentSchema.methods.isImage = function() {
  return this.fileType === 'image';
};

// Método para verificar si el archivo es un documento de texto
documentSchema.methods.isTextDocument = function() {
  return ['pdf', 'docx', 'txt'].includes(this.fileType);
};

// Método estático para obtener documentos por usuario
documentSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Método estático para obtener documentos por estado
documentSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Middleware para validar que el usuario existe
documentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (!user) {
      return next(new Error('Usuario no encontrado'));
    }
    if (user.userType !== 'student') {
      return next(new Error('Solo los estudiantes pueden subir documentos'));
    }
  }
  next();
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;


