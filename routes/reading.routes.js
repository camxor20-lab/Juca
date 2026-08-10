import { Router } from 'express';
import { 
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} from '../controllers/reading.controller.js';

const router = Router();

router.post('/', createReading);
router.get('/', getReadings);
router.get('/:id', getReadingById);
router.put('/:id', updateReading);
router.delete('/:id', deleteReading);

export default router;