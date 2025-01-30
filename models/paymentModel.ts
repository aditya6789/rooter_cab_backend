

import mongoose from "mongoose";

export interface IPayment extends Document{
    rideId:mongoose.Schema.Types.ObjectId;
    amount:number;
    transactionId?:String;
    paymentMethod?:String;
    status:String;

}

const PaymentSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    // unique: true,
    // required: true
  },
  paymentMethod: {
    type: String, // e.g., 'PhonePe', 'GooglePay', 'CreditCard'
    // required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default  Payment;
