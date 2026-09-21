import { body, param } from 'express-validator';

export const validarCrearLectura = [
  body('userId')
    .exists().withMessage('El ID del usuario (userId) es obligatorio')
    .isMongoId().withMessage('Debe proporcionar un ID de usuario válido (ObjectId)'),
  body('numerologistId')
    .exists().withMessage('El ID del numerólogo (numerologistId) es obligatorio')
    .isMongoId().withMessage('Debe proporcionar un ID de numerólogo válido (ObjectId)'),
  body('readingType')
    .exists().withMessage('El tipo de lectura es obligatorio')
    .isIn(['love', 'career', 'money', 'general']).withMessage('El tipo de lectura debe ser love, career, money o general'),
  body('summary')
    .exists().withMessage('El resumen de la lectura es obligatorio')
    .isString().withMessage('El resumen debe ser un texto')
    .trim()
    .notEmpty().withMessage('El resumen no puede estar vacío')
    .isLength({ min: 3, max: 200 }).withMessage('El resumen debe tener entre 3 y 200 caracteres'),
  body('details')
    .optional()
    .isString().withMessage('Los detalles deben ser un texto')
    .trim()
    .isLength({ max: 2000 }).withMessage('Los detalles no pueden superar los 2000 caracteres'),
];

export const validarLecturaId = [
  param('id')
    .isMongoId().withMessage('El ID de la lectura no es válido (debe ser un ObjectId)'),
];