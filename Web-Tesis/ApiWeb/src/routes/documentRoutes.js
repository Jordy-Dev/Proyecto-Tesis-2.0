const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, requireStudent, requireTeacher } = require('../middleware/auth');
const { validate, documentSchemas, querySchemas } = require('../middleware/validation');

// Middleware para subir archivos (simulado)
const upload = (req, res, next) => {
  // Simular archivo subido
  req.file = {
    path: `/uploads/${Date.now()}-${req.body.fileName}`,
    originalname: req.body.fileName
  };
  next();
};

// Rutas de documentos
router.post('/upload', authenticateToken, requireStudent, upload, validate(documentSchemas.upload), documentController.uploadDocument);
router.get('/my-documents', authenticateToken, requireStudent, validate(querySchemas.pagination, 'query'), documentController.getUserDocuments);
router.get('/by-grade', authenticateToken, requireTeacher, validate(querySchemas.filter, 'query'), documentController.getDocumentsByGrade);
router.get('/:documentId', authenticateToken, documentController.getDocument);
router.put('/:documentId', authenticateToken, documentController.updateDocument);
router.delete('/:documentId', authenticateToken, documentController.deleteDocument);
router.post('/:documentId/process', authenticateToken, documentController.processDocument);

module.exports = router;


