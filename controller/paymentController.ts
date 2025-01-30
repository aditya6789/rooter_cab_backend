import { Request, Response } from "express";
import Payment from "../models/paymentModel";
import Ride from "../models/rideModel";
import {WalletModel} from "../models/walletModel";
import { Pay } from "twilio/lib/twiml/VoiceResponse";
import crypto from "crypto";

// Interface for Payment creation request body
interface CreatePaymentRequest {
  rideId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

// Interface for Payment status update request body
interface UpdatePaymentStatusRequest {
  transactionId: string;
  rideId: String;
  status: "Pending" | "Completed" | "Failed";
}

const PaymentController = {
  // PAYU GENERATE HASH

  async generateHash(req: Request, res: Response): Promise<void> {
    const { hashString, hashName } = req.body;
    const hash = crypto
      .createHash("sha512")
      .update(hashString + process.env.PAYU_MERCHANT_SALT)
      .digest("hex");

    console.log(hashName);
    console.log(hash);
    res.status(200).json({ [hashName]: hash });
  },
  // Create a new payment
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { rideId, amount, paymentMethod }: CreatePaymentRequest = req.body;

      // Create a new payment with status 'Pending'
      const newPayment = new Payment({
        rideId,
        amount,
        paymentMethod,
        status: "Pending",
      });

      const savedPayment = await newPayment.save();
      res.status(201).json(savedPayment);
    } catch (error) {
      res.status(500).json({ message: "Error creating payment", error });
    }
  },

  // Update payment status

  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    console.log(req.body);
    try {
      const { transactionId, status, rideId }: UpdatePaymentStatusRequest =
        req.body;

      // Find the payment using rideId
      const payment = await Payment.findOne({ rideId });
      console.log("payment");

      if (!payment) {
        res
          .status(404)
          .json({ message: "Payment not found for the provided rideId" });
        console.log("payment not found");

        return;
      }

      // Update the payment status and transactionId
      const updatedPayment = await Payment.findOneAndUpdate(
        { rideId }, // Find the payment by rideId
        { status, transactionId, updatedAt: Date.now() }, // Update the status and transactionId
        { new: true }
      );
      console.log("payment 3");

      // if (!updatedPayment) {
      //   res.status(404).json({ message: 'Payment update failed' });
      // console.log('payment failed');

      //   return;
      // }

      // Find the associated ride
      const ride = await Ride.findOne({ _id: rideId });
      if (!ride) {
        console.log("ride not found");
        res.status(404).json({ message: "Ride not found" });
        return;
      }

      // Extract the driverId from the ride
      const driverId = ride.driverInfo?.driverId;

      // Check if the driver already has a wallet
      let wallet = await WalletModel.findOne({ driverId });

      // If the wallet doesn't exist, create one
      if (!wallet) {
        wallet = new WalletModel({
          driverId,
          balance: 0, // Initial balance
          currency: "USD",
          transactions: [],
        });
        await wallet.save();
      }

      // Update the wallet balance and add a transaction if the payment is completed
      if (ride.status === "completed" && payment.status === "completed") {
        const amount = payment.amount; // Assuming `amount` is a field in your Payment model
        wallet.balance += amount; // Update the wallet balance
        wallet.transactions.push({
          amount,
          type: "credit",
          description: `Payment received for ride ${rideId}`,
          date: new Date(),
        });
        await wallet.save(); // Save the updated wallet
      }

      res.status(200).json({ updatedPayment, wallet });
    } catch (error) {
      res.status(500).json({ message: "Error updating payment status", error });
    }
  },

  // Get payment details by transactionId
  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const payment = await Payment.findOne({ transactionId });

      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving payment", error });
    }
  },
};

export default PaymentController;
