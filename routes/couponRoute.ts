import { Router } from "express";
import {
  createCoupon,
 
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
} from "../controller/couponController";
import { applyCoupon } from "../controller/apply_couponController";

const couponRouter = Router();

couponRouter.post("/", createCoupon);
couponRouter.get("/", getAllCoupons);
couponRouter.put("/:id", updateCoupon);
couponRouter.delete("/:id", deleteCoupon);
couponRouter.post("/apply", applyCoupon);

export default couponRouter;
