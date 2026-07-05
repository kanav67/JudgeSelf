import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../middleware/auth.js';
import { handleCreateContest, handleGetContest } from '../controllers/contest.controller.js';
import { handleGetProblem, handleGetProblemById } from '../controllers/problem.controller.js';
import { getImage, getImageById } from '../controllers/images.controller.js';

const contestRoutes = express.Router();

contestRoutes.post('/create', authenticate, handleCreateContest);
contestRoutes.get('/:id', handleGetContest);

//deleted problems
contestRoutes.get('/:contestId/hidden/:problemId', asyncHandler(handleGetProblemById));
contestRoutes.get('/:contestId/hidden/:problemId/:imageId', asyncHandler(getImageById));

contestRoutes.get('/:contestId/:problemIndex', handleGetProblem);
contestRoutes.get('/:contestId/:problemIndex/:imageId', asyncHandler(getImage));

export { contestRoutes };