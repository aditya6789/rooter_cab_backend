import mongoose, { Document, Schema } from 'mongoose';

interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed'; // Discount type: percentage or fixed amount
  discountValue: number; // Value of the discount
  expirationDate: Date;
  isActive: boolean;
  usageLimit?: number; // Optional: Limit on number of times the coupon can be used
  usedCount: number; // Track the number of times the coupon has been used
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  expirationDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
});

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
