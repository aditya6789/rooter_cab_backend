import { Schema, model, Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
  vehicleType: "motorcycle" | "auto" | "car";
  planName: string;
  price: number;
  duration: number; // Duration in days
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  vehicleType: { type: String, enum: ["motorcycle", "auto", "car"], required: true },
  planName: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
});

const SubscriptionPlan = model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);

export default SubscriptionPlan;
