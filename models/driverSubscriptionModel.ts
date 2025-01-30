import { Schema, model, Document, Types } from "mongoose";

export interface IDriverSubscription extends Document {
  user: Types.ObjectId; // Reference to the User model
  plan: Types.ObjectId; // Reference to the SubscriptionPlan model
  startDate: Date;
  endDate: Date;
  status: "active" | "expired";
  paymentId: string; // Payment gateway reference
}

const DriverSubscriptionSchema = new Schema<IDriverSubscription>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "expired"], default: "active" },
  paymentId: { type: String, required: true },
});

const DriverSubscription = model<IDriverSubscription>("DriverSubscription", DriverSubscriptionSchema);

export default DriverSubscription;
