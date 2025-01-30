import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true }
});

// Add index that automatically removes expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Otp', otpSchema);
