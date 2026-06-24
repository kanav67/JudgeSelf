import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';

import {
  createProblemImport,
  getProblemById,
  testEndpoint
} from '../controllers/problems.controller.js';

const problemsRoutes = express.Router();

problemsRoutes.post('/import', asyncHandler(createProblemImport));
problemsRoutes.get('/test', asyncHandler(testEndpoint));
problemsRoutes.get('/:problemId', asyncHandler(getProblemById));

export { problemsRoutes };