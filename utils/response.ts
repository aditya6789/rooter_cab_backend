import { ValidationError } from "express-validator";

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T | null;
  error: null;
}

interface FailureResponse {
  success: false;
  message: string;
  data: null;
  error: string | null | ValidationError[];
}

function successResponse<T>(
  message: string,
  data: T | null = null
): SuccessResponse<T> {
  return {
    success: true,
    message: message,
    data: data,
    error: null,
  };
}

function failureResponse(
  message: string,
  error: string | null | ValidationError[] = null
): FailureResponse {
  return {
    success: false,
    message: message,
    data: null,
    error: error,
  };
}

export { successResponse, failureResponse, SuccessResponse, FailureResponse };
