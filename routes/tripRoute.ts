import express, { Request, Response } from "express";
import TripController  from "../controller/tripController";

export const tripRouter = express.Router();

tripRouter.get("/customer-trip", async (req: Request, res: Response) => {
  await TripController.findTripsForCustomer(req, res);
});

tripRouter.get("/driver-trips/:driverId", async (req: Request, res: Response) => {
  await TripController.findTripsForDriver(req, res);
});
