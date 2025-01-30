import { Request, Response } from 'express';
import Trip from '../models/tripModel';
import User from '../models/userModel';

// Interface for request body
interface TripRequest {
  customerId?: string;
  driverId?: string;
}

// Controller functions
const TripController = {
  // Find trips related to a customer
  findTripsForCustomer: async (req: Request, res: Response) => {
    const { customerId } = req.query;
    console.log(customerId);

    try {
      // Explicitly specify the path and model to populate
      const trips = await Trip.find({customerId: customerId})
        .populate({
          path: 'rideId',
          model: 'Ride' // Make sure this matches your Ride model name
        });

      if (!trips || trips.length === 0) {
        return res.status(404).json({ error: 'No trips found' });
      }

      console.log("trips", JSON.stringify(trips, null, 2));

      return res.status(200).json({ trips });
    } catch (error) {
      console.error('Error finding trips for customer:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Find trips related to a driver
  findTripsForDriver: async (req: Request, res: Response) => {
    const { driverId } = req.params;

    try {
      const trips = await Trip.find({driverId:driverId}).populate({
        path: 'rideId',
        model: 'Ride' 
      });

      if (!trips) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      console.log(trips);

      return res.status(200).json({ trips });
    } catch (error) {
      console.error('Error finding trips for driver:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Store trip ID in user document

};

export default TripController;
