import { required } from "joi";
import mongoose, { ObjectId } from "mongoose";

const { Schema } = mongoose;

/**
 * @export
 * @interface IRide
 */
export interface IRide {
  _id?: ObjectId;  // Add this line to include the _id field
  customerId: string;
  pickupLocation: Location;
  dropLocation: Location;
  driverLocation?: Location;
  status: 'pending' | 'accepted' | 'completed' | 'ongoing' | 'cancelled' | 'arrived_at_pickup';
  price: number;
  driverId: string | null;
  otp: string | null;
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  driverInfo?: {
    driverId: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string;
    vehicleName: string;
    vehicleNumber: string;
  };
}

const RideSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pickupLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
  },
  dropLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },

  },
  driverLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'ongoing', 'cancelled', 'arrived_at_pickup'],
    required: true,
  },

  otp: {
    type: String,
  },
  customerInfo: {
    fullName: String,
    email: String,
    phone: String,
  },
  driverInfo: {
    driverId: String,
    fullName: String,
    email: String,
    phone: String,
    profileImage: String,
    vehicleName: String,
    vehicleNumber: String,
  },
}, { timestamps: true });

RideSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

RideSchema.set('toJSON', {
  virtuals: true,
});

/**
 * @export
 * @interface ICancelRide
 */
export interface ICancelRide {
  ride: String;
  cancelReason: String;
  isDriver: boolean;
}

const cancelRideSchema = new Schema({
  ride: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
  },
  cancelReason: { type: String, required: true },
  isDriver: { type: Boolean, required: true },


})

const Ride = mongoose.model('Ride', RideSchema);
export const CancelRide = mongoose.model<ICancelRide>('CancelRide', cancelRideSchema);

/**
 * @typedef Ride
 */
export default Ride;
