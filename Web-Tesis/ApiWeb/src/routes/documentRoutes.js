const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authenticateToken, requireStudent, requireTeacher } = require('../middleware/auth');
const { validate, documentSchemas, querySchemas } = require('../middleware/validation');

// Crear directorio de uploads si no existe
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Permitir PDF, Word, TXT e imágenes
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/bmp',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB por defecto
  },
  fileFilter: fileFilter
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo permitido (10MB)'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'Error al subir el archivo'
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error al procesar el archivo'
    });
  }
  next();
};

// Rutas de documentos
router.post('/upload', authenticateToken, requireStudent, upload.single('file'), handleMulterError, documentController.uploadDocument);
router.get('/my-documents', authenticateToken, requireStudent, validate(querySchemas.pagination, 'query'), documentController.getUserDocuments);
router.get('/by-grade', authenticateToken, requireTeacher, validate(querySchemas.filter, 'query'), documentController.getDocumentsByGrade);
router.get('/:documentId', authenticateToken, documentController.getDocument);
router.put('/:documentId', authenticateToken, documentController.updateDocument);
router.delete('/:documentId', authenticateToken, documentController.deleteDocument);
router.post('/:documentId/process', authenticateToken, documentController.processDocument);

module.exports = router;


