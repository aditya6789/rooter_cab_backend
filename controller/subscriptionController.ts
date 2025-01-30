import { Request, Response } from "express";
import SubscriptionPlan from "../models/subscriptionPlanModel";
import DriverSubscription from "../models/driverSubscriptionModel";
import User from "../models/userModel";

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { vehicleType, planName, price, duration } = req.body;

    const plan = new SubscriptionPlan({ vehicleType, planName, price, duration });
    await plan.save();

    res.status(201).json({ message: "Subscription plan created successfully", plan });
  } catch (error) {
    res.status(500).json({ message: "Error creating plan", error });
  }
};


//get admin plans
export const getAllPlans = async (req: Request, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans", error });
  }
};

//update admin plans

export const updatePlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, updates, { new: true });
      if (!updatedPlan) return res.status(404).json({ message: "Plan not found" });
  
      res.status(200).json({ message: "Plan updated successfully", updatedPlan });
    } catch (error) {
      res.status(500).json({ message: "Error updating plan", error });
    }
  };

  //delete admin plans
  export const deletePlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const deletedPlan = await SubscriptionPlan.findByIdAndDelete(id);
      if (!deletedPlan) return res.status(404).json({ message: "Plan not found" });
  
      res.status(200).json({ message: "Plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting plan", error });
    }
  };


  //get driver plans by vehicle type


export const getPlansByVehicleType = async (req: Request, res: Response) => {
  try {
    const { vehicleType } = req.params;

    const plans = await SubscriptionPlan.find({ vehicleType });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans", error });
  }
};

// driver subscription
export const subscribeToPlan = async (req: Request, res: Response) => {
    try {
      const { userId, planId, paymentId } = req.body;
  
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) return res.status(404).json({ message: "Plan not found" });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.earnings_type === "subscription") return res.status(400).json({ message: "User Already Subscribed" });
  
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + plan.duration);
  
      const subscription = new DriverSubscription({
        user: userId,
        plan: planId,
        startDate: now,
        endDate,
        status: "active",
        paymentId,
      });
  
      await subscription.save();
      user.earnings_type = "subscription";
      await user.save();
      res.status(201).json({ message: "Subscription activated successfully", subscription });
    } catch (error) {
      res.status(500).json({ message: "Error subscribing to plan", error });
    }
  };

  // fetch active subscription by driver id
  export const getActiveSubscriptions = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
  
      const subscriptions = await DriverSubscription.find({
        user: userId,
        status: "active",
        endDate: { $gte: new Date() },
      }).populate("plan");
  
      res.status(200).json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscriptions", error });
    }
  };

  export const getSubscriptionByUserId = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const subscription = await DriverSubscription.findOne({ user: userId }).populate("plan");
      res.status(200).json({subscription});
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscription", error });
    }
  };

// fetch expired subscription by driver id
  export const getExpiredSubscriptions = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
  
      const subscriptions = await DriverSubscription.find({
        user: userId,
        status: "expired",
        endDate: { $lt: new Date() },
      }).populate("plan");
  
      res.status(200).json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscriptions", error });
    }
  };

