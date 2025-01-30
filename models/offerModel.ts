import { Schema, model, Document } from 'mongoose';

interface IOffer extends Document {
  title: string;
  description: string;
  percentage: number;
  createdAt: Date;
}

const offerSchema = new Schema<IOffer>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  percentage: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Offer = model<IOffer>('Offer', offerSchema);

export default Offer;
export { IOffer };
