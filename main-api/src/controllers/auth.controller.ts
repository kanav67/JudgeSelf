import type { Request, Response } from 'express';

import type { DecodedToken } from '../middleware/auth';
import { UserRepository } from '../repositories/user.repository';
import { AuthService, REFRESH_TOKEN_EXPIRATION } from '../services/auth.service';

const loginUser = async (request: Request, response: Response) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return response.status(400).json({ error: 'Username and password are required' });
  }

  const isEmail = username.includes('@');

  var loginResponse = null;
  if (isEmail) {
    loginResponse = await AuthService.loginUserByEmail(username, password);
  } else {
    loginResponse = await AuthService.loginUserByUsername(username, password);
  }

  if (!loginResponse) {
    return response.status(401).json({ error: 'Invalid credentials' });
  }

  //todo save refresh token to redis/database for future validation and revocation if needed
  //refresh token as cookie
  //ensure to make the same changes in this as in refreshToken function
  response.cookie('refreshToken', loginResponse.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseToMilliseconds(REFRESH_TOKEN_EXPIRATION),
  });

  return response.status(200).json({ accessToken: loginResponse.accessToken });
};

const logoutUser = async (_request: Request, response: Response) => {
  //clear refresh token cookie
  response.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return response.status(200).json({ message: 'Logged out successfully' });
};

const checkUsernameAvailability = async (request: Request, response: Response) => {
  const { username } = request.query as { username: string };

  if (!username) {
    return response.status(400).json({ error: 'Username is required' });
  }

  const user = await UserRepository.checkUsernameExists(username);

  if (user) {
    return response.status(200).json({ available: false });
  }

  return response.status(200).json({ available: true });
};

const registerUser = async (request: Request, response: Response) => {
  const { username, email, password } = request.body as { username: string; email: string; password: string };

  if (!username || !email || !password) {
    return response.status(400).json({ error: 'Username, email and password are required' });
  }

  const { user, err } = await AuthService.registerUser(username, email, password);
  if (err) {
    return response.status(400).json({ error: err });
  }

  return response.status(200).json({ message: 'User registered successfully', userId: user?.id });
};

const changePassword = async (request: Request, response: Response) => {
  const { id } = (request as any).user as DecodedToken;
  const { oldPassword, newPassword } = request.body as { oldPassword: string; newPassword: string };
  //even tho user is already logged in, as a precaution ask for old password to verify identity

  if (!oldPassword || !newPassword) {
    return response.status(400).json({ error: 'Old password and new password are required' });
  }

  const { err } = await AuthService.changePassword(id, oldPassword, newPassword);
  if (err) {
    return response.status(400).json({ error: err });
  }

  return response.status(200).json({ message: 'Password changed successfully' });
};

const refreshToken = async (request: Request, response: Response) => {
  const refreshToken = request.cookies.refreshToken;

  const { accessToken, err } = await AuthService.refreshAccessToken(refreshToken);

  if (err) {
    return response.status(401).json({ error: err });
  }

  return response.status(200).json({ accessToken });
}

export const AuthController = {
  loginUser,
  logoutUser,
  checkUsernameAvailability,
  registerUser,
  changePassword,
  refreshToken
};

function parseToMilliseconds(timeStr: string): number {
  const value = parseInt(timeStr);
  const unit = timeStr.slice(-1);

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000; // Days
    case 'h': return value * 60 * 60 * 1000;      // Hours
    case 'm': return value * 60 * 1000;           // Minutes
    case 's': return value * 1000;                // Seconds
    default: return value;                        // Fallback
  }
};
