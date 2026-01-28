import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      const errors = error.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }
  };
};
