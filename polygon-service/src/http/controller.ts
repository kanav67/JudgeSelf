import type { Request, Response } from 'express';

import { importProblem } from '../services/problem-import.service';

export const createProblemImport = async (request: Request, response: Response) => {
  try {
    const { polygonUrl, contestId, problemIndex } = request.body;
    if (!polygonUrl) {
    return response.status(400).json({ message: 'polygonUrl is required' });
  }

  const problem = await importProblem(polygonUrl, contestId, problemIndex);
  response.status(201).json({ result: problem });
} catch (error) {
    console.error('Error importing problem:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
};

export const testEndpoint = async (request: Request, response: Response) => {
  const polygonUrl = 'https://polygon.codeforces.com/p0pFH42/kanav67/alice-bob-easy';
  const contestId = 1;

  const problemId = await importProblem(polygonUrl, contestId);
  response.status(201).json({ problemId });
};