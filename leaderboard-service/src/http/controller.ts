import type { Request, Response } from 'express';
import { recalculateLiveUserScore, getLeaderboardPage, getUserLeaderboardRow } from '../services/leaderboard.service';
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
    //todo check if contest is valid or not and is not currently active
    await recalculateLiveUserScore(contestId, userId);

    res.json({ status: 'Success', message: 'User leaderboard updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to recalculate user' });
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