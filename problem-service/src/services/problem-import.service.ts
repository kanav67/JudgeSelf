import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

import { fetchProblemZip } from './polygon/polygon.service.js';
import { parseProblemXML } from './polygon/polygon-xml.service.js';
import { extractProblemStatement } from './statement.service.js';
import { validateTestCases } from './polygon/polygon-tests.service.js';
import { zipProblemFiles } from './archive.service.js';
import { uploadToS3 } from './s3.service.js';
import { createProblemRecord } from '../repositories/problems.repository.js';

const TMP_BASE_DIR = env.polygonTmpDir || '/tmp/polygon/';

const generateUUID = () => {
  return crypto.randomUUID();
};

export const importProblem = async (problemUrl: string) => {
  const problemId = generateUUID();

  const workDir = path.join(TMP_BASE_DIR, problemId);

  try {
    await fs.mkdir(workDir, { recursive: true });
    
    await fetchProblemZip(problemUrl, workDir);

    const xmlFilePath = path.join(workDir, 'problem.xml');
    const xmlContent = await fs.readFile(xmlFilePath, 'utf-8');
    const parsedData = await parseProblemXML(xmlContent);
    const statementsData = await extractProblemStatement(workDir);

    await validateTestCases(workDir, parsedData.testSetName, parsedData.testCount);
    //todo ensure only supported languages are used

    await zipProblemFiles(workDir, parsedData);

    const problemZipPath = path.join(workDir, 'problem.zip');
    const problemZipKey = `problems/${problemId}.zip`;
    console.log(`Uploading problem zip to S3: ${problemZipPath} -> ${problemZipKey}`);
    await uploadToS3(problemZipPath, problemZipKey);
    
    for (const img of statementsData.images) {
      await uploadToS3(img.imgSrc, `${problemId}/images/${img.name}`);
    }
    const imagesKeys = statementsData.images.map((img) => `${problemId}/images/${img.name}`);

    const res = await createProblemRecord({
      id: problemId,
      polygonId: parsedData.polygonUrl,
      polygonVersion: parsedData.polygonRevision,

      name: parsedData.problemName,
      statement: statementsData.statement,
      inputStatement: statementsData.inputStatement,
      outputStatement: statementsData.outputStatement,
      examples: statementsData.examples,
      notes: statementsData.notes,
      imagesKey: imagesKeys,
      tags: parsedData.tags,

      memoryLimit: parsedData.memoryLimit,
      timeLimit: parsedData.timeLimit,
      testCount: parsedData.testCount,

      inputType: parsedData.inputType,
      outputType: parsedData.outputType,
      authorName: parsedData.authorName,

      hasInteractor: parsedData.hasInteractor,
      interactorLanguage: parsedData.interactorLanguage,
      checkerLanguage: parsedData.checkerLanguage,
      problemZipKey: problemZipKey,
    });
    
    return res;
  } catch (error) {
    console.error(`Failed to import problem from ${problemUrl}:\n`);
    throw error;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
};

export const initializeTmpDir = async () => {
  try {
    await fs.mkdir(TMP_BASE_DIR, { recursive: true });

    const files = await fs.readdir(TMP_BASE_DIR);
    await Promise.all(files.map(async (file) => {
      const fullPath = path.join(TMP_BASE_DIR, file);
      await fs.rm(fullPath, { recursive: true, force: true });
    }));

    console.log(`Initialized temporary directory ${TMP_BASE_DIR}`);
  } catch (error) {
    console.error(`Failed to create temporary directory ${TMP_BASE_DIR}:`, error);
    throw error;
  }
};
