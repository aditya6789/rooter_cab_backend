import express, { NextFunction, Request, Response } from "express";
import {
  LoginController,
  RegisterController,
} from "../controller/authController";
import upload from "../middleware/multer";

export const authRouter = express.Router();

authRouter.post(
  "/send-otp",
  async (req: Request, res: Response, next: NextFunction) => { 
    await LoginController.sendOtp(req, res, next);
  }
);

authRouter.post(
  "/resend-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    await LoginController.resendOtp(req, res, next);
  }
);

authRouter.post(
  "/validate-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    await LoginController.validateOtp(req, res, next);
  }
);

authRouter.post(
  "/verify-admin-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    await LoginController.verifyAdminOtp(req, res, next);
  }
);
authRouter.post(
  "/driver-register",
  async (req: Request, res: Response, next: NextFunction) => {
    await RegisterController.driverRegister(req, res, next);
  }
);

authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    await RegisterController.register(req, res, next);
  }
);
authRouter.post(
  "/register-admin",
  async (req: Request, res: Response, next: NextFunction) => {
    await RegisterController.registerAdmin(req, res, next);
  }
);
authRouter.post(
  "/assign-vehicle",
  async (req: Request, res: Response, next: NextFunction) => {
    await RegisterController.assignVehicleToUser(req, res);
  }
);
authRouter.get(
  "/get-vehicle/:userId",
  async (req: Request, res: Response, next: NextFunction) => {
    await RegisterController.getVehiclesOfUser(req, res);
  }
);



export default authRouter;
