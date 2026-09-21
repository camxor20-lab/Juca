import { body, param } from 'express-validator';

export const validarCrearPerfilNumerologico = [
  body('userId')
    .exists().withMessage('El ID de usuario (userId) es obligatorio')
    .isMongoId().withMessage('Debe proporcionar un ID de usuario válido de MongoDB'),
  body('lifePathNumber')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('El número de camino de vida debe ser un entero entre 1 y 99'),
  body('destinyNumber')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('El número de destino debe ser un entero entre 1 y 99'),
  body('soulUrgeNumber')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('El número de impulso del alma debe ser un entero entre 1 y 99'),
  body('personalityNumber')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('El número de personalidad debe ser un entero entre 1 y 99'),
  body('notes')
    .optional()
    .isString().withMessage('Las notas deben ser un texto')
    .trim()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden superar los 1000 caracteres'),
];

export const validarPerfilId = [
  param('id')
    .isMongoId().withMessage('El ID del perfil no es válido (debe ser un ObjectId)'),
];