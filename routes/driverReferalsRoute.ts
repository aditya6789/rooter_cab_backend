import express from "express";
import { getReferralCode, fetchReferralNetwork } from "../controller/driverReferalsController";

const driverReferalsRouter = express.Router();

// Generate referral code for a driver
driverReferalsRouter.get("/get-referral-code/:driverId", getReferralCode);

// Fetch referral network for a driver
driverReferalsRouter.get("/get-referral-network/:referralCode", fetchReferralNetwork);

export default driverReferalsRouter;
