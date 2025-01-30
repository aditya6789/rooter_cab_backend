import express, { Request, Response } from "express";
import { RideController } from "../controller/rideController";

export const rideRouter = express.Router();

rideRouter.post("/book-ride", async (req: Request, res: Response) => {
  await RideController.book_ride(req, res);
});
rideRouter.post("/complete-ride", async (req: Request, res: Response) => {
  await RideController.complete_ride(req, res);
});
rideRouter.post("/start-ride", async (req: Request, res: Response) => {
  await RideController.start_ride(req, res);
});
rideRouter.post("/cancel-ride", async (req: Request, res: Response) => {
  await RideController.cancel_ride(req, res);
});
