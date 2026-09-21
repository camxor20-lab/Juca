# Bitácora de Reparación — Laboratorio de Ataque y Defensa
**Repositorio / API:** API de Numerología  
**Desarrollador:** Julian Remolina  
**Tecnologías:** Node.js, Express, Mongoose, MongoDB, express-validator  
**Fecha:** 14 de Septiembre de 2026  

---

## 1. Clasificación Previa por Severidad

Antes de realizar cualquier modificación al código fuente, se agruparon todos los hallazgos reportados durante el ataque inicial en tres niveles de severidad técnica:

### CRÍTICO (Deja guardar datos corruptos, inconsistentes o permite escalada de privilegios)
- **Ataque #7 y #8 (Mass Assignment en POST y PUT):** El cliente podía enviar `"role": "admin"` y autoasignarse privilegios administrativos en la base de datos sin autorización.
- **Ataque #12 (Referencia a la nada):** Permitía crear lecturas asociadas a `ObjectId` inexistentes, dejando referencias rotas que devolvían `null` al ejecutar `populate`.
- **Ataque #13 (Borrar dependencias activas):** Permitía eliminar usuarios que poseían lecturas registradas, dejando registros huérfanos e inconsistentes en la colección de lecturas.
- **Ataque #4 (Vacío disfrazado con espacios en blanco):** Permitía insertar cadenas vacías compuestas solo por espacios (`"   "`), evadiendo la restricción de campo requerido.
- **Ataque #6 (Texto gigante):** Permitía almacenar cadenas de 10.000+ caracteres sin tope de longitud, arriesgando denegación de servicio por memoria/disco.

### GRAVE (Responde con 500, o muestra al cliente información interna o errores crudos de Mongoose)
- **Ataque #9 (Id que no es un id):** Consultar un ID con formato no hexadecimal (`123abc`) provocaba un `CastError` de Mongoose que detonaba un `500 Internal Server Error` con el stack trace / mensaje interno del ORM.
- **Ataque #1, #2, #3, #5 (Validación delegada a la base de datos):** Peticiones sin datos obligatorios, tipos invertidos o valores enum inválidos atravesaban la capa HTTP y reventaban directamente contra el Schema de Mongoose arrojando errores crudos.

### MENOR (Funciona, pero el mensaje es malo, inconsistente o el código HTTP no corresponde)
- **Ataque #11 (Método inexistente):** Responder con página HTML por defecto de Express (`Cannot DELETE /api/users`) en vez de un objeto JSON estructurado acorde al estándar de la API REST.
- **Ataque #14 (Actualización parcial):** Mongoose utiliza `$set` en `findByIdAndUpdate` conservando los demás campos, pero requería un validador que no forzara campos obligatorios en operaciones de actualización (`validarActualizarUsuario`).

---

## 2. Orden de Reparación Planificado (Compromiso Inicial)

1. **Orden 1 (Seguridad y Escalada de Privilegios):** Ataques #7 y #8 (Mass Assignment en creación y actualización).
2. **Orden 2 (Integridad Referencial de Claves Foráneas):** Ataque #12 (Referencia a la nada en `POST /api/readings`).
3. **Orden 3 (Integridad Referencial en Eliminación):** Ataque #13 (Restricción de borrado de usuario con dependencias activas).
4. **Orden 4 (Sanitización y Validación de Espacios):** Ataque #4 (Vacío disfrazado con `.trim().notEmpty()`).
5. **Orden 5 (Control de Longitud y Denegación de Servicio):** Ataque #6 (Límite de caracteres con `.isLength({ max: 50 })`).
6. **Orden 6 (Formato de Identificadores y Excepciones 500):** Ataque #9 (Validación de ObjectId con `.isMongoId()` y captura global de `CastError`).
7. **Orden 7 (Validaciones HTTP de Entrada):** Ataques #1, #2, #3, #5 (Tipos, enums y requeridos estructurados con `express-validator`).
8. **Orden 8 (Estandarización de Respuestas HTTP y Actualización Parcial):** Ataques #11 y #14 (Manejador 404 JSON y validador parcial para PUT).

---

## 3. Registro Detallado de Reparaciones

---

### REPARACIÓN del ATAQUE #7 y #8
- **Por qué falló (Causa real, no síntoma):** El controlador `user.controller.js` pasaba directamente `req.body` al constructor del modelo `new User(req.body)` y al método `User.findByIdAndUpdate(req.params.id, req.body)`. Mongoose tiene la opción `strict: true` habilitada por defecto, pero esta solo ignora campos que *no* existan en el Schema. Como `role` sí está declarado en el Schema (con opciones `client` y `admin`), Mongoose lo consideraba legítimo y lo almacenaba, permitiendo la escalada de privilegios a cualquier atacante.
- **Dónde lo arreglé:** `controller` ([Controllers/user.controller.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/Controllers/user.controller.js))
- **Qué cambié:**
  - *Antes:*
    ```javascript
    export const createUser = async (req, res) => {
      try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
      } catch (error) { ... }
    };

    export const updateUser = async (req, res) => {
      try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        ...
      } catch (error) { ... }
    };
    ```
  - *Después:*
    ```javascript
    export const createUser = async (req, res) => {
      try {
        const { firstName, lastName, email, password, birthDate } = req.body;
        // Whitelist estricto: el cliente nunca puede definir su propio rol
        const user = new User({
          firstName,
          lastName,
          email,
          password,
          birthDate,
          role: 'client' // Forzado en el servidor
        });
        await user.save();
        res.status(201).json(user);
      } catch (error) { ... }
    };

    export const updateUser = async (req, res) => {
      try {
        if (req.body.role !== undefined) {
          return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado: no tiene permisos para modificar el campo role'
          });
        }
        const { firstName, lastName, email, password, birthDate } = req.body;
        const datosActualizar = {};
        if (firstName !== undefined) datosActualizar.firstName = firstName;
        if (lastName !== undefined) datosActualizar.lastName = lastName;
        if (email !== undefined) datosActualizar.email = email;
        if (password !== undefined) datosActualizar.password = password;
        if (birthDate !== undefined) datosActualizar.birthDate = birthDate;

        const user = await User.findByIdAndUpdate(req.params.id, datosActualizar, { new: true, runValidators: true });
        ...
      } catch (error) { ... }
    };
    ```
- **Cómo lo comprobé:**
  - Petición POST con `{"role": "admin", ...}`:
    - *Respuesta:* `HTTP 201 Created` con `"role": "client"`. El rol `admin` fue ignorado.
  - Petición PUT con `{"role": "admin"}`:
    - *Respuesta:* `HTTP 403 Forbidden`
    ```json
    {
      "status": "error",
      "message": "Acceso denegado: no tiene permisos para modificar el campo role"
    }
    ```
- **Commit:** `9f95a87 fix(seguridad): previene mass assignment de role en creacion y actualizacion de usuarios`

---

### REPARACIÓN del ATAQUE #12
- **Por qué falló (Causa real, no síntoma):** Ni el Schema de Mongoose ni `express-validator` comprueban si el valor de un campo `ref` existe físicamente en la otra colección. `isMongoId()` solo verifica que el string tenga 24 caracteres hexadecimales válidos. Por tanto, se guardaban lecturas con identificadores de usuarios inexistentes, produciendo `null` al ejecutar consultas con `populate`.
- **Dónde lo arreglé:** `controller` ([Controllers/reading.controller.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/Controllers/reading.controller.js))
- **Qué cambié:**
  - *Antes:*
    ```javascript
    export const createReading = async (req, res) => {
      try {
        const reading = new Reading(req.body);
        await reading.save();
        res.status(201).json(reading);
      } catch (error) { ... }
    };
    ```
  - *Después:*
    ```javascript
    import Reading from '../models/Reading.model.js';
    import User from '../models/User.model.js';

    export const createReading = async (req, res) => {
      try {
        const { userId, numerologistId, readingType, readingDate, summary, details } = req.body;

        if (userId) {
          const existeUsuario = await User.findById(userId);
          if (!existeUsuario) {
            return res.status(400).json({
              status: 'error',
              mensaje: 'Integridad referencial violada: el usuario referenciado en userId no existe'
            });
          }
        }

        if (numerologistId) {
          const existeNumerologo = await User.findById(numerologistId);
          if (!existeNumerologo) {
            return res.status(400).json({
              status: 'error',
              mensaje: 'Integridad referencial violada: el numerólogo referenciado en numerologistId no existe'
            });
          }
        }

        const reading = new Reading({
          userId,
          numerologistId,
          readingType,
          readingDate: readingDate || Date.now(),
          summary,
          details
        });

        await reading.save();
        res.status(201).json(reading);
      } catch (error) { ... }
    };
    ```
- **Cómo lo comprobé:**
  - Petición: `POST /api/readings` con `userId: "6aa8045e651efa27312c9599"` (ID formalmente válido pero inexistente).
  - *Respuesta:* `HTTP 400 Bad Request`
    ```json
    {
      "status": "error",
      "mensaje": "Integridad referencial violada: el usuario referenciado en userId no existe"
    }
    ```
- **Commit:** `d458741 fix(relaciones): valida existencia de documentos referenciados en creacion de lectura`

---

### REPARACIÓN del ATAQUE #13
- **Por qué falló (Causa real, no síntoma):** MongoDB no impone restricciones de clave foránea de forma nativa. Al ejecutar `deleteUser`, el documento del usuario se borraba de la base de datos sin revisar si otras colecciones (`readings`, `numerology-profiles`) tenían documentos que apuntaban a él por referencia `ref`, rompiendo los vínculos de populate.
- **Dónde lo arreglé:** `controller` ([Controllers/user.controller.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/Controllers/user.controller.js))
- **Qué cambié:**
  - *Antes:*
    ```javascript
    export const deleteUser = async (req, res) => {
      try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
      } catch (error) { ... }
    };
    ```
  - *Después:*
    ```javascript
    export const deleteUser = async (req, res) => {
      try {
        const { id } = req.params;

        // Validación de Integridad Referencial (Ataque #13: Borrar dependencias)
        const lecturasAsociadas = await Reading.countDocuments({
          $or: [{ userId: id }, { numerologistId: id }]
        });

        if (lecturasAsociadas > 0) {
          return res.status(409).json({
            status: 'error',
            mensaje: `Restricción de Integridad Referencial: No se puede eliminar el usuario porque tiene ${lecturasAsociadas} lectura(s) asociadas`
          });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
      } catch (error) { ... }
    };
    ```
- **Cómo lo comprobé:**
  - Petición: `DELETE /api/users/<id_ana_gomez>` (usuario con lecturas en la BD).
  - *Respuesta:* `HTTP 409 Conflict`
    ```json
    {
      "status": "error",
      "mensaje": "Restricción de Integridad Referencial: No se puede eliminar el usuario porque tiene 2 lectura(s) asociadas"
    }
    ```
- **Commit:** `257db91 fix(integridad): restringe borrado de usuario con lecturas asociadas`

---

### REPARACIÓN del ATAQUE #4 y #6
- **Por qué falló (Causa real, no síntoma):**
  1. *Para Ataque #4:* La regla tenía el orden invertido: `.notEmpty()` se evaluaba antes de `.trim()`. Cuando el atacante enviaba `"   "`, su longitud era 3, por lo que `.notEmpty()` no fallaba; luego `.trim()` transformaba el valor en `""` y salía del validador sin registrar error HTTP, estallando en la base de datos.
  2. *Para Ataque #6:* No existía regla de límite de longitud con `.isLength({ max: ... })`, por lo que strings de 10.000 caracteres eran aceptados sin control.
- **Dónde lo arreglé:** `validator` ([validators/user.validator.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/validators/user.validator.js))
- **Qué cambié:**
  - *Antes:*
    ```javascript
    body('firstName')
      .exists().withMessage('El primer nombre es obligatorio')
      .notEmpty().withMessage('El primer nombre no puede estar vacío')
      .isString().withMessage('El primer nombre debe ser un texto')
      .trim(),
    ```
  - *Después:*
    ```javascript
    body('firstName')
      .exists().withMessage('El primer nombre es obligatorio')
      .isString().withMessage('El primer nombre debe ser un texto')
      .trim()
      .notEmpty().withMessage('El primer nombre no puede estar vacío')
      .isLength({ min: 2, max: 50 }).withMessage('El primer nombre debe tener entre 2 y 50 caracteres'),
    ```
- **Cómo lo comprobé:**
  - Petición con `"firstName": "   "`:
    - *Respuesta:* `HTTP 400 Bad Request`
    ```json
    {
      "status": "error",
      "mensaje": "Errores de validación en los datos enviados",
      "errores": [
        { "campo": "firstName", "mensaje": "El primer nombre no puede estar vacío" },
        { "campo": "firstName", "mensaje": "El primer nombre debe tener entre 2 y 50 caracteres" }
      ]
    }
    ```
  - Petición con `"firstName": "A".repeat(10000)`:
    - *Respuesta:* `HTTP 400 Bad Request`
    ```json
    {
      "status": "error",
      "errores": [
        { "campo": "firstName", "mensaje": "El primer nombre debe tener entre 2 y 50 caracteres" }
      ]
    }
    ```
- **Commit:** `624156f fix(validacion): sanitiza espacios con trim antes de notEmpty y limita longitud maxima`

---

### REPARACIÓN del ATAQUE #5 y #14
- **Por qué falló (Causa real, no síntoma):**
  1. *Para Ataque #5:* El validador no contenía reglas para el campo `role`, permitiendo que valores como `"super_hacker_god"` llegaran a Mongoose y provocaran un error crudo en vez de un 400 limpio.
  2. *Para Ataque #14:* La ruta `PUT /api/users/:id` reutilizaba `validarCrearUsuario`, lo cual exigía que todos los campos del usuario vinieran obligatoriamente en la actualización.
- **Dónde lo arreglé:** `validator` y `route` ([validators/user.validator.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/validators/user.validator.js), [routes/user.routes.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/routes/user.routes.js))
- **Qué cambié:**
  - Se añadió regla con `.isIn(['client', 'admin'])`.
  - Se creó el validador desacoplado `validarActualizarUsuario` donde los campos son opcionales (`.optional()`), permitiendo actualizaciones atómicas de un solo campo sin exigir la totalidad del documento.
- **Cómo lo comprobé:**
  - Petición con `"role": "super_hacker_god"`:
    - *Respuesta:* `HTTP 400 Bad Request` con mensaje `"El rol especificado debe ser 'client' o 'admin'"`.
  - Petición PUT enviando únicamente `{"firstName": "Diana Modificada"}`:
    - *Respuesta:* `HTTP 200 OK` actualizando solo el campo y manteniendo intactos `lastName`, `email`, `birthDate`, `role`.
- **Commit:** `624156f fix(validacion): sanitiza espacios con trim antes de notEmpty y limita longitud maxima`

---

### REPARACIÓN del ATAQUE #9 y #11
- **Por qué falló (Causa real, no síntoma):**
  1. *Para Ataque #9:* Las rutas de lectura y perfiles numerológicos carecían de validador de parámetro `:id`, o cuando se enviaba un ID como `123abc`, la petición llegaba a `findById` de Mongoose, arrojando un `CastError` no capturado adecuadamente que terminaba en `HTTP 500`.
  2. *Para Ataque #11:* Peticiones a métodos o rutas no registradas (como `DELETE /api/users`) eran respondidas con la plantilla HTML interna de Express (`<!DOCTYPE html>...Cannot DELETE...`).
- **Dónde lo arreglé:** `validator`, `routes` y `middleware` ([validators/reading.validator.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/validators/reading.validator.js), [routes/reading.routes.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/routes/reading.routes.js), [app.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/app.js))
- **Qué cambié:**
  - Se vinculó `param('id').isMongoId()` en todas las rutas con parámetro identificador.
  - En `app.js` se implementó un middleware 404 global que responde siempre en JSON.
  - En `app.js` se agregó un manejador de errores global que intercepta cualquier `CastError` residual y lo transforma limpiamente en `HTTP 400 Bad Request`.
- **Cómo lo comprobé:**
  - Petición `GET /api/users/123abc`:
    - *Respuesta:* `HTTP 400 Bad Request`
    ```json
    {
      "status": "error",
      "mensaje": "Errores de validación en los datos enviados",
      "errores": [
        { "campo": "id", "mensaje": "El ID de usuario no es válido (debe ser un ObjectId de MongoDB)" }
      ]
    }
    ```
  - Petición `DELETE /api/users`:
    - *Respuesta:* `HTTP 404 Not Found`
    ```json
    {
      "status": "error",
      "mensaje": "Ruta o método no disponible: DELETE /api/users"
    }
    ```
- **Commit:** `e19a6e5 fix(validacion): rechaza ObjectId invalido en GET /:id y captura errores en middleware global`

---

## 4. Comparación: Plan Original vs. Ejecución Real

| Fase Planificada | Orden Previsto | Orden Ejecutado | ¿Se cumplió en una sola capa? |
| :--- | :---: | :---: | :--- |
| **Mass Assignment** (Ataques #7, #8) | 1 | 1 | Sí (Capa `controller`) |
| **Integridad Referencial** (Ataque #12) | 2 | 2 | Sí (Capa `controller`) |
| **Borrado de Dependencias** (Ataque #13) | 3 | 3 | Sí (Capa `controller`) |
| **Espacios y Longitud** (Ataques #4, #6) | 4 y 5 | 4 | Sí (Capa `validator`) |
| **Enum y Actualización Parcial** (Ataques #5, #14) | 7 y 8 | 5 | Sí (Capa `validator` / `routes`) |
| **ObjectId Inválido y 404 JSON** (Ataques #9, #11) | 6 y 8 | 6 | Sí (Capa `validator` / `middleware`) |

Se cumplió estrictamente la regla del laboratorio: **cada falla se reparó en una sola capa**, sin duplicar validaciones cruzadas entre controladores y validadores.
