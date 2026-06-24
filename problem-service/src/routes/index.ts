import express from 'express';

import { healthRoutes } from './health.routes.js';
import { problemsRoutes } from './problems.routes.js';

const routes = express.Router();

routes.use('/health', healthRoutes);
routes.use('/problems', problemsRoutes);

export { routes };
