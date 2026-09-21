// seed.js - Poblar base de datos con datos de prueba reales para el laboratorio
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import NumerologyProfile from './models/NumerologyProfile.model.js';
import Reading from './models/Reading.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/numerologia_lab';

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB para poblar datos...');

    // Limpiar colecciones
    await User.deleteMany({});
    await NumerologyProfile.deleteMany({});
    await Reading.deleteMany({});
    console.log('Colecciones anteriores vaciadas.');

    // 1. Crear 3 Usuarios
    const users = await User.create([
      {
        firstName: 'Ana',
        lastName: 'Gomez',
        email: 'ana.gomez@test.com',
        password: 'password123',
        birthDate: new Date('1995-04-12'),
        role: 'client'
      },
      {
        firstName: 'Carlos',
        lastName: 'Perez',
        email: 'carlos.perez@test.com',
        password: 'password123',
        birthDate: new Date('1988-11-23'),
        role: 'admin'
      },
      {
        firstName: 'Diana',
        lastName: 'Lopez',
        email: 'diana.lopez@test.com',
        password: 'password123',
        birthDate: new Date('2000-01-15'),
        role: 'client'
      }
    ]);
    console.log(`Insertados ${users.length} usuarios.`);

    // 2. Crear 3 Perfiles Numerológicos (con ref a User)
    const profiles = await NumerologyProfile.create([
      {
        userId: users[0]._id,
        lifePathNumber: 7,
        destinyNumber: 3,
        soulUrgeNumber: 9,
        personalityNumber: 5,
        notes: 'Perfil enfocado en intuición, análisis profundo y búsqueda espiritual.'
      },
      {
        userId: users[1]._id,
        lifePathNumber: 1,
        destinyNumber: 8,
        soulUrgeNumber: 4,
        personalityNumber: 6,
        notes: 'Liderazgo innato, sentido práctico y metas financieras ambiciosas.'
      },
      {
        userId: users[2]._id,
        lifePathNumber: 9,
        destinyNumber: 6,
        soulUrgeNumber: 2,
        personalityNumber: 1,
        notes: 'Humanitarismo, compasión y búsqueda de armonía en relaciones familiares.'
      }
    ]);
    console.log(`Insertados ${profiles.length} perfiles numerológicos.`);

    // 3. Crear 3 Lecturas (con refs a User como cliente y User como numerólogo)
    const readings = await Reading.create([
      {
        userId: users[0]._id,
        numerologistId: users[1]._id,
        readingType: 'love',
        readingDate: new Date('2026-09-10'),
        summary: 'Compatibilidad de almas y ciclos de cierre afectivo',
        details: 'Se proyecta un periodo propicio para relaciones constructivas basadas en la sinceridad.'
      },
      {
        userId: users[2]._id,
        numerologistId: users[1]._id,
        readingType: 'career',
        readingDate: new Date('2026-09-12'),
        summary: 'Cambio de rumbo vocacional y expansión laboral',
        details: 'Oportunidades de emprender en proyectos sociales o de tecnología aplicada.'
      },
      {
        userId: users[0]._id,
        numerologistId: users[1]._id,
        readingType: 'general',
        readingDate: new Date('2026-09-14'),
        summary: 'Año personal 5: transformaciones y viajes',
        details: 'El consultante experimentará cambios súbitos de perspectiva durante el último trimestre.'
      }
    ]);
    console.log(`Insertadas ${readings.length} lecturas.`);

    console.log('\n--- DATOS DE PRUEBA GENERADOS EXITOSAMENTE ---');
    console.log('Usuarios ID:', users.map(u => ({ id: u._id.toString(), email: u.email, role: u.role })));
    console.log('Perfiles ID:', profiles.map(p => ({ id: p._id.toString(), userId: p.userId.toString() })));
    console.log('Lecturas ID:', readings.map(r => ({ id: r._id.toString(), userId: r.userId.toString(), numerologistId: r.numerologistId.toString() })));

    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar la base de datos:', error);
    process.exit(1);
  }
};

seedDB();
