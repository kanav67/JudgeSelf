import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { ImageController } from '../controllers/images.controller.js';
import { ProblemController } from '../controllers/problem.controller.js';

const problemRoutes = express.Router();

problemRoutes.get('/:problemId', asyncHandler(ProblemController.getProblemById));
problemRoutes.get('/:problemId/:imageId', asyncHandler(ImageController.getImageById));


export { problemRoutes };