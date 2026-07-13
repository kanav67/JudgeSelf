import { Router } from 'express';
import express from 'express';
import { getProblemStatusPage, getStatusPage } from './controller';

export const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const statusRoutes = Router();

statusRoutes.get([
  '/problem/:problemId/user/:userId{/:page}',
  '/problem/:problemId{/:page}'
], getProblemStatusPage);

statusRoutes.get([
  '/contest/:contestId/user/:userId{/:page}',
  '/contest/:contestId{/:page}',
  '/user/:userId{/:page}',
  '{/:page}'
], getStatusPage);

app.use('/api/status', statusRoutes);
