const express = require('express');

const { healthRoutes } = require('./health.routes');
const { problemsRoutes } = require('./problems.routes');

const routes = express.Router();

routes.use('/health', healthRoutes);
routes.use('/problems', problemsRoutes);

module.exports = { routes };