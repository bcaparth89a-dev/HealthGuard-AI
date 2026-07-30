import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { getRecords, uploadRecord } from '../controllers/records.controller.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // limit 10MB

router.get('/', requireAuth, getRecords);
router.post('/upload', requireAuth, upload.single('document'), uploadRecord);

export default router;
