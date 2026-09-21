import { Router } from 'express';
import { 
  createReading, 
  getReadings, 
  getReadingById, 
  updateReading, 
  deleteReading 
} from '../controllers/reading.controller.js';
import { 
  validarCrearLectura, 
  validarLecturaId 
} from '../validators/reading.validator.js';
import { validateResult } from '../middlewares/validateResult.middleware.js';
import { validarJWT } from '../middlewares/validarToken.js';

const router = Router();

router.post('/', validarCrearLectura, validateResult, createReading);
router.get('/', getReadings);
router.get('/:id', validarLecturaId, validateResult, getReadingById);
router.put('/:id', validarLecturaId, validarCrearLectura, validateResult, updateReading);
router.delete('/:id', validarLecturaId, validateResult, deleteReading);

export default router;
