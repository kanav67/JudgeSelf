import type { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/http-error.js';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};