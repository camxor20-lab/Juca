import mongoose from 'mongoose'; // Importar la biblioteca Mongoose para interactuar con MongoDB

const conectarDB = async () => { // Definir una función asíncrona para conectar a la base de datos MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI); // Intentar establecer la conexión con la base de datos MongoDB usando la URI definida en las variables de entorno
    console.log('Conectado a MongoDB'); // Mostrar un mensaje en la consola indicando que la conexión a MongoDB fue exitosa
  } catch (error) { // Manejar errores de conexión a la base de datos
    console.error('Error al conectar a MongoDB:', error.message); // Mostrar un mensaje de error en la consola si la conexión falla
    process.exit(1); // Salir del proceso con un código de error 1 si la conexión falla
  }
};

export default conectarDB; // Exportar la función conectarDB para que pueda ser utilizada en otros archivos, como app.js