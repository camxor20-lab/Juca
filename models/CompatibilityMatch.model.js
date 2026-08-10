import mongoose from 'mongoose';

const compatibilityMatchSchema = new mongoose.Schema(
  {
    userId1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userId2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    compatibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    analysis: {
      type: String,
      required: true
    },
    matchDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('CompatibilityMatch', compatibilityMatchSchema);