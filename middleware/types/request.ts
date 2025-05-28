// IMPORT EXPRESS AS EXPRESS
import express from "express";
interface AuthRequest extends express.Request {
  user?: {
    _id: string;
    role: string;
  };
}

export default AuthRequest;
