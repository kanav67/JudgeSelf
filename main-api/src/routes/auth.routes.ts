import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { changePassword, loginUser, logoutUser, refreshToken, registerUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const authRoutes = express.Router();

authRoutes.post('/login', asyncHandler(loginUser));
authRoutes.get('/signup', asyncHandler(registerUser));

authRoutes.use(authenticate);

authRoutes.get('/logout', asyncHandler(logoutUser));
authRoutes.post('/changepassword', asyncHandler(changePassword));
authRoutes.get('/refresh-token', asyncHandler(refreshToken));

export { authRoutes };