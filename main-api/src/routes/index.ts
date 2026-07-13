import express from 'express';

import { healthRoutes } from './health.routes.js';
import { problemRoutes } from './problem.routes.js';
import { authRoutes } from './auth.routes.js';
import { contestRoutes } from './contest.routes.js';
import { leaderboardRoutes } from './leaderboard.routes.js';
import { statusRoutes } from './status.routes.js';

const routes = express.Router();

routes.use('/health', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/contest', contestRoutes);
routes.use('/problem', problemRoutes);
routes.use('/leaderboard', leaderboardRoutes);
routes.use('/status', statusRoutes);

export { routes };
