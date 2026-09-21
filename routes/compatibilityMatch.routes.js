import { Router } from 'express';
import { 
  createCompatibilityMatch, 
  getCompatibilityMatches, 
  getCompatibilityMatchById, 
  updateCompatibilityMatch, 
  deleteCompatibilityMatch 
} from '../controllers/compatibilityMatch.controller.js';
import { 
  validarCrearCompatibilidad, 
  validarCompatibilidadId 
} from '../validators/compatibilityMatch.validator.js';
import { validateResult } from '../middlewares/validateResult.middleware.js';
import { validarJWT } from '../middlewares/validarToken.js';

const router = Router();

router.post('/', validarJWT, validarCrearCompatibilidad, validateResult, createCompatibilityMatch);
router.get('/', validarJWT, getCompatibilityMatches);
router.get('/:id', validarJWT, validarCompatibilidadId, validateResult, getCompatibilityMatchById);
router.put('/:id', validarJWT, validarCompatibilidadId, validarCrearCompatibilidad, validateResult, updateCompatibilityMatch);
router.delete('/:id', validarJWT, validarCompatibilidadId, validateResult, deleteCompatibilityMatch);

export default router;
