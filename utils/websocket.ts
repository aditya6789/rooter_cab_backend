import { Types } from 'mongoose';
import SocketConnection, { ISocketConnection } from '../models/wsModel';

async function getSocketConnection(userId:Types.ObjectId | string ): Promise<ISocketConnection | null> {
  try {
    const latestConnection = await SocketConnection.findOne({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return latestConnection;
  } catch (error) {
    console.error('Error getting latest socket connection:', error);
    throw error;
  }
}

export default getSocketConnection;
