import express from 'express';

import { LeaderboardController } from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const leaderboardRoutes = express.Router();

leaderboardRoutes.get('/:contestId/user/:userId', asyncHandler(LeaderboardController.getUserLeaderboardInfo));
leaderboardRoutes.get('/:contestId{/:page}', asyncHandler(LeaderboardController.getLeaderboard));

leaderboardRoutes.post('/:contestId/recalculate/user/:userId', authenticate, asyncHandler(LeaderboardController.forceRecalculateUser));
leaderboardRoutes.post('/:contestId/recalculate/contest', authenticate, asyncHandler(LeaderboardController.forceRecalculateContest));

export { leaderboardRoutes };