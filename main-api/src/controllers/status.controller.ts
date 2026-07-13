import type { Request, Response } from 'express';

import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { firstValue } from '../utils/req-extract.js';
import { proxyFetch } from '../utils/proxy-fetch.js';

const statusBaseUrl = env.statusServiceUrl.replace(/\/$/, '');

const buildStatusUrl = (path: string) => `${statusBaseUrl}/api/status${path}`;

const getStatusPage = async (req: Request, res: Response) => {
  const page = firstValue(req.params.page);
  const path = page ? `/${page}` : '';
  const result = await proxyFetch(buildStatusUrl(path));

  return res.status(result.status).json(result.body);
};

const getContestStatusPage = async (req: Request, res: Response) => {
  const contestId = firstValue(req.params.contestId);
  const page = firstValue(req.params.page);
  const userId = firstValue(req.params.userId);
  const path = userId
    ? `/contest/${contestId}/user/${userId}${page ? `/${page}` : ''}`
    : `/contest/${contestId}${page ? `/${page}` : ''}`;

  const result = await proxyFetch(buildStatusUrl(path));

  return res.status(result.status).json(result.body);
};

const getProblemStatusPage = async (req: Request, res: Response) => {
  const problemId = firstValue(req.params.problemId);
  const page = firstValue(req.params.page);
  const userId = firstValue(req.params.userId);

  const path = userId
    ? `/problem/${problemId}/user/${userId}${page ? `/${page}` : ''}`
    : `/problem/${problemId}${page ? `/${page}` : ''}`;

  const result = await proxyFetch(buildStatusUrl(path));

  return res.status(result.status).json(result.body);
};

const getSubmissionById = async (req: Request, res: Response) => {
  const submissionId = firstValue(req.params.submissionId);
  const authUserId = (req as AuthenticatedRequest).user.id;

  if (!submissionId) {
    return res.status(400).json({ message: 'Submission id is required' });
  }

  const submission = await SubmissionRepository.getSubmissionById(submissionId);
  if (!submission) {
    return res.status(404).json({ message: 'Invalid Submission Id' });
  }

  const contestEnded = new Date(submission.contest_end_time).getTime() <= Date.now();
  const isContestOwner = submission.contest_owner_id === authUserId;
  const isSubmissionOwner = submission.user_id === authUserId;

  var showResults = isContestOwner || isSubmissionOwner || contestEnded;
  if (submission.status === 'INT') {
    showResults = isContestOwner;
  }

  const body = {
    ...submission,
    results: showResults ? submission.results : null,
  };

  return res.status(200).json(body);
};

export const StatusController = {
  getStatusPage,
  getContestStatusPage,
  getProblemStatusPage,
  getSubmissionById,
};