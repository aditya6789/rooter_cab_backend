import express from "express";
import { getEarnings } from "../controller/earnings_controller";


const router = express.Router();

// Earnings endpoint with authentication
router.get("/", getEarnings);

export default router;
