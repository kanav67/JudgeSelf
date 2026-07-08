import { UPDATE_USER_STATE_LUA } from "../config/_lua";
import { redisClient } from "../config/redis";
import type { QueueMessage } from "../tasks/rabbitmq.task";
import { getContestMetadataKey, getContestLeaderboardKey } from "./leaderboard.service";
import { computeUserScores } from "./scoring.service";

export interface UserContestMetadata {
  problems: Record<string, ProblemProblemState[]>; //problemID to array of submissions of the user
  processedSubmissions: string[];
}

export interface ProblemProblemState {
  submissionId: string;
  relativeSubmittedAt: number;
  status: 'AC' | 'WA' | 'TLE' | 'MLE' | 'CE' | 'RE';
}

export async function processLiveVerdict(verdict: QueueMessage): Promise<void> {
  const metadataHashKey = getContestMetadataKey(verdict.contestId);
  const leaderboardZsetKey = getContestLeaderboardKey(verdict.contestId);

  //using lua to avoid race conditions
  const updatedMetadataRaw = await redisClient.eval(UPDATE_USER_STATE_LUA, {
    keys: [metadataHashKey],
    arguments: [
      verdict.userId,
      verdict.submissionId,
      verdict.problemId,
      verdict.status,
      verdict.relativeSubmittedAt.toString()
    ]
  }) as string;

  const metadata: UserContestMetadata = JSON.parse(updatedMetadataRaw);

  const { score } = computeUserScores(metadata);

  await redisClient.zAdd(leaderboardZsetKey, {
    score: score,
    value: verdict.userId
  });
}