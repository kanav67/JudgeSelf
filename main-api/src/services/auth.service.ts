import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import type { UserData } from "../repositories/user.repository";
import { UserRepository } from "../repositories/user.repository";

//todo move to config
const ACCESS_TOKEN_EXPIRATION = '5m';
export const REFRESH_TOKEN_EXPIRATION = '7d';

interface LoginResponse {
    userId: string;
    accessToken: string;
    refreshToken: string;
}

export const AuthService = {
    loginUserByEmail: async (email: string, password: string): Promise<LoginResponse | null> => {
        const user = await UserRepository.getUserByEmail(email);
        if (!user) return null;

        const isPasswordValid = user && (await bcrypt.compare(password, user.password_hash));
        if (!isPasswordValid) return null;

        return loginUser(user, password);
    },
    loginUserByUsername: async (username: string, password: string): Promise<LoginResponse | null> => {
        const user = await UserRepository.getUserByUsername(username);
        if (!user) return null;

        return loginUser(user, password);
    },
    registerUser: async (username: string, email: string, password: string): Promise<{ user?: UserData, err?: string }> => {
        const emailExists = await UserRepository.checkEmailExists(email);
        if (emailExists) {
            return { err: 'An account with that email already exists' };
        }

        const usernameExists = await UserRepository.checkUsernameExists(username);
        if (usernameExists) {
            return { err: 'Given username is already taken' };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await UserRepository.createUser(username, email, passwordHash);

        return { user };
    },
    changePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<{ err?: string }> => {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            return { err: 'User not found' };
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isOldPasswordValid) {
            return { err: 'Old password is incorrect' };
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await UserRepository.changeUserPassword(userId, newPasswordHash);

        return {};
    },
    refreshAccessToken: async (refreshToken: string): Promise<{ accessToken?: string, err?: string }> => {
        try {
            const decoded = jwt.verify(refreshToken, env.jwtRefreshTokenSecret as string) as { id: string; username: string };

            const payload = {
                id: decoded.id,
                username: decoded.username,
            };

            const newAccessToken = jwt.sign(payload, env.jwtAccessTokenSecret as string, {
                expiresIn: ACCESS_TOKEN_EXPIRATION,
            });

            return { accessToken: newAccessToken };
        } catch (err) {
            return { err: 'Invalid refresh token' };
        }
    }
}

const loginUser = async (user: UserData, password: string): Promise<LoginResponse | null> => {
    const isPasswordValid = user && (await bcrypt.compare(password, user.password_hash));
    if (!isPasswordValid) return null;

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

    return {
        userId: user.id,
        accessToken,
        refreshToken
    }
}