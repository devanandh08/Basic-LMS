import express from 'express';
import { 
  enrollInCourse, 
  getMyEnrollments, 
  updateProgress, 
  cancelEnrollment 
} from '../controllers/enrollmentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/enroll', protect, enrollInCourse);
router.get('/my', protect, getMyEnrollments);
router.put('/progress', protect, updateProgress);
router.delete('/:courseId', protect, cancelEnrollment);

export default router;
