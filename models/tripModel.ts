import { Schema, model, Document, Types, ObjectId } from "mongoose";

export interface ITrip extends Document {
  rideId: Types.ObjectId;
  driverId: Types.ObjectId | null;
  customerId: Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  duration: string;
  distance: string;
  pickupLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  dropLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  fare?: number;
  status: 'pending' | 'started' | 'completed' | 'cancelled';
  tripCompleted: boolean;
  review?: Types.ObjectId;
}

const tripSchema = new Schema({
  rideId: { 
    type: Schema.Types.ObjectId, 
    ref: "Ride", 
    required: true 
  },
  driverId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  customerId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  startTime: { 
    type: Date 
  },
  endTime: { 
    type: Date 
  },
  duration: { 
    type: String, 
    required: true 
  },
  distance: { 
    type: String, 
    required: true 
  },
  pickupLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  dropLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  fare: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'started', 'completed', 'cancelled'],
    default: 'pending'
  },
  tripCompleted: { 
    type: Boolean, 
    default: false 
  },
  review: {
    type: Types.ObjectId,
    ref: "Review"

  },
 
}, {
  timestamps: true
});

const Trip = model<ITrip>("Trip", tripSchema);
export default Trip;
