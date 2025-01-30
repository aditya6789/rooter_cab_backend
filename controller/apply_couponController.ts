import { Request, Response } from 'express';
import { Coupon } from '../models/couponModel';

export const applyCoupon = async (req: Request, res: Response) => {
  console.log("applyCoupon");
  console.log(req.body);
  try {
    const { code, orderTotal } = req.body;
    const coupon = await Coupon.findOne({ code });

    if (!coupon || !coupon.isActive || new Date() > coupon.expirationDate) {
      return res.status(400).send({ message: 'Invalid or expired coupon' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).send({ message: 'Coupon usage limit reached' });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discount = coupon.discountValue;
    }

    const discountedTotal = orderTotal - discount;

    // Update coupon usage count
    coupon.usedCount += 1;
    await coupon.save();

    res.send({ discountedTotal, discount , discountType:coupon.discountType });
  } catch (error:any) {
    res.status(500).send({ error: error.message });
  }
};
