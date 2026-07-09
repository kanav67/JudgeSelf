import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import z from 'zod';

const authRoutes = express.Router();

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    });

authRoutes.post('/login', asyncHandler(AuthController.loginUser));
authRoutes.post('/signup', asyncHandler(AuthController.registerUser));
authRoutes.get('/refresh-token', asyncHandler(AuthController.refreshToken));

authRoutes.use(authenticate);

authRoutes.get('/logout', asyncHandler(AuthController.logoutUser));
authRoutes.post('/changepassword', asyncHandler(AuthController.changePassword));

export { authRoutes };