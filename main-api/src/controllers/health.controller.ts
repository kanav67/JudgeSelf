import type { Request, Response } from 'express';

export const getHealth = async (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
};
