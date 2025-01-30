class CustomErrorHandler extends Error {
  public status: number;

  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, CustomErrorHandler.prototype);
  }

  static alreadyExist(message: string): CustomErrorHandler {
    return new CustomErrorHandler(409, message);
  }

  static wrongCredentials(message: string = "Username or password is wrong!"): CustomErrorHandler {
    return new CustomErrorHandler(401, message);
  }

  static unAuthorized(message: string = "Unauthorized"): CustomErrorHandler {
    return new CustomErrorHandler(401, message);
  }

  static notFound(message: string = "404 Not Found"): CustomErrorHandler {
    return new CustomErrorHandler(404, message);
  }

  static serverError(message: string = "Internal server error"): CustomErrorHandler {
    return new CustomErrorHandler(500, message);
  }
}

export default CustomErrorHandler;

