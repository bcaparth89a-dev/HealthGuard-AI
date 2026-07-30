import express from 'express';
import { 
  getAllReports, 
  getReportById, 
  deleteReport, 
  duplicateReport 
} from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All EMR report actions require authentication
router.get('/', requireAuth, getAllReports);
router.get('/:id', requireAuth, getReportById);
router.delete('/:id', requireAuth, deleteReport);
router.post('/:id/duplicate', requireAuth, duplicateReport);

export default router;
