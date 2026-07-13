import express from 'express';

import { StatusController } from '../controllers/status.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const statusRoutes = express.Router();

statusRoutes.get([
  '/problem/:problemId/user/:userId{/:page}',
  '/problem/:problemId{/:page}'
], asyncHandler(StatusController.getProblemStatusPage));

statusRoutes.get([
  '/contest/:contestId/user/:userId{/:page}',
  '/contest/:contestId{/:page}'
], asyncHandler(StatusController.getContestStatusPage));

statusRoutes.get('/submission/:submissionId', authenticate, asyncHandler(StatusController.getSubmissionById));

statusRoutes.get('{/:page}', asyncHandler(StatusController.getStatusPage));

export { statusRoutes };