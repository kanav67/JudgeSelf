import { Request, Response } from "express";
import { getSubmissions } from "../services/status.service.js";

export const getStatusPage = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.params.page as string) || 1;
  const contestId = req.params.contestId?.toString() as string | undefined;
  const userId = req.params.userId?.toString() as string | undefined;

  const limit = 30;//fixed for now

  const result = await getSubmissions(page, limit, contestId, userId);

  res.json(result);
}