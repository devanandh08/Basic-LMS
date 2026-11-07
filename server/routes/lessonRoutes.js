import express from 'express';
import { getLessonsByCourse, createLesson, updateLesson, deleteLesson } from '../controllers/lessonController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', getLessonsByCourse);
router.post('/', protect, authorize('admin', 'instructor'), createLesson);
router.put('/:id', protect, authorize('admin', 'instructor'), updateLesson);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteLesson);

export default router;
