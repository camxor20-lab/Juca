import CompatibilityMatch from '../models/CompatibilityMatch.model.js';

export const createCompatibilityMatch = async (req, res) => {
  try {
    const match = new CompatibilityMatch(req.body);
    await match.save();
    res.status(201).json(match);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const getCompatibilityMatches = async (req, res) => {
  try {
    const matches = await CompatibilityMatch.find().populate('userId1').populate('userId2');
    res.json(matches);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getCompatibilityMatchById = async (req, res) => {
  try {
    const match = await CompatibilityMatch.findById(req.params.id).populate('userId1').populate('userId2');
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const updateCompatibilityMatch = async (req, res) => {
  try {
    const match = await CompatibilityMatch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const deleteCompatibilityMatch = async (req, res) => {
  try {
    const match = await CompatibilityMatch.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json({ message: 'Match deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};