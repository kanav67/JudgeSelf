import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { createContest, getContestById } from "../repositories/contest.repository";

export const handleCreateContest = async (req: Request, res: Response) => {
    const { name, start_time, end_time } = req.body;
    const owner_id = (req as AuthenticatedRequest).user.id;

    const contest = await createContest({ name, start_time, end_time, owner_id });

    res.status(201).json(contest);
}

export const handleGetContest = async (req: Request, res: Response) => {
    const contestId = req.params.id;
    const includeProblemData = req.query.includeProblems === 'true';

    if (!contestId || contestId != String(contestId)) {
        return res.status(400).json({ message: "Valid Contest Id is required" });
    }

    const contest = await getContestById(contestId, includeProblemData);

    if (!contest) {
        return res.status(404).json({ message: "Invalid Contest Id" });
    }

    res.status(200).json(contest);
}