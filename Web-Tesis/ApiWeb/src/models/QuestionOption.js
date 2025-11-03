const mongoose = require('mongoose');

const questionOptionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'El ID de la pregunta es requerido']
  },
  optionLetter: {
    type: String,
    required: [true, 'La letra de la opción es requerida'],
    uppercase: true,
    enum: {
      values: ['A', 'B', 'C', 'D'],
      message: 'La letra de la opción debe ser A, B, C o D'
    }
  },
  optionText: {
    type: String,
    required: [true, 'El texto de la opción es requerido'],
    trim: true
  },
  isCorrect: {
    type: Boolean,
    required: [true, 'Debe especificar si la opción es correcta'],
    default: false
  },
  orderNumber: {
    type: Number,
    required: [true, 'El número de orden es requerido'],
    min: [1, 'El número de orden debe ser al menos 1'],
    max: [4, 'El número de orden no puede exceder 4']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
questionOptionSchema.index({ questionId: 1 });
questionOptionSchema.index({ questionId: 1, optionLetter: 1 }, { unique: true });
questionOptionSchema.index({ questionId: 1, orderNumber: 1 }, { unique: true });

// Virtual para obtener la pregunta
questionOptionSchema.virtual('question', {
  ref: 'Question',
  localField: 'questionId',
  foreignField: '_id',
  justOne: true
});

// Método para verificar si es la respuesta correcta
questionOptionSchema.methods.isCorrectAnswer = function() {
  return this.isCorrect === true;
};

// Método estático para obtener opciones por pregunta
questionOptionSchema.statics.findByQuestion = function(questionId) {
  return this.find({ questionId }).sort({ orderNumber: 1 });
};

// Método estático para obtener la respuesta correcta de una pregunta
questionOptionSchema.statics.findCorrectAnswer = function(questionId) {
  return this.findOne({ questionId, isCorrect: true });
};

// Método estático para obtener opciones por letra
questionOptionSchema.statics.findByLetter = function(questionId, optionLetter) {
  return this.findOne({ questionId, optionLetter: optionLetter.toUpperCase() });
};

// Middleware para validar que la pregunta existe
questionOptionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Question = mongoose.model('Question');
    const question = await Question.findById(this.questionId);
    if (!question) {
      return next(new Error('Pregunta no encontrada'));
    }
    
    // Solo permitir opciones para preguntas de opción múltiple
    if (question.questionType !== 'multiple_choice') {
      return next(new Error('Solo las preguntas de opción múltiple pueden tener opciones'));
    }
  }
  next();
});

// Middleware para validar que solo hay una respuesta correcta por pregunta
questionOptionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('isCorrect')) {
    if (this.isCorrect) {
      const existingCorrect = await this.constructor.findOne({
        questionId: this.questionId,
        isCorrect: true,
        _id: { $ne: this._id }
      });
      
      if (existingCorrect) {
        return next(new Error('Ya existe una respuesta correcta para esta pregunta'));
      }
    }
  }
  next();
});

// Middleware para validar unicidad de la letra de opción por pregunta
questionOptionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('optionLetter')) {
    const existingOption = await this.constructor.findOne({
      questionId: this.questionId,
      optionLetter: this.optionLetter,
      _id: { $ne: this._id }
    });
    
    if (existingOption) {
      return next(new Error('Ya existe una opción con esta letra en la pregunta'));
    }
  }
  next();
});

// Middleware para validar unicidad del número de orden por pregunta
questionOptionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('orderNumber')) {
    const existingOption = await this.constructor.findOne({
      questionId: this.questionId,
      orderNumber: this.orderNumber,
      _id: { $ne: this._id }
    });
    
    if (existingOption) {
      return next(new Error('Ya existe una opción con este número de orden en la pregunta'));
    }
  }
  next();
});

const QuestionOption = mongoose.model('QuestionOption', questionOptionSchema);

module.exports = QuestionOption;


