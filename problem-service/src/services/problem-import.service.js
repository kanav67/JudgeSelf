const { zipDirectory } = require('./archive.service');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { uploadToS3 } = require('./s3.service');
const { fetchPolygonProblem } = require('./polygon.service');
const { env } = require('../config/env');
const { extractProblemStatement } = require('./statement.service');

const execPromise = promisify(exec);

const TMP_BASE_DIR = env.POLYGON_TMPDIR || '/tmp/polygon/';
const SUPPORTED_GCC_VERSIONS = ['14', '17', '20', '23'];

const generateUUID = () => {
  return crypto.randomUUID();
}

const parseProblemXML = async (workDir) => {
  const xmlFilePath = path.join(workDir, 'problem.xml');
  const xmlContent = await fs.readFile(xmlFilePath, 'utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false, 
    attributeNamePrefix: '',
    isArray: (name, jpath, isObject, isArray) => {
        // forces 'name' to always be parsed as an array
        const forceArrayPaths = [
          'problem.names.name',
          'problem.statements.statement',
          'problem.judging.testset',
          'problem.files.resources.file',
        ];
        return forceArrayPaths.includes(jpath);
    }
  });

  const problemData = parser.parse(xmlContent);
  const names = problemData.problem.names.name;
  const testsets = problemData.problem.judging.testset;

  if(names.length === 0) {
    throw new Error('No problem name found in the problem. Please ensure the problem has at least one name.');
  }
  const problemName = names.find(name => name.language === 'english')?.value || names[0].value;

  if(testsets.length > 1) {
    throw new Error('Multiple testsets are not supported yet. Please ensure the problem has only one testset.');
  }
  if(testsets.length == 0) {
    throw new Error('No testset found in the problem. Please ensure the problem has at least one testset.');
  }
  if(parseInt(testsets[0]['test-count']) <= 0) {
    throw new Error('There should be atleast one test in the testset.');
  }

  const checker = problemData.problem.assets.checker;
  if(!checker || !checker.source) {
    throw new Error('No checker was found. Please add atleast one checker.');
  }
  if (!checker.source.path) {
    throw new Error('Checker source not found in problem. Are you sure a checker is provided?');
  }
  if (!checker.source.type) {
    throw new Error('Checker language not found in problem.');
  }

  // skipping author name as it is not actually shown on codeforces.
  // for future reference, if needed, we can extract it from the problem-properties.json file.

  return {
    polygonUrl: problemData.problem.url,
    timeLimit: parseInt(testsets[0]['time-limit']),
    memoryLimit: parseInt(testsets[0]['memory-limit']),
    testCount: parseInt(testsets[0]['test-count']),
    testSetName: testsets[0].name,
    problemName: problemName,
    checkerSourcePath: checker.source.path,
    checkerLanguage: checker.source.type,
    hasTestlib: problemData.problem.assets.checker.type === 'testlib' ? true : false,
    inputType: 'stdin',
    outputType: 'stdout',
    authorName: '',
  };
}

const importProblem = async (problemUrl) => {
  const problemId = generateUUID();

  const workDir = path.join(TMP_BASE_DIR, problemId);

  try {
    await fs.mkdir(workDir, { recursive: true });
    
    await fetchPolygonProblem(problemUrl, workDir);
    const parsedData = await parseProblemXML(workDir);
    const statementsData = await extractProblemStatement(workDir);
    statementsData.images = statementsData.images.map(file => `problems/${problemId}/images/${file}`);

    console.log('Parsed problem data:', parsedData);

    //make it compulsory to build Full package

    // //this is a very bad way to do it but giving permission is necessary
    // const files = await fs.readdir(path.join(workDir, 'scripts'));
    // await Promise.all(files.map(async (file) => {
    //   const fullPath = path.join(workDir, 'scripts', file);
    //   const fileStat = await fs.stat(fullPath);

    //   if (file.endsWith('.sh')) {
    //     // 0o755 gives read/write/execute to owner, and read/execute to others
    //     await fs.chmod(fullPath, 0o755);
    //   }
    // }));
    // console.log('Permissions set for script files.');

    // //generates testcases
    // const testcasesGenOutput = await execPromise('bash doall.sh', { cwd: workDir });
    // if(testcasesGenOutput.stderr) {
    //   throw new Error(`Testcase generation failed: ${testcasesGenOutput.stderr}`);
    // }
    // console.log(testcasesGenOutput.stdout);

    //todo let workers handle it
    // //compile testlib files locally
    // if(parsedData.hasTestlib) {
    //   //detects g++ version like g++14, g++17 etc. default to 20 if not found
    //   const match = parsedData.checkerLanguage.match(/g\+\+(\d{2,})/);
    //   var stdVer = '20';
    //   if(match && SUPPORTED_GCC_VERSIONS.includes(match[1])) {
    //     stdVer = match[1];
    //   }

    //   const checkerOutBinary = path.join(workDir, 'checkerBin');
    //   const compileRes = await execPromise(`g++ -O2 -std=c++${stdVer} ${checkerSourcePath} -o ${checkerOutBinary}`, { cwd: workDir });
    //   if(compileRes.stderr) {
    //     throw new Error(`Checker compilation failed: ${compileRes.stderr}`);
    //   }

    //   parsedData.checkerSourcePath = checkerOutBinary;
    //   parsedData.checkerLanguage = 'binary';
    // }

    const testsDir = path.join(workDir, parsedData.testSetName);
    const testsZipPath = path.join(workDir, 'tests.zip');
    await zipDirectory(testsDir, testsZipPath);

    const checkerFileKey = `problems/${problemId}/checker`;
    const testcasesZipKey = `problems/${problemId}/tests.zip`;

    // await uploadToS3(checkerSourcePath, checkerFileKey);
    // await uploadToS3(testsZipPath, testcasesZipKey);
    // for (const file of statementsData.images) {
    //     await uploadToS3(path.join(workDir, file), file);
    // }


    // await createProblemRecord({
    //   id: problemId,
    //   polygonId: problemData.problem.id,
    //   name: problemData.problem.name,
    //   statement: statementsData.statement,
    //   inputStatement: statementsData.inputStatement,
    //   outputStatement: statementsData.outputStatement,
    //   memoryLimit: memoryLimit,
    //   timeLimit: timeLimit,
    //   testCount: testCount,
    //   examples: statementsData.examples,
    //   inputType: statementsData.inputType,
    //   outputType: statementsData.outputType,
    //   authorName: statementsData.authorName,
    //   checkerLanguage: checkerLanguage,
    //   testcasesZipKey: testcasesZipKey,
    //   checkerFileKey: checkerFileKey
    // });

    console.log({
      id: problemId,
      polygonId: parsedData.polygonUrl,
      name: parsedData.problemName,
      statement: statementsData.statement,
      inputStatement: statementsData.inputStatement,
      outputStatement: statementsData.outputStatement,
      examples: statementsData.examples,
      notes: statementsData.notes,

      memoryLimit: parsedData.memoryLimit,
      timeLimit: parsedData.timeLimit,
      testCount: parsedData.testCount,

      inputType: statementsData.inputType,
      outputType: statementsData.outputType,
      authorName: parsedData.authorName,

      checkerLanguage: parsedData.checkerLanguage,
      testcasesZipKey: testcasesZipKey,
      checkerFileKey: checkerFileKey,
    })
    
    return problemId;
    
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    console.log('Cleaning up temporary files...');
    // await fs.rm(workDir, { recursive: true, force: true });
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
