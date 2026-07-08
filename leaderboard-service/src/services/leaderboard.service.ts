import { pgPool } from "../config/postgres";
import { redisClient } from "../config/redis";
import { computeUserScores } from "./scoring.service";

export interface LeaderboardRow {
  rank: number;
  userId: string;
  score: number;
  problemsSolved: number;
  penalty: number;
  problemDetails: Record<string, {
    solved: boolean;
    wrongAttemptsBeforeAC: number;
    scoreTime: number;
  }>;
}

export interface Leaderboard {
  leaderboard: LeaderboardRow[];
  currentPage: number;
  totalPages: number;
  totalParticipants: number;
}

export const getContestLeaderboardKey = (contestId: string) => {
  return `contest:${contestId}:leaderboard`;
}

export const getContestMetadataKey = (contestId: string) => {
  return `contest:${contestId}:metadata`;
}

export const getUserLeaderboardRow = async (contestId: string, userId: string): Promise<LeaderboardRow | null> => {
  const leaderboardZsetKey = getContestLeaderboardKey(contestId);

  const rank = await redisClient.zRevRank(leaderboardZsetKey, userId);
  if (rank) {
    const metadataHashKey = getContestMetadataKey(contestId);
    const redisMetadata = await redisClient.hmGet(metadataHashKey, userId);
    if (redisMetadata && redisMetadata[0]) {
      const meta = JSON.parse(redisMetadata[0]);
      const scoreCalculation = computeUserScores(meta);
      return {
        rank: rank + 1,//handle 0 indexed rank
        userId: userId,
        score: scoreCalculation.score,
        problemsSolved: scoreCalculation.solved,
        penalty: scoreCalculation.penalty,
        problemDetails: scoreCalculation.details
      };
    }
  }

  const dbQuery = `SELECT rank, user_id, problems_solved, penalty, problem_details
                   FROM contest_results
                   WHERE contest_id = $1 AND user_id = $2`;
  const dbResult = await pgPool.query(dbQuery, [contestId, userId]);
  if (dbResult.rowCount === 0) {
    return null;
  }
  const row = dbResult.rows[0];
  return {
    rank: row.rank,
    userId: row.user_id,
    score: row.score,
    problemsSolved: row.problems_solved,
    penalty: row.penalty,
    problemDetails: row.problem_details
  };
}

export const getLeaderboardPage = async (contestId: string, page: number, pageSize: number): Promise<{ leaderboard?: Leaderboard, error?: string }> => {
  const totalParticipants = await getTotalLeaderboardEntries(contestId);

  const response: Leaderboard = {
    currentPage: page,
    totalPages: Math.ceil(totalParticipants / pageSize),
    totalParticipants: totalParticipants,
    leaderboard: []
  };

  //helps bypass db query in a running contest
  const redisResult = await getLeaderboardPageFromRedis(contestId, page, pageSize);
  if (redisResult) {
    response.leaderboard = redisResult;
    return { leaderboard: response };
  }

  //checks for valid contest
  //I had plans to do something if leaderboard is not frozen, but I think it's better to just return the db result
  const contest = await pgPool.query('SELECT leaderboard_frozen, end_time FROM contests WHERE id = $1', [contestId]);
  if (contest.rowCount === 0) {
    return { error: 'Invalid Contest ID' };
  }

  return { leaderboard: { ...response, leaderboard: await getLeaderboardPageFromDB(contestId, page, pageSize) } };
}

const getLeaderboardPageFromDB = async (contestId: string, page: number, pageSize: number): Promise<LeaderboardRow[]> => {
  const startIdx = (page - 1) * pageSize;

  //using keyset pagination by comparing rank instead of OFFSET
  //fetches rows with rank > startRank
  const startRank = startIdx;

  const dbResult = await pgPool.query(
    `SELECT rank, user_id, problems_solved, penalty, problem_details
           FROM contest_results
           WHERE contest_id = $1 AND rank > $2
           ORDER BY rank ASC LIMIT $3`,
    [contestId, startRank, pageSize]
  );

  return dbResult.rows;
};

const getLeaderboardPageFromRedis = async (contestId: string, page: number, pageSize: number): Promise<LeaderboardRow[] | null> => {
  const leaderboardZsetKey = getContestLeaderboardKey(contestId);
  const metadataHashKey = getContestMetadataKey(contestId);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize - 1;

  const userIdsWithScores = await redisClient.zRangeWithScores(leaderboardZsetKey, startIdx, endIdx, { REV: true });
  if (userIdsWithScores.length === 0) {
    return null;
  }

  const userIds = userIdsWithScores.map(u => u.value);
  const rawMetadataList = await redisClient.hmGet(metadataHashKey, userIds);

  const payload: LeaderboardRow[] = userIdsWithScores.map((user, idx) => {
    const meta = JSON.parse(rawMetadataList[idx] || '{}');
    const scoreCalculation = computeUserScores(meta);
    return {
      rank: startIdx + idx + 1,
      userId: user.value,
      score: scoreCalculation.score,
      problemsSolved: scoreCalculation.solved,
      penalty: scoreCalculation.penalty,
      problemDetails: scoreCalculation.details
    };
  });

  return payload;
}

export const getTotalLeaderboardEntries = async (contestId: string): Promise<number> => {
  const leaderboardZsetKey = getContestLeaderboardKey(contestId);

  let totalParticipants = await redisClient.zCard(leaderboardZsetKey);
  if (totalParticipants !== 0) {
    return totalParticipants;
  }

  const totalParticipantsQuery = `SELECT COUNT(*) FROM contest_results WHERE contest_id = $1`;
  const res = await pgPool.query(totalParticipantsQuery, [contestId]);
  if (res.rowCount === 0) {
    return 0;
  }
  totalParticipants = parseInt(res.rows[0].count);
  return totalParticipants;
}