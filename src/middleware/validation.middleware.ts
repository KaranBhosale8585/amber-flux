import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateRequest = (
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req[target]);
      // Overwrite the request object property with validated and casted values
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        // Format the message nicely for the standard error format
        const errorMsg = error.errors.map(e => e.message).join(', ');
        next(new ValidationError(errorMsg, issues));
      } else {
        next(error);
      }
    }
  };
};
