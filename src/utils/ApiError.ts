class ApiError extends Error {
  statusCode: number;
  errors: any[];

  constructor(statusCode: number, message = "Something went wrong", errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "ApiError";

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
