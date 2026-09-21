import { Router } from 'express';
import { 
  login,               
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/user.controller.js';
import { 
  validarCrearUsuario, 
  validarActualizarUsuario,
  validarUsuarioId 
} from '../validators/user.validator.js';
import { validateResult } from '../middlewares/validateResult.middleware.js';

const router = Router();

// Ruta pública: inicio de sesión
router.post('/login', login);

// Rutas de usuario para laboratorio
router.post('/', validarCrearUsuario, validateResult, createUser);
router.get('/', getUsers);
router.get('/:id', validarUsuarioId, validateResult, getUserById);
router.put('/:id', validarUsuarioId, validarActualizarUsuario, validateResult, updateUser);
router.delete('/:id', validarUsuarioId, validateResult, deleteUser);

export default router;
