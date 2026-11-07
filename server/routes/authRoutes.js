import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  getAllUsers, 
  updateUserRole, 
  deleteUser 
} from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Admin-only User CRUD routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;
