import express from "express";
import { updateLocation, getLocation, getLocationByUserId } from "../controller/locationController";
const router = express.Router();

router.post("/update-location", updateLocation);
router.get("/get-location", getLocation);
router.get("/get-location/:userId", getLocationByUserId);

export default router;  
