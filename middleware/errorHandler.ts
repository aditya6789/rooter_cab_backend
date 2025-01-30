import { Request, Response, NextFunction } from "express";
import { DEBUG_MODE } from "../config/index";
import Joi from "joi";
import CustomErrorHandler from "../services/customErrorHandler";

const { ValidationError } = Joi;

interface Error {
  status?: number;
  message?: string;
}

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let statusCode = 500;
  let data = {
    message: "Internal Error",
    ...(DEBUG_MODE === "true" && { originalErr: err.message }),
  };

  if (err instanceof ValidationError) {
    statusCode = 422;
    data = {
      message: err.message,
    };
  }

  if (err instanceof CustomErrorHandler) {
    statusCode = err.status || 500;
    data = {
      message: err.message || "An error occurred",
    };
  }

  return res.status(statusCode).json(data);
};

export default errorHandler;
