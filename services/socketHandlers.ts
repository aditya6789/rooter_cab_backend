import { Server as SocketIOServer } from "socket.io";
import { AuthSocket, Location } from "../types/socket_types";
import SocketConnection, { ISocketConnection } from "../models/wsModel";
import User from "../models/userModel";
import axios from "axios";
import Ride from "../models/rideModel";
import Trip from "../models/tripModel";
import { generateOTP } from "../utils/helpers";
import { Make, Vehicle } from "../models/vechileModel";
import { Types } from "mongoose";
import { VehicleModel } from "../models/vechileModel";
import { getLocation } from "./locationService";
// Helper functions
const findDriverById = async (id: string): Promise<ISocketConnection | null> => {
  return await SocketConnection.findOne({ userId: id, userType: "driver", isActive: true }).exec();
};

// Socket handlers for rides
export const setupSocketHandlers = (io: SocketIOServer) => {
  // Handle socket connection
  io.on("connection", (socket: AuthSocket) => {
    console.log(`User connected: ${socket.user}`);

    // Handle customer registration
    socket.on("customer-register", async () => {
      // console.log("Customer registering:", data.customerId);
      console.log("socket.user", socket.user);
      const user = await User.findOne({ _id: socket.user });

      // Clean up any existing connections
      await SocketConnection.deleteMany({ userId: socket.user });
      await SocketConnection.deleteMany({ socketId: socket.id });


      // get location from redis  
      const location = await getLocation(user?._id?.toString() ?? "");
      // console.log("location", location);
      if (user) {
        await new SocketConnection({
          socketId: socket.id,
          userId: user._id,
          userType: "customer",
          location: {
            latitude: location?.lat,
            longitude: location?.lng
          }
        }).save();

        socket.emit("pong", {
          message: "Customer connected",
          user: user
        });
        console.log("Customer connected:", socket.id);
      }
    });

    // Handle driver registration
    socket.on(
      "register",
      async () => {
        const user = await User.findOne({ _id: socket.user });
        if (user) {
          // Clean up existing connections
          await SocketConnection.deleteMany({ userId: user._id });
          await SocketConnection.deleteMany({ socketId: socket.id });

          const vehicle = await Vehicle.findOne({ user: user._id });
          const vehicleModel = await VehicleModel.findOne({ _id: vehicle?.model });
          const vehicleMake = await Make.findOne({ _id: vehicleModel?.make });

          // console.log("vehicleMake", vehicleMake);
          // get location from redis
          const location = await getLocation(user.id.toString());
          const socketConnection = await new SocketConnection({
            socketId: socket.id,
            userId: user._id,
            location: {
              latitude: location?.lat,
              longitude: location?.lng
            },
            userType: user.userType,
            vehicleType: vehicleMake?.vehicleType,
            available: true,
          }).save();

          console.log("Driver connected:", socket.id);
          console.log("Driver location:", location);
        }
      }
    );

    // Handle location updates
    socket.on(
      "location-update",
      async (data: { location: Location; driverId: string }) => {
        const { location, driverId } = data;

        try {
          // Update driver location in MongoDB
          await SocketConnection.updateOne(
            { userId: driverId },
            { $set: { location } }
          );

          // Find the ride associated with the driver
          const ride = await Ride.findOne({
            driverId: driverId,
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

          // Get address from coordinates
          try {
            const geocodeResponse = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyCdXyAkWjkhUlWXBbpkieWRi2OV47AbVFE`
            );
            const address = geocodeResponse.data.results[0]?.formatted_address || "Unknown";

            // Find and notify the customer
            const customerConnection = await SocketConnection.findOne({
              userId: ride.customerId,
            });

            if (customerConnection) {
              const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
              if (customerSocket) {
                customerSocket.emit("driver-location-update", { location, address });
              }
            }
          } catch (error) {
            console.error("Error getting address:", error);
            // Still send the location update without address
            io.to(ride.customerId.toString()).emit("driver-location-update", {
              location,
              address: "Unknown",
            });
          }
        } catch (error) {
          console.error("Error updating driver location:", error);
        }
      }
    );

    // Handle ride request acceptance
    socket.on("ride-accepted", async (data: { rideId: string }) => {
      console.log("ride-accepted", data);
      try {
        const ride = await Ride.findById(data.rideId);
        if (!ride || ride.status !== "pending") {
          return;
        }
        console.log("ride-accepted ride", ride);

        // Get driver information
        const driverSocketObj = await SocketConnection.findOne({
          socketId: socket.id,
          userType: "driver"
        });
        console.log('driverSocketObj', driverSocketObj);

        if (!driverSocketObj) {
          return;
        }

        const driverUser = await User.findById(driverSocketObj.userId);
        const vehicle = await Vehicle.findOne({ user: driverSocketObj.userId }).populate('model');
        console.log('vehicle', vehicle);
        console.log('driverUser', driverUser);

        if (!driverUser || !vehicle) {
          return;
        }

        // Update ride status
        const otp = generateOTP();
        const updatedRide = await Ride.findOneAndUpdate(
          { _id: data.rideId },
          {
            driverInfo: {
              fullName: driverUser.full_name,
              email: driverUser.email,
              phone: driverUser.phone!,
              profileImage: driverUser.profile_image ?? "",
              vehicleName: vehicle.model.name,
              vehicleNumber: vehicle.vehicle_number,
              driverId: driverUser._id,
            },
            status: "accepted",
            driverId: driverSocketObj.userId,
            otp: otp,
          },
          { new: true }
        );
        console.log('updatedRide', updatedRide);

        // Update trip
        await Trip.findOneAndUpdate(
          { rideId: data.rideId },
          { driverId: driverSocketObj.userId },
          { new: true }
        );

        // Update driver availability
        await SocketConnection.updateMany(
          { userId: driverSocketObj.userId },
          { available: false }
        );

        // Find and notify the customer
        const customerConnection = await SocketConnection.findOne({
          userId: ride.customerId,
        });

        console.log("customerConnection", customerConnection);

        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          console.log("customerSocket", customerSocket);
          if (customerSocket) {
            console.log("Emitting ride accepted to customer");

            // vehicle number
            const vehicle = await Vehicle.findOne({ user: driverSocketObj.userId });
            const vehicleNumber = vehicle?.vehicle_number;
            const vehicleModel = await VehicleModel.findOne({ _id: vehicle?.model });
            const vehicleName = vehicleModel?.name;
            customerSocket.emit("ride-accepted", {
              ride: {
                ...updatedRide?.toObject(),
                driverInfo: {
                  ...updatedRide?.driverInfo,
                  driverId: driverSocketObj.userId,
                  vehicleNumber: vehicleNumber,
                  vehicleName: vehicleName
                },
                otp: otp
              },
              message: "Ride accepted by driver",
              driverLocation: driverSocketObj.location
            });
          }
        }

        // Send response back to driver
        socket.emit("ride-acceptance-confirmed", {
          success: true,
          message: "Ride accepted successfully",
          ride: updatedRide,
          otp: otp,
          driverLocation: driverSocketObj.location
        });

      } catch (error) {
        console.error("Error accepting ride:", error);
        socket.emit("ride-acceptance-confirmed", {
          success: false,
          message: "Error accepting ride"
        });
      }
    });

    // Handle ride start (OTP verification)
    socket.on("verify-otp", async (data: { rideId: string, otp: string }) => {
      try {
        const ride = await Ride.findById(data.rideId);
        if (!ride || ride.status !== "accepted") {
          socket.emit("otp-verification", { success: false, message: "Invalid ride or status" });
          return;
        }

        if (ride.otp !== data.otp) {
          socket.emit("otp-verification", { success: false, message: "Invalid OTP" });
          return;
        }

        // Update ride status
        await Ride.findByIdAndUpdate(data.rideId, { status: "ongoing" });

        // Notify customer and driver
        const customerConnection = await SocketConnection.findOne({
          userId: ride.customerId,
        });

        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          if (customerSocket) {
            customerSocket.emit("ride-started", {
              message: "OTP verified successfully. Your ride has started.",
              rideId: ride._id,
            });
          }
        }

        socket.emit("otp-verification", {
          success: true,
          message: "OTP verified successfully. Ride started."
        });
      } catch (error) {
        console.error("Error verifying OTP:", error);
        socket.emit("otp-verification", {
          success: false,
          message: "An error occurred during verification"
        });
      }
    });

    // Handle ride completion
    socket.on("complete-ride", async (data: { rideId: string }) => {
      try {
        const ride = await Ride.findById(data.rideId);
        if (!ride || !["ongoing", "accepted"].includes(ride.status)) {
          socket.emit("ride-completion", {
            success: false,
            message: "Invalid ride or status"
          });
          return;
        }

        // Update ride status
        await Ride.findByIdAndUpdate(data.rideId, { status: "completed" });

        // Update trip
        await Trip.findOneAndUpdate(
          { rideId: data.rideId },
          { tripCompleted: true },
          { new: true }
        );

        // Update driver availability
        await SocketConnection.updateMany(
          { userId: ride.driverInfo?.driverId },
          { available: true }
        );

        // Notify customer
        const customerConnection = await SocketConnection.findOne({
          userId: ride.customerId,
        });

        if (customerConnection) {
          const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
          if (customerSocket) {
            customerSocket.emit("ride-completed", { rideId: ride._id });
          }
        }

        socket.emit("ride-completion", {
          success: true,
          message: "Ride completed successfully"
        });
      } catch (error) {
        console.error("Error completing ride:", error);
        socket.emit("ride-completion", {
          success: false,
          message: "An error occurred during completion"
        });
      }
    });

    // // Handle ride cancellation
    // socket.on("cancel-ride", async (data: {
    //   rideId: string,
    //   cancelReason: string,
    //   isDriver: boolean
    // }) => {
    //   try {
    //     const ride = await Ride.findById(data.rideId);
    //     if (!ride || !["pending", "accepted"].includes(ride.status)) {
    //       socket.emit("ride-cancellation", {
    //         success: false,
    //         message: "Invalid ride or status"
    //       });
    //       return;
    //     }

    //     // Update ride status
    //     await Ride.findByIdAndUpdate(data.rideId, { status: "cancelled" });

    //     // Update trip
    //     await Trip.findOneAndUpdate(
    //       { rideId: data.rideId },
    //       { tripCancelled: true },
    //       { new: true }
    //     );

    //     // Update driver availability if driver exists
    //     if (ride.driverInfo?.driverId) {
    //       await SocketConnection.updateMany(
    //         { userId: ride.driverInfo?.driverId },
    //         { available: true }
    //       );
    //     }

    //     // Notify the other party
    //     if (data.isDriver) {
    //       // Notify customer
    //       const customerConnection = await SocketConnection.findOne({
    //         userId: ride.customerId,
    //       });

    //       if (customerConnection) {
    //         const customerSocket = io.sockets.sockets.get(customerConnection.socketId);
    //         if (customerSocket) {
    //           customerSocket.emit("ride-cancelled", {
    //             message: "Ride cancelled by driver",
    //             cancelReason: data.cancelReason,
    //           });
    //         }
    //       }
    //     } else {
    //       // Notify driver
    //       const driverConnection = await SocketConnection.findOne({
    //         userId: ride.driverInfo?.driverId,
    //       });

    //       if (driverConnection) {
    //         const driverSocket = io.sockets.sockets.get(driverConnection.socketId);
    //         if (driverSocket) {
    //           driverSocket.emit("ride-cancelled", {
    //             message: "Ride cancelled by customer",
    //             cancelReason: data.cancelReason,
    //           });
    //         }
    //       }
    //     }

    //     socket.emit("ride-cancellation", {
    //       success: true,
    //       message: "Ride cancelled successfully"
    //     });
    //   } catch (error) {
    //     console.error("Error cancelling ride:", error);
    //     socket.emit("ride-cancellation", {
    //       success: false,
    //       message: "An error occurred during cancellation"
    //     });
    //   }
    // });

    // Handle socket disconnection
    socket.on("disconnect", async () => {
      await SocketConnection.deleteOne({ socketId: socket.id });
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}; 