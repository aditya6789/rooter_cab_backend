import { Request, Response } from 'express';
import User from '../models/userModel';
import driverTokenModel from '../models/notificationToken';

// Store FCM token in the database
export const storeFcmToken = async (req: Request, res: Response) => {
  console.log(req.body);
  console.log('running');
  try {
    const { driverId, fcmToken } = req.body;

    // Store the FCM token in your database against the driver ID
    // You can use a database like MongoDB or any other to store driver data
    // Example using MongoDB:
    const driver = await User.findById(driverId);
    if (driver) {
      const userToken = new driverTokenModel({ userId: driverId, token: fcmToken });
      await userToken.save();
      res.status(200).json({ message: 'FCM token saved successfully' });
    } else {
      res.status(404).json({ message: 'Driver not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: 'Failed to save FCM token', error: error.message });
  }
};

// Check FCM token for a driver
export const checkFcmToken = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    const tokenRecord = await driverTokenModel.findOne({ userId: driverId });
    if (tokenRecord) {
      res.status(200).json({ 
        exists: true,
        token: tokenRecord.token 
      });
    } else {
      res.status(200).json({ 
        exists: false,
        message: 'No FCM token found for this driver'
      });
    }
  } catch (error:any) {
    res.status(500).json({ message: 'Failed to check FCM token', error: error.message });
  }
};
