import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http.js';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, details: error.details });
  }

  console.error(error);
  return res.status(500).json({ message: 'Unexpected server error' });
};
