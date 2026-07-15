import type { Request, Response } from "express";
import { getSubmissions, getSubmissionsForProblem } from "../services/status.service";

export const getStatusPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.params.page as string) || 1;
    const contestId = req.params.contestId?.toString() as string | undefined;
    const userId = req.params.userId?.toString() as string | undefined;

    const limit = 30;//fixed for now

    const result = await getSubmissions(page, limit, contestId, userId);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const getProblemStatusPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.params.page as string) || 1;
    const problemId = req.params.problemId as string;
    const userId = req.params.userId?.toString() as string | undefined;

    const limit = 30;//fixed for now

    const result = await getSubmissionsForProblem(page, limit, problemId, userId);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}