export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', public details: any = null) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class FastAPIUnavailableError extends AppError {
  constructor(message: string = 'FastAPI document analysis service is unavailable') {
    super(message, 503, 'FASTAPI_UNAVAILABLE');
  }
}

export class FastAPIInvalidResponseError extends AppError {
  constructor(message: string = 'FastAPI document analysis service returned an invalid response') {
    super(message, 502, 'FASTAPI_INVALID_RESPONSE');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', public details: any = null) {
    super(message, 500, 'DATABASE_ERROR');
  }
}
