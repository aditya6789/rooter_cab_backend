import mongoose, { Schema, Document, Types } from 'mongoose';

interface ITicketUpdate {
  updatedBy: Types.ObjectId;
  message: string;
  timestamp: Date;
}

export interface ITicket extends Document {
  userId: Types.ObjectId;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  updates: ITicketUpdate[];
}

const ticketUpdateSchema = new Schema<ITicketUpdate>({
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new Schema<ITicket>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
  updates: [ticketUpdateSchema]
}, {
  timestamps: true
});

export default mongoose.model<ITicket>('Ticket', ticketSchema);
