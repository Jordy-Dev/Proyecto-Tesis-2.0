const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authenticateToken, requireStudent, requireTeacher } = require('../middleware/auth');
const { validate, documentSchemas, querySchemas } = require('../middleware/validation');

// Configuración real de subida de archivos con multer
const uploadPath = process.env.UPLOAD_PATH || './uploads';

// Asegurar que la carpeta de uploads existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024
  }
});

// Rutas de documentos
router.post('/upload', authenticateToken, requireStudent, upload.single('file'), documentController.uploadDocument);
router.get('/my-documents', authenticateToken, requireStudent, validate(querySchemas.pagination, 'query'), documentController.getUserDocuments);
router.get('/by-grade', authenticateToken, requireTeacher, validate(querySchemas.filter, 'query'), documentController.getDocumentsByGrade);
router.get('/:documentId', authenticateToken, documentController.getDocument);
router.put('/:documentId', authenticateToken, documentController.updateDocument);
router.delete('/:documentId', authenticateToken, documentController.deleteDocument);
router.post('/:documentId/process', authenticateToken, documentController.processDocument);

module.exports = router;


