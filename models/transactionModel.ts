const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    reference: { type: String }, // e.g., payment gateway reference
    metadata: { type: Object }, // additional data
  },
  { timestamps: true }
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);

export default TransactionModel;
