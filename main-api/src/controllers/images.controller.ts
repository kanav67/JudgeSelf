import type { Request, Response } from "express";
import { s3Client } from "../config/s3";
import { ProblemsRepository } from "../repositories/problems.repository";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const getImage = async (req: Request, res: Response) => {
    const { contestId, problemIndex, imageId } = req.params;

    if (!contestId || contestId != String(contestId)) {
        return res.status(400).json({ message: "Valid Contest Id is required" });
    }
    if (!problemIndex || problemIndex != String(problemIndex)) {
        return res.status(400).json({ message: "Valid Problem Index is required" });
    }
    if (!imageId || imageId != String(imageId)) {
        return res.status(400).json({ message: "Valid Image Id is required" });
    }

    const problem = await ProblemsRepository.getProblemByContestIdAndIndex(contestId, problemIndex);

    if (!problem) {
        return res.status(404).json({ message: "Invalid Problem Index" });
    }

    //get image from s3 bucket
    const response = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `images/${problem.id}/${imageId}`,
    }));
    
    if (!response.Body) {
        return res.status(404).json({ message: "Not found" });
    }

    res.setHeader("Content-Type", response.ContentType || "image/jpeg");
    (response.Body as any).pipe(res);
}

const getImageById = async (req: Request, res: Response) => {
    const problemId = req.params.id;
    const imageId = req.params.imagesId;

    if (!problemId || problemId != String(problemId)) {
        return res.status(400).json({ message: "Valid Problem Id is required" });
    }
    if (!imageId || imageId != String(imageId)) {
        return res.status(400).json({ message: "Valid Image Id is required" });
    }

    const response = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `images/${problemId}/${imageId}`,
    }));

    if (!response.Body) {
        return res.status(404).json({ message: "Not found" });
    }

    res.setHeader("Content-Type", response.ContentType || "image/jpeg");
    (response.Body as any).pipe(res);
}

export const ImageController = {
    getImage,
    getImageById
};