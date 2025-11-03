const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'El ID del examen es requerido']
  },
  questionNumber: {
    type: Number,
    required: [true, 'El número de pregunta es requerido'],
    min: [1, 'El número de pregunta debe ser al menos 1']
  },
  questionText: {
    type: String,
    required: [true, 'El texto de la pregunta es requerido'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer'],
    default: 'multiple_choice'
  },
  points: {
    type: Number,
    default: 10,
    min: [1, 'Los puntos deben ser al menos 1'],
    max: [100, 'Los puntos no pueden exceder 100']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  aiReasoning: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
questionSchema.index({ examId: 1 });
questionSchema.index({ examId: 1, questionNumber: 1 }, { unique: true });

// Virtual para obtener el examen
questionSchema.virtual('exam', {
  ref: 'Exam',
  localField: 'examId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener las opciones
questionSchema.virtual('options', {
  ref: 'QuestionOption',
  localField: '_id',
  foreignField: 'questionId'
});

// Virtual para obtener las respuestas de estudiantes
questionSchema.virtual('studentAnswers', {
  ref: 'StudentAnswer',
  localField: '_id',
  foreignField: 'questionId'
});

// Método para verificar si es pregunta de opción múltiple
questionSchema.methods.isMultipleChoice = function() {
  return this.questionType === 'multiple_choice';
};

// Método para verificar si es pregunta verdadero/falso
questionSchema.methods.isTrueFalse = function() {
  return this.questionType === 'true_false';
};

// Método para verificar si es pregunta de respuesta corta
questionSchema.methods.isShortAnswer = function() {
  return this.questionType === 'short_answer';
};

// Método estático para obtener preguntas por examen
questionSchema.statics.findByExam = function(examId) {
  return this.find({ examId }).sort({ questionNumber: 1 });
};

// Método estático para obtener preguntas por dificultad
questionSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty }).sort({ createdAt: -1 });
};

// Middleware para validar que el examen existe
questionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Exam = mongoose.model('Exam');
    const exam = await Exam.findById(this.examId);
    if (!exam) {
      return next(new Error('Examen no encontrado'));
    }
    
    // Verificar que el número de pregunta no exceda el total del examen
    if (this.questionNumber > exam.totalQuestions) {
      return next(new Error('El número de pregunta excede el total del examen'));
    }
  }
  next();
});

// Middleware para validar unicidad del número de pregunta por examen
questionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('questionNumber')) {
    const existingQuestion = await this.constructor.findOne({
      examId: this.examId,
      questionNumber: this.questionNumber,
      _id: { $ne: this._id }
    });
    
    if (existingQuestion) {
      return next(new Error('Ya existe una pregunta con este número en el examen'));
    }
  }
  next();
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;


