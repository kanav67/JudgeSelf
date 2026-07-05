import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

import { env } from '../config/env';
import { changeUserPassword, checkEmailExists, checkUsernameExists, createUser, getUserByEmail, getUserById, getUserByUsername } from '../repositories/user.repository';
import type { DecodedToken } from '../middleware/auth';

const ACCESS_TOKEN_EXPIRATION = '5m';
const REFRESH_TOKEN_EXPIRATION = '7d';

export const loginUser = async (request: Request, response: Response) => {
  const { username, password } = request.body as { username: string; password: string };

  const isEmail = username.includes('@');

  var user;
  if (isEmail) {
    user = await getUserByEmail(username);
  } else {
    user = await getUserByUsername(username);
  }

  if (!user) {
    return response.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = {
    id: user.id,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, env.jwtAccessTokenSecret as string, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });

  const refreshToken = jwt.sign(payload, env.jwtRefreshTokenSecret as string, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });

  //todo save refresh token to redis/database for future validation and revocation if needed
  //refresh token as cookie
  //ensure to make the same changes in this as in refreshToken function
  response.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseToMilliseconds(REFRESH_TOKEN_EXPIRATION),
  });

  return response.status(200).json({ accessToken });
};

export const logoutUser = async (_request: Request, response: Response) => {
  //clear refresh token cookie
  response.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return response.status(200).json({ message: 'Logged out successfully' });
}

export const checkUsernameAvailability = async (request: Request, response: Response) => {
  const { username } = request.query as { username: string };

  if (!username) {
    return response.status(400).json({ error: 'Username is required' });
  }

  const user = await checkUsernameExists(username);

  if (user) {
    return response.status(200).json({ available: false });
  }

  return response.status(200).json({ available: true });
};

export const registerUser = async (request: Request, response: Response) => {
  const { username, email, password } = request.body as { username: string; email: string; password: string };

  if (!username || !email || !password) {
    return response.status(400).json({ error: 'Username, email and password are required' });
  }

  const usernameExists = await checkUsernameExists(username);
  if (usernameExists) {
    return response.status(400).json({ error: 'Given username is already taken' });
  }
  
  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    return response.status(400).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await createUser(username, email, passwordHash);

  if (!newUser) {
    return response.status(500).json({ error: 'Failed to create user' });
  }

  return response.status(201).json({ message: 'User registered successfully', userId: newUser.id });
};

export const changePassword = async (request: Request, response: Response) => {
  const { oldPassword, newPassword } = request.body as { oldPassword: string; newPassword: string };
  //even tho user is already logged in, as a precaution ask for old password to verify identity

  if (!oldPassword || !newPassword) {
    return response.status(400).json({ error: 'Old password and new password are required' });
  }

  const { id } = (request as any).user as DecodedToken;
  const user = await getUserById(id);

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    return response.status(401).json({ error: 'Old password is incorrect' });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await changeUserPassword(user.id, newPasswordHash);

  return response.status(200).json({ message: 'Password changed successfully' });
};

export const refreshToken = async (request: Request, response: Response) => {
  const refreshToken = request.cookies.refreshToken;

  if (!refreshToken) {
    return response.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshTokenSecret as string) as { id: string; username: string };

    const payload = {
      id: decoded.id,
      username: decoded.username,
    };

    const newAccessToken = jwt.sign(payload, env.jwtAccessTokenSecret as string, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    });

    return response.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    //clear cookie if refresh token is invalid
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return response.status(401).json({ error: 'Invalid refresh token' });
  }
};

function parseToMilliseconds(timeStr : string): number {
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
