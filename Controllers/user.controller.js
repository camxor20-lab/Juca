import User from '../models/User.model.js';
import Reading from '../models/Reading.model.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    res.json({ message: 'Login exitoso', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      role: 'client'
    });
    await user.save();
    res.status(201).json(user);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const updateUser = async (req, res) => {
  try {
    // Si el cliente intenta alterar el rol, se rechaza de forma explícita
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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};