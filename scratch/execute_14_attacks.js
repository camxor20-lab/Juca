// scratch/execute_14_attacks.js
// Script para ejecutar y documentar de manera reproducible los 14 ataques

const BASE_URL = 'http://localhost:3200';

async function runAttacks() {
  console.log('=== INICIANDO PRUEBAS DE LOS 14 ATAQUES ===\n');

  // Obtener IDs de prueba existentes
  const usersRes = await fetch(`${BASE_URL}/api/users`);
  const users = await usersRes.json();
  const validUserId = users[0]?._id;
  const anotherUserId = users[1]?._id;

  const readingsRes = await fetch(`${BASE_URL}/api/readings`);
  const readings = await readingsRes.json();
  const validReadingId = readings[0]?._id;

  console.log('Usuario base ID:', validUserId);
  console.log('Lectura base ID:', validReadingId);
  console.log('--------------------------------------------------\n');

  const results = [];

  // ATAQUE 1: Falta lo obligatorio
  {
    const body = { firstName: 'Juan' };
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    results.push({
      num: 1,
      name: 'Falta lo obligatorio',
      method: 'POST',
      route: '/api/users',
      body,
      status: res.status,
      response: data,
      verdict: res.status === 400 && data.errores ? 'DEFENDIDO' : 'VULNERABLE',
      note: res.status === 400 && data.errores 
        ? 'express-validator detectó campos faltantes y devolvió 400 estructurado.' 
        : `Respondió ${res.status}: ${JSON.stringify(data)}`
    });
  }

  // ATAQUE 2: Body totalmente vacío
  {
    const body = {};
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    results.push({
      num: 2,
      name: 'Body totalmente vacío',
      method: 'POST',
      route: '/api/users',
      body,
      status: res.status,
      response: data,
      verdict: res.status === 400 && data.errores ? 'DEFENDIDO' : 'VULNERABLE',
      note: res.status === 400 && data.errores 
        ? 'express-validator rechazó el body vacío con 400 y detalle de campos requeridos.' 
        : `Respondió ${res.status}: ${JSON.stringify(data)}`
    });
  }

  // ATAQUE 3: Tipos cambiados
  {
    const body = {
      firstName: 99999,
      lastName: 88888,
      email: 'tipos.cambiados@test.com',
      password: 'password123',
      birthDate: 'fecha-totalmente-invalida'
    };
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    results.push({
      num: 3,
      name: 'Tipos cambiados',
      method: 'POST',
      route: '/api/users',
      body,
      status: res.status,
      response: data,
      verdict: res.status === 400 && data.errores ? 'DEFENDIDO' : 'VULNERABLE',
      note: res.status === 400 && data.errores 
        ? 'express-validator validó tipos (isString, isISO8601) y rechazó con 400.' 
        : `Respondió ${res.status}: ${JSON.stringify(data)}`
    });
  }

  // ATAQUE 4: Vacío disfrazado ("" y luego "   ")
  {
    const body = {
      firstName: '   ',
      lastName: '   ',
      email: 'espacios@test.com',
      password: 'password123',
      birthDate: '1995-05-15'
    };
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    const wasDefended = res.status === 400 && data.errores && data.errores.some(e => e.campo === 'firstName');
    results.push({
      num: 4,
      name: 'Vacío disfrazado (espacios en blanco)',
      method: 'POST',
      route: '/api/users',
      body,
      status: res.status,
      response: data,
      verdict: wasDefended ? 'DEFENDIDO' : 'VULNERABLE',
      note: wasDefended 
        ? 'El validador tiene .trim().notEmpty() y rechazó el string compuesto solo de espacios.' 
        : `Permitió guardar espacios en blanco o no los detectó con 400: ${res.status}`
    });
  }

  // ATAQUE 5: Valor inventado en un enum
  {
    const body = {
      firstName: 'Rolando',
      lastName: 'Inventado',
      email: 'enum.invalido@test.com',
      password: 'password123',
      birthDate: '1992-07-20',
      role: 'super_hacker_god'
    };
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    // Defendido si express-validator lo atrapa limpiamente sin llegar a error de Mongoose
    const isCleanValidator = res.status === 400 && data.errores && data.errores.some(e => e.campo === 'role');
    results.push({
      num: 5,
      name: 'Valor inventado en un enum',
      method: 'POST',
      route: '/api/users',
      body,
      status: res.status,
      response: data,
      verdict: isCleanValidator ? 'DEFENDIDO' : 'VULNERABLE',
      note: isCleanValidator 
        ? 'express-validator contiene .isIn(["client", "admin"]) y devolvió 400 amigable.' 
        : `El error cayó a Mongoose Schema o se tragó el valor: ${JSON.stringify(data)}`
    });
  }

  // ATAQUE 6: Texto gigante (10.000 caracteres)
  {
    const body = {
      firstName: 'A'.repeat(10000),
      lastName: 'Gomez',
      email: 'gigante@test.com',
      password: 'password123',
      birthDate: '1995-05-15'
    };
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    const wasDefended = res.status === 400 && data.errores && data.errores.some(e => e.campo === 'firstName');
    results.push({
      num: 6,
      name: 'Texto gigante (10.000 caracteres)',
      method: 'POST',
      route: '/api/users',
      body: { ...body, firstName: 'A x 10000 chars...' },
      status: res.status,
      response: data,
      verdict: wasDefended ? 'DEFENDIDO' : 'VULNERABLE',
      note: wasDefended 
        ? 'express-validator limitó la longitud con .isLength({ max: 50 }) devolviendo 400.' 
        : `Permitió registrar un string gigante de 10.000 caracteres: Status ${res.status}`
    });
  }

  // ATAQUE 7: Mass assignment en POST
  {
    const body = {
      firstName: 'Hacker',
      lastName: 'Privilegios',
      email: 'hacker.admin@test.com',
      password: 'password123',
      birthDate: '1990-01-01',
      role: 'admin'
    };
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    // Verificamos si se guardó con role admin
    const isSavedAsAdmin = data && data.role === 'admin';
    results.push({
      num: 7,
      name: 'Mass assignment (POST de creación)',
      method: 'POST',
      route: '/api/users',
      body,
      status: res.status,
      response: data,
      verdict: isSavedAsAdmin ? 'VULNERABLE' : 'DEFENDIDO',
      note: isSavedAsAdmin 
        ? 'VULNERABLE: El endpoint de creación permitió que el cliente asigne su propio rol como "admin".' 
        : 'DEFENDIDO: El controlador o validador ignora o rechaza la asignación de campos sensibles.'
    });
  }

  // ATAQUE 8: Lo mismo pero por la ventana (Mass assignment en PUT)
  {
    const body = {
      role: 'admin'
    };
    const res = await fetch(`${BASE_URL}/api/users/${validUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    const wasUpdatedToAdmin = data && data.role === 'admin';
    results.push({
      num: 8,
      name: 'Mass assignment en actualización (PUT)',
      method: 'PUT',
      route: `/api/users/${validUserId}`,
      body,
      status: res.status,
      response: data,
      verdict: wasUpdatedToAdmin ? 'VULNERABLE' : 'DEFENDIDO',
      note: wasUpdatedToAdmin 
        ? 'VULNERABLE: El usuario pudo escalar su rol a admin a través del PUT.' 
        : `DEFENDIDO: El PUT bloqueó la modificación del rol sensible: Status ${res.status}`
    });
  }

  // ATAQUE 9: Id que no es un id
  {
    const res = await fetch(`${BASE_URL}/api/users/123abc`);
    const data = await res.json().catch(() => null);
    const isClean400 = res.status === 400;
    results.push({
      num: 9,
      name: 'Id que no es un id',
      method: 'GET',
      route: '/api/users/123abc',
      body: null,
      status: res.status,
      response: data,
      verdict: isClean400 ? 'DEFENDIDO' : 'VULNERABLE',
      note: isClean400 
        ? 'DEFENDIDO: Se rechazó con 400 Bad Request por formato de ObjectId inválido antes de llegar a Mongoose.' 
        : `VULNERABLE: Respondió ${res.status} exponiendo CastError de Mongoose: ${JSON.stringify(data)}`
    });
  }

  // ATAQUE 10: Id válido pero que no existe
  {
    const nonExistentId = '6aa8045e651efa27312c9599';
    const res = await fetch(`${BASE_URL}/api/users/${nonExistentId}`);
    const data = await res.json().catch(() => null);
    const is404 = res.status === 404;
    results.push({
      num: 10,
      name: 'Id válido pero que no existe',
      method: 'GET',
      route: `/api/users/${nonExistentId}`,
      body: null,
      status: res.status,
      response: data,
      verdict: is404 ? 'DEFENDIDO' : 'VULNERABLE',
      note: is404 
        ? 'DEFENDIDO: Respondió 404 Not Found con mensaje claro.' 
        : `Respondió ${res.status}: ${JSON.stringify(data)}`
    });
  }

  // ATAQUE 11: Método que no existe
  {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'DELETE'
    });
    const text = await res.text();
    // Express devuelve 404 por defecto
    results.push({
      num: 11,
      name: 'Método que no existe (DELETE a ruta colección)',
      method: 'DELETE',
      route: '/api/users',
      body: null,
      status: res.status,
      response: text.slice(0, 100),
      verdict: res.status === 404 || res.status === 405 ? 'DEFENDIDO' : 'VULNERABLE',
      note: `Respondió ${res.status}. Express no expone el endpoint y rechaza la petición.`
    });
  }

  // ATAQUE 12: Referencia a la nada
  {
    const fakeUserId = '6aa8045e651efa27312c9599';
    const body = {
      userId: fakeUserId,
      numerologistId: fakeUserId,
      readingType: 'love',
      readingDate: '2026-09-14',
      summary: 'Lectura con usuario inexistente',
      details: 'Prueba de referencia fantasma'
    };
    const res = await fetch(`${BASE_URL}/api/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);

    let populateCheck = null;
    if (res.status === 201 && data._id) {
      const getPopulate = await fetch(`${BASE_URL}/api/readings/${data._id}`);
      populateCheck = await getPopulate.json().catch(() => null);
    }

    const wasBlocked = res.status === 400 || res.status === 404;
    results.push({
      num: 12,
      name: 'Referencia a la nada (ref inexistente en otra colección)',
      method: 'POST',
      route: '/api/readings',
      body,
      status: res.status,
      response: data,
      verdict: wasBlocked ? 'DEFENDIDO' : 'VULNERABLE',
      note: wasBlocked 
        ? 'DEFENDIDO: La API verificó previamente la existencia del usuario referenciado y rechazó la creación.' 
        : `VULNERABLE: Dejó guardar la lectura (Status 201). Al hacer populate, el campo referenciado devolvió: userId=${populateCheck ? JSON.stringify(populateCheck.userId) : 'null'}`
    });
  }

  // ATAQUE 13: Borrar algo del que otros dependen
  {
    // Intentar borrar validUserId (Ana Gómez, que tiene lecturas asociadas)
    const res = await fetch(`${BASE_URL}/api/users/${validUserId}`, {
      method: 'DELETE'
    });
    const data = await res.json().catch(() => null);

    // Verificar si las lecturas quedaron con populate null
    const checkReadings = await fetch(`${BASE_URL}/api/readings`);
    const remainingReadings = await checkReadings.json().catch(() => []);
    const orphanedReading = remainingReadings.find(r => !r.userId || r.userId === null);

    const wasProtected = res.status === 400 || res.status === 409;
    results.push({
      num: 13,
      name: 'Borrar algo del que otros dependen',
      method: 'DELETE',
      route: `/api/users/${validUserId}`,
      body: null,
      status: res.status,
      response: data,
      verdict: wasProtected ? 'DEFENDIDO' : 'VULNERABLE',
      note: wasProtected 
        ? 'DEFENDIDO: La API impidió el borrado porque existen lecturas asociadas al usuario.' 
        : `VULNERABLE: Se eliminó el usuario (Status ${res.status}). Las lecturas asociadas quedaron huérfanas con userId: null.`
    });
  }

  // ATAQUE 14: Actualizar solo un campo
  {
    const targetUserId = anotherUserId || validUserId;
    const body = { firstName: 'NombreSoloActualizado' };
    const res = await fetch(`${BASE_URL}/api/users/${targetUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);

    // Verificar si los demás campos siguen existiendo
    const getRes = await fetch(`${BASE_URL}/api/users/${targetUserId}`);
    const userAfter = await getRes.json().catch(() => null);

    const otherFieldsIntact = userAfter && userAfter.lastName && userAfter.email && userAfter.role;
    results.push({
      num: 14,
      name: 'Actualizar solo un campo',
      method: 'PUT',
      route: `/api/users/${targetUserId}`,
      body,
      status: res.status,
      response: data,
      verdict: otherFieldsIntact ? 'DEFENDIDO' : 'VULNERABLE',
      note: otherFieldsIntact 
        ? `DEFENDIDO: Mongoose aplicó $set por defecto en findByIdAndUpdate. Los campos no enviados (lastName, email, role) se mantuvieron intactos sin ser sobreescritos a null o undefined.` 
        : `VULNERABLE: Los demás campos se perdieron o fueron borrados.`
    });
  }

  console.log('=== RESULTADOS DE LOS 14 ATAQUES ===\n');
  results.forEach(r => {
    console.log(`ATAQUE #${r.num}: ${r.name}`);
    console.log(`Petición: ${r.method} ${r.route}`);
    console.log(`Body:`, JSON.stringify(r.body));
    console.log(`Respondió: ${r.status}`, JSON.stringify(r.response));
    console.log(`Veredicto: ${r.verdict}`);
    console.log(`Qué noté: ${r.note}`);
    console.log('--------------------------------------------------\n');
  });

  const defendedCount = results.filter(r => r.verdict === 'DEFENDIDO').length;
  const vulnerableCount = results.filter(r => r.verdict === 'VULNERABLE').length;
  console.log(`CONTEO FINAL: ${defendedCount} DEFENDIDOS / ${vulnerableCount} VULNERABLES`);
}

runAttacks().catch(console.error);
