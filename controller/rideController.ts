import { Request, Response } from "express";
import axios from "axios";
import User from "../models/userModel";
import SocketConnection from "../models/wsModel";
import Trip from "../models/tripModel";
import { Types } from "mongoose";
import Ride, { CancelRide, IRide } from "../models/rideModel";
import { getDirectionsWithTolls } from "../services/googleApiService";
import { Vehicle, VehicleCategory, VehicleModel } from "../models/vechileModel";
import Payment from "../models/paymentModel";
import DriverEarnings from '../models/driverEarningsModel';
import { generateOTP } from "../utils/helpers";
import AuthenticatedRequest from "../middleware/types/request";
import CustomErrorHandler from "../services/customErrorHandler";
import { NextFunction } from "express";
import * as locationService from "../services/locationService";

interface RideAcceptedData {
  ride: any;
  otp: string;
}

export const RideController = {

  async getRideDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }
    const userId = req.user._id;
    const ride = await Ride.findOne({ customerId: userId, status: { $in: ["accepted", "ongoing", "completed", "cancelled", "arrived_at_pickup"] } }).sort({ createdAt: -1 });
    if (!ride) {
      return res.status(404).send("Ride not found");
    }

    // get vehicle
    const vehicle = await Vehicle.findOne({ user: ride.driverInfo?.driverId });
    if (!vehicle) {
      return res.status(404).send("Vehicle not found");
    }
    console.log("vehicle-data", vehicle);
    const vehicleModel = await VehicleModel.findOne({ _id: vehicle.model });
    console.log("vehicleModel", vehicleModel);
    return res.status(200).send({
      ...ride.toObject(),
      driverInfo: {
        ...ride.driverInfo,
        vehicleName: vehicleModel?.name,
        vehicleNumber: vehicle.vehicle_number,
      }
    });
  },

  async getActiveRide(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }
    const userId = req.user._id;
    console.log("GET RIDE DETAILS FOR DRIVER CALLED");
    // status should be accepted or ongoing
    // driver id or customer id 
    const ride = await Ride.findOne({ $or: [{ "driverInfo.driverId": userId }, { customerId: userId }], status: { $in: ["accepted", "ongoing", "completed", "cancelled", "arrived_at_pickup"] } }).sort({ createdAt: -1 });
    console.log("ride", ride);
    if (!ride) {
      return res.status(404).send("Ride not found");
    }
    return res.status(200).send(ride);
  },

  async getAllRides(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }
    const userId = req.user._id;
    const rides = await Ride.find();
    const trips = await Trip.find().select("rideId duration distance startTime endTime");

    const ridesWithTrips = rides.map(ride => {
      const trip = trips.find(trip => trip?.rideId && trip.rideId.toString() === ride._id?.toString());
      return {
        ...ride.toObject(),
        trip: trip ? trip.toObject() : null
      };
    });

    return res.status(200).send(ridesWithTrips);
  },
  async getRideDetailsById(req: Request, res: Response, next: NextFunction) {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    const trip = await Trip.findOne({ rideId: rideId }).select("duration distance startTime endTime");
    const rideWithTrip = {
      ...ride?.toObject(),
      trip: trip ? trip.toObject() : null
    };
    return res.status(200).send(rideWithTrip);
  },
  async book_ride(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log("BOOK RIDE CALLED");
    console.log("req.user", req.user);
    if (!req.user) {
      console.log("UNAUTHORIZED");
      return next(CustomErrorHandler.unAuthorized());
    }
    const customerId = req.user._id;
    const { pickupLocation, dropLocation, vehicleType } = req.body;
    console.log("req.body", req.body);
    if (!pickupLocation || !dropLocation || !customerId) {
      console.log("MISSING REQUIRED FIELDS");
      return res.status(400).send("Missing required fields");
    }
    console.log("pickupLocation", pickupLocation);
    if (!pickupLocation.latitude || !pickupLocation.longitude) {
      console.log("INVALID PICKUP LOCATION");
      return res.status(400).send("Invalid pickup location");
    }

    try {
      const customer = await User.findById(customerId);

      if (!customer) {
        console.log("CUSTOMER NOT FOUND");
        return res.status(404).send("Customer not found");
      }

      const directions = await getDirectionsWithTolls(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropLocation.latitude,
        dropLocation.longitude
      );
      console.log("directions", directions);
      if (directions.error) {
        console.log("ERROR IN GETTING DIRECTIONS");
        return res.status(500).send(directions.error);
      }

      const vehicleCategory = await VehicleCategory.findOne({ name: vehicleType });
      console.log("vehicleCategory", vehicleCategory);
      const defaultPrice = directions!.distance! + directions!.tollCost!;
      const categoryPrice = defaultPrice * Number(vehicleCategory?.price);
      const price = categoryPrice / 1000;
      console.log("price", price);
      // Create new ride
      const ride = new Ride({
        customerId: customerId,
        pickupLocation,
        dropLocation,
        status: "pending",
        price: price,
        driverId: null,
        otp: null,
        customerInfo: {
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone!,
        },
      });

      await ride.save();
      console.log("ride", ride);

      // Create payment record
      const newPayment = new Payment({
        rideId: ride._id,
        amount: price,
        status: "Pending",
      });
      await newPayment.save();

      // Create trip record
      const durationInMinutes = (parseInt(directions.duration!) / 60).toFixed(2);
      const distanceInKm = (Number(directions.distance!) / 1000).toFixed(2);
      const newTrip = new Trip({
        rideId: ride._id,
        customerId: customerId,
        duration: durationInMinutes,
        distance: distanceInKm,
        tripCompleted: false,
        pickupLocation: pickupLocation,
        dropLocation: dropLocation,
        status: "pending",
        startTime: new Date().getTime(),
      });

      await newTrip.save();
      console.log("newTrip", newTrip);
      // Add trip to customer's trips array
      customer.trips.push(newTrip._id as Types.ObjectId);
      await customer.save();

      const io = req.app.locals.io;

      // Find available drivers with the requested vehicle type
      const availableDrivers = await SocketConnection.find({
        vehicleType: vehicleType.toLowerCase(),
        userType: "driver",
        available: true
      });
      console.log("availableDrivers", availableDrivers);
      if (!availableDrivers || availableDrivers.length === 0) {
        return res.status(200).json({
          message: "No drivers available for the selected category"
        });
      }

      // Broadcast the ride request to available drivers
      const uniqueDriverIds = [...new Set(availableDrivers.map(driver => driver.userId.toString()))];
      console.log("uniqueDriverIds", uniqueDriverIds);
      // Find all socket connections for these drivers
      const driverSockets = await SocketConnection.find({
        userId: { $in: uniqueDriverIds },
        userType: "driver"
      });

      // Broadcast ride request to all available drivers
      driverSockets.forEach(driverSocket => {
        const socket = io.sockets.sockets.get(driverSocket.socketId);
        if (socket) {
          console.log("Emmiting ride request to driver");
          console.log("socket", socket);
          socket.emit("ride-request", { ride: ride.toObject() });
        }
      });



      // Send immediate response after broadcasting
      return res.status(200).json({
        message: "Ride request sent to available drivers"
      });

    } catch (err) {
      console.error("Error booking ride:", err);
      res.status(500).send("Internal server error");
    }
  },

  async complete_ride(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log("complete_ride called with body:", req.body);
    if (!req.user) {
      console.log("User not authenticated");
      return next(CustomErrorHandler.unAuthorized());
    }
    const driver = req.user;
    const { rideId } = req.body;
    console.log("Driver:", driver);
    console.log("Ride ID:", rideId);

    const ride = await Ride.findById(rideId);
    console.log("Found ride:", ride);

    if (!ride) {
      console.log("Ride not found");
      return res.status(404).send("Ride not found");
    }

    if (!driver._id || ride?.driverInfo?.driverId !== driver._id) {
      console.log("Unauthorized: driver ID mismatch");
      return next(CustomErrorHandler.unAuthorized());
    }

    try {
      // Update ride status
      await Ride.findByIdAndUpdate(ride._id, { status: "completed" });
      console.log("Ride status updated to completed");
      // Update trip status
      await Trip.findOneAndUpdate(
        { rideId: ride._id },
        { tripCompleted: true },
        { new: true }
      );
      console.log("Trip status updated to completed");
      // Update driver availability if driver info exists
      if (ride.driverInfo && ride.driverInfo.driverId) {
        console.log("Updating driver availability to true");
        await SocketConnection.updateMany(
          { userId: ride.driverInfo.driverId },
          { $set: { available: true } }
        );
        console.log("Driver availability updated to true");
      }
      console.log("ride.driverInfo", ride.driverInfo);
      // Update driver's earnings
      if (ride.driverInfo && ride.driverInfo.driverId) {
        const earnings = await DriverEarnings.findOne({ driverId: ride.driverInfo.driverId });
        if (earnings) {
          earnings.totalEarnings += ride.price;
          earnings.dailyEarnings += ride.price;
          if (ride._id) {
            earnings.rides.push(ride._id as unknown as Types.ObjectId);
          }
          earnings.lastUpdated = new Date();
          await earnings.save();
        } else {
          await DriverEarnings.create({
            driverId: ride.driverInfo.driverId,
            totalEarnings: ride.price,
            dailyEarnings: ride.price,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            rides: ride._id ? [ride._id as unknown as Types.ObjectId] : [],
            lastUpdated: new Date(),
          });
        }
      }
      console.log("ride.driverInfo", ride.driverInfo);
      // Send events through socket connection (handled by socketHandlers)
      const io = req.app.locals.io;
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      });
      console.log("customerConnection", customerConnection);
      if (customerConnection) {
        console.log("customerConnection found");
        const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
        if (customerSocket) {
          console.log("Emitting ride-completed event to customer");
          customerSocket.emit("ride-completed", { rideId: ride._id });
        }
      }
      console.log("ride.driverInfo", ride.driverInfo);

      if (ride.driverInfo && ride.driverInfo.driverId) {
        console.log("driverConnection found");
        const driverConnection = await SocketConnection.findOne({
          userId: ride.driverInfo.driverId,
        });
        console.log("driverConnection", driverConnection);
        if (driverConnection) {
          console.log("driverSocket found");
          const driverSocket = io.sockets.sockets.get(driverConnection.socketId);
          if (driverSocket) {
            console.log("Emitting ride-completed event to driver");
            driverSocket.emit("ride-completed", {
              message: "Ride completed successfully",
              rideId: ride._id
            });
          }
        }
      }
      console.log("ride.driverInfo", ride.driverInfo);
      return res.status(200).json("Ride completed successfully");
    } catch (err) {
      console.error("Error completing ride:", err);
      return res.status(500).send("Internal server error");
    }
  },

  async start_ride(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log("start_ride called with body:", req.body);

    if (!req.user) {
      console.log("User not authenticated");
      return next(CustomErrorHandler.unAuthorized());
    }

    const driver = req.user;
    console.log("Driver:", driver);

    const { rideId, otp } = req.body;
    console.log(`Received rideId: ${rideId}, otp: ${otp}`);

    const ride = await Ride.findById(rideId);
    console.log("Found ride:", ride);

    if (!ride || ride.driverInfo?.driverId !== driver._id) {
      console.log("Unauthorized: ride not found or driver mismatch");
      console.log("Ride driver ID:", ride?.driverInfo?.driverId);
      console.log("Request user ID:", driver._id);
      return next(CustomErrorHandler.unAuthorized());
    }

    if (!ride) {
      console.log("Ride not found");
      return res.status(404).send("Ride not found");
    }

    if (ride.otp !== otp) {
      console.log(`OTP mismatch. Expected: ${ride.otp}, Received: ${otp}`);
      return res.status(400).send("Invalid OTP");
    }

    try {
      console.log("Updating ride status to ongoing");
      // Update ride status
      const updatedRide = await Ride.findByIdAndUpdate(ride._id, { status: "ongoing" });
      console.log("Updated ride:", updatedRide);

      // Notify the customer (handled by socketHandlers)
      const io = req.app.locals.io;
      console.log("Socket IO instance:", io ? "Available" : "Not available");

      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      });
      console.log("Customer connection:", customerConnection);

      if (customerConnection) {
        const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
        console.log("Customer socket:", customerSocket ? "Found" : "Not found");

        if (customerSocket) {
          console.log("Emitting ride-started event to customer");
          customerSocket.emit("ride-started", {
            message: "OTP verified successfully. Your ride has started.",
            rideId: ride._id,
          });
          console.log("Event emitted successfully");
        }
      }

      console.log("Ride started successfully");
      return res.status(200).send("Ride started");
    } catch (error) {
      console.error("Error starting ride:", error);
      return res.status(500).send("Internal server error");
    }
  },


  // arrived at pickup location
  async arrived_at_pickup_location(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log("arrived_at_pickup_location called with body:", req.body);
    console.log("arrived_at_pickup_location called with user:", req.user);
    if (!req.user) {
      console.log("User not authenticated");
      return next(CustomErrorHandler.unAuthorized());
    }
    console.log("arrived_at_pickup_location called with user:", req.user);
    const driver = req.user;
    const { rideId } = req.body;
    console.log("Driver:", driver);
    console.log("Ride ID:", rideId);

    const ride = await Ride.findById(rideId);
    console.log("Ride:", ride);
    if (!ride) {
      console.log("Ride not found");
      return res.status(404).send("Ride not found");
    }
    console.log("ride.driverInfo", ride.driverInfo);
    if (ride.driverInfo?.driverId !== driver._id) {
      console.log("Unauthorized: ride not found or driver mismatch");
      console.log("Ride driver ID:", ride?.driverInfo?.driverId);
      console.log("Request user ID:", driver._id);
      return next(CustomErrorHandler.unAuthorized());
    }

    console.log("ride.status", ride.status);
    if (ride.status === "arrived_at_pickup") {
      console.log("Ride is already arrived at pickup location");
      return res.status(200).send("Ride is already arrived at pickup location");
    }

    if (ride.status !== "accepted") {
      console.log("Ride is not accepted");
      return res.status(400).send("Ride is not accepted");
    }
    console.log("Arrived at pickup location");
    await Ride.findByIdAndUpdate(rideId, { status: "arrived_at_pickup" });
    return res.status(200).send("Arrived at pickup location");
  },

  // cancel ride api
  async cancel_ride(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }
    const userId = req.user._id;
    const { cancelReason } = req.body;

    // FIND LATEST RIDE CUSTOMER ID OR DRIVER ID ALSO STATUS SHOULD BE PENDING OR ACCEPTED
    const ride = await Ride.findOne({ $or: [{ customerId: userId }, { "driverInfo.driverId": userId }], status: { $in: ["pending", "accepted"] } }).sort({ createdAt: -1 });
    if (!ride) {
      return res.status(404).send("Ride not found");
    }

    if (ride.customerId.toString() !== userId.toString() && ride.driverInfo?.driverId?.toString() !== userId.toString()) {
      return next(CustomErrorHandler.unAuthorized());
    }

    const isDriver = ride.driverInfo?.driverId?.toString() === userId.toString();
    try {
      // Update ride status
      await Ride.findByIdAndUpdate(ride._id, { status: "cancelled" });
      // Save cancellation reason
      const cancelRide = new CancelRide({
        rideId: ride._id,
        cancelReason,
        isDriver
      });
      await cancelRide.save();

      // Update trip status
      await Trip.findOneAndUpdate(
        { rideId: ride._id },
        { tripCancelled: true },
        { new: true }
      );

      // Update driver availability if driver exists
      if (ride.driverInfo && ride.driverInfo.driverId) {
        await SocketConnection.updateMany(
          { userId: ride.driverInfo.driverId },
          { $set: { available: true } }
        );
      }

      // Send events through socket connection (handled by socketHandlers)
      const io = req.app.locals.io;

      if (isDriver) {
        const customerConnection = await SocketConnection.findOne({
          userId: ride.customerId,
        });

        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          if (customerSocket) {
            customerSocket.emit("ride-cancelled", {
              message: "Ride cancelled by driver",
              cancelReason,
            });
          }
        }
      } else if (ride.driverInfo && ride.driverInfo.driverId) {
        console.log("driverConnection found");
        const driverConnection = await SocketConnection.findOne({
          userId: ride.driverInfo.driverId,
        });
        console.log("driverConnection", driverConnection);
        if (driverConnection) {
          const driverSocket = io.sockets.sockets.get(driverConnection.socketId);
          if (driverSocket) {
            console.log("Emitting ride-cancelled event to driver");
            driverSocket.emit("ride-cancelled", {
              message: cancelReason,
              cancelReason,
            });
          }
        }
      }

      return res.status(200).json({
        message: "Ride cancelled successfully",
        cancelRide
      });
    } catch (error) {
      console.error("Error cancelling ride:", error);
      return res.status(500).send("Internal server error");
    }
  },

  async update_driver_location(io: any, driverId: string, location: any) {
    try {
      // Update driver location in MongoDB (assuming SocketConnection is your Mongoose model)
      await SocketConnection.updateOne(
        { userId: driverId },
        { $set: { location } }
      );

      // Find the ride associated with the driver
      const ride = await Ride.findOne({
        "driverInfo.driverId": driverId,
        status: { $in: ["accepted", "ongoing"] }
      });

      if (!ride) {
        // Broadcast available driver location
        io.emit("available-drivers", {
          driverId: driverId,
          location: location,
        });
        return;
      }

      if (ride) {
        // Find the customer's socket and emit location update
        const customerConnection = await SocketConnection.findOne({
          userId: ride.customerId
        });

        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);

          if (customerSocket) {
            try {
              const geocodeResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyCdXyAkWjkhUlWXBbpkieWRi2OV47AbVFE`
              );
              const address = geocodeResponse.data.results[0]?.formatted_address || "Unknown";
              customerSocket.emit("driver-location-update", { location, address });
            } catch (err) {
              console.error("Error getting address:", err);
              customerSocket.emit("driver-location-update", {
                location,
                address: "Unknown",
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Error updating driver location:", err);
    }
  },

  // New API endpoints

  async acceptRide(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }

    const driver = req.user;
    const { rideId } = req.body;

    try {
      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      if (ride.status !== "pending") {
        return res.status(400).json({ message: "Ride is no longer available" });
      }

      // Generate OTP for ride verification
      const otp = generateOTP();

      // Get driver details
      const driverDetails = await User.findById(driver._id);
      if (!driverDetails) {
        return res.status(404).json({ message: "Driver not found" });
      }

      // Update ride with driver information and OTP
      const driverInfo = {
        driverId: driver._id,
        fullName: driverDetails.full_name,
        phone: driverDetails.phone || "",
        email: driverDetails.email,
        rating: driverDetails.rating || 0,
      };

      await Ride.findByIdAndUpdate(rideId, {
        status: "accepted",
        driverInfo: driverInfo,
        otp: otp
      });


      // Update driver availability
      await SocketConnection.updateMany(
        { userId: driver._id },
        { $set: { available: false } }
      );

      // Send real-time updates
      const io = req.app.locals.io;

      // Notify customer
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      });

      if (customerConnection) {
        const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
        if (customerSocket) {
          const vehicle = await Vehicle.findOne({ user: driver._id });
          const vehicleNumber = vehicle?.vehicle_number;
          const vehicleModel = await VehicleModel.findOne({ _id: vehicle?.model });
          const vehicleName = vehicleModel?.name;
          const rideAcceptedData: RideAcceptedData = {
            ride: {
              ...ride.toObject(),
              driverInfo: {
                ...ride.driverInfo,
                driverId: driver._id,
                vehicleNumber: vehicleNumber,
                vehicleName: vehicleName
              },
              otp: otp
            },
            otp
          };
          console.log("customerSocket", customerSocket);
          customerSocket.emit("ride-accepted", rideAcceptedData);
        }
      }

      console.log("Ride Controller Ride Accepted");
      console.log("rideAcceptedData", ride);

      // Response to driver
      return res.status(200).json({
        message: "Ride accepted successfully",
        ride: {
          ...ride.toObject(),
          driverInfo,
          otp
        }
      });

    } catch (err) {
      console.error("Error accepting ride:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async verifyOTP(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }

    const { rideId, otp } = req.body;

    try {
      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      if (ride.status !== "accepted") {
        return res.status(400).json({ message: "Ride is not in accepted state" });
      }

      if (ride.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Update ride status to ongoing
      await Ride.findByIdAndUpdate(rideId, { status: "ongoing" });

      // Send real-time updates
      const io = req.app.locals.io;

      // Notify both customer and driver
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      });

      if (customerConnection) {
        const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
        if (customerSocket) {
          customerSocket.emit("ride-started", {
            message: "Your ride has started",
            rideId: ride._id
          });
        }
      }

      if (ride.driverInfo && ride.driverInfo.driverId) {
        const driverConnection = await SocketConnection.findOne({
          userId: ride.driverInfo.driverId,
        });

        if (driverConnection) {
          const driverSocket = io.sockets.sockets.get(driverConnection.socketId);
          if (driverSocket) {
            driverSocket.emit("ride-started", {
              message: "OTP verified successfully. Ride has started.",
              rideId: ride._id
            });
          }
        }
      }

      return res.status(200).json({ message: "OTP verified successfully. Ride has started." });

    } catch (err) {
      console.error("Error verifying OTP:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async trackRide(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }

    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if the user is either the customer or the driver
      const userId = req.user._id.toString();
      const isCustomer = ride.customerId.toString() === userId;
      const isDriver = ride.driverInfo?.driverId?.toString() === userId;

      if (!isCustomer && !isDriver) {
        return next(CustomErrorHandler.unAuthorized());
      }

      // Get location data based on who is tracking
      let location = null;

      if (isCustomer && ride.driverInfo?.driverId) {
        // Customer tracking driver
        location = await locationService.getLocation(ride.driverInfo.driverId.toString());
      } else if (isDriver) {
        // Driver tracking customer (pickup location)
        location = {
          lat: ride.pickupLocation?.latitude,
          lng: ride.pickupLocation?.longitude,
          updatedAt: Date.now()
        };
      }

      if (!location) {
        return res.status(404).json({ message: "Location data not available" });
      }

      // Try to get address information
      let address = "Unknown";
      try {
        const geocodeResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=AIzaSyCdXyAkWjkhUlWXBbpkieWRi2OV47AbVFE`
        );
        address = geocodeResponse.data.results[0]?.formatted_address || "Unknown";
      } catch (err) {
        console.error("Error getting address:", err);
      }

      return res.status(200).json({
        location: {
          latitude: location.lat,
          longitude: location.lng,
          updatedAt: location.updatedAt
        },
        address
      });

    } catch (err) {
      console.error("Error tracking ride:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async updateRideLocation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(CustomErrorHandler.unAuthorized());
    }

    const driver = req.user;
    const { latitude, longitude, rideId } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "Missing latitude or longitude" });
    }

    try {
      // Verify this is the driver's ride
      const ride = await Ride.findOne({
        _id: rideId,
        "driverInfo.driverId": driver._id,
        status: { $in: ["accepted", "ongoing"] }
      });

      if (!ride) {
        return res.status(404).json({ message: "Active ride not found for this driver" });
      }

      // Update location in Redis
      await locationService.updateLocation(driver._id.toString(), latitude, longitude);

      // Get address information
      let address = "Unknown";
      try {
        const geocodeResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCdXyAkWjkhUlWXBbpkieWRi2OV47AbVFE`
        );
        address = geocodeResponse.data.results[0]?.formatted_address || "Unknown";
      } catch (err) {
        console.error("Error getting address:", err);
      }

      // Send real-time location update to customer
      const io = req.app.locals.io;
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId
      });

      if (customerConnection) {
        const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
        if (customerSocket) {
          customerSocket.emit("driver-location-update", {
            location: { latitude, longitude },
            address,
            driverId: driver._id.toString(),
            rideId: ride._id.toString()
          });
        }
      }

      return res.status(200).json({ message: "Location updated successfully" });

    } catch (err) {
      console.error("Error updating ride location:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};
