import { Request, Response } from "express";
import axios from "axios";
import User from "../models/userModel";
import SocketConnection, { ISocketConnection } from "../models/wsModel";

import Trip from "../models/tripModel";
import { Server } from "socket.io";
import { Socket } from "dgram";
import { Mongoose, ObjectId, Schema, Types } from "mongoose";
import Ride, { CancelRide, IRide } from "../models/rideModel";
import { getDirectionsWithTolls, getDistanceAndETA } from "../services/googleApiService";
import { IVehicleModel, Vehicle, VehicleCategory, VehicleModel } from "../models/vechileModel";
import Payment from "../models/paymentModel";
import DriverEarnings from '../models/driverEarningsModel';
// import { Location } from "../types/socket_types";

let rides: IRide[] = [];

// const findRideById = (id: number): IRide | undefined =>
//   rides.find((ride) => ride._id === id);

const findDriverById = async (
  id: string
): Promise<ISocketConnection | null> => {
  return await SocketConnection.findOne({ userId: id }).exec();
};

const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const assignRideToDriver = async (
  io: any,
  newRide: IRide,
  driver: ISocketConnection,
  availableDrivers: ISocketConnection[],
  res: Response
) => {
  const driverSocket = io.sockets.sockets.get(driver.socketId);
  if (!driverSocket) {
    console.log("Driver socket not found, reassigning...");
    const nextDriver = availableDrivers.shift();
    if (nextDriver) {
      assignRideToDriver(io, newRide, nextDriver, availableDrivers, res);
    } else {
      if (!res.headersSent) {
        res.status(200).send("No drivers available");
      }
    }
    return;
  }

  const driverVehicle = await Vehicle.findOne({ user: driver.userId })
    .populate<{ model: IVehicleModel }>("model") // Populate and specify the type of the model field
    .exec();

  driverSocket.emit("ride-request", { ride: newRide });
  // console.log("Ride requested", { ride: newRide });

  const timeout = setTimeout(() => {
    if (newRide.status === "pending") {
      console.log("Driver did not respond in time, reassigning...");
      const nextDriver = availableDrivers.shift();
      if (nextDriver) {
        assignRideToDriver(io, newRide, nextDriver, availableDrivers, res);
      } else {
        if (!res.headersSent) {
          res.status(200).send("No drivers available");
        }
      }
    }
  }, 30000);

  const handleAcceptance = async () => {
    const vehicle = await Vehicle.findOne({ user: driver.userId }).populate('model');
    // console.log("vehicle", vehicle);
    if (!vehicle) {
      // console.error("Vehicle not found for driver");
      return res.status(404).send("Vehicle not found for driver");
    }
    // console.log("working");
    clearTimeout(timeout);
    newRide.status = "accepted";
    newRide.driverId = driver.userId.toString();
    newRide.otp = generateOTP();
    newRide.driverLocation = driver.location ?? undefined;
    const driverUser = await User.findById(driver.userId);
    if (driverUser) {
     
      newRide.driverInfo = {
        fullName: driverUser.full_name,
        driverId: driver.userId.toString(),
        email: driverUser.email,
        phone: driverUser.phone!,
        profileImage: driverUser.profile_image ?? "",
        vehicleName: vehicle.model.name,
        vehicleNumber:vehicle.vehicle_number,
      };
    }
    // console.log("working 2 ");

    const rideupdate = await Ride.findOneAndUpdate(
      { _id: newRide._id },
      {
        driverInfo: {
          fullName: driverUser!.full_name,
          email: driverUser!.email,
          phone: driverUser!.phone!,
          vehicleName: vehicle.model.name,
          vehicleNumber: vehicle.vehicle_number,
          driverId: driverUser!._id,
        },
        status: "accepted",
        driverId: driver.userId,
      },
      { new: true }
    );

    if (!rideupdate) {
      console.error("ride not found");
      return res.status(404).send("ride not found");
    }

    if (rideupdate) {
      console.log("ride Updated");
    }


    const customerSocket = io.sockets.sockets.get(driver.socketId);

    const existingTrip = await Trip.findOneAndUpdate(
      { rideId: newRide._id },
      { driverId: driver.userId },
      { new: true }
    );

    if (!existingTrip) {
      console.error("Trip not found");
      return res.status(404).send("Trip not found");
    }

    if (existingTrip) {
      console.log("Trip Updated");
    }

    if (customerSocket) {
      customerSocket.emit("otp", { otp: newRide.otp });
    }
    // console.log(newRide);
    if (!res.headersSent) {
      res
        .status(200)
        .send({ message: "Driver accepted the request", ride: newRide });
    }
    cleanup();
  };

  const handleDisconnect = () => {
    clearTimeout(timeout);
    if (newRide.status === "pending") {
      console.log("Driver disconnected, reassigning...");
      const nextDriver = availableDrivers.shift();
      if (nextDriver) {
        assignRideToDriver(io, newRide, nextDriver, availableDrivers, res);
      } else {
        if (!res.headersSent) {
          res.status(200).send("No drivers available");
        }
      }
    }
  };

  const cleanup = () => {
    driverSocket.off("ride-accepted", handleAcceptance);
    driverSocket.off("disconnect", handleDisconnect);
  };

  driverSocket.on("ride-accepted", handleAcceptance);
  driverSocket.on("disconnect", handleDisconnect);
};

export const RideController = {

  async book_ride(req: Request, res: Response) {
    // console.log(req.body);
    const { pickupLocation, dropLocation, customerId, vehicleType } = req.body;

    if (!pickupLocation || !dropLocation || !customerId) {
      return res.status(400).send("Missing required fields");
    }

    if (!pickupLocation.latitude || !pickupLocation.longitude) {
      return res.status(400).send("Invalid pickup location");
    }

    try {
      const customer = await User.findById(customerId);

      if (!customer) {
        return res.status(404).send("Customer not found");
      }

      const directions = await getDirectionsWithTolls(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropLocation.latitude,
        dropLocation.longitude
      );
      if (directions.error) {
        return res.status(500).send(directions.error);
      }
      const vehicleCategory = await VehicleCategory.findOne({ name: vehicleType });
      const defaultPrice = directions!.distance! + directions!.tollCost!;
      console.log("defaultPrice", defaultPrice);
      const price = defaultPrice / 100;
      console.log("price", price);


      const ride = new Ride({
        
        customerId: customerId,
        pickupLocation,
        dropLocation,
        status: "pending",
        price: price,
        driverId: null,
        otp: null,
        driverLocation: undefined,
        customerInfo: {
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone!,
        },
      });

      const newRide: IRide = ride.toObject();
      // console.log("New ride being pushed:", newRide);
      rides.push(newRide);
      try {
        await ride.save();
        console.log("ride save");
      } catch (error) {
        console.log(error);
      }

      const newPayment = new Payment({
        rideId: newRide._id,
        amount: price,
        status: "Pending",
      });
      // Convert duration from minutes to hours
      // directions.duration is in seconds, so 67 seconds would be:
      // 67 / 60 = 1.12 minutes
      const durationInMinutes = (parseInt(directions.duration!) / 60).toFixed(2); // Convert seconds to minutes
      const distanceInKm = (Number(directions.distance!) / 1000).toFixed(2);
      const newTrip = new Trip({
        rideId: newRide._id,
        customerId: customerId ?? '',
        duration: durationInMinutes,
        distance: distanceInKm,
        tripCompleted: false,
        pickupLocation: pickupLocation,
        dropLocation: dropLocation,
        status: "pending",
        startTime: new Date().getTime(),
      });

      try {
        await newPayment.save();
        console.log("payment save");
      } catch (error) {
        console.log("Error saving in payment", error),
        res.status(500).send("Failed to save payment details");
      }

      try {
        await newTrip.save();
        customer.trips.push(newTrip._id as Types.ObjectId);
        await customer.save();
      } catch (error) {
        console.error("Error saving trip:", error);
        return res.status(500).send("Failed to save trip details");
      }

     const availableVehicles =  await SocketConnection.find({vehicleType: vehicleType})

      // console.log('availableVehicles', availableVehicles);

      const filteredVehicles = availableVehicles.filter((socket) => socket.userId);

      if (!filteredVehicles || filteredVehicles.length === 0) {
        const io = req.app.locals.io as any;
        const customerConnection = await SocketConnection.findOne({
          userId: customerId,
        }).exec();
        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          if (customerSocket) {
            customerSocket.emit("no-drivers-available", {
              message: "No drivers available for the selected category"
            });
          }
        }
        return res.status(200).send("No drivers available for the selected category");
      }

      const driverIds = filteredVehicles.map((socket) => socket.userId.toString());
      if (driverIds.length === 0) {
        const io = req.app.locals.io as any;
        const customerConnection = await SocketConnection.findOne({
          userId: customerId,
        }).exec();
        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          if (customerSocket) {
            customerSocket.emit("no-drivers-available", {
              message: "No active drivers available for the selected category"
            });
          }
        }
        return res.status(200).send("No active drivers available");
      }

      const io = req.app.locals.io as any;
      const availableDrivers = await SocketConnection.find({
        userType: "driver",
        userId: { $in: driverIds },
      }).exec();

      if (availableDrivers.length === 0) {
        const customerConnection = await SocketConnection.findOne({
          userId: customerId,
        }).exec();
        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          if (customerSocket) {
            customerSocket.emit("no-drivers-available", {
              message: "No drivers available"
            });
          }
        }
        return res.status(200).send("No drivers available");
      }

      const initialDriver = availableDrivers.shift();
      if (initialDriver) {
        assignRideToDriver(io, newRide, initialDriver, availableDrivers, res);
      } else {
        res.status(200).send("No drivers available");
      }
    } catch (err) {
      console.error("Error booking ride:", err);
      res.status(500).send("Internal server error");
    }
  },

  async complete_ride(req: Request, res: Response) {
    const { rideId } = req.body;
    console.log(`Completing ride with ID: ${rideId}`);

    console.log("Ride ID to find:", rideId);
    console.log("Rides array:", rides);

    const rideIndex = rides.findIndex(
      (ride) => ride._id!.toString() === rideId.toString()
    );
    if (rideIndex === -1) {
      console.error("Ride not found");
      return res.status(404).send("Ride not found");
    }

    const ride = rides[rideIndex];
    ride.status = "completed";

    const driver = await findDriverById(ride.driverId!);
    if (!driver) {
      console.error("Driver not found");
      return res.status(404).send("Driver not found");
    }

    console.log("Driver found, updating status to available");
  

    const io = req.app.locals.io as any;

    try {
      // Find customer connection and emit event
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      }).exec();
      if (!customerConnection) {
        console.error("Customer connection not found");
        return res.status(404).send("Customer connection not found");
      }

      const customerSocketId = customerConnection.socketId;
      console.log(`Customer socket ID: ${customerSocketId}`);
      console.log("Customer connection data:", customerConnection);

      const customerSocket = io.sockets.sockets.get(customerSocketId);
      if (!customerSocket) {
        console.error(
          "Customer socket not found. Active socket IDs:",
          Array.from(io.sockets.sockets.keys())
        );
        return res.status(404).send("Customer socket not found");
      }

      console.log("Emitting ride-completed event to customer");

      customerSocket.emit(
        "ride-completed",
        { rideId: ride._id },
        async (ack: any) => {
          console.log("Emit callback invoked");
          // Deleting the socket connection entry from the database
          try {
            const deleteResult = await SocketConnection.findOneAndDelete({
              _id: customerConnection._id,
            });
            if (!deleteResult) {
              console.error("Socket connection not found for deletion");
              return res
                .status(404)
                .json("Socket connection not found for deletion");
            }
            console.log("Socket connection deleted successfully");
          } catch (deleteErr) {
            console.error("Error deleting socket connection:", deleteErr);
            return res
              .status(500)
              .json("Ride completed but failed to delete socket connection");
          }
        }
      );

      // Find driver connection and emit event
      const driverConnection = await SocketConnection.findOne({
        userId: ride.driverId,
      }).exec();

      if (driverConnection) {
        const driverSocket = io.sockets.sockets.get(driverConnection.socketId);
        if (driverSocket) {
          driverSocket.emit("ride-completed", { 
            message: "Ride completed successfully",
            rideId: ride._id 
          });
        }
      }

      console.log("Emit sent to both customer and driver");
      res.status(200).json("Ride completed successfully");

      await SocketConnection.updateOne(
        { userId: ride.driverId },
        { $set: { available: true } }
      );
      rides.splice(rideIndex, 1);
  
      const existingTrip = await Trip.findOneAndUpdate(
        { rideId: ride._id },
        { tripCompleted: true },
        { new: true }
      );
  
      if (!existingTrip) {
        console.error("Trip not found");
        return res.status(404).send("Trip not found");
      }
  
      console.log("Trip completed");
  
      // Update driver's earnings
      const earnings = await DriverEarnings.findOne({ driverId: ride.driverId });
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
          driverId: ride.driverId,
          totalEarnings: ride.price,
          dailyEarnings: ride.price,
          weeklyEarnings: 0,
          monthlyEarnings: 0,
          rides: ride._id ? [ride._id as unknown as Types.ObjectId] : [],
          lastUpdated: new Date(),
        });
      }
  
      console.log('Driver earnings updated');

    } catch (err) {
      console.error("Error emitting ride-completed event:", err);
      res.status(500).send("Internal server error");
    }
  },
  async start_ride(req: Request, res: Response) {
    console.log(req.body);
    const { rideId, otp } = req.body;

    console.log("Ride ID to find:", rideId);
    console.log("Rides array:", rides);

    const rideIndex = rides.findIndex(
      (ride) => ride._id!.toString() === rideId.toString()
    );
    if (rideIndex === -1) {
      console.error("Ride not found");
      return res.status(404).send("Ride not found");
    }

    const io = req.app.locals.io as any;
    const ride = rides[rideIndex];

    if (ride.otp !== otp) {
      return res.status(400).send("Invalid OTP");
    }

    ride.status = "ongoing";

    try {
      // Find the customer's socket connection
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      }).exec();
      if (!customerConnection) {
        console.error("Customer connection not found");
        return res.status(404).send("Customer connection not found");
      }

      const customerSocketId = customerConnection.socketId;
      const customerSocket = io.sockets.sockets.get(customerSocketId);

      if (!customerSocket) {
        console.error("Customer socket not found");
        return res.status(404).send("Customer socket not found");
      }

      // Emit event to customer that the OTP is verified and ride has started
      customerSocket.emit("ride-started", {
        message: "OTP verified successfully. Your ride has started.",
        rideId: ride._id,
      });

      console.log("Emitted ride-started event to customer");
    } catch (error) {
      console.error("Error emitting ride-started event:", error);
      return res.status(500).send("Internal server error");
    }

    return res.status(200).send("Ride started");
  },

  // cancel ride api

  async cancel_ride(req: Request, res: Response) {
    console.log("CANCEL RIDE CALLED");
    console.log(req.body);
    const { rideId, cancelReason, isDriver } = req.body;
    const io = req.app.locals.io as any;

    console.log(`Cancelling ride with ID: ${rideId}`);

    const rideIndex = rides.findIndex(
      (ride) => ride._id!.toString() === rideId.toString()
    );
    if (rideIndex === -1) {
      console.error("Ride not found");
      return res.status(404).send("Ride not found");
    }

    const ride = rides[rideIndex];
    ride.status = "cancelled";

    const cancelRide = new CancelRide(req.body);
    await cancelRide.save(); // Ensure save completes

    const driver = await findDriverById(ride.driverInfo?.driverId!);
    if (!driver) {
      console.error("Driver not found");
      return res.status(404).send("Driver not found");
    }

    console.log("Driver found, updating status to available");
    await SocketConnection.updateOne(
      { userId: ride.driverId },
      { $set: { available: true } }
    );

    const existingTrip = await Trip.findOneAndUpdate(
      { rideId: ride._id },
      { tripCancelled: true },
      { new: true }
    );

    if (!existingTrip) {
      console.error("Trip not found");
      return res.status(404).send("Trip not found");
    }

    console.log("Trip cancelled");

    try {
      const customerConnection = await SocketConnection.findOne({
        userId: ride.customerId,
      }).exec();
      if (!customerConnection) {
        console.error("Customer connection not found");
        return res.status(404).send("Customer connection not found");
      }

      const customerSocketId = customerConnection.socketId;
      const customerSocket = io.sockets.sockets.get(customerSocketId);
      if (!customerSocket) {
        console.error("Customer socket not found");
        return res.status(404).send("Customer socket not found");
      }

      const driverSocketId = driver.socketId;
      const driverSocket = io.sockets.sockets.get(driverSocketId);
      if (!driverSocket) {
        console.error("Driver socket not found");
        return res.status(404).send("Driver socket not found");
      }

      if (isDriver) {
        customerSocket.emit("ride-cancelled", {
          message: "Ride cancelled by driver",
          cancelReason,
        });
      } else {
        driverSocket.emit("ride-cancelled", {
          message: "Ride cancelled by customer",
          cancelReason,
        });
      }

      rides.splice(rideIndex, 1);

      // Send the final response here
      return res
        .status(200)
        .json({ message: "Ride Cancel Successfully ", cancelRide });
    } catch (error) {
      console.error("Error during ride cancellation:", error);
      return res.status(500).send("Internal server error");
    }
  },
  async update_driver_location(io: Server, driverId: string, location: any) {
    try {
      // Update driver location in MongoDB (assuming SocketConnection is your Mongoose model)
      await SocketConnection.updateOne(
        { userId: driverId },
        { $set: { location } }
      );

      // Find the ride associated with the driver
      const ride = rides.find(
        (ride) => ride.driverInfo?.driverId === driverId && ride.status === "accepted"
      );
      // console.log("ride", ride);
      if(!ride){
        console.log("ride not found");
        console.log("available drivers sending");
        io.emit("available-drivers", {
          driverId: driverId,
          location: location,
        });
      }

      if (ride) {
        console.log("driver location update sending");
        io.sockets.sockets.forEach((socket: any) => {
          axios
            .get(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyCdXyAkWjkhUlWXBbpkieWRi2OV47AbVFE`
            )
            .then((geocodeResponse) => {
              const address =
                geocodeResponse.data.results[0]?.formatted_address || "Unknown";

              socket.emit("driver-location-update", { location, address });
              // console.log(
              //   "Emitted driver-location-update event to customer with address:",
              //   address
              // );
            })
            .catch((err) => {
              console.error("Error getting address:", err);
              socket.emit("driver-location-update", {
                location,
                address: "Unknown",
              });
            });
        });
      }

      // console.log("Driver location updated successfully");
    } catch (err) {
      console.error("Error updating driver location:", err);
    }
  },
};
