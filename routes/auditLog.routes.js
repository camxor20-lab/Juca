import { Router } from 'express';
import { 
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  updateAuditLog,
  deleteAuditLog
} from '../controllers/auditLog.controller.js';

const router = Router();

router.post('/', createAuditLog);
router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);
router.put('/:id', updateAuditLog);
router.delete('/:id', deleteAuditLog);

export default router;