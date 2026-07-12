import { pgPool } from '../config/postgres';
import { executeContestHardFreeze } from '../services/freeze.service';

let intervalId: NodeJS.Timeout;

export const StartFreezeTask: () => void = () => {
  checkForFinishedContests();
  setInterval(async () => {
    try {
      await checkForFinishedContests();
    } catch (error) {
      console.error('Freeze cron failed with error:', error);
    }
  }, 60000);
}

const checkForFinishedContests = async () => {
  const activeContestsQuery = `
        SELECT id FROM contests 
        WHERE leaderboard_frozen = false AND end_time < NOW()
      `;
  const res = await pgPool.query(activeContestsQuery);

  for (const contest of res.rows) {
    if (await hasPendingSubmissions(contest.id)) continue;

    await executeContestHardFreeze(contest.id);
  }
}

const hasPendingSubmissions = async (contestId: string): Promise<boolean> => {
  const pendingQuery = `
        SELECT COUNT(*) FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE p.contest_id = $1 AND s.status IN ('QUEUE') 
      `;
  const pendingRes = await pgPool.query(pendingQuery, [contestId]);
  const pendingCount = parseInt(pendingRes.rows[0].count, 10);
  return pendingCount > 0;
}
