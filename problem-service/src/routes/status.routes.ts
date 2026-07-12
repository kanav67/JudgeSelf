import express from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { getStatusPage } from '../controllers/status.controller.js';

const statusRoutes = express.Router();

statusRoutes.get([
    '/contest/:contestId/user/:userId/:page?',
    '/contest/:contestId/:page?',
    '/user/:userId/:page?',
    '/:page?'
], asyncHandler(getStatusPage));

//todo update it to express 5
// statusRoutes.get([
//     '/:contestId/user/:userId{/:page}',
//     '/:contestId{/:page}',
//     '/user/:userId{/:page}',
//     '/{/:page}'
// ], asyncHandler(getStatusPage));

export { statusRoutes };