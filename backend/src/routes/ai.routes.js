import express from 'express';
import { generateAiReport } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/report', requireAuth, generateAiReport);

export default router;
