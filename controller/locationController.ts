import { Request, Response } from "express";
import User from "../models/userModel";
import AuthenticatedRequest from "../middleware/types/request";
import * as locationService from "../services/locationService";
import Ride from "../models/rideModel";
import SocketConnection from "../models/wsModel";
// import SocketConnection from "../models/socketConnectionModel";

const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
        return res.status(400).json({ message: "Missing latitude or longitude" });
    }

    try {
        await locationService.updateLocation(user._id?.toString() ?? "", latitude, longitude);
        // broadcast location to rides where driver and status is accepted or ongoing
        const rides = await Ride.find({ "driverInfo.driverId": user._id, status: { $in: ["accepted", "ongoing"] } });
        for (const ride of rides) {
            const io = req.app.locals.io;

            const customerConnection = await SocketConnection.findOne({
                userId: ride.customerId,
            });
            console.log("Sending location to customer", customerConnection);
            if (customerConnection) {
                const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
                if (customerSocket) {
                    customerSocket.emit("driver-location-update", {
                        latitude,
                        longitude
                    });
                }
            }
        }
        return res.status(200).json({ message: "Location updated" });
    } catch (err) {
        console.error("Error updating location:", err);
        return res.status(500).json({ message: "Error updating location" });
    }
}

const getLocation = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const location = await locationService.getLocation(req.user._id.toString());

        if (!location) {
            // Fallback to database if Redis data not found
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ location: user.location });
        }

        return res.status(200).json({ location });
    } catch (err) {
        console.error("Error retrieving location:", err);
        return res.status(500).json({ message: "Error retrieving location" });
    }
}

const getLocationByUserId = async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;

    try {
        const location = await locationService.getLocation(userId);

        if (!location) {
            // Fallback to database if Redis data not found
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ location: user.location });
        }

        return res.status(200).json({ location });
    } catch (err) {
        console.error("Error retrieving location:", err);
        return res.status(500).json({ message: "Error retrieving location" });
    }
}

export { updateLocation, getLocation, getLocationByUserId };
