import type { Request, Response } from 'express';
import { redisClient } from '../config/redis';
import { pgPool } from '../config/postgres';
import { processLiveVerdict } from '../services/redis.service';
import { getLeaderboardPage, getUserLeaderboardRow } from '../services/leaderboard.service';
import { executeContestHardFreeze } from '../services/freeze.service';

const firstValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

export const getLeaderboard = async (req: Request, res: Response) => {
  const contestId = firstValue(req.params.contestId);
  const page = parseInt(firstValue(req.params.page) || '1');
  const pageSize = 50; //for now fixed the page size

  try {
    const { leaderboard, error } = await getLeaderboardPage(contestId, page, pageSize);
    if (error) {
      return res.status(500).json({ error });
    }

    res.json({ leaderboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to build structural response profile' });
  }
}

export async function getUserLeaderboardInfo(req: Request, res: Response): Promise<void> {
  const contestId = firstValue(req.params.contestId);
  const userId = firstValue(req.params.userId);

  if (!userId) {
    res.status(400).json({ error: 'Missing explicit user reference payload' });
    return;
  }

  try {
    const result = await getUserLeaderboardRow(contestId, userId);
    if (!result) {
      res.status(404).json({ error: 'User not found in leaderboard' });
      return;
    }
    res.json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve user leaderboard row' });
  }
}

export async function forceRecalculateUser(req: Request, res: Response): Promise<void> {
  const contestId = firstValue(req.params.contestId);
  const userId = firstValue(req.params.userId);

  try {
    const metadataHashKey = `{contest:${contestId}}:metadata`;

    // Clear targeted cache key partition
    await redisClient.hDel(metadataHashKey, userId);

    // Rebuild partition explicitly out of base structural queries
    const submissions = await pgPool.query(
      `SELECT id, problem_id, status, EXTRACT(EPOCH FROM (created_at - (SELECT start_time FROM contests WHERE id = $1)))::INTEGER as submitted_at
       FROM submissions WHERE contest_id = $1 AND user_id = $2 AND type = 'rated' ORDER BY created_at ASC`,
      [contestId, userId]
    );

    for (const sub of submissions.rows) {
      await processLiveVerdict({
        submissionId: sub.id,
        contestId,
        userId,
        problemId: sub.problem_id,
        status: sub.status,
        relativeSubmittedAt: sub.submitted_at
      });
    }

    res.json({ status: 'Success', message: 'Target profile updated dynamically' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Recalculation routine tracking anomaly encountered' });
  }
}

export async function forceRecalculateContest(req: Request, res: Response): Promise<void> {
  const contestId = firstValue(req.params.contestId);

  try {
    //todo check if contest is valid or not and is not currently active

    await executeContestHardFreeze(contestId);

    res.json({ status: 'Success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to recalculate contest' });
  }
}