import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config(); // cargar variables del .env

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware para leer json
app.use(express.json()); 

// Conexión a Mongo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error conectando a Mongo:', err));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando!');
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});