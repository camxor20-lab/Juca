import { body, param } from 'express-validator';

export const validarCrearCompatibilidad = [
  body('perfil1Id')
    .exists().withMessage('El ID del primer perfil es obligatorio')
    .isMongoId().withMessage('El ID del primer perfil debe ser un ID válido'),
  body('perfil2Id')
    .exists().withMessage('El ID del segundo perfil es obligatorio')
    .isMongoId().withMessage('El ID del segundo perfil debe ser un ID válido')
    .custom((value, { req }) => {
      if (value === req.body.perfil1Id) {
        throw new Error('No se puede comparar un perfil consigo mismo');
      }
      return true;
    }),
  body('porcentajeCompatibilidad')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('El porcentaje debe ser un número entre 0 y 100'),
];

export const validarCompatibilidadId = [
  param('id')
    .isMongoId().withMessage('El ID de compatibilidad no es válido'),
];