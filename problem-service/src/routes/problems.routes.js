const express = require('express');

const {
  createProblemImport,
  getProblemById,
} = require('../controllers/problems.controller');

const problemsRoutes = express.Router();

problemsRoutes.post('/import', createProblemImport);
problemsRoutes.get('/:problemId', getProblemById);

module.exports = { problemsRoutes };