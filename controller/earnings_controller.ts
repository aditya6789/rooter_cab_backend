  import { NextFunction, Request, Response } from 'express';
import Ride from '../models/rideModel';
import moment from 'moment'; // For handling date comparisons
import AuthenticatedRequest from '../middleware/types/request';
import CustomErrorHandler from '../services/customErrorHandler';
/**
 * Get earnings for today, this week, and this month.
 */
export const getEarnings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if(!req.user || req.user.role !== "admin"){
      return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;

  try {
    // Get today's date at midnight (start of the day)
    const today = moment().startOf('day');
    
    // Get the start of the current week (Sunday) and month (1st day of month)
    const startOfWeek = moment().startOf('week'); // or use 'isoWeek' for Monday start
    const startOfMonth = moment().startOf('month');
    
    // Find today's completed rides
    const todayRides = await Ride.find({
      driverId:userId,
      status: 'completed',
      createdAt: { $gte: today.toDate() },
    });
    console.log("todayRides", todayRides);
    if(!todayRides) return res.status(200).json({message:"No rides found"});

    // Find this week's completed rides
    const weeklyRides = await Ride.find({
      driverId:userId,
      status: 'completed',
      createdAt: { $gte: startOfWeek.toDate() },
    });
    console.log("weeklyRides", weeklyRides);
    if(!weeklyRides) return res.status(200).json({message:"No rides found"});

    // Find this month's completed rides
    const monthlyRides = await Ride.find({
      driverId:userId,
      status: 'completed',
      createdAt: { $gte: startOfMonth.toDate() },
    });
    console.log("monthlyRides", monthlyRides);
    if(!monthlyRides) return res.status(200).json({message:"No rides found"});


    // Calculate total earnings for each period
    const todayEarnings = todayRides.reduce((total, ride) => total + ride.price, 0);
    const weeklyEarnings = weeklyRides.reduce((total, ride) => total + ride.price, 0);
    const monthlyEarnings = monthlyRides.reduce((total, ride) => total + ride.price, 0);

    // Respond with the earnings and ride counts
    res.status(200).json({
      today: {
        totalRides: todayRides.length,
        totalEarnings: todayEarnings,
      },
      thisWeek: {
        totalRides: weeklyRides.length,
        totalEarnings: weeklyEarnings,
      },
      thisMonth: {
        totalRides: monthlyRides.length,
        totalEarnings: monthlyEarnings,
      }
    });

  } catch (error) {
    console.error('Error calculating earnings:', error);
    res.status(500).json({ message: 'Error calculating earnings' });
  }
};
