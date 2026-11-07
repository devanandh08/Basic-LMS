import express from 'express';
import { getDashboardSummary } from '../controllers/reportController.js';

const router = express.Router();

// Allow accessing summary for dashboard and academic report generation
router.get('/summary', getDashboardSummary);

export default router;
