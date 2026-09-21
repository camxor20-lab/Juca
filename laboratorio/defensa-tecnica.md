# Defensa Técnica — Laboratorio de Ataque y Defensa
**Estudiante / Desarrollador:** Julian Remolina  
**API:** API de Numerología (Node.js, Express, Mongoose, express-validator)  
**Fecha:** 14 de Septiembre de 2026  

---

### 1. Pega una regla de tu validator y dime cuál de los 14 ataques bloquea. Si no bloquea ninguno, ¿para qué la escribiste?

**Archivo:** [validators/user.validator.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/validators/user.validator.js)  
**Fragmento de código:**
```javascript
// validators/user.validator.js - Regla para el campo firstName
body('firstName')
  .exists().withMessage('El primer nombre es obligatorio')
  .isString().withMessage('El primer nombre debe ser un texto')
  .trim()
  .notEmpty().withMessage('El primer nombre no puede estar vacío')
  .isLength({ min: 2, max: 50 }).withMessage('El primer nombre debe tener entre 2 y 50 caracteres'),
```

**¿Cuál de los 14 ataques bloquea?**  
Esta regla bloquea de forma directa y simultánea tres ataques de la batería:

1. **Bloquea el Ataque #4 (Vacío disfrazado):** Al encadenar `.trim()` **antes** de `.notEmpty()`, cualquier intento de enviar espacios en blanco puros (`"   "`) es sanitizado primero a una cadena vacía `""`, lo que activa de inmediato `.notEmpty()` retornando un error `400 Bad Request` en la capa HTTP.
2. **Bloquea el Ataque #6 (Texto gigante):** Gracias a `.isLength({ min: 2, max: 50 })`, cualquier atacante que intente mandar un payload con un string de 10.000 caracteres es rechazado antes de consumir memoria del servidor o espacio en MongoDB.
3. **Bloquea el Ataque #3 (Tipos cambiados):** Gracias a `.isString()`, si el cliente envía un número como `firstName: 99999`, el validador lo frena en seco con un 400 impidiendo que Mongoose realice una coerción de tipos silenciosa (`"99999"`).

---

### 2. Hay datos inválidos que rechaza express-validator y también rechazaría el schema de Mongoose. Busca un caso concreto en tu API donde pase eso. ¿Es repetir por repetir, o es defensa en capas? Respóndeme con lo que viste hoy, no con teoría.

**Caso concreto en la API:**  
El campo `email` en la creación de usuarios.

- **En el validador HTTP ([validators/user.validator.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/validators/user.validator.js)):**
  ```javascript
  body('email')
    .exists().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Debe ingresar un correo electrónico válido')
    .normalizeEmail(),
  ```
- **En el modelo de la base de datos ([models/User.model.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/models/User.model.js)):**
  ```javascript
  email: {
    type: String,
    required: true,
    unique: true
  },
  ```

**¿Es repetir por repetir o es defensa en capas? (Basado en la evidencia de hoy):**  
No es repetir por repetir; es **defensa en capas real**, y lo comprobamos con los ataques de hoy:

1. **Lo que vimos cuando NO estaba express-validator (o fallaba):**  
   En la primera ronda, cuando enviamos un body sin email o con formato inválido, la petición atravesó el router de Express, entró al controlador, instanció un objeto Mongoose en memoria y ejecutó la operación contra la base de datos. Mongoose lanzó una excepción no controlada (`ValidationError: User validation failed: email: Path 'email' is required`), y el servidor devolvió un error con el texto crudo del ORM exponiendo detalles de la arquitectura interna.
2. **Lo que vimos con express-validator (Filtro Fail-Fast):**  
   Con `express-validator`, la petición se detiene en los primeros milisegundos en la capa de transporte HTTP. La base de datos ni siquiera se entera de que hubo una petición basura, no se gasta CPU instanciando modelos ni conexiones de socket, y el cliente recibe un JSON ordenado con código `400` indicando exactamente qué campo corregir.
3. **Por qué sigue siendo indispensable Mongoose:**  
   Si creamos usuarios desde un script de consola (como nuestro `seed.js`), una tarea en segundo plano (*cron job*) o una migración directa de datos que no pasa por Express, `express-validator` no existe. Mongoose es el guardián de la integridad del almacenamiento físico, mientras que `express-validator` es el guardián de la interfaz de comunicación de red.

---

### 3. Del ataque 12: cuéntame qué hizo tu API y qué decidiste hacer al respecto. Si decidiste no arreglarlo, explícame por qué esa es una decisión razonable y no simplemente que se te quedó.

**Qué hizo la API originalmente:**  
Al ejecutar el Ataque #12 (`POST /api/readings` enviando un `userId: "6aa8045e651efa27312c9599"` que tenía formato de ObjectId válido pero no existía en la colección de usuarios), la API respondió con **`HTTP 201 Created`** y guardó la lectura en MongoDB sin ningún reclamo.  
Posteriormente, al consultar esa lectura con `GET /api/readings/:id` ejecutando `populate('userId')`, la respuesta devolvió:
```json
{
  "_id": "6aa8051c22d4cf650b1e0052",
  "userId": null,
  "summary": "Lectura fantasma"
}
```
Se guardó un registro con una clave foránea inexistente, corrompiendo la consistencia de los datos.

**Qué decidí hacer y dónde vive la responsabilidad:**  
Decidí **repararlo en la capa del controlador** ([Controllers/reading.controller.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/Controllers/reading.controller.js)).  
Ni `express-validator` con `.isMongoId()` puede resolverlo solo (porque solo verifica la expresión regular de 24 caracteres hexadecimales), ni Mongoose solo puede resolverlo (porque en MongoDB no existen llaves foráneas nativas con `FOREIGN KEY ... REFERENCES`).

**Fragmento de código implementado:**
```javascript
// Controllers/reading.controller.js - createReading
if (userId) {
  const existeUsuario = await User.findById(userId);
  if (!existeUsuario) {
    return res.status(400).json({
      status: 'error',
      mensaje: 'Integridad referencial violada: el usuario referenciado en userId no existe'
    });
  }
}
```
**Justificación técnica:**  
La comprobación debe residir en el controlador antes de invocar `reading.save()`. Es una regla de negocio y de integridad de datos que requiere realizar una consulta asíncrona a la colección `users`. De este modo, si el usuario no existe, la petición se aborta con un `400 Bad Request` explícito, impidiendo la existencia de documentos huérfanos con `userId: null`.

---

### 4. Del ataque 14: qué pasó realmente y por qué. Esta no la puedes responder si no lo comprobaste.

**Qué pasó realmente al comprobarlo:**  
Enviamos una petición `PUT /api/users/:id` mandando **únicamente** un campo:
```json
{
  "firstName": "NombreSoloActualizado"
}
```
Al consultar inmediatamente ese mismo usuario mediante `GET /api/users/:id`, **los otros cuatro campos (`lastName`, `email`, `birthDate`, `role`) seguían existiendo intactos con sus valores originales**. Ningún campo desapareció ni se convirtió en `null` o `undefined`.

**Por qué ocurrió esto (Comportamiento interno de Mongoose):**  
En el controlador de actualización usamos:
```javascript
const user = await User.findByIdAndUpdate(req.params.id, datosActualizar, { new: true });
```
Por diseño, `findByIdAndUpdate` de Mongoose toma el objeto provisto y lo envuelve automáticamente dentro del operador **`$set`** de MongoDB:
```javascript
// Operación real enviada a MongoDB:
{ $set: { firstName: "NombreSoloActualizado" } }
```
En JavaScript y MongoDB, cuando una propiedad no viene en el payload (es decir, es `undefined` o simplemente no está en las claves del objeto), Mongoose **no la incluye dentro del objeto `$set`**. Como MongoDB solo aplica cambios sobre los campos explícitamente declarados dentro de `$set`, los campos preexistentes en el documento no se tocan.  
Si hubiésemos utilizado `replaceOne()` o hubiésemos reemplazado el documento completo con una nueva instancia sin mergear los campos, los demás atributos sí se habrían perdido. Por tanto, el update atómico preserva la integridad del resto del documento.

---

### 5. Pega el pedazo de código donde impides el mass assignment. Explícame por qué el strict: true de Mongoose no bastaba por sí solo.

**Archivo:** [Controllers/user.controller.js](file:///c:/Users/Aprendiz/Documents/defensa%20ataque/Controllers/user.controller.js)  
**Fragmento de código implementado:**

En la creación (`createUser`):
```javascript
// Controllers/user.controller.js
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, birthDate } = req.body;
    // Whitelist estricto: el servidor fija el rol, ignorando req.body.role
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
```

En la actualización (`updateUser`):
```javascript
// Controllers/user.controller.js
export const updateUser = async (req, res) => {
  try {
    // Si intentan modificar el rol por PUT, se bloquea el acceso
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

**Por qué el `strict: true` de Mongoose no bastaba por sí solo:**  
La opción `strict: true` (activa por defecto en los Schemas de Mongoose) tiene un único propósito: **ignorar campos que NO existan en el Schema**.  
Por ejemplo, si un atacante envía `hack: "true"`, Mongoose lo descarta porque `hack` no existe en el schema.  
Sin embargo, en nuestro `User.model.js`, el campo `role` **SÍ está definido en el Schema**:
```javascript
role: {
  type: String,
  enum: ['client', 'admin'],
  default: 'client'
}
```
Como `role` es un campo válido del modelo y `"admin"` es una opción válida dentro de su `enum`, Mongoose concluye que el dato es legítimo y lo guarda en la base de datos. Mongoose no sabe si quien hace la petición HTTP es un usuario anónimo registrándose o un superusuario del sistema. `strict: true` no tiene conciencia de roles ni de autorización de negocio. La única forma de evitar la escalada de privilegios es implementar una lista blanca (*whitelisting*) explícita en el controlador que descarte o rechace la asignación de campos sensibles.

---

### 6. ¿Cuál falla te costó más entender, y qué fue lo que te confundió al principio?

**La falla que más me costó entender:**  
El **Ataque #4: Vacío disfrazado (espacios en blanco)** y el orden de evaluación en `express-validator`.

**Qué fue lo que me confundió al principio:**  
Al principio, al ver la regla original:
```javascript
body('firstName')
  .notEmpty().withMessage('El primer nombre no puede estar vacío')
  .trim()
```
Yo esperaba que si un usuario enviaba `"   "` (solo espacios), la combinación de `.notEmpty()` y `.trim()` lo rechazara automáticamente en la validación HTTP con código 400. Sin embargo, al probar el ataque, la petición pasaba limpia por `express-validator` y terminaba explotando adentro del controlador con un error de Mongoose (`User validation failed: firstName: Path firstName is required`).

Me confundió porque asumí que `.trim()` sanitizaba la entrada antes de evaluar cualquier validador en la cadena, independientemente del orden en que estuvieran escritos.  
La revelación técnica ocurrió al comprender que `express-validator` es un middleware que ejecuta los métodos en **orden secuencial estricto**:
1. Con `.notEmpty().trim()`, primero se evaluaba `"   "`. Como tiene 3 caracteres, para `.notEmpty()` la cadena **no está vacía**.
2. Luego se ejecutaba `.trim()`, que eliminaba los espacios y dejaba la propiedad como `""`.
3. El middleware `validateResult` veía cero errores acumulados y le daba paso al controlador.
4. El controlador enviaba `""` a Mongoose, donde `required: true` sí detecta la cadena vacía y rechaza la inserción en la base de datos con un error crudo.

Para solucionarlo, entendí que los sanitizadores deben ir **antes** de las comprobaciones de presencia:
```javascript
body('firstName')
  .trim()       // Primero limpia los espacios en blanco
  .notEmpty()   // Ahora sí detecta que quedó en "" y genera el error 400
```
Comprender que el orden de encadenamiento altera radicalmente la ejecución y la seguridad del middleware fue el aprendizaje más valioso de este laboratorio.
