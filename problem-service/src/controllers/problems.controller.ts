import { Request, Response } from 'express';

import { importProblem } from '../services/problem-import.service.js';
import { uploadToS3 } from '../services/s3.service.js';

export const createProblemImport = async (request: Request, response: Response) => {
  const { polygonUrl, contestId, problemIndex } = request.body;
  if (!polygonUrl) {
    return response.status(400).json({ message: 'polygonUrl is required' });
  }

  const problemId = await importProblem(polygonUrl, contestId, problemIndex);
  response.status(201).json({ problemId });
};

export const testEndpoint = async (request: Request, response: Response) => {
  const polygonUrl = 'https://polygon.codeforces.com/p0pFH42/kanav67/alice-bob-easy';
  const contestId = 1;

  const problemId = await importProblem(polygonUrl, contestId);
  response.status(201).json({ problemId });
};

export const getProblemById = async (request: Request, response: Response) => {
  response.status(501).json({
    message: 'Problem lookup is not implemented yet.',
    problemId: (request.params).problemId,
  });
};
