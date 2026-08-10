import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    numerologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readingType: {
      type: String,
      enum: ['love', 'career', 'money', 'general'],
      required: true
    },
    readingDate: {
      type: Date,
      default: Date.now
    },
    summary: {
      type: String,
      required: true
    },
    details: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Reading', readingSchema);