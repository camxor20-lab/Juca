import { body, param } from 'express-validator';

export const validarCrearUsuario = [
  body('firstName')
    .exists().withMessage('El primer nombre es obligatorio')
    .isString().withMessage('El primer nombre debe ser un texto')
    .trim()
    .notEmpty().withMessage('El primer nombre no puede estar vacío')
    .isLength({ min: 2, max: 50 }).withMessage('El primer nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .exists().withMessage('El apellido es obligatorio')
    .isString().withMessage('El apellido debe ser un texto')
    .trim()
    .notEmpty().withMessage('El apellido no puede estar vacío')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email')
    .exists().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Debe ingresar un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .exists().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres'),
  body('birthDate')
    .exists().withMessage('La fecha de nacimiento es obligatoria')
    .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
  body('role')
    .optional()
    .isIn(['client', 'admin']).withMessage('El rol especificado debe ser "client" o "admin"'),
];

export const validarActualizarUsuario = [
  body('firstName')
    .optional()
    .isString().withMessage('El primer nombre debe ser un texto')
    .trim()
    .notEmpty().withMessage('El primer nombre no puede estar vacío si se proporciona')
    .isLength({ min: 2, max: 50 }).withMessage('El primer nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .optional()
    .isString().withMessage('El apellido debe ser un texto')
    .trim()
    .notEmpty().withMessage('El apellido no puede estar vacío si se proporciona')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email')
    .optional()
    .isEmail().withMessage('Debe ingresar un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
  body('role')
    .optional()
    .isIn(['client', 'admin']).withMessage('El rol especificado debe ser "client" o "admin"'),
];

export const validarUsuarioId = [
  param('id')
    .isMongoId().withMessage('El ID de usuario no es válido (debe ser un ObjectId de MongoDB)'),
];