const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireTeacher, requireStudent } = require('../middleware/auth');
const { validate, querySchemas } = require('../middleware/validation');

// Rutas para estudiantes (pueden acceder a su propio progreso)
router.get('/my-progress', authenticateToken, requireStudent, userController.getMyProgress);

// Rutas para docentes
router.get('/students', authenticateToken, requireTeacher, validate(querySchemas.filter, 'query'), userController.getStudents);
router.get('/students/:studentId', authenticateToken, requireTeacher, userController.getStudent);
router.get('/students/:studentId/progress', authenticateToken, requireTeacher, userController.getStudentProgress);
router.get('/students/:studentId/exams', authenticateToken, requireTeacher, validate(querySchemas.pagination, 'query'), userController.getStudentExams);
router.get('/statistics', authenticateToken, requireTeacher, userController.getStatistics);
router.get('/ranking', authenticateToken, requireTeacher, validate(querySchemas.filter, 'query'), userController.getRanking);

module.exports = router;


