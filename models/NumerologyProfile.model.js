import mongoose from 'mongoose';

const numerologyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lifePathNumber: {
      type: Number
    },
    destinyNumber: {
      type: Number
    },
    soulUrgeNumber: {
      type: Number
    },
    personalityNumber: {
      type: Number
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('NumerologyProfile', numerologyProfileSchema);