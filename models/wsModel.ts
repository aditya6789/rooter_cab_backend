import { Schema, model, Document, Types } from 'mongoose';

// export interface ILocation {
//   latitude: number;
//   longitude: number;
// }

export  interface ISocketConnection extends Document {
  socketId: string;
  userId: Types.ObjectId;
  location?: Location | null;
  userType?: String | null;
  vehicleType?: String | null;
  available?: Boolean | null;
  isActive?: Boolean | null;
}

const socketConnectionSchema = new Schema({
  socketId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  location: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
  },
  userType: { type: String, required: false },
  vehicleType: { type: String, required: false },
  available: { type: Boolean, default: true },
  isActive: { type: Boolean, default: false },
});

const SocketConnection = model<ISocketConnection>('SocketConnection', socketConnectionSchema);
export default SocketConnection;
