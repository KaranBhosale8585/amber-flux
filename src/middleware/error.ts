import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';
  
  // Log the error details internally
  console.error(`[Error] Request ID: ${requestId} | Message: ${err.message} | Name: ${err.name || 'Error'}`, {
    stack: err.stack,
    details: err.details || null,
  });

  let statusCode = 500;
  let message = 'An unexpected internal server error occurred';
  let errorCode = 'INTERNAL_SERVER_ERROR';

  // Handle application specific errors (e.g. NotFound, FastAPIUnavailable, etc.)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } 
  // Handle SQLite / Drizzle DB errors
  else if (err.code && typeof err.code === 'string' && err.code.startsWith('SQLITE_')) {
    statusCode = 500;
    message = 'A database error occurred while processing the request';
    errorCode = `DATABASE_ERROR_${err.code}`;
  } 
  // Handle better-sqlite3 standard errors
  else if (err.name === 'SqliteError') {
    statusCode = 500;
    message = 'A database constraint or execution error occurred';
    errorCode = 'DATABASE_ERROR';
  }

  // Consistent response structure requested
  res.status(statusCode).json({
    success: false,
    message: message,
    error: errorCode,
  });
};
