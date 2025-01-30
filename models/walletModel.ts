import mongoose, { Schema, model, Document } from 'mongoose';

// Transaction Interface
interface Transaction {
  type: 'credit' | 'debit'; // 'credit' for adding balance, 'debit' for withdrawal
  amount: number;
  date: Date;
  description: string;
}

// Wallet Interface
interface Wallet extends Document {
  driverId: mongoose.Schema.Types.ObjectId;
  balance: number;
  transactions: Transaction[];
}

const transactionSchema = new Schema<Transaction>({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
});

const walletSchema = new Schema<Wallet>({
  driverId: { type: Schema.Types.ObjectId, refPath: 'User', required: true },

  balance: { type: Number, default: 0 },
  transactions: [transactionSchema],
});

export const WalletModel = model<Wallet>('Wallet', walletSchema);
