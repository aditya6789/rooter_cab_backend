import mongoose from 'mongoose';

const driverTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true }
});

export default mongoose.model('DriverToken', driverTokenSchema);
