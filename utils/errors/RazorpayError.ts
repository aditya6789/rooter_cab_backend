export class RazorpayError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'RAZORPAY_ERROR') {
    super(message);
    this.name = 'RazorpayError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class RazorpayValidationError extends RazorpayError {
  constructor(message: string) {
    super(message, 400, 'RAZORPAY_VALIDATION_ERROR');
    this.name = 'RazorpayValidationError';
  }
}

export class RazorpayAuthenticationError extends RazorpayError {
  constructor(message: string) {
    super(message, 401, 'RAZORPAY_AUTH_ERROR');
    this.name = 'RazorpayAuthenticationError';
  }
}

export class RazorpayResourceNotFoundError extends RazorpayError {
  constructor(message: string) {
    super(message, 404, 'RAZORPAY_NOT_FOUND');
    this.name = 'RazorpayResourceNotFoundError';
  }
}

export class RazorpayPaymentError extends RazorpayError {
  constructor(message: string) {
    super(message, 422, 'RAZORPAY_PAYMENT_ERROR');
    this.name = 'RazorpayPaymentError';
  }
} 