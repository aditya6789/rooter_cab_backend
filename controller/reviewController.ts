import { Request, Response } from 'express';
import Review, { IReview } from '../models/reviewModel';
import Ride from '../models/rideModel';
import AuthenticatedRequest from '../middleware/types/request';
import CustomErrorHandler from '../services/customErrorHandler';
import { NextFunction } from 'express';
// Create a review
const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if(!req.user){
    return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;
  try {
    const { rideId, toUserId, rating, comment, reviewType } = req.body;

    // Validate ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404).json({ message: 'Ride not found' });
      return;
    }

    // Check for existing review
    const existingReview = await Review.findOne({ rideId, fromUserId:userId });
    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this ride' });
      return;
    }

    const review = new Review({
      rideId,
      fromUserId:userId,
      toUserId,
      rating,
      comment,
      reviewType
    });

    await review.save();
    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get all reviews for a user (received reviews)
const getUserReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if(!req.user){
    return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;
  try {
    const reviews = await Review.find({ toUserId: userId })
      .populate('fromUserId', 'full_name profile_image')
      .populate('rideId', 'pickupLocation dropLocation createdAt');
    
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    res.status(200).json({
      reviews,
      totalReviews: reviews.length,
      averageRating: averageRating || 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews by ride ID
const getRideReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;
    const reviews = await Review.find({ rideId })
      .populate('fromUserId', 'full_name profile_image')
      .populate('toUserId', 'full_name profile_image');
    
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update a review
const updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if(!req.user){
    return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { 
        _id: req.params.id,
        fromUserId: userId // Ensure user can only update their own review
      },
      { rating, comment },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ message: 'Review not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Review updated successfully', review });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review
const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if(!req.user){
    return next(CustomErrorHandler.unAuthorized());
  }
  const userId= req.user._id;
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      fromUserId: userId // Ensure user can only delete their own review
    });

    if (!review) {
      res.status(404).json({ message: 'Review not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export { 
  createReview, 
  getUserReviews, 
  getRideReviews, 
  updateReview, 
  deleteReview 
};
