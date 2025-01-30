import { Request, Response } from 'express';
import Notification, { INotification } from '../models/notificationModel';
import driverTokenModel from '../models/notificationToken';
import { sendPushNotification } from '../services/firebase_service';

const createNotification = async (req: Request, res: Response): Promise<void> => {
  console.log(req.body);
  try {
    const notification: INotification = new Notification(req.body);
    await notification.save();
    console.log(notification);
    res.status(201).json(notification);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications: INotification[] = await Notification.find();
    res.status(200).json(notifications);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const getNotificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification: INotification | null = await Notification.findById(req.params.id);
    if (notification) {
      res.status(200).json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const updateNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification: INotification | null = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (notification) {
      res.status(200).json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification: INotification | null = await Notification.findByIdAndDelete(req.params.id);
    if (notification) {
      res.status(200).json({ message: 'Notification deleted' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const sendNotification = async (req: Request, res: Response): Promise<void> => {
  const { title, body } = req.body;

  try {
    // Fetch all FCM tokens from the database
    const driverTokens = await driverTokenModel.find();
    console.log(driverTokens);

    // Send notifications to all tokens
    const notificationPromises = driverTokens.map(async (driverToken) => {
      console.log(driverToken.token);
      return sendPushNotification(driverToken.token, title, body);
    });

    await Promise.all(notificationPromises);
    res.status(200).send({ message: 'Notifications sent successfully!' });
  } catch (error:any) {
    res.status(500).send({ error: 'Failed to send notifications', details: error.message });
  }
}

export { createNotification, getNotifications, getNotificationById, updateNotification, deleteNotification , sendNotification };
