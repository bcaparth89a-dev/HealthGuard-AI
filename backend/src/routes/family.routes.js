import express from 'express';
import { 
  getFamilyMembers, 
  addFamilyMember, 
  deleteFamilyMember 
} from '../controllers/family.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware for all family endpoints
router.use(requireAuth);

router.get('/', getFamilyMembers);
router.post('/', addFamilyMember);
router.delete('/:id', deleteFamilyMember);

export default router;
