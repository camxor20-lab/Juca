// server.js
import app from './app.js';
import conectarDB from './database/db.js';

const PORT = process.env.PORT || 3200;

// Conectar a la base de datos
conectarDB();

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});