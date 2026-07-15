import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { ContestRepository } from "../repositories/contest.repository";
import { firstValue } from "../utils/req-extract";

const createContest = async (req: Request, res: Response) => {
    const name = firstValue(req.body.name);
    const start_time = firstValue(req.body.start_time);
    const end_time = firstValue(req.body.end_time);

    if (!name) {
        return res.status(400).json({ message: "Valid Contest Name is required" });
    }
    if (!start_time) {
        return res.status(400).json({ message: "Valid Contest Start Time is required" });
    }
    if (!end_time) {
        return res.status(400).json({ message: "Valid Contest End Time is required" });
    }
    const owner_id = (req as AuthenticatedRequest).user.id;

    const contest = await ContestRepository.createContest({ name, start_time, end_time, owner_id });

    res.status(201).json(contest);
}

const getContest = async (req: Request, res: Response) => {
    const contestId = firstValue(req.params.contestId);
    const includeProblemData = req.query.includeProblems === 'true';

    if (!contestId) {
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