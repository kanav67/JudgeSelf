import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { getHealth } from '../controllers/health.controller.js';

const healthRoutes = express.Router();

healthRoutes.get('/', asyncHandler(getHealth));

export { healthRoutes };