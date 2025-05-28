import express, { NextFunction, Request, Response } from "express";
import TripController  from "../controller/tripController";

export const tripRouter = express.Router();

tripRouter.get("/customer-trip", async (req: Request, res: Response, next: NextFunction) => {
  await TripController.findTripsForCustomer(req, res, next);
});

tripRouter.get("/driver-trips/:driverId", async (req: Request, res: Response, next: NextFunction) => {
  await TripController.findTripsForDriver(req, res, next);
});
