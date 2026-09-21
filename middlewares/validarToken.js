import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const validarJWT = async (req, res, next) => {
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({
      msg: 'No hay token en la petición',
    });
  }

  try {
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await User.findById(uid);

    if (!usuario) {
      return res.status(401).json({
        msg: 'Token no válido - usuario no existe en DB',
      });
    }

    if (usuario.estado === 0) {
      return res.status(401).json({
        msg: 'Token no válido - usuario inactivo',
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      msg: 'Token no válido',
    });
  }
};