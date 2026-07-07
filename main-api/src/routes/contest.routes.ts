import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../middleware/auth.js';
import { ContestController } from '../controllers/contest.controller.js';
import { ProblemController } from '../controllers/problem.controller.js';
import { ImageController } from '../controllers/images.controller.js';

const contestRoutes = express.Router();

contestRoutes.post('/create', authenticate, ContestController.createContest);
contestRoutes.get('/:id', ContestController.getContest);

//deleted problems
contestRoutes.get('/:contestId/hidden/:problemId', asyncHandler(ProblemController.getProblemById));
contestRoutes.get('/:contestId/hidden/:problemId/:imageId', asyncHandler(ImageController.getImageById));

contestRoutes.get('/:contestId/:problemIndex', ProblemController.getProblem);
contestRoutes.get('/:contestId/:problemIndex/:imageId', asyncHandler(ImageController.getImage));

export { contestRoutes };