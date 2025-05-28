import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { connectDB } from "./db/db";
import errorHandler from "./middleware/errorHandler";
import { router } from "./routes/index";
import { AuthSocket } from "./types/socket_types";
import SocketConnection from "./models/wsModel";
import User from "./models/userModel";
import { setupSocketHandlers } from "./services/socketHandlers";
import geohash from "ngeohash";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import redis from "redis";
import auth from "./middleware/auth";
// import locationRouter from "./routes/locationRoute";



const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());
app.use(auth);
app.use("/api", router);
app.use(errorHandler);
app.use(express.static(path.join("./", "public")));

connectDB()
  .then(() => {
    // Creating HTTP SERVER
    const server = http.createServer(app);

    // Creating SocketIO Server
    const io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Authentication middleware for Socket.IO
    io.use((socket: AuthSocket, next) => {
      const token = socket.handshake.auth.token;
      console.log('token', token);

      if (token) {
        jwt.verify(token, JWT_SECRET as string, (err: any, decoded: any) => {
          if (err) {
            console.log("JWT verification failed:", err);
            return next(new Error("Authentication error"));
          } else {
            console.log("decoded", decoded);
            socket.user = decoded._id;
            next();
          }
        });
      } else {
        next(new Error("Authentication error"));
      }
    });

    // Set up centralized socket handlers
    setupSocketHandlers(io);

    // Make io available to express routes
    app.locals.io = io;

    // Listen to HTTP server
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

// Helper function for processing driver location
async function processDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  const precision = 7; // Adjust precision as needed
  const geohashCode = geohash.encode(latitude, longitude, precision);

  // Update driver location in DB
  try {
    await SocketConnection.updateOne(
      { userId: driverId },
      {
        $set: {
          location: {
            latitude,
            longitude
          },
          geohash: geohashCode
        }
      }
    );
  } catch (error) {
    console.error("Error updating driver location:", error);
  }
}