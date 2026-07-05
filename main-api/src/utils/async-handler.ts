import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';

export const asyncHandler = (fn: (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};