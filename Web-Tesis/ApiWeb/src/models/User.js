const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir en consultas por defecto
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [255, 'El nombre no puede exceder 255 caracteres']
  },
  userType: {
    type: String,
    required: [true, 'El tipo de usuario es requerido'],
    enum: {
      values: ['student', 'teacher'],
      message: 'El tipo de usuario debe ser student o teacher'
    }
  },
  grade: {
    type: String,
    required: [true, 'El grado es requerido'],
    enum: {
      values: ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'],
      message: 'Grado inválido'
    }
  },
  section: {
    type: String,
    enum: {
      values: ['A', 'B'],
      message: 'La sección debe ser A o B'
    },
    required: function() {
      return this.userType === 'student';
    }
  },
  avatarUrl: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=667eea&color=fff`;
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ grade: 1, section: 1 });

// Virtual para obtener el progreso del estudiante
userSchema.virtual('progress', {
  ref: 'StudentProgress',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Virtual para obtener los documentos del estudiante
userSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'userId'
});

// Middleware para encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo encriptar si la contraseña fue modificada
  if (!this.isModified('password')) return next();
  
  try {
    // Encriptar contraseña con bcrypt
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos del usuario
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Método estático para buscar por email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Método estático para obtener estudiantes por grado y sección
userSchema.statics.findStudentsByGradeAndSection = function(grade, section = null) {
  const query = { userType: 'student', grade };
  if (section) {
    query.section = section;
  }
  return this.find(query);
};

// Método estático para obtener docentes por grado
userSchema.statics.findTeachersByGrade = function(grade) {
  return this.find({ userType: 'teacher', grade });
};

const User = mongoose.model('User', userSchema);

module.exports = User;


