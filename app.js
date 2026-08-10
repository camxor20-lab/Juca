import express from 'express';
import dotenv from 'dotenv';
import conectarDB from './database/db.js';

import userRoutes from './routes/user.routes.js';
import numerologyProfileRoutes from './routes/numerologyProfile.routes.js';
import readingRoutes from './routes/reading.routes.js';
import compatibilityMatchRoutes from './routes/compatibilityMatch.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3200;

conectarDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API de Numerología funcionando');
});

app.use('/api/users', userRoutes);
app.use('/api/numerology-profiles', numerologyProfileRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/compatibility-matches', compatibilityMatchRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
