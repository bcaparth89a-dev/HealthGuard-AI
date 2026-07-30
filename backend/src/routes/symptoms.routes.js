import express from 'express';
import { checkSymptoms } from '../controllers/symptoms.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/check', requireAuth, checkSymptoms);

export default router;
