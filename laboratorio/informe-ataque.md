# Informe de Ataque — Laboratorio de Ataque y Defensa
**Objetivo Auditado:** API de Numerología (Compañero: Juca / API Colaborador)  
**Auditor:** Julian Remolina  
**Tecnologías:** Node.js, Express, MongoDB, Mongoose, express-validator  
**Fecha:** 14 de Septiembre de 2026  

---

## Resumen Ejecutivo

Durante el laboratorio se ejecutó una batería de 14 pruebas de penetración y estrés contra los endpoints de la API (`/api/users`, `/api/readings`, `/api/numerology-profiles`).  
El objetivo consistió en evaluar la robustez en validación de entrada, sanitización de datos, control de asignación masiva de campos privilegiados (*mass assignment*), manejo de identificadores inválidos, e integridad referencial entre colecciones vinculadas mediante `ref` y `populate`.

---

# RONDA 1 — Ataque Inicial a la API del Compañero

### ATAQUE #1: Falta lo obligatorio
- **Petición:** `POST /api/users`
- **Body:**
  ```json
  {
    "firstName": "Juan"
  }
  ```
- **Respondió:** `HTTP 400 Bad Request`
  ```json
  {
    "message": "User validation failed: birthDate: Path `birthDate` is required., password: Path `password` is required., email: Path `email` is required., lastName: Path `lastName` is required."
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** La API carece de middleware de `express-validator` en su ruta. La petición viajó hasta la capa del controlador y fue Mongoose quien detuvo la inserción en la base de datos arrojando su error interno crudo. No hubo validación HTTP temprana ni mensajes estructurados para el cliente.

---

### ATAQUE #2: Body totalmente vacío
- **Petición:** `POST /api/users`
- **Body:** `{}`
- **Respondió:** `HTTP 400 Bad Request`
  ```json
  {
    "message": "User validation failed: birthDate: Path `birthDate` is required., password: Path `password` is required., email: Path `email` is required., lastName: Path `lastName` is required., firstName: Path `firstName` is required."
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Similar al ataque anterior, un payload completamente vacío atraviesa los middlewares sin ser interceptado antes de invocar la operación `new User(req.body).save()`, delegando la carga a la base de datos.

---

### ATAQUE #3: Tipos cambiados
- **Petición:** `POST /api/users`
- **Body:**
  ```json
  {
    "firstName": 99999,
    "lastName": 88888,
    "email": "tipos.cambiados@test.com",
    "password": "password123",
    "birthDate": "no-es-una-fecha"
  }
  ```
- **Respondió:** `HTTP 400 Bad Request`
  ```json
  {
    "message": "Cast to date failed for value \"no-es-una-fecha\" (type string) at path \"birthDate\""
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Mongoose aplicó coerción automática de tipos sobre los números en `firstName` y `lastName` transformándolos silenciosamente a strings (`"99999"` y `"88888"`). La petición solo falló al intentar parsear la fecha en Mongoose, exponiendo un `CastError` interno de la base de datos.

---

### ATAQUE #4: Vacío disfrazado
- **Petición:** `POST /api/users`
- **Body:**
  ```json
  {
    "firstName": "   ",
    "lastName": "   ",
    "email": "espacios@test.com",
    "password": "password123",
    "birthDate": "1995-05-15"
  }
  ```
- **Respondió:** `HTTP 201 Created`
  ```json
  {
    "_id": "6aa8051c22d4cf650b1e004d",
    "firstName": "   ",
    "lastName": "   ",
    "email": "espacios@test.com",
    "password": "password123",
    "birthDate": "1995-05-15T00:00:00.000Z",
    "role": "client"
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Falló la sanitización. Dado que la cadena `"   "` tiene longitud 3 y no es `null` ni `""`, Mongoose la consideró un valor válido para un campo requerido. Se guardaron registros con espacios en blanco en la base de datos. Falta sanitización con `.trim()` antes de comprobar `.notEmpty()`.

---

### ATAQUE #5: Valor inventado en un enum
- **Petición:** `POST /api/users`
- **Body:**
  ```json
  {
    "firstName": "Rolando",
    "lastName": "Inventado",
    "email": "enum.invalido@test.com",
    "password": "password123",
    "birthDate": "1992-07-20",
    "role": "super_hacker_god"
  }
  ```
- **Respondió:** `HTTP 400 Bad Request`
  ```json
  {
    "message": "User validation failed: role: `super_hacker_god` is not a valid enum value for path `role`."
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Aunque el valor fue rechazado, la validación ocurrió en Mongoose y no en la capa HTTP. Se expuso un mensaje de error crudo del ORM en lugar de un error 400 limpio de `express-validator`.

---

### ATAQUE #6: Texto gigante
- **Petición:** `POST /api/users`
- **Body:**
  ```json
  {
    "firstName": "A".repeat(10000),
    "lastName": "Gomez",
    "email": "gigante@test.com",
    "password": "password123",
    "birthDate": "1995-05-15"
  }
  ```
- **Respondió:** `HTTP 201 Created`
  ```json
  {
    "_id": "6aa8051c22d4cf650b1e004e",
    "firstName": "AAAA... (10.000 caracteres)",
    "lastName": "Gomez",
    "email": "gigante@test.com",
    "role": "client"
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** No existe límite de tamaño en el validador ni en el schema para campos de texto. El servidor almacenó 10.000 caracteres sin restricción, abriendo la puerta a ataques de denegación de servicio (DoS) por agotamiento de almacenamiento o memoria.

---

### ATAQUE #7: Mass assignment (POST)
- **Petición:** `POST /api/users`
- **Body:**
  ```json
  {
    "firstName": "Hacker",
    "lastName": "Privilegios",
    "email": "hacker.admin@test.com",
    "password": "password123",
    "birthDate": "1990-01-01",
    "role": "admin"
  }
  ```
- **Respondió:** `HTTP 201 Created`
  ```json
  {
    "_id": "6aa8051c22d4cf650b1e004f",
    "firstName": "Hacker",
    "lastName": "Privilegios",
    "email": "hacker.admin@test.com",
    "role": "admin"
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Falla crítica de seguridad. El controlador realiza `new User(req.body)`, permitiendo que cualquier usuario que se registre se asigne arbitrariamente el rol de `admin`. No hay lista blanca de campos (*whitelisting*).

---

### ATAQUE #8: Lo mismo pero por la ventana (Mass assignment en PUT)
- **Petición:** `PUT /api/users/6aa8045e651efa27312c9502`
- **Body:**
  ```json
  {
    "role": "admin"
  }
  ```
- **Respondió:** `HTTP 200 OK`
  ```json
  {
    "_id": "6aa8045e651efa27312c9502",
    "firstName": "Ana",
    "lastName": "Gomez",
    "email": "ana.gomez@test.com",
    "role": "admin"
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** El endpoint de actualización pasa ciegamente `req.body` a `User.findByIdAndUpdate(req.params.id, req.body)`. Un cliente regular puede alterar su propio rol a administrador mediante una simple petición PUT.

---

### ATAQUE #9: Id que no es un id
- **Petición:** `GET /api/users/123abc`
- **Body:** `null`
- **Respondió:** `HTTP 500 Internal Server Error`
  ```json
  {
    "message": "Cast to ObjectId failed for value \"123abc\" (type string) at path \"_id\" for model \"User\""
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Falla grave. En lugar de devolver un `400 Bad Request` indicando que el parámetro de ruta no es un identificador válido de MongoDB, la aplicación intenta consultar la base de datos, Mongoose lanza una excepción de casteo y el bloque `catch` responde con un `500` exponiendo detalles del motor.

---

### ATAQUE #10: Id válido pero que no existe
- **Petición:** `GET /api/users/6aa8045e651efa27312c9599`
- **Body:** `null`
- **Respondió:** `HTTP 404 Not Found`
  ```json
  {
    "message": "User not found"
  }
  ```
- **Veredicto:** **DEFENDIDO**
- **Qué noté:** El controlador comprueba explícitamente `if (!user) return res.status(404).json(...)` respondiendo correctamente con código 404 y un mensaje claro.

---

### ATAQUE #11: Método que no existe
- **Petición:** `DELETE /api/users`
- **Body:** `null`
- **Respondió:** `HTTP 404 Not Found` (Página HTML por defecto de Express: `Cannot DELETE /api/users`)
- **Veredicto:** **DEFENDIDO**
- **Qué noté:** Express por defecto no reconoce el método DELETE sobre la ruta raíz de la colección y rechaza la petición con 404 (aunque sería ideal un manejador global que retorne JSON).

---

### ATAQUE #12: Referencia a la nada
- **Petición:** `POST /api/readings`
- **Body:**
  ```json
  {
    "userId": "6aa8045e651efa27312c9599",
    "numerologistId": "6aa8045e651efa27312c9599",
    "readingType": "love",
    "readingDate": "2026-09-14",
    "summary": "Lectura fantasma",
    "details": "Usuario inexistente"
  }
  ```
- **Respondió:** `HTTP 201 Created`
  ```json
  {
    "_id": "6aa8051c22d4cf650b1e0052",
    "userId": "6aa8045e651efa27312c9599",
    "numerologistId": "6aa8045e651efa27312c9599",
    "readingType": "love",
    "summary": "Lectura fantasma"
  }
  ```
- Al consultar con `GET /api/readings/6aa8051c22d4cf650b1e0052` (con populate):
  ```json
  {
    "_id": "6aa8051c22d4cf650b1e0052",
    "userId": null,
    "numerologistId": null,
    "summary": "Lectura fantasma"
  }
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** Ni `express-validator` ni el schema de Mongoose impiden insertar un `ObjectId` formalmente válido que apunta a un documento inexistente. Al hacer `populate`, Mongoose no encuentra el documento referenciado y asigna `null`, corrompiendo la consistencia de la base de datos.

---

### ATAQUE #13: Borrar algo del que otros dependen
- **Petición:** `DELETE /api/users/6aa8045e651efa27312c9502` (Usuario "Ana Gómez", con lecturas asignadas)
- **Respondió:** `HTTP 200 OK`
  ```json
  {
    "message": "User deleted"
  }
  ```
- Al consultar las lecturas existentes con populate:
  ```json
  [
    {
      "_id": "6aa8045e651efa27312c950f",
      "userId": null,
      "summary": "Compatibilidad de almas y ciclos de cierre afectivo"
    }
  ]
  ```
- **Veredicto:** **VULNERABLE**
- **Qué noté:** No existe restricción de integridad referencial ni borrado en cascada. La eliminación de la entidad padre dejó lecturas huérfanas en la base de datos con relaciones rotas (`userId: null`).

---

### ATAQUE #14: Actualizar solo un campo
- **Petición:** `PUT /api/users/6aa8045e651efa27312c9504`
- **Body:**
  ```json
  {
    "firstName": "Diana Modificada"
  }
  ```
- Al consultar con `GET /api/users/6aa8045e651efa27312c9504`:
  ```json
  {
    "_id": "6aa8045e651efa27312c9504",
    "firstName": "Diana Modificada",
    "lastName": "Lopez",
    "email": "diana.lopez@test.com",
    "birthDate": "2000-01-15T00:00:00.000Z",
    "role": "client"
  }
  ```
- **Veredicto:** **DEFENDIDO**
- **Qué noté:** Los otros cuatro campos (`lastName`, `email`, `password`, `birthDate`, `role`) se mantuvieron intactos. Mongoose por defecto utiliza el operador `$set` en `findByIdAndUpdate`, por lo que las claves ausentes en `req.body` no se sobrescriben con `undefined` ni se eliminan.

---

## Conteo Final — Ronda 1
- **Defendidos:** 3
- **Vulnerables:** 11

---

# RONDA 2 — Verificación de la API Reparada del Compañero

Tras el ciclo de reparaciones en la API auditada, se volvió a ejecutar la batería completa de los 14 ataques, sumando una prueba de ciclo CRUD normal para validar regresiones.

### Resultados de la Segunda Ronda

| Ataque | Nombre del Ataque | Estado Inicial (Ronda 1) | Estado Final (Ronda 2) | ¿Hallazgo Cerrado? |
| :---: | :--- | :---: | :---: | :---: |
| **#1** | Falta lo obligatorio | VULNERABLE | **DEFENDIDO** | Sí |
| **#2** | Body totalmente vacío | VULNERABLE | **DEFENDIDO** | Sí |
| **#3** | Tipos cambiados | VULNERABLE | **DEFENDIDO** | Sí |
| **#4** | Vacío disfrazado | VULNERABLE | **DEFENDIDO** | Sí |
| **#5** | Valor inventado en enum | VULNERABLE | **DEFENDIDO** | Sí |
| **#6** | Texto gigante | VULNERABLE | **DEFENDIDO** | Sí |
| **#7** | Mass assignment (POST) | VULNERABLE | **DEFENDIDO** | Sí |
| **#8** | Mass assignment (PUT) | VULNERABLE | **DEFENDIDO** | Sí |
| **#9** | Id que no es un id | VULNERABLE | **DEFENDIDO** | Sí |
| **#10** | Id válido pero que no existe | DEFENDIDO | **DEFENDIDO** | Mantenido |
| **#11** | Método que no existe | DEFENDIDO | **DEFENDIDO** | Mantenido |
| **#12** | Referencia a la nada | VULNERABLE | **DEFENDIDO** | Sí |
| **#13** | Borrar dependencias | VULNERABLE | **DEFENDIDO** | Sí |
| **#14** | Actualizar solo un campo | DEFENDIDO | **DEFENDIDO** | Mantenido |

### Conteo Final — Ronda 2
- **Defendidos:** 14
- **Vulnerables:** 0

### Análisis de Regresiones y Nuevas Fallas
- **Hallazgos originales cerrados:** 11 de 11 vulnerabilidades corregidas satisfactoriamente.
- **Regresiones detectadas:** Ninguna. Se ejecutó el flujo CRUD normal (Creación de usuario válido -> Obtención por ID -> Actualización de datos permitidos -> Creación de lectura con IDs válidos -> Eliminación de lectura -> Eliminación de usuario sin dependencias) y todas las operaciones respondieron con sus códigos HTTP esperados (201, 200, 204/200).
- **Fallas nuevas observadas:** Ninguna. Los nuevos middlewares de validación no generaron cuellos de botella ni colisiones de rutas.
