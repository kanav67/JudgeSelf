import type { Request, Response } from "express";
import { ProblemsRepository } from "../repositories/problems.repository";
import type { AuthenticatedRequest } from "../middleware/auth";
import { ContestRepository } from "../repositories/contest.repository";

const addProblem = async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const contestId = req.params.id;
    if (!contestId || contestId != String(contestId)) {
        return res.status(400).json({ message: "Valid Contest Id is required" });
    }

    const contest = await ContestRepository.getContestById(contestId, false);

    if(!contest) {
        return res.status(404).json({ message: "Invalid Contest Id" });
    }

    if(contest.owner_id !== userId) {
        return res.status(403).json({ message: "You are not authorized to add problems to this contest" });
    }

    const { polygonUrl } = req.body;

    const response = await fetch("problem-service/api/problems/import", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ contestId, polygonUrl }),
    })

    res.status(response.status).json(await response.json());
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