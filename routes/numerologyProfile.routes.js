import { Router } from 'express';
import { 
  createNumerologyProfile,
  getNumerologyProfiles,
  getNumerologyProfileById,
  updateNumerologyProfile,
  deleteNumerologyProfile
} from '../controllers/numerologyProfile.controller.js';

const router = Router();

router.post('/', createNumerologyProfile);
router.get('/', getNumerologyProfiles);
router.get('/:id', getNumerologyProfileById);
router.put('/:id', updateNumerologyProfile);
router.delete('/:id', deleteNumerologyProfile);

export default router;