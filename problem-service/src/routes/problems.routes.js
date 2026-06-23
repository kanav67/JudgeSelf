const express = require('express');
const { asyncHandler } = require('../utils/async-handler');

const {
  createProblemImport,
  getProblemById,
  testEndpoint
} = require('../controllers/problems.controller');

const problemsRoutes = express.Router();

problemsRoutes.post('/import', asyncHandler(createProblemImport));
problemsRoutes.get('/test', asyncHandler(testEndpoint));
problemsRoutes.get('/:problemId', asyncHandler(getProblemById));


module.exports = { problemsRoutes };