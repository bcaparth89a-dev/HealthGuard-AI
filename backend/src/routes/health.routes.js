import express from 'express';
import { predictRisk } from '../controllers/health.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, predictRisk);

export default router;
