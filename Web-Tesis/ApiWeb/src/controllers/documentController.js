const Document = require('../models/Document');
const Exam = require('../models/Exam');
const path = require('path');
const fs = require('fs').promises;
const geminiService = require('../services/geminiService');

// Subir documento
const uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Verificar que el usuario es estudiante
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Solo los estudiantes pueden subir documentos'
      });
    }

    // Verificar que hay un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }

    // Obtener información del archivo
    const fileName = req.body.fileName || req.file.originalname;
    const fileType = req.body.fileType || getFileTypeFromMime(req.file.mimetype);
    const fileSize = req.file.size;

    // Validar tipo de archivo
    const allowedTypes = ['pdf', 'docx', 'txt', 'image'];
    if (!allowedTypes.includes(fileType)) {
      // Eliminar archivo subido si el tipo no es válido
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido'
      });
    }

    // Crear documento en la base de datos
    const document = new Document({
      userId,
      fileName,
      filePath: req.file.path,
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
    // Eliminar archivo si hay error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
    }
    next(error);
  }
};

// Función auxiliar para obtener el tipo de archivo desde el MIME type
const getFileTypeFromMime = (mimeType) => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
  if (mimeType === 'text/plain') return 'txt';
  if (mimeType.startsWith('image/')) return 'image';
  return 'unknown';
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
    const userId = req.user._id.toString();

    const document = await Document.findById(documentId).populate('exam');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso - comparar ambos como strings para evitar problemas de tipo
    if (req.user.userType === 'student' && document.userId.toString() !== userId.toString()) {
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
    const userId = req.user._id.toString();

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso - comparar ambos como strings para evitar problemas de tipo
    if (req.user.userType === 'student' && document.userId.toString() !== userId.toString()) {
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
    const userId = req.user._id.toString();

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso - comparar ambos como strings para evitar problemas de tipo
    if (req.user.userType === 'student' && document.userId.toString() !== userId.toString()) {
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

// Procesar documento con Gemini
const processDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id.toString();

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso - comparar ambos como strings para evitar problemas de tipo
    if (req.user.userType === 'student' && document.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este documento'
      });
    }

    // Verificar que el archivo existe
    if (!document.filePath) {
      return res.status(400).json({
        success: false,
        message: 'El documento no tiene un archivo asociado'
      });
    }

    // Marcar como procesando
    document.status = 'processing';
    document.errorMessage = undefined;
    await document.save();

    // Procesar de forma asíncrona
    processDocumentAsync(document).catch(error => {
      console.error('Error procesando documento de forma asíncrona:', error);
    });

    res.json({
      success: true,
      message: 'Documento enviado para procesamiento con Gemini',
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

// Procesar documento de forma asíncrona con Gemini
const processDocumentAsync = async (document) => {
  try {
    // Procesar documento con Gemini
    const processedContent = await geminiService.processDocumentWithGemini(
      document.filePath,
      document.fileType
    );

    // Actualizar documento con el contenido procesado
    if (typeof processedContent === 'string') {
      // Para imágenes, processedContent es directamente el texto
      document.contentText = processedContent;
    } else {
      // Para documentos de texto, usar el texto original extraído
      document.contentText = processedContent.originalText || processedContent.analyzedContent;
    }

    document.status = 'analyzed';
    document.errorMessage = undefined;
    await document.save();

    console.log(`✅ Documento ${document._id} procesado exitosamente con Gemini`);
  } catch (error) {
    console.error(`❌ Error procesando documento ${document._id}:`, error);
    document.status = 'error';
    document.errorMessage = error.message || 'Error procesando el documento con Gemini';
    await document.save();
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


