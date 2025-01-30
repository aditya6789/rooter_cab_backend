import express from "express";
import { authRouter } from "./authRoute";
import { UserRouter } from "./userRoute";
import { rideRouter } from "./rideRoute";
import { notificationRouter } from "./notificationRoute";
import vechileRouter from "./vechileRoute";
import { tripRouter } from "./tripRoute";
import ticketRouter from "./ticketRoute";
import { reviewRouter } from "./reviewRoute";

import offerRouter from "./offerRoute";
import couponRouter from "./couponRoute";
import paymentRouter from "./paymentRoute";
import WalletRouter from "./walletRoute";
import earningRouter from "./earningRoute";
import driverearningsRoute from "./driverEarningsRoute";
import driverReferalsRouter from "./driverReferalsRoute";
import mapsRoute from "./mapsRoute";
import subscriptionRoute from "./subscriptionRoute";
import emergencyContactRoute from "./emergencyContactRoute";
import adminDashboardRoute from "./adminDashboardRoute";
import imageUploadRoute from "./image_uploadRoute";
import socketConnectionRouter from "./socket_connectionRoute";

export const router = express.Router();

router.use("/auth", authRouter);
router.use("/ride", rideRouter);
router.use("/user", UserRouter);
router.use("/vehicle", vechileRouter);
router.use("/offer", offerRouter);
router.use("/coupon", couponRouter);
router.use("/trip", tripRouter);
router.use("/notification", notificationRouter);
router.use("/ticket", ticketRouter);
router.use("/review", reviewRouter);
router.use("/pay", paymentRouter);
router.use("/wallet", WalletRouter);
router.use("/earnings", driverearningsRoute);
router.use("/maps", mapsRoute);
router.use("/driver-referrals", driverReferalsRouter);
router.use("/subscription", subscriptionRoute);
router.use("/emergency-contact", emergencyContactRoute);
router.use("/admin", adminDashboardRoute);
router.use("/image-upload", imageUploadRoute);
router.use("/socket-connection", socketConnectionRouter);