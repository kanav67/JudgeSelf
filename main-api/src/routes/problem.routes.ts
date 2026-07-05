import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { getImageById } from '../controllers/images.controller.js';
import { handleGetProblemById } from '../controllers/problem.controller.js';

const problemRoutes = express.Router();

problemRoutes.get('/:problemId', asyncHandler(handleGetProblemById));
problemRoutes.get('/:problemId/:imageId', asyncHandler(getImageById));


export { problemRoutes };