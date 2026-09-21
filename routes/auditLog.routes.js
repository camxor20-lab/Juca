import { Router } from 'express';
import { 
  createAuditLog, 
  getAuditLogs, 
  getAuditLogById, 
  updateAuditLog, 
  deleteAuditLog 
} from '../controllers/auditLog.controller.js';
import { 
  validarCrearRegistroAuditoria, 
  validarAuditoriaId 
} from '../validators/auditLog.validator.js';
import { validateResult } from '../middlewares/validateResult.middleware.js';
import { validarJWT } from '../middlewares/validarToken.js';

const router = Router();

router.post('/', validarJWT, validarCrearRegistroAuditoria, validateResult, createAuditLog);
router.get('/', validarJWT, getAuditLogs);
router.get('/:id', validarJWT, validarAuditoriaId, validateResult, getAuditLogById);
router.put('/:id', validarJWT, validarAuditoriaId, validarCrearRegistroAuditoria, validateResult, updateAuditLog);
router.delete('/:id', validarJWT, validarAuditoriaId, validateResult, deleteAuditLog);

export default router;
