import mongoose, { Schema, Document } from 'mongoose';

interface IDriverEarnings extends Document {
    driverId: mongoose.Types.ObjectId;
    totalEarnings: number;
    monthlyEarnings: number;
    weeklyEarnings: number;
    dailyEarnings: number;
    rides: mongoose.Types.ObjectId[];
    lastUpdated: Date;
}

const DriverEarningsSchema: Schema = new Schema({
    driverId: { type: mongoose.Types.ObjectId, ref: 'Driver', required: true },
    totalEarnings: { type: Number, default: 0 },
    monthlyEarnings: { type: Number, default: 0 },
    weeklyEarnings: { type: Number, default: 0 },
    dailyEarnings: { type: Number, default: 0 },
    rides: [{ type: mongoose.Types.ObjectId, ref: 'Ride' }],
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model<IDriverEarnings>('DriverEarnings', DriverEarningsSchema);
