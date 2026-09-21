import Reading from '../models/Reading.model.js';
import User from '../models/User.model.js';

export const createReading = async (req, res) => {
  try {
    const { userId, numerologistId, readingType, readingDate, summary, details } = req.body;

    // Validación de Integridad Referencial (Ataque #12: Referencia a la nada)
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
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const getReadings = async (req, res) => {
  try {
    const readings = await Reading.find().populate('userId').populate('numerologistId');
    res.json(readings);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getReadingById = async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id).populate('userId').populate('numerologistId');
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json(reading);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const updateReading = async (req, res) => {
  try {
    const reading = await Reading.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json(reading);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const deleteReading = async (req, res) => {
  try {
    const reading = await Reading.findByIdAndDelete(req.params.id);
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json({ message: 'Reading deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};