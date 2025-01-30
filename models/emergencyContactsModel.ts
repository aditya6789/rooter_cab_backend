
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyContact extends Document {
  userId: Schema.Types.ObjectId;
  contacts: Array<{
    name: string;
    phone: string;
 
  }>;
}

const EmergencyContactSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contacts: [{
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
  }]
}, { timestamps: true });

EmergencyContactSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

EmergencyContactSchema.set('toJSON', {
  virtuals: true
});

const EmergencyContact = mongoose.model<IEmergencyContact>('EmergencyContact', EmergencyContactSchema);

export default EmergencyContact;
