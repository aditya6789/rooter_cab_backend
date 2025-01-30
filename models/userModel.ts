import { Schema, model, Document, Types } from "mongoose";
export interface IContact {
  name: string;
  phoneNumber: string;
}

export interface IUser extends Document {
  full_name: string;
  email: string;
  phone?: string;
  gender?: string;
  vehicle?: string;
  profile_image?: string;
  verified: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
  aadharcard?: string;
  pancard?: string;
  profile?: string;
  rc?: string;
  driverlicence?: string;
  contacts?: IContact[];
  userType: "customer" | "driver" | "admin";
  earnings_type?: "subscription" | "commission";
  walletBalance: Number;
  trips: Types.ObjectId[]; // Only ObjectId array
  vehicles: Types.ObjectId; // ObjectId array for vehicles
  location?: string;
  rating?: number;
  rides?: Array<any>;
  status?: boolean;
}
const ContactSchema = new Schema<IContact>({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});
const UserSchema = new Schema<IUser>({
  full_name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  profile_image: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  phone: {
    type: String,
  },
  gender: {
    type: String,
    required: false,
  },
  vehicle: {
    type: String,
  },
  verified: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
    default: 'Pending',
  },
  aadharcard: {
    type: String,
  },
  profile: {
    type: String,
  },
  pancard: {
    type: String,
  },
  rc: {
    type: String,
  },
  driverlicence: {
    type: String,
  },
  contacts: [ContactSchema],
  userType: {
    type: String,
    enum: ["customer", "driver", "admin"],
    required: true,
    default: "customer",
  },
  earnings_type: {
    type: String,
    enum: ["subscription", "commission"],
    default: "commission",
    required: false,
  },
  trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }], // Reference to Trip model
  vehicles: { type: Schema.Types.ObjectId, ref: "VehicleModel" }, // Reference to Vehicle model
  walletBalance: {
    type: Number,
    default: 0,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
  },
  rides: {
    type: Array,
  },
  status: {
    type: Boolean,
  },
});

const User = model<IUser>("User", UserSchema);

export default User;
