import express from 'express';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, verifyCourseCode } from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getCourses);
router.post('/verify-code', verifyCourseCode);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('admin', 'instructor'), createCourse);
router.put('/:id', protect, authorize('admin', 'instructor'), updateCourse);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteCourse);

export default router;
