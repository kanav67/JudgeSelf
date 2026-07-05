import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type DecodedToken = {
  id: string;
  username: string;
};

export interface AuthenticatedRequest extends Request {
  user: DecodedToken;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access Denied: No token provided" });
  }

  const decoded : DecodedToken | null = decodeToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Access Denied: Invalid token" });
  }

  (req as AuthenticatedRequest).user = decoded;

  next();
};

function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
  } catch (err) {
    return null;
  }
}