const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar el token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Agregar el usuario al objeto request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar que el usuario es estudiante
const requireStudent = (req, res, next) => {
  if (req.user.userType !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo para estudiantes.'
    });
  }
  next();
};

// Middleware para verificar que el usuario es docente
const requireTeacher = (req, res, next) => {
  if (req.user.userType !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo para docentes.'
    });
  }
  next();
};

// Middleware para verificar que el usuario puede acceder a un recurso específico
const requireOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (req.user.userType === 'teacher') {
    // Los docentes pueden acceder a recursos de sus estudiantes
    if (req.user.grade !== req.body.grade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a recursos de tu grado asignado'
      });
    }
  } else if (req.user.userType === 'student') {
    // Los estudiantes solo pueden acceder a sus propios recursos
    if (resourceUserId && resourceUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a tus propios recursos'
      });
    }
  }
  
  next();
};

// Middleware para verificar que el usuario puede acceder a un examen específico
const requireExamAccess = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const Exam = require('../models/Exam');
    
    const exam = await Exam.findById(examId).populate('userId');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examen no encontrado'
      });
    }

    // Verificar acceso según el tipo de usuario
    if (req.user.userType === 'student') {
      // Los estudiantes solo pueden acceder a sus propios exámenes
      if (exam.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propios exámenes'
        });
      }
    } else if (req.user.userType === 'teacher') {
      // Los docentes pueden acceder a exámenes de sus estudiantes
      if (exam.userId.grade !== req.user.grade) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a exámenes de tu grado asignado'
        });
      }
    }

    req.exam = exam;
    next();
  } catch (error) {
    console.error('Error verificando acceso al examen:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar que el usuario puede acceder a un documento específico
const requireDocumentAccess = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const Document = require('../models/Document');
    
    const document = await Document.findById(documentId).populate('userId');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso según el tipo de usuario
    if (req.user.userType === 'student') {
      // Los estudiantes solo pueden acceder a sus propios documentos
      if (document.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propios documentos'
        });
      }
    } else if (req.user.userType === 'teacher') {
      // Los docentes pueden acceder a documentos de sus estudiantes
      if (document.userId.grade !== req.user.grade) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a documentos de tu grado asignado'
        });
      }
    }

    req.document = document;
    next();
  } catch (error) {
    console.error('Error verificando acceso al documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar que el usuario puede acceder a un resultado específico
const requireResultAccess = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    const ExamResult = require('../models/ExamResult');
    
    const result = await ExamResult.findById(resultId).populate('userId');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Resultado no encontrado'
      });
    }

    // Verificar acceso según el tipo de usuario
    if (req.user.userType === 'student') {
      // Los estudiantes solo pueden acceder a sus propios resultados
      if (result.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propios resultados'
        });
      }
    } else if (req.user.userType === 'teacher') {
      // Los docentes pueden acceder a resultados de sus estudiantes
      if (result.userId.grade !== req.user.grade) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a resultados de tu grado asignado'
        });
      }
    }

    req.result = result;
    next();
  } catch (error) {
    console.error('Error verificando acceso al resultado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  authenticateToken,
  requireStudent,
  requireTeacher,
  requireOwnership,
  requireExamAccess,
  requireDocumentAccess,
  requireResultAccess
};


