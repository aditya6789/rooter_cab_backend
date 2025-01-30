import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import Otp from "../models/otpModel";
import User from "../models/userModel";
import Refresh from "../models/refreshModel";
import CustomErrorHandler from "../services/customErrorHandler";
import JwtService from "../services/jwtService";
import { REFRESH_SECRET } from "../config/index";
import {
  sendOtpSchema,
  validateOtpSchema,
  registerSchema,
  driverRegisterSchema,
} from "../schema/auth.schema";

import {
  Make,
  Vehicle,
  VehicleCategory,
  VehicleModel,
} from "../models/vechileModel";
import { failureResponse, successResponse } from "../utils/response";
import DriverReferals from "../models/driverReferalsModel";
import { generateReferralCode } from "../utils/generate_referal_code";
import { sendSMS } from '../services/smsService';

// Function to generate a 6-digit numeric OTP
const generateNumericOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const LoginController = {
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    console.log("OTP SEND CALLED");
    const { error } = sendOtpSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { phone } = req.body;
    const otp = generateNumericOtp();

    try {
      // Store OTP in the database
      const otpRecord = await Otp.create({ 
        phone, 
        otp, 
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // OTP expires in 10 minutes
      });

      // Send OTP via SMS
      try {
        const date = new Date();
        const formattedDate = date.toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        await sendSMS(phone, otp, formattedDate);
        res.send({ 
          message: "OTP sent successfully.",
          // Remove otp from response in production
          otp: process.env.NODE_ENV === 'development' ? otp : undefined 
        });
      } catch (smsError) {
        // If SMS fails, delete the OTP record
        await Otp.deleteOne({ _id: otpRecord._id });
        throw new Error('Failed to send OTP via SMS');
      }
    } catch (err) {
      return next(err);
    }
  },

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    console.log("RESEND OTP CALLED");
    const { error } = sendOtpSchema.validate(req.body);
    if (error) {
      return next(error); 
    }

    const { phone } = req.body;
    const otp = generateNumericOtp();

    try {
      // Delete any existing OTP for this phone number
      await Otp.deleteMany({ phone });

      // Store new OTP in the database
      const otpRecord = await Otp.create({
        phone,
        otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // OTP expires in 10 minutes
      });

      // Send OTP via SMS
      try {
        await sendSMS(phone, otp , new Date().toISOString());
        res.send({
          message: "OTP resent successfully.",
          // Remove otp from response in production
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
      } catch (smsError) {
        // If SMS fails, delete the OTP record
        await Otp.deleteOne({ _id: otpRecord._id });
        throw new Error('Failed to send OTP via SMS');
      }
    } catch (err) {
      return next(err);
    }
  },


  // Validate OTP and redirect to registration if new user
  async validateOtp(req: Request, res: Response, next: NextFunction) {
    const { error } = validateOtpSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { phone, otp } = req.body;

    try {
      // Check if the OTP exists and hasn't expired
      const otpRecord = await Otp.findOne({ 
        phone, 
        otp,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        return next(CustomErrorHandler.wrongCredentials('Invalid or expired OTP'));
      }

      // Check if the user exists
      let user = await User.findOne({ phone });

      if (!user) {
        // If the user does not exist, add phone number to temporary storage and redirect to registration
        return res
          .status(201)
          .send({ message: "New user. Please register.", phone });
      }

      // Generate tokens
      const access_token = JwtService.sign({
        _id: user._id,
        role: user.userType,
      });
      const refresh_token = JwtService.sign(
        { _id: user._id, role: user.userType },
        "1y",
        REFRESH_SECRET
      );
      await Refresh.create({ token: refresh_token });

      // Remove the used OTP
      await Otp.deleteOne({ _id: otpRecord._id });

      res.send({
        access_token,
        refresh_token,
        role: user.userType,
        phone: user.phone,
        user,
      });
    } catch (err) {
      return next(err);
    }
  },

  async verifyAdminOtp(req: Request, res: Response, next: NextFunction) {
    const { otp , phone  } = req.body;
    if(!otp ){
      return next(CustomErrorHandler.alreadyExist("OTP is required"));
    }
    const user = await User.findOne({ phone });
    if(!user){
      return next(CustomErrorHandler.alreadyExist("User not found"));
    }
    if(user.userType !== "admin"){
      return next(CustomErrorHandler.alreadyExist("User is not an admin"));
    }
   try{
    const otpRecord = await Otp.findOne({ phone , otp });
    if(!otpRecord){
      return next(CustomErrorHandler.alreadyExist("OTP is not valid"));
    }
    await Otp.deleteOne({ _id: otpRecord._id });

    const access_token = JwtService.sign({
      _id: user._id,
      role: user.userType,
    });
    const refresh_token = JwtService.sign(
      { _id: user._id, role: user.userType },
      "1y",
      REFRESH_SECRET
    );
    await Refresh.create({ token: refresh_token });


    res.send(successResponse("OTP verified successfully", {
      access_token,
      refresh_token,
      user,
    }));
   }catch(err){
    return next(err);
   }
    
  }
};



// Controller for User Registration
export const RegisterController = {
  async register(req: Request, res: Response, next: NextFunction) {
    const { error } = registerSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { full_name, email, phone } = req.body;

    try {
      // Check if the user already exists
      let user = await User.findOne({ phone });

      if (user) {
        return next(CustomErrorHandler.alreadyExist("User already exists."));
      }

      // Create the new user
      user = new User({ full_name, email, phone });
      await user.save();

      const access_token = JwtService.sign({
        _id: user._id,
        role: user.userType,
      });
      const refresh_token = JwtService.sign(
        { _id: user._id, role: user.userType },
        "1y",
        REFRESH_SECRET
      );
      await Refresh.create({ token: refresh_token });

      res.send({ message: "User registered successfully.", access_token, refresh_token , user });
    } catch (err) {
      return next(err);
    }
  },

  async driverRegister(req: Request, res: Response, next: NextFunction) {
    console.log("driverRegister");
    try {
      // Validate the request body
      const { error } = driverRegisterSchema.validate(req.body);
      if (error) {
        console.log("Validation error:", error.details);
        return next(error);
      }

      const { full_name, email, aadharcard, pancard, phone , rc , driverlicence , profile_image } = req.body;
      const userType = "driver";
      console.log("req.body", req.body);
      // Check if the user already exists
      let user = await User.findOne({ email });
      if (user) {
        console.log("user", user);
        return next(CustomErrorHandler.alreadyExist("User already exists."));
      }

      // Create the new user
      user = new User({
        full_name,
        email,
        phone,
        aadharcard,
        userType,
        pancard,
        rc,
        driverlicence,
        profile_image,
        verified: false,
      });
      await user.save();
      console.log("saved");
      console.log("user", user);

      const referralCode = generateReferralCode(user.full_name);
      const driverReferals = new DriverReferals({
        driverId: user._id,
        referralCode: referralCode,


      });
      await driverReferals.save();
      console.log("driverReferals", driverReferals);
      // Generate tokens
      const access_token = JwtService.sign({
        _id: user._id,
        role: user.userType,
      });
      const refresh_token = JwtService.sign(
        { _id: user._id, role: user.userType },
        "1y",
        REFRESH_SECRET
      );
      await Refresh.create({ token: refresh_token });

      res.send({
        user,
        access_token,
        refresh_token,
        message: "driver register successfully",
      });
    } catch (err) {
      console.log("err", err);
      return next(err);
    }
  },

  async assignVehicleToUser(req: Request, res: Response) {
    const { model, userId , categoryId , vehicle_number } = req.body;
    console.log(req.body);
    const vehicleModel = await VehicleModel.findById(model);
    const user = await User.findById(userId);
    // const make =  await Make.findById(makeId);
    const category =  await VehicleCategory.findById(categoryId);

    if (!vehicleModel) {
      return res.status(400).json(failureResponse("Invalid Model"));
    }
    if (!user) {
      return res.status(400).json(failureResponse("Invalid User"));
    }
    const vehicle = new Vehicle({
      model: model,
      category: categoryId,
      vehicle_number: vehicle_number,

      user: userId,
    });

    vehicle.save();
    return res
      .status(200)
      .json(successResponse("Assigned Successfully", vehicle));
  },

  async getVehiclesOfUser(req: Request, res: Response) {
    console.log("getVehiclesOfUser");
    const { userId } = req.params;
    console.log("userId", userId);

    console.log(req.body);

    try {
      const vehicles = await Vehicle.find({ user: userId }).populate("model");

      if (!vehicles || vehicles.length === 0) {
        return res.status(404).json(failureResponse("No Vehicles Found"));
      }

      return res
        .status(200)
        .json(successResponse("Vehicles Retrieved Successfully", vehicles));
    } catch (error) {
      console.error(error);
      return res.status(500).json(failureResponse("Server Error"));
    }
  },
  async updateVehicle(req: Request, res: Response) {
    const { vehicleId } = req.params;
    const { model, userId , categoryId } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json(failureResponse("Vehicle not found"));
    }
    vehicle.model = model;
    vehicle.category = categoryId;
    vehicle.user = userId;
    await vehicle.save();
    return res.status(200).json(successResponse("Vehicle updated successfully", vehicle));
  },
  async registerAdmin(req: Request, res: Response, next: NextFunction) {
    console.log("registerAdmin");
    try {
      const { full_name, email, phone } = req.body;
      
      // Validate required fields
      if (!email) {
        return next(CustomErrorHandler.notFound ("Email is required"));
      }
      if (!full_name) {
        return next(CustomErrorHandler.notFound("Full name is required")); 
      }
      if (!phone) {
        return next(CustomErrorHandler.notFound("Phone is required"));
      }

      const userType = "admin";
      const user = new User({ full_name, email, phone, userType });
      await user.save();
      res.send({ message: "Admin registered successfully" });
    } catch (err) {
      return next(err);
    }
  }
};
