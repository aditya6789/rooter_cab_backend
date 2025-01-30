import { Schema, model, Document, Types } from "mongoose";

export interface IDriver extends Document {
  driverId: Types.ObjectId; // Reference to the User model
  referralCode?: string; // Unique code for the driver
  referredBy?: string; // The referralCode of the referrer
  referrals: Types.ObjectId[]; // Array of referred driver IDs
  commissionRate: number; // Commission rate percentage
  createdAt: Date; // Creation date
}

const DriverReferalsSchema = new Schema<IDriver>({
  driverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // Allows null values for unused referral codes
  },
  referredBy: {
    type: String, // Referral code of the referrer
    default: null,
  },
  referrals: [
    {
      type: Schema.Types.ObjectId,
      ref: "Driver", // Reference to other drivers
    },
  ],
  commissionRate: {
    type: Number,
    default: 10, // Default commission rate (10%)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DriverReferals = model<IDriver>("DriverReferals", DriverReferalsSchema);

export default DriverReferals;
