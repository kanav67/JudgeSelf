const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const { env } = require('../config/env');

const { fetchProblemZip } = require('./polygon/polygon.service');
const { parseProblemXML } = require('./polygon/polygon-xml.service');
const { extractProblemStatement } = require('./statement.service');
const { validateTestCases } = require('./polygon/polygon-tests.service');
const { zipProblemFiles } = require('./archive.service');
const { uploadToS3 } = require('./s3.service');
const { createProblemRecord } = require('../repositories/problems.repository');

const TMP_BASE_DIR = env.POLYGON_TMPDIR || '/tmp/polygon/';

const generateUUID = () => {
  return crypto.randomUUID();
}

const importProblem = async (problemUrl) => {
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
    await uploadToS3(problemZipPath, problemZipKey);
    
    for (const img of statementsData.images) {
      await uploadToS3(img.imgSrc, `${problemId}/images/${img.name}`);
    }
    statementsData.images = statementsData.images.map(img => `${problemId}/images/${img.name}`);

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
      imagesKey: statementsData.images,

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
    console.error(`Failed to import problem from ${problemUrl}:\n`, error);
    throw error;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

const initializeTmpDir = async () => {
  try {
    await fs.mkdir(TMP_BASE_DIR, { recursive: true });

    //cleanup any previous files
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
}

module.exports = { importProblem, initializeTmpDir };