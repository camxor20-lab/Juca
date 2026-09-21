import { Router } from 'express';
import { 
  createNumerologyProfile, 
  getNumerologyProfiles, 
  getNumerologyProfileById, 
  updateNumerologyProfile, 
  deleteNumerologyProfile 
} from '../controllers/numerologyProfile.controller.js';
import { 
  validarCrearPerfilNumerologico, 
  validarPerfilId 
} from '../validators/numerologyProfile.validator.js';
import { validateResult } from '../middlewares/validateResult.middleware.js';
import { validarJWT } from '../middlewares/validarToken.js';

const router = Router();

router.post('/', validarCrearPerfilNumerologico, validateResult, createNumerologyProfile);
router.get('/', getNumerologyProfiles);
router.get('/:id', validarPerfilId, validateResult, getNumerologyProfileById);
router.put('/:id', validarPerfilId, validarCrearPerfilNumerologico, validateResult, updateNumerologyProfile);
router.delete('/:id', validarPerfilId, validateResult, deleteNumerologyProfile);

export default router;
