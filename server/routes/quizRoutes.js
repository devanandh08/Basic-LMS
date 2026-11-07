import express from 'express';
import { 
  getQuizzesByCourse, 
  getQuizById, 
  createQuizWithQuestions, 
  updateQuiz,
  submitQuiz, 
  deleteQuiz,
  getMyResults,
  getAllResults,
  addQuestionToQuiz,
  deleteQuestion
} from '../controllers/quizController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Quiz retrieval
router.get('/course/:courseId', getQuizzesByCourse); // Public course quiz outline
router.get('/results/my', protect, getMyResults); // Student's own quiz results
router.get('/results/all', protect, authorize('admin', 'instructor'), getAllResults); // Admin/Instructor reports
router.get('/:quizId', protect, getQuizById); // Specific quiz details

// Quiz Management (Instructors & Admins)
router.post('/', protect, authorize('admin', 'instructor'), createQuizWithQuestions);
router.put('/:id', protect, authorize('admin', 'instructor'), updateQuiz);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteQuiz);

// Quiz Submission
router.post('/submit', protect, submitQuiz);

// Question Management
router.post('/:quizId/questions', protect, authorize('admin', 'instructor'), addQuestionToQuiz);
router.delete('/questions/:id', protect, authorize('admin', 'instructor'), deleteQuestion);

export default router;
