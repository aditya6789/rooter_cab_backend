import { Request, Response, NextFunction } from "express";
import CustomErrorHandler from "../services/customErrorHandler";
import JwtService from "../services/jwtService";

interface DecodedToken {
  _id: string;
  role: string;
  exp?: number;
  iat?: number;
}

export interface IRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

const auth = async (req: IRequest, res: Response, next: NextFunction) => {
  let authHeader = req.headers.authorization;
  // ignore login and register routes
  if (
    req.originalUrl.includes("login") ||
    req.originalUrl.includes("register") ||
    req.originalUrl.includes("validate-otp") ||
    req.originalUrl.includes("send-otp")||
    req.originalUrl.includes("driver-register")
  ) {
    console.log("req.originalUrl:", req.originalUrl);
    console.log("Skipping authentication for login and register routes");
    return next();
  }

  if (!authHeader) {
    console.log("Authorization header missing");
    return next(CustomErrorHandler.unAuthorized());
  }

  console.log("Authorization header:", authHeader);

  try {
    const token = authHeader.split(" ")[1];
    console.log("Token:", token);

    const decodedToken = JwtService.verify(token) as DecodedToken;

    if (!decodedToken || !decodedToken._id || !decodedToken.role) {
      console.log("Invalid decoded token");
      return next(CustomErrorHandler.unAuthorized());
    }

    const user = {
      _id: decodedToken._id,
      role: decodedToken.role,
    };

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      // Handle token expiration gracefully
      console.log("Token expired");
      return next(CustomErrorHandler.unAuthorized("Token expired"));
    } else {
      console.error("JWT verification error:", error);
      return next(CustomErrorHandler.unAuthorized());
    }
  }
};

export default auth;
