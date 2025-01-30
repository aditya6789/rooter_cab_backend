import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  rideId: mongoose.Schema.Types.ObjectId;    // Reference to the ride
  fromUserId: mongoose.Schema.Types.ObjectId; // User giving the review
  toUserId: mongoose.Schema.Types.ObjectId;   // User receiving the review
  rating: number;                            // Rating (1-5)
  comment: string;                           // Review comment
  reviewType: 'driver' | 'passenger';        // Whether reviewing driver or passenger
}

const reviewSchema: Schema = new Schema({
  rideId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Ride',
    required: true 
  },
  fromUserId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  toUserId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  comment: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500 
  },
  reviewType: {
    type: String,
    enum: ['driver', 'customer'],
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews for same ride
reviewSchema.index({ rideId: 1, fromUserId: 1 }, { unique: true });

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
