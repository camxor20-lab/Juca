// app.js
// Daniel Mauricio Vesga Tibaduiza
// Andrea Carolina Silva Macias

import express from 'express';
import dotenv from 'dotenv';

// Importar las 5 rutas
import userRoutes from './routes/user.routes.js';
import numerologyProfileRoutes from './routes/numerology.routes.js';
import readingRoutes from './routes/reading.routes.js';
import compatibilityMatchRoutes from './routes/compatibilityMatch.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';

dotenv.config();

const app = express();

// Middleware para procesar JSON
app.use(express.json());

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('API de Numerología funcionando');
});

// Registrar las 5 rutas
app.use('/api/users', userRoutes);
app.use('/api/numerology-profiles', numerologyProfileRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/compatibility-matches', compatibilityMatchRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Manejador 404 consistente en JSON para rutas o métodos no definidos (Ataque #11)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    mensaje: `Ruta o método no disponible: ${req.method} ${req.originalUrl}`
  });
});

// Middleware centralizado de manejo de errores (Ataque #9 y excepciones no controladas)
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      mensaje: `Identificador o dato con formato inválido para el campo ${err.path}`
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      mensaje: 'El cuerpo de la petición contiene un JSON con sintaxis rota'
    });
  }

  console.error('Error interno no controlado:', err);
  res.status(500).json({
    status: 'error',
    mensaje: 'Error interno en el servidor'
  });
});

// Exportar la instancia de app
export default app;
