import { env } from '../config/env';
import type { UserContestMetadata } from './redis.service';

export interface UserScore {
  score: number; //decides the rank in the leaderboard
  solved: number;
  penalty: number;
  details: Record<string, {
    solved: boolean;
    wrongAttemptsBeforeAC: number;
    scoreTime: number;
  }>;
}

//currently uses ICPC scoring
//todo add options for different types of scoring
export function computeUserScores(metadata: UserContestMetadata): UserScore {
  let solvedCount = 0;
  let totalPenalty = 0;
  const details: Record<string, any> = {};

  for (const [probId, submissions] of Object.entries(metadata.problems)) {

    //sort based on relative submission time
    const sorted = [...submissions].sort((a, b) => a.relativeSubmittedAt - b.relativeSubmittedAt);

    let wrongAttemptsBeforeAC = 0;
    let isSolved = false;
    let scoreTime = 0;

    for (const sub of sorted) {
      if (sub.status === 'AC') {
        isSolved = true;
        scoreTime = sub.relativeSubmittedAt;
        break;
      } else if (['WA', 'TLE', 'MLE', 'RE'].includes(sub.status)) {
        wrongAttemptsBeforeAC++;
      }
    }

    if (isSolved) {
      solvedCount++;
      // 20 minutes penalty per incorrect run prior to AC verification
      const penaltyForProblem = scoreTime + (wrongAttemptsBeforeAC * 20 * 60);
      totalPenalty += penaltyForProblem;
    }
    details[probId] = { solved: isSolved, wrongAttemptsBeforeAC, scoreTime };
  }

  const compositeScore = (solvedCount * env.penaltyOffset) - totalPenalty;

  return { score: compositeScore, solved: solvedCount, penalty: totalPenalty, details };
}