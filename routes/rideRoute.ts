import express, { Request, Response, NextFunction } from "express";
import { RideController } from "../controller/rideController";

export const rideRouter = express.Router();

; rideRouter.post("/book-ride", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.book_ride(req, res, next);
});
rideRouter.post("/complete-ride", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.complete_ride(req, res, next);
});

rideRouter.post("/accept-ride", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.acceptRide(req, res, next);
});

rideRouter.post("/arrived-at-pickup-location", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.arrived_at_pickup_location(req, res, next);
});

rideRouter.post("/verify-otp", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.verifyOTP(req, res, next);
});

rideRouter.post("/start-ride", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.start_ride(req, res, next);
});
rideRouter.post("/cancel-ride", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.cancel_ride(req, res, next);
});
rideRouter.get("/get-ride-details/:userId", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.getRideDetails(req, res, next);
});
rideRouter.get("/get-active-ride", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.getActiveRide(req, res, next);
});
rideRouter.get("/get-all-rides", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.getAllRides(req, res, next);
});
rideRouter.get("/get-ride-details-by-id/:rideId", async (req: Request, res: Response, next: NextFunction) => {
  await RideController.getRideDetailsById(req, res, next);
});


