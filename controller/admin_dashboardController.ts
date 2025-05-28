import { Request, Response } from 'express';
import User from '../models/userModel';
import Ride from '../models/rideModel';
import DriverSubscription from '../models/driverSubscriptionModel';

export const AdminDashboardController = {
    async getDashboardStats(req: Request, res: Response) {
        try {
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

            // Get total revenue and rides
            const rides = await Ride.find({ status: 'completed' });
            const totalRevenue = rides.reduce((sum, ride) => sum + (ride.price || 0), 0);
            const lastMonthRides = rides.filter(ride => new Date(ride.createdAt) >= lastMonth);
            const lastMonthRevenue = lastMonthRides.reduce((sum, ride) => sum + (ride.price || 0), 0);

            // Get active drivers
            const activeDrivers = await User.find({ 
                userType: 'driver',
                verified: true,
                active: true
            });

            // Get pending approvals
            const pendingApprovals = await User.countDocuments({ 
                userType: 'driver',
                verified: false
            });

            // Calculate revenue growth
            const revenueGrowth = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

            const overviewCards = [
                {
                    title: "Total Revenue",
                    value: `₹${totalRevenue.toFixed(2)}`,
                    description: `${revenueGrowth.toFixed(1)}% from last month`,
                    trend: revenueGrowth > 0 ? "up" : "down",
                    icon: "DollarSign",
                    metric: "Monthly Growth"
                },
                {
                    title: "Active Drivers",
                    value: activeDrivers.length.toString(),
                    description: `${activeDrivers.length - lastMonthRides.length} new drivers`,
                    trend: "up",
                    icon: "Users",
                    metric: "Driver Retention: 85%"
                },
                {
                    title: "Total Rides",
                    value: rides.length.toString(),
                    description: "+19% from last month",
                    trend: "up",
                    icon: "Car",
                    metric: `Avg. ${Math.round(rides.length / 30)} rides/day`
                },
                {
                    title: "Pending Approvals",
                    value: pendingApprovals.toString(),
                    description: "Requires attention",
                    trend: "down",
                    icon: "Activity",
                    metric: "48hr avg. response time"
                }
            ];

            // Get recent drivers
            const recentDrivers = await User.find({ userType: 'driver' })
                .sort({ createdAt: -1 })
                .limit(3)
                .select('full_name status rides rating location lastActive profile_image');

            // Get recent customers with their latest rides
            const recentCustomers = await Ride.find({ status: 'completed' })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('customerId', 'full_name profile_image')
                .select('createdAt price dropLocation status rating feedback customerId');

            res.status(200).json({
                overviewCards,
                recentDrivers: recentDrivers.map(driver => ({
                    id: driver._id,
                    name: driver.full_name,
                    status: driver.status ? "Active" : "Inactive",
                    rides: driver.rides?.length || 0,
                    rating: driver.rating || 0,
                    location: driver.location,
                    avatar: driver.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.full_name)}`
                })),
                recentCustomers: recentCustomers.map(ride => ({
                    id: ride._id,
                    name: (ride.customerId as any).full_name,
                    avatar: (ride.customerId as any).profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent((ride.customerId as any).full_name)}`,
                    tripDate: new Date(ride.createdAt).toLocaleString(),
                    amount: `$${ride.price}`,
                    destination: ride.dropLocation?.address || 'N/A',
                    status: ride.status,
                })),
                recentAlerts: [
                    {
                        id: "1",
                        type: "High Demand",
                        message: "Surge pricing active in Downtown area",
                        time: "15 mins ago",
                        severity: "success"
                    },
                    // Add more alerts as needed
                ]
            });

        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching dashboard data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async getRevenueStats(req: Request, res: Response) {
        try {
            const revenueData = await Ride.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: { 
                            $dateToString: { 
                                format: "%Y-%m", 
                                date: "$createdAt" 
                            }
                        },
                        revenue: { $sum: "$price" },
                        rides: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } },
                { $limit: 7 }
            ]);

            res.status(200).json({
                revenueData: revenueData.map(item => ({
                    month: new Date(item._id + "-01").toLocaleString('default', { month: 'short' }),
                    revenue: item.revenue,
                    rides: item.rides
                }))
            });

        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching revenue stats',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async getPopularLocations(req: Request, res: Response) {
        try {
            const locationData = await Ride.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: '$dropLocation.address',
                        value: { $sum: 1 },
                        rides: { $sum: 1 },
                        revenue: { $sum: '$price' }
                    }
                },
                { $sort: { value: -1 } },
                { $limit: 4 },
                {
                    $project: {
                        name: '$_id',
                        value: 1,
                        rides: 1,
                        revenue: { $round: ['$revenue', 2] }
                    }
                }
            ]);

            res.status(200).json({
                locationData: locationData.map(location => ({
                    name: location.name || 'Unknown Location',
                    value: location.value,
                    rides: location.rides,
                    revenue: `$${location.revenue}`
                }))
            });

        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching popular locations',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
