import { Router } from 'express';
import { 
  createReview, 
  getUserReviews, 
  getRideReviews, 
  updateReview, 
  deleteReview 
} from '../controller/reviewController';

export const reviewRouter = Router();

// Define routes and their handlers
reviewRouter.post('/', createReview);
reviewRouter.get('/reviews', getUserReviews);
reviewRouter.get('/reviews/:rideId', getRideReviews);

reviewRouter.put('/reviews/:id', updateReview);
reviewRouter.delete('/reviews/:id', deleteReview);

