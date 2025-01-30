import { Router } from 'express';
import { createNotification, getNotifications, getNotificationById, updateNotification, deleteNotification , sendNotification } from '../controller/notificationController';


export const notificationRouter = Router();

notificationRouter.post('/', createNotification);
notificationRouter.get('/', getNotifications);
notificationRouter.get('/:id', getNotificationById);
notificationRouter.put('/:id', updateNotification);
notificationRouter.delete('/:id', deleteNotification);
notificationRouter.post('/send-notification', sendNotification);
  

