const Joi = require('joi');

// Esquemas de validación para usuarios
const userSchemas = {
  register: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.empty': 'El nombre es requerido',
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 255 caracteres',
        'any.required': 'El nombre es requerido'
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Email inválido',
        'string.empty': 'El email es requerido',
        'any.required': 'El email es requerido'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'string.max': 'La contraseña no puede exceder 128 caracteres',
        'string.empty': 'La contraseña es requerida',
        'any.required': 'La contraseña es requerida'
      }),
    userType: Joi.string()
      .valid('student', 'teacher')
      .required()
      .messages({
        'any.only': 'El tipo de usuario debe ser student o teacher',
        'any.required': 'El tipo de usuario es requerido'
      }),
    grade: Joi.string()
      .valid('1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado')
      .required()
      .messages({
        'any.only': 'Grado inválido',
        'any.required': 'El grado es requerido'
      }),
    section: Joi.string()
      .valid('A', 'B')
      .when('userType', {
        is: 'student',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'any.only': 'La sección debe ser A o B',
        'any.required': 'La sección es requerida para estudiantes',
        'any.forbidden': 'La sección no es permitida para docentes'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Email inválido',
        'string.empty': 'El email es requerido',
        'any.required': 'El email es requerido'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'La contraseña es requerida',
        'any.required': 'La contraseña es requerida'
      }),
    userType: Joi.string()
      .valid('student', 'teacher')
      .required()
      .messages({
        'any.only': 'El tipo de usuario debe ser student o teacher',
        'any.required': 'El tipo de usuario es requerido'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(255)
      .messages({
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 255 caracteres'
      }),
    grade: Joi.string()
      .valid('1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado')
      .messages({
        'any.only': 'Grado inválido'
      }),
    section: Joi.string()
      .valid('A', 'B')
      .messages({
        'any.only': 'La sección debe ser A o B'
      })
  })
};

// Esquemas de validación para documentos
const documentSchemas = {
  upload: Joi.object({
    fileName: Joi.string()
      .trim()
      .max(255)
      .required()
      .messages({
        'string.empty': 'El nombre del archivo es requerido',
        'string.max': 'El nombre del archivo no puede exceder 255 caracteres',
        'any.required': 'El nombre del archivo es requerido'
      }),
    fileType: Joi.string()
      .valid('pdf', 'docx', 'txt', 'image')
      .required()
      .messages({
        'any.only': 'Tipo de archivo no soportado',
        'any.required': 'El tipo de archivo es requerido'
      }),
    fileSize: Joi.number()
      .min(1)
      .max(10485760)
      .required()
      .messages({
        'number.min': 'El archivo debe tener al menos 1 byte',
        'number.max': 'El archivo no puede exceder 10MB',
        'any.required': 'El tamaño del archivo es requerido'
      })
  })
};

// Esquemas de validación para exámenes
const examSchemas = {
  create: Joi.object({
    documentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de documento inválido',
        'any.required': 'El ID del documento es requerido'
      }),
    title: Joi.string()
      .trim()
      .max(255)
      .required()
      .messages({
        'string.empty': 'El título del examen es requerido',
        'string.max': 'El título no puede exceder 255 caracteres',
        'any.required': 'El título del examen es requerido'
      }),
    description: Joi.string()
      .trim()
      .max(1000)
      .messages({
        'string.max': 'La descripción no puede exceder 1000 caracteres'
      }),
    totalQuestions: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'El número de preguntas debe ser un número entero',
        'number.min': 'Debe tener al menos 1 pregunta',
        'number.max': 'No puede tener más de 50 preguntas'
      }),
    passingScore: Joi.number()
      .min(0)
      .max(100)
      .default(70)
      .messages({
        'number.min': 'El puntaje de aprobación no puede ser menor a 0',
        'number.max': 'El puntaje de aprobación no puede ser mayor a 100'
      }),
    timeLimit: Joi.number()
      .min(1)
      .max(180)
      .messages({
        'number.min': 'El tiempo límite debe ser al menos 1 minuto',
        'number.max': 'El tiempo límite no puede exceder 180 minutos'
      })
  }),

  start: Joi.object({
    examId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de examen inválido',
        'any.required': 'El ID del examen es requerido'
      })
  })
};

// Esquemas de validación para preguntas
const questionSchemas = {
  create: Joi.object({
    examId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de examen inválido',
        'any.required': 'El ID del examen es requerido'
      }),
    questionNumber: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'El número de pregunta debe ser un número entero',
        'number.min': 'El número de pregunta debe ser al menos 1',
        'any.required': 'El número de pregunta es requerido'
      }),
    questionText: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'El texto de la pregunta es requerido',
        'any.required': 'El texto de la pregunta es requerido'
      }),
    questionType: Joi.string()
      .valid('multiple_choice', 'true_false', 'short_answer')
      .default('multiple_choice')
      .messages({
        'any.only': 'Tipo de pregunta inválido'
      }),
    points: Joi.number()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.min': 'Los puntos deben ser al menos 1',
        'number.max': 'Los puntos no pueden exceder 100'
      }),
    difficulty: Joi.string()
      .valid('easy', 'medium', 'hard')
      .default('medium')
      .messages({
        'any.only': 'Dificultad inválida'
      })
  })
};

// Esquemas de validación para respuestas
const answerSchemas = {
  submit: Joi.object({
    examId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de examen inválido',
        'any.required': 'El ID del examen es requerido'
      }),
    questionId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de pregunta inválido',
        'any.required': 'El ID de la pregunta es requerido'
      }),
    selectedOption: Joi.string()
      .valid('A', 'B', 'C', 'D')
      .messages({
        'any.only': 'La opción seleccionada debe ser A, B, C o D'
      }),
    answerText: Joi.string()
      .trim()
      .max(1000)
      .messages({
        'string.max': 'La respuesta no puede exceder 1000 caracteres'
      }),
    timeSpent: Joi.number()
      .min(0)
      .messages({
        'number.min': 'El tiempo no puede ser negativo'
      })
  }).or('selectedOption', 'answerText')
};

// Esquemas de validación para opciones de pregunta
const optionSchemas = {
  create: Joi.object({
    questionId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de pregunta inválido',
        'any.required': 'El ID de la pregunta es requerido'
      }),
    optionLetter: Joi.string()
      .valid('A', 'B', 'C', 'D')
      .required()
      .messages({
        'any.only': 'La letra de la opción debe ser A, B, C o D',
        'any.required': 'La letra de la opción es requerida'
      }),
    optionText: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'El texto de la opción es requerido',
        'any.required': 'El texto de la opción es requerido'
      }),
    isCorrect: Joi.boolean()
      .required()
      .messages({
        'any.required': 'Debe especificar si la opción es correcta'
      }),
    orderNumber: Joi.number()
      .integer()
      .min(1)
      .max(4)
      .required()
      .messages({
        'number.base': 'El número de orden debe ser un número entero',
        'number.min': 'El número de orden debe ser al menos 1',
        'number.max': 'El número de orden no puede exceder 4',
        'any.required': 'El número de orden es requerido'
      })
  })
};

// Esquemas de validación para consultas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'La página debe ser un número entero',
        'number.min': 'La página debe ser al menos 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'El límite debe ser un número entero',
        'number.min': 'El límite debe ser al menos 1',
        'number.max': 'El límite no puede exceder 100'
      }),
    sort: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'El orden debe ser asc o desc'
      })
  }),

  filter: Joi.object({
    grade: Joi.string()
      .valid('1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado')
      .messages({
        'any.only': 'Grado inválido'
      }),
    section: Joi.string()
      .valid('A', 'B')
      .messages({
        'any.only': 'Sección inválida'
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'suspended')
      .messages({
        'any.only': 'Estado inválido'
      }),
    userType: Joi.string()
      .valid('student', 'teacher')
      .messages({
        'any.only': 'Tipo de usuario inválido'
      })
  })
};

// Middleware de validación genérico
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

// Middleware de validación para parámetros de ruta
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parámetros de ruta inválidos',
        errors
      });
    }

    req.params = value;
    next();
  };
};

// Middleware de validación para consultas
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  userSchemas,
  documentSchemas,
  examSchemas,
  questionSchemas,
  answerSchemas,
  optionSchemas,
  querySchemas,
  validate,
  validateParams,
  validateQuery
};


