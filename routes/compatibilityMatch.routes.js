import { Router } from 'express';
import { 
  createCompatibilityMatch,
  getCompatibilityMatches,
  getCompatibilityMatchById,
  updateCompatibilityMatch,
  deleteCompatibilityMatch
} from '../controllers/compatibilityMatch.controller.js';

const router = Router();

router.post('/', createCompatibilityMatch);
router.get('/', getCompatibilityMatches);
router.get('/:id', getCompatibilityMatchById);
router.put('/:id', updateCompatibilityMatch);
router.delete('/:id', deleteCompatibilityMatch);

export default router;