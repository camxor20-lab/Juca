import AuditLog from '../models/AuditLog.model.js';

export const createAuditLog = async (req, res) => {
  try {
    const log = new AuditLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('userId');
    res.json(logs);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId');
    if (!log) {
      return res.status(404).json({ message: 'AuditLog not found' });
    }
    res.json(log);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const updateAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!log) {
      return res.status(404).json({ message: 'AuditLog not found' });
    }
    res.json(log);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const deleteAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'AuditLog not found' });
    }
    res.json({ message: 'AuditLog deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};