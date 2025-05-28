import { NextFunction, Request, Response } from "express";
import { generateReferralCode } from "../utils/generate_referal_code";
import User from "../models/userModel";
import DriverReferals from "../models/driverReferalsModel";
import AuthenticatedRequest from "../middleware/types/request";
import CustomErrorHandler from "../services/customErrorHandler";
interface IUser {
  full_name: string;
  email: string;
}

interface ReferredDriver {
  driverId: IUser;
  referralCode: string;
  commissionRate: number;
}

// Generate Referral Code API
export const getReferralCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if(!req.user || req.user.role !== "driver"){
      return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;
  console.log("getReferralCode", req.body);
  const { driverId } = req.params; // driverId is the User._id

  try {
    // Find the user first to validate they exist
    const user = await User.findById(driverId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find or create driver referral record
    let driver = await DriverReferals.findOne({ driverId });

    if (driver?.referralCode) {
      // Return existing referral code if found
      return res.status(200).json({ 
        message: "Existing referral code retrieved.",
        referralCode: driver.referralCode 
      });
    }

    // Generate new referral code
    const referralCode = generateReferralCode(user.full_name);

    if (!driver) {
      // Create new driver referral record if none exists
      driver = new DriverReferals({
        driverId,
        referralCode
      });
    } else {
      // Update existing record with new code
      driver.referralCode = referralCode;
    }

    await driver.save();

    res.status(201).json({
      message: "Referral code generated successfully.",
      referralCode,
      driverId: user._id,
      driverName: user.full_name
    });

  } catch (error) {
    console.error('Error in generateReferralCodeForDriver:', error);
    res.status(500).json({ 
      message: "Error generating referral code.",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Fetch Referral Network API
export const fetchReferralNetwork = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if(!req.user || req.user.role !== "driver"){
      return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;
  const { referralCode } = req.params;
    
  try {
    // Find the driver with the given referral code
    const driver = await DriverReferals.findOne({ referralCode }).populate("referrals", "driverId referralCode");

    if (!driver) {
      return res.status(404).json({ message: "Driver with referral code not found." });
    }

    const referredDrivers = await DriverReferals.find({ referredBy: referralCode })
        .populate<ReferredDriver>('driverId', 'full_name email');

    res.status(200).json({
      message: "Referral network retrieved successfully.",
      network: referredDrivers.map((referredDriver) => ({
        full_name: referredDriver.driverId.full_name,
        email: referredDriver.driverId.email,
        referralCode: referredDriver.referralCode,
        commissionRate: referredDriver.commissionRate,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching referral network.", error });
  }
};
