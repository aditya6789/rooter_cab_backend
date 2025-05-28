import express, { Request, Response } from 'express';
import { Coupon } from '../models/couponModel';

const router = express.Router();

// Create a new coupon
export const createCoupon = async (req: Request, res: Response) => {
  console.log("createCoupon", req.body);
  const { code, discountType, discountValue, expirationDate, isActive, usageLimit, usedCount } = req.body;
  try {
    const coupon = new Coupon({ code, discountType, discountValue, expirationDate, isActive, usageLimit, usedCount });
    await coupon.save();
    res.status(201).send(coupon);
  } catch (error: any) {
    res.status(400).send({ error: error.message });
  }
};

export const getAllCoupons = async (req: Request, res: Response) => {
  console.log("getAllCoupons");
  try {
    const coupons = await Coupon.find();
    res.send(coupons);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

// Get a coupon by code
export const getCouponByCode = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code });
    if (!coupon) return res.status(404).send({ message: 'Coupon not found' });
    res.send(coupon);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

// Update a coupon
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true }
    );
    if (!coupon) return res.status(404).send({ message: 'Coupon not found' });
    res.send(coupon);
  } catch (error: any) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a coupon
export const deleteCoupon = async (req: Request, res: Response) => {
  console.log("deleteCoupon", req.params.code);
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id });
    if (!coupon) return res.status(404).send({ message: 'Coupon not found' });
    res.send({ message: 'Coupon deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

export default router;
