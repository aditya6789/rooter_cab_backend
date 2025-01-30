import { Schema, model, Document } from 'mongoose';

interface INotification extends Document {
  title: string;
  body: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;
export { INotification };
