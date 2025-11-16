const express = require('express');
const router = express.Router();
const participationController = require('../controllers/participationController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');

// Todas las rutas requieren autenticación y ser docente
router.use(authenticateToken);
router.use(requireTeacher);

// Crear nueva sesión de participación
router.post('/sessions', participationController.createSession);

// Obtener todas las sesiones del docente
router.get('/sessions', participationController.getMySessions);

// Obtener una sesión específica
router.get('/sessions/:sessionId', participationController.getSession);

// Actualizar una sesión activa
router.put('/sessions/:sessionId', participationController.updateSession);

// Finalizar una sesión
router.post('/sessions/:sessionId/complete', participationController.completeSession);

// Obtener estadísticas de participación
router.get('/statistics', participationController.getStatistics);

module.exports = router;





