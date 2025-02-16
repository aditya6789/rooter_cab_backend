import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { connectDB } from "./db/db";
import errorHandler from "./middleware/errorHandler";
import { router } from "./routes/index";
import { AuthSocket, CustomSocket, Location } from "./types/socket_types";
import { createClient } from "redis";
import SocketConnection from "./models/wsModel";
import User from "./models/userModel";
import { RideController } from "./controller/rideController";
import { updateDriverLocation } from "./services/redisService";
// import kafka from "kafka-node";
import geohash from "ngeohash";
import { getTokenFromRequest } from "./services/jwtService";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import auth from "./middleware/auth";
import { emit } from "process";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());
// app.use(auth);
app.use("/api", router);
app.use(errorHandler);
app.use(express.static(path.join("./", "public")));

// Kafka Producer Setup
// const Producer = kafka.Producer;
// const client = new kafka.KafkaClient();
// const producer = new Producer(client);

// producer.on("ready", () => {
//   console.log("Kafka Producer is connected and ready.");
// });

// producer.on("error", (err) => {
//   console.error("Kafka Producer error:", err);
// });

connectDB()
  .then(() => {
    // Creating HTTP SERVER
    const server = http.createServer(app);

    // Createing SocketIO Server
    const io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Authentication middleware for Socket.IO
    io.use((socket: AuthSocket, next) => {
      const token = socket.handshake.auth.token;

      if (token) {
        jwt.verify(token, JWT_SECRET as string, (err: any, decoded: any) => {
          if (err) {
            console.log("JWT verification failed:", err);
            return next(new Error("Authentication error"));
          } else {
            socket.user = decoded.username;
            next();
          }
        });
      } else {
        next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket: AuthSocket) => {
      console.log(`User connected: ${socket.user}`);

      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          if (data.driverId && data.latitude && data.longitude) {
            // Process driver location update
            processDriverLocation(data.driverId, data.latitude, data.longitude);
          }

          console.log(message);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });

      socket.on("customer-register", async (data: { customerId: string }) => {
        console.log(data.customerId);
        const user = await User.findOne({ _id: data.customerId });
        await SocketConnection.deleteMany({ userId: data.customerId });
        
        await SocketConnection.deleteMany({ socketId: socket.id });
        const socketconnect = await SocketConnection.findOne({ socketId: socket.id });
        if (socketconnect) {
          await socketconnect.deleteOne({ socketId: socket.id });
        }
        
        if (user) {
          await new SocketConnection({
            socketId: socket.id,
            userId: user._id,
            userType: "customer",
          }).save();
          console.log("customer Connected", socket.id);
        }
      });

      socket.on(
        "register",
        async (data: {
          role: string;
          location: Location;
          driverId: string;
          vehicleType: string;
        }) => {
          if (data.role === "driver") {
            const user = await User.findOne({ _id: data.driverId });
            if (user) {
              // Deleting Previous Entries
              await SocketConnection.deleteMany({ userId: user._id });
              await SocketConnection.deleteMany({ socketId: socket.id });
              const socketconnect = await SocketConnection.findOne({ socketId: socket.id });
              if (socketconnect) {
                await socketconnect.deleteOne({ socketId: socket.id });
              }
              await new SocketConnection({
                socketId: socket.id,
                userId: user._id,
                location: data.location,
                userType: data.role,
                vehicleType: data.vehicleType,
              }).save();

              console.log("Driver Connected:", socket.id);
              console.log("Driver Location:", data.location);
            }
          }
        }
      );

      // Add Kafka Support
      // // Import Kafka producer
      // import { producer } from '../kafka/producer';

      // socket.on(
      //   "location-update",
      //   async (data: { location: Location; driverId: string }) => {
      //     console.log("Location update received");
      //     const { location, driverId } = data;

      //     try {
      //       // Send location update to Kafka
      //       await producer.send({
      //         topic: 'driver-location-updates',
      //         messages: [
      //           {
      //             key: driverId,
      //             value: JSON.stringify({
      //               driverId,
      //               latitude: location.latitude,
      //               longitude: location.longitude,
      //               timestamp: new Date().toISOString()
      //             })
      //           },
      //         ],
      //       });
      //       console.log("Location update sent to Kafka");

      //       // Continue with existing logic
      //       RideController.update_driver_location(io, driverId, location);
      //     } catch (error) {
      //       console.error("Error sending location update to Kafka:", error);
      //     }
      //   }
      // );

      socket.on(
        "location-update",
        (data: { location: Location; driverId: string }) => {
          console.log("updated");
          const { location, driverId } = data;
         
          RideController.update_driver_location(io, driverId, location);
        }
      );
      // socket.on("available-drivers", (data) => {
      //   console.log("Driver location update received:", data);
      //   // Handle the event (e.g., update the UI, notify the user, etc.)
      // });

      socket.on("disconnect", async () => {
        await SocketConnection.deleteOne({ socketId: socket.id });
        console.log("Client disconnected");
      });
      socket.on("ride-completed", (data) => {
        console.log("Ride completed:", data);
        // Handle the event (e.g., update the UI, notify the user, etc.)
      });
    });

    app.locals.io = io;

    // Listen TO http server

    server
      .listen(PORT, "0.0.0.0", () => {
        console.log(`Server connected to port ${PORT}`);
      })
      .on("error", (err) => {
        console.error(`Error starting the server: ${err.message}`);
      });
  })
  .catch((err) => {
    console.error(`Error connecting to the database: ${err.message}`);
  });

async function processDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  const precision = 7; // Adjust precision as needed
  const geohashCode = geohash.encode(latitude, longitude, precision);

  // Prepare message for Kafka
  const payloads = [
    {
      topic: "driver-locations",
      messages: JSON.stringify({
        driverId,
        latitude,
        longitude,
        geohash: geohashCode,
        timestamp: Date.now(),
      }),
    },
  ];

  // Send message to Kafka
  // producer.send(payloads, (err, data) => {
  //   if (err) {
  //     console.error("Error sending message to Kafka:", err);
  //   } else {
  //     console.log(`Location update for driver ${driverId} sent to Kafka.`);
  //   }
  // });
}
