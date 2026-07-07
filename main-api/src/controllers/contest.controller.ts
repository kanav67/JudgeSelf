import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { ContestRepository } from "../repositories/contest.repository";

const createContest = async (req: Request, res: Response) => {
    const { name, start_time, end_time } = req.body;
    const owner_id = (req as AuthenticatedRequest).user.id;

    const contest = await ContestRepository.createContest({ name, start_time, end_time, owner_id });

    res.status(201).json(contest);
}

const getContest = async (req: Request, res: Response) => {
    const contestId = req.params.id;
    const includeProblemData = req.query.includeProblems === 'true';

    if (!contestId || contestId != String(contestId)) {
        return res.status(400).json({ message: "Valid Contest Id is required" });
    }

    const contest = await ContestRepository.getContestById(contestId, includeProblemData);

    if (!contest) {
        return res.status(404).json({ message: "Invalid Contest Id" });
    }

    res.status(200).json(contest);
}

export const ContestController = {
    createContest,
    getContest
};