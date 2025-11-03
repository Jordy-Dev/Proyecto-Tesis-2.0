const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, requireStudent, requireTeacher } = require('../middleware/auth');
const { validate, examSchemas, querySchemas } = require('../middleware/validation');

// Rutas de exámenes
router.post('/create', authenticateToken, requireStudent, validate(examSchemas.create), examController.createExam);
router.get('/my-exams', authenticateToken, requireStudent, validate(querySchemas.pagination, 'query'), examController.getUserExams);
router.get('/by-grade', authenticateToken, requireTeacher, validate(querySchemas.filter, 'query'), examController.getExamsByGrade);
router.get('/:examId', authenticateToken, examController.getExam);
router.post('/:examId/start', authenticateToken, requireStudent, validate(examSchemas.start), examController.startExam);
router.post('/:examId/submit', authenticateToken, requireStudent, examController.submitExam);
router.get('/:examId/questions', authenticateToken, examController.getExamQuestions);
router.get('/:examId/result', authenticateToken, examController.getExamResult);

module.exports = router;


