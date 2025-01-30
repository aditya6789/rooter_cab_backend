import { Request, Response } from 'express';
import Ride from '../models/rideModel';

// Get earnings for a driver
export const getDriverEarnings = async (req: Request, res: Response) => {
    const { driverId } = req.params;

    try {
        const rides = await Ride.find(
            {
                 'driverInfo.driverId': driverId,
            status: "completed"
            }
        );
        const today = new Date();
        
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Filter rides for each period
        const dailyRides = rides.filter((ride: any) => {
            const rideDate = new Date(ride.createdAt);
            return rideDate >= startOfDay && rideDate <= endOfDay;
        });

        const weeklyRides = rides.filter((ride: any) => {
            const rideDate = new Date(ride.createdAt);
            return rideDate >= startOfWeek;
        });

        const monthlyRides = rides.filter((ride: any) => {
            const rideDate = new Date(ride.createdAt);
            return rideDate >= startOfMonth;
        });

        // Calculate earnings for each period
        const dailyEarnings = dailyRides.reduce((acc: any, ride: any) => acc + (ride.price || 0), 0);
        const weeklyEarnings = weeklyRides.reduce((acc: any, ride: any) => acc + (ride.price || 0), 0);
        const monthlyEarnings = monthlyRides.reduce((acc: any, ride: any) => acc + (ride.price || 0), 0);

        // Format ride data to include relevant information
        const formatRide = (ride: any) => ({
            id: ride._id,
            createdAt: ride.createdAt,
            price: ride.price,
            pickupLocation: ride.pickupLocation.address,
            dropLocation: ride.dropLocation.address,
            status: ride.status
        });

        res.status(200).json({
            daily: {
                earnings: dailyEarnings,
                rides: dailyRides.map(formatRide),
                count: dailyRides.length
            },
            weekly: {
                earnings: weeklyEarnings,
                rides: weeklyRides.map(formatRide),
                count: weeklyRides.length
            },
            monthly: {
                earnings: monthlyEarnings,
                rides: monthlyRides.map(formatRide),
                count: monthlyRides.length
            },
            dateRanges: {
                startOfDay: startOfDay.toISOString(),
                endOfDay: endOfDay.toISOString(),
                startOfWeek: startOfWeek.toISOString(),
                startOfMonth: startOfMonth.toISOString()
            },
            totalRides: rides.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching earnings', error });
    }
};
