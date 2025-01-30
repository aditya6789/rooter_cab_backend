import express from "express";
import { Request, Response } from "express";
import { successResponse, failureResponse } from "../utils/response";
import SocketConnection from "../models/wsModel";

const socketConnectionRouter = express.Router();

// Find socket connection by userId
socketConnectionRouter.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log("userId", userId);
    
 
    
    // Find socket connection for the given userId
    const userSocket = SocketConnection.findOne({userId:userId});
    console.log("userSocket", userSocket);

    if (!userSocket) {
      return res.status(404).json(failureResponse("Socket connection not found for this user"));
    }

    res.status(200).json(successResponse("Socket connection found", {
        exist:true,
    }));

  } catch (error: any) {
    console.error("Error finding socket connection:", error);
    res.status(500).json(failureResponse(error.message));
  }
});

export default socketConnectionRouter;
