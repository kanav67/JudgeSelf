import { env } from "../config/env.js"
import { redisClient } from "../config/redis.js"
import { getSubmissionsCount, getSubmissionsFromDB, SubmissionRow } from "../repositories/status.repository.js";

interface StatusMessage {
  submission_id: string;
  contest_id: string;
  running: boolean;
  time: number;
  memory: number;
  status: string;
}

export interface StatusPage {
  submissions: SubmissionRow[];
  currentPage: number;
  totalPages: number;
  totalSubmissions: number;
}

const redisKey = 'active_submissions';

export const Subscribe = async (): Promise<void> => {
  redisClient.subscribe(env.redisStatusChannel, (payload) => {
    const msg: StatusMessage = JSON.parse(payload);

    if (msg.running) {
      redisClient.hSet(redisKey, msg.submission_id, msg.status);
    } else {
      redisClient.hDel(redisKey, msg.submission_id);
    }
  });
}

export const getSubmissions = async (page: number, limit: number, contestId?: string, userId?: string): Promise<StatusPage> => {
  const [dbSubs, totalCount] = await Promise.all([
    getSubmissionsFromDB(contestId, userId, page, limit),
    getSubmissionsCount(contestId, userId)
  ]);
  const queuedSubs = dbSubs.filter(sub => sub.status === 'QUEUE').map(sub => sub.submissionId);

  if (queuedSubs.length !== 0) {
    const redisStatus = await redisClient.hmGet(redisKey, queuedSubs);
    queuedSubs.forEach((sub, index) => {
      const status = redisStatus[index];
      // hmGet returns null for fields that don't exist
      if (status) {
        dbSubs.find(s => s.submissionId === sub)!.status = status;
      }
    });
  }

  return {
    submissions: dbSubs,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalSubmissions: totalCount
  }
}