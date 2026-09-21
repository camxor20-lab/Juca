import { body, param } from 'express-validator';

export const validarCrearRegistroAuditoria = [
  body('usuarioId')
    .exists().withMessage('El ID de usuario es obligatorio')
    .isMongoId().withMessage('Debe proporcionar un ID de usuario válido'),
  body('accion')
    .exists().withMessage('La acción es obligatoria')
    .notEmpty().withMessage('La acción realizada no puede estar vacía')
    .isString().withMessage('La acción debe ser un texto')
    .trim(),
  body('detalles')
    .optional()
    .isObject().withMessage('Los detalles deben ser un objeto JSON válido'),
];

export const validarAuditoriaId = [
  param('id')
    .isMongoId().withMessage('El ID del registro de auditoría no es válido'),
];