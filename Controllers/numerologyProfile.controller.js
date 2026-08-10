import NumerologyProfile from '../models/NumerologyProfile.model.js';

export const createNumerologyProfile = async (req, res) => {
  try {
    const profile = new NumerologyProfile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const getNumerologyProfiles = async (req, res) => {
  try {
    const profiles = await NumerologyProfile.find().populate('userId', 'firstName lastName');
    res.json(profiles);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getNumerologyProfileById = async (req, res) => {
  try {
    const profile = await NumerologyProfile.findById(req.params.id).populate('userId');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const updateNumerologyProfile = async (req, res) => {
  try {
    const profile = await NumerologyProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const deleteNumerologyProfile = async (req, res) => {
  try {
    const profile = await NumerologyProfile.findByIdAndDelete(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};