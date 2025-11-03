const Document = require('../models/Document');
const Exam = require('../models/Exam');
const path = require('path');
const fs = require('fs').promises;

// Subir documento
const uploadDocument = async (req, res, next) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const userId = req.user._id;

    // Verificar que el usuario es estudiante
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Solo los estudiantes pueden subir documentos'
      });
    }

    // Crear documento en la base de datos
    const document = new Document({
      userId,
      fileName,
      filePath: req.file ? req.file.path : null,
      fileType,
      fileSize,
      status: 'uploaded'
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: {
        document: {
          id: document._id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          status: document.status,
          createdAt: document.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documentos del usuario
const getUserDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    // Construir filtro
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Calcular paginación
    const skip = (page - 1) * limit;

    // Obtener documentos
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('exam', 'title status');

    // Contar total
    const total = await Document.countDocuments(filter);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documento por ID
const getDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const document = await Document.findById(documentId).populate('exam');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && document.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este documento'
      });
    }

    res.json({
      success: true,
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar documento
const updateDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { fileName, contentText } = req.body;
    const userId = req.user._id;

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && document.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este documento'
      });
    }

    // Actualizar campos permitidos
    if (fileName) document.fileName = fileName;
    if (contentText) document.contentText = contentText;

    await document.save();

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar documento
const deleteDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && document.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este documento'
      });
    }

    // Verificar si tiene exámenes asociados
    const exam = await Exam.findOne({ documentId });
    if (exam) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el documento porque tiene exámenes asociados'
      });
    }

    // Eliminar archivo físico si existe
    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
      } catch (fileError) {
        console.error('Error eliminando archivo:', fileError);
      }
    }

    await Document.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documentos por grado (para docentes)
const getDocumentsByGrade = async (req, res, next) => {
  try {
    const { grade, section } = req.query;
    const teacherGrade = req.user.grade;

    // Verificar que el docente puede acceder a este grado
    if (req.user.userType !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Solo los docentes pueden acceder a esta función'
      });
    }

    if (grade && grade !== teacherGrade) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a documentos de tu grado asignado'
      });
    }

    // Construir filtro
    const filter = {};
    if (grade) {
      filter.grade = grade;
    }
    if (section) {
      filter.section = section;
    }

    // Obtener documentos con información del usuario
    const documents = await Document.aggregate([
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
          ...filter
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: 'documentId',
          as: 'exam'
        }
      },
      {
        $project: {
          _id: 1,
          fileName: 1,
          fileType: 1,
          fileSize: 1,
          status: 1,
          createdAt: 1,
          'user.name': 1,
          'user.grade': 1,
          'user.section': 1,
          exam: { $arrayElemAt: ['$exam', 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        documents
      }
    });
  } catch (error) {
    next(error);
  }
};

// Procesar documento con IA (simulado)
const processDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.userType === 'student' && document.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este documento'
      });
    }

    // Simular procesamiento con IA
    document.status = 'processing';
    await document.save();

    // Simular tiempo de procesamiento
    setTimeout(async () => {
      try {
        document.status = 'analyzed';
        document.contentText = 'Contenido extraído del documento...'; // Simulado
        await document.save();
      } catch (error) {
        console.error('Error procesando documento:', error);
        document.status = 'error';
        document.errorMessage = 'Error procesando el documento';
        await document.save();
      }
    }, 5000);

    res.json({
      success: true,
      message: 'Documento enviado para procesamiento',
      data: {
        document: {
          id: document._id,
          status: document.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByGrade,
  processDocument
};


