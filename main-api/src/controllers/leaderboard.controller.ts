import type { Request, Response } from 'express';

import { env } from '../config/env.js';
import { ContestRepository } from '../repositories/contest.repository.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { firstValue } from '../utils/req-extract.js';
import { proxyFetch } from '../utils/proxy-fetch.js';

const leaderboardBaseUrl = env.leaderboardServiceUrl.replace(/\/$/, '');

const getLeaderboard = async (req: Request, res: Response) => {
  const contestId = firstValue(req.params.contestId);
  const page = firstValue(req.params.page);
  const pageSegment = page ? `/${page}` : '';

  if (!contestId) {
    return res.status(400).json({ message: 'Contest id is required' });
  }

  const result = await proxyFetch(`${leaderboardBaseUrl}/api/leaderboard/${contestId}${pageSegment}`);
  return res.status(result.status).json(result.body);
};

const getUserLeaderboardInfo = async (req: Request, res: Response) => {
  const contestId = firstValue(req.params.contestId);
  const userId = firstValue(req.params.userId);
  const page = firstValue(req.params.page);
  const pageSegment = page ? `/${page}` : '';

  if (!contestId || !userId) {
    return res.status(400).json({ message: 'Contest id and user id are required' });
  }

  const result = await proxyFetch(`${leaderboardBaseUrl}/api/leaderboard/${contestId}/user/${userId}${pageSegment}`);

  return res.status(result.status).json(result.body);
};

const forceRecalculateUser = async (req: Request, res: Response) => {
  const contestId = firstValue(req.params.contestId);
  const userId = firstValue(req.params.userId);
  const authUserId = (req as AuthenticatedRequest).user.id;

  if (!contestId || !userId) {
    return res.status(400).json({ message: 'Contest id and user id are required' });
  }

  if (!await isContestOwner(contestId, authUserId)) {
    return res.status(403).json({ message: 'You are not authorized to recalculate this contest' });
  }


  const result = await proxyFetch(
    `${leaderboardBaseUrl}/api/leaderboard/${contestId}/recalculate/user/${userId}`,
    { method: 'POST' },
  );

  return res.status(result.status).json(result.body);
};

const forceRecalculateContest = async (req: Request, res: Response) => {
  const contestId = firstValue(req.params.contestId);
  const authUserId = (req as AuthenticatedRequest).user.id;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest id is required' });
  }

  if (!await isContestOwner(contestId, authUserId)) {
    return res.status(403).json({ message: 'You are not authorized to recalculate this contest' });
  }

  const result = await proxyFetch(
    `${leaderboardBaseUrl}/api/leaderboard/${contestId}/recalculate/contest`,
    { method: 'POST' },
  );

  return res.status(result.status).json(result.body);
};

const isContestOwner = async (contestId: string, userId: string): Promise<boolean> => {
  const contest = await ContestRepository.getContestById(contestId, false);
  if (!contest) {
    return false;
  }

  return contest.owner_id === userId;
};

export const LeaderboardController = {
  getLeaderboard,
  getUserLeaderboardInfo,
  forceRecalculateUser,
  forceRecalculateContest,
};
