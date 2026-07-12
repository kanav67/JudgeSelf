import { pgPool } from '../config/postgres';
import { redisClient } from '../config/redis';
import { getContestLeaderboardKey, getContestMetadataKey } from './leaderboard.service';
import type { UserContestMetadata } from './redis.service';
import { computeUserScores } from './scoring.service';

export interface SubmissionRow {
  id: string;
  user_id: string;
  problem_id: string;
  status: 'AC' | 'WA' | 'TLE' | 'MLE' | 'CE' | 'RE';
  submitted_at: number;
}

export async function executeContestHardFreeze(contestId: string): Promise<void> {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    const submissionsRes: { rows: SubmissionRow[] } = await client.query(
      `SELECT s.id, s.user_id, s.problem_id, s.status, EXTRACT(EPOCH FROM (s.created_at - (SELECT start_time FROM contests WHERE id = $1)))::INTEGER as submitted_at
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE p.contest_id = $1 AND s.type = 'RATED'
       ORDER BY s.created_at ASC`,
      [contestId]
    );

    const aggregateState: Record<string, UserContestMetadata> = {};

    for (const row of submissionsRes.rows) {
      if (!aggregateState[row.user_id]) {
        aggregateState[row.user_id] = { problems: {}, processedSubmissions: [] };
      }

      if (!aggregateState[row.user_id].problems[row.problem_id]) {
        aggregateState[row.user_id].problems[row.problem_id] = [];
      }
      aggregateState[row.user_id].problems[row.problem_id].push({
        submissionId: row.id,
        relativeSubmittedAt: row.submitted_at,
        status: row.status
      });
      aggregateState[row.user_id].processedSubmissions.push(row.id);
    }

    const standings = Object.entries(aggregateState).map(([userId, meta]) => {
      const scoreData = computeUserScores(meta);
      return { userId, ...scoreData };
    });

    standings.sort((a, b) => {
      return b.score - a.score;
    });

    //clear old data
    await client.query(`DELETE FROM contest_results WHERE contest_id = $1`, [contestId]);

    const insertQuery = `
      INSERT INTO contest_results (contest_id, user_id, rank, score, problems_solved, penalty, problem_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    //todo in future, for about 10k users this should be fine. If we want absoulte performance look into COPY
    for (let i = 0; i < standings.length; i++) {
      const entry = standings[i];
      await client.query(insertQuery, [
        contestId,
        entry.userId,
        i + 1,
        entry.score,
        entry.solved,
        entry.penalty,
        JSON.stringify(entry.details)
      ]);
    }

    // Update operational metadata state parameter
    await client.query(`UPDATE contests SET leaderboard_frozen = TRUE WHERE id = $1`, [contestId]);

    await client.query('COMMIT');
    console.log(`Leaderboard frozen for contest: ${contestId}`);

    //cleanup Redis keys to free memory
    const freedKeys = await redisClient.unlink([getContestMetadataKey(contestId), getContestLeaderboardKey(contestId)]);
    console.log(`Freed ${freedKeys} keys from redis for contest: ${contestId}`);

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to freeze leaderboard for contest: ${contestId}`, err, err.stack);
    throw err;
  } finally {
    client.release();
  }
}