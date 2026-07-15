import type { Request, Response } from "express";
import { ProblemsRepository } from "../repositories/problems.repository";
import type { AuthenticatedRequest } from "../middleware/auth";
import { ContestRepository } from "../repositories/contest.repository";
import { env } from "../config/env";
import { proxyFetch } from "../utils/proxy-fetch";
import { firstValue } from "../utils/req-extract";

const addProblem = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  const contestId = firstValue(req.params.contestId);
  const problemIndex = firstValue(req.body.problemIndex);
  const polygonUrl = firstValue(req.body.polygonUrl);

  if (!contestId) {
    return res.status(400).json({ message: "Valid Contest Id is required" });
  }
  if (!problemIndex) {
    return res.status(400).json({ message: "Valid Problem Index is required" });
  }
  if (!polygonUrl) {
    return res.status(400).json({ message: "Valid Polygon Url is required" });
  }

  const contest = await ContestRepository.getContestById(contestId, true);
  if (!contest) {
    return res.status(404).json({ message: "Invalid Contest Id" });
  }
  if (contest.owner_id !== userId) {
    return res.status(403).json({ message: "You are not authorized to add problems to this contest" });
  }

  const existingIndex = contest.problems?.find((problem) => problem.problem_index === problemIndex);
  if (existingIndex) {
    return res.status(400).json({ message: "Problem with this index already exists" });
  }

  const response = await proxyFetch(`${env.polygonServiceUrl}/api/problems/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contestId, polygonUrl }),
  })

  res.status(response.status).json(response.body);
}

const getProblem = async (req: Request, res: Response) => {
  const { contestId, problemIndex } = req.params;

  if (!contestId || contestId != String(contestId)) {
    return res.status(400).json({ message: "Valid Contest Id is required" });
  }
  if (!problemIndex || problemIndex != String(problemIndex)) {
    return res.status(400).json({ message: "Valid Problem Index is required" });
  }

  const contest = await ProblemsRepository.getProblemByContestIdAndIndex(contestId, problemIndex);

  if (!contest) {
    return res.status(404).json({ message: "Invalid Problem Index" });
  }

  res.status(200).json(contest);
}

const getProblemById = async (req: Request, res: Response) => {
  const problemId = req.params.id;

  if (!problemId || problemId != String(problemId)) {
    return res.status(400).json({ message: "Valid Problem Id is required" });
  }

  const contest = await ProblemsRepository.getProblemById(problemId);

  if (!contest) {
    return res.status(404).json({ message: "Invalid Problem Id" });
  }

  res.status(200).json(contest);
}

export const ProblemController = {
  addProblem,
  getProblem,
  getProblemById
};