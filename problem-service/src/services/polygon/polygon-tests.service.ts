import fs from 'fs/promises';
import path from 'node:path';

import { exec } from 'child_process';
import { promisify } from 'node:util';
const execPromise = promisify(exec);
const MAX_TESTS_GENERATION_TIME = 5 * 60 * 1000; //5min

//todo run it in a sandbox
export const generateTestCases = async (workDir: string) => {
  const startedAt = Date.now();
  console.log(`Generating test cases in ${workDir}`);

  //ensure wine is installed
  try {
    await execPromise('wine --version');
  } catch (error) {
    throw new Error('Wine is required to generate testcases but it is not installed.');
  }

  //this is a very bad way to do it but giving permission is necessary
  const files = await fs.readdir(path.join(workDir, 'scripts'));
  await Promise.all(files.map(async (file) => {
    const fullPath = path.join(workDir, 'scripts', file);

    if (file.endsWith('.sh')) {
      // 0o755 gives read/write/execute to owner, and read/execute to others
      await fs.chmod(fullPath, 0o755);
    }
  }));

  //generates testcases
  try {
    const testcasesGenOutput = await execPromise('bash doall.sh', { cwd: workDir, timeout: MAX_TESTS_GENERATION_TIME });
    console.log(testcasesGenOutput);
  } catch (error: any) {
    throw new Error(`Testcase generation failed: ${error.message}, \nstderr: ${error.stderr}`);
  }

  console.log(`Took ${Date.now() - startedAt}ms to generate test cases in ${workDir}`);
};

export const validateTestCases = async (workDir: string, testSetName: string, testCount: number) => {
  const testsDir = path.join(workDir, testSetName);

  const entries = await fs.readdir(testsDir, { withFileTypes: true });

  if (entries.length !== testCount * 2) {
    throw new Error(`Expected ${testCount * 2} test files (Total ${testCount} tests), but found ${entries.length}.`);
  }

  for (const entry of entries) {
    const fullPath = path.join(testsDir, entry.name);

    if (!entry.isFile()) {
      throw new Error(`Only files are allowed in the test directory: ${fullPath}`);
    }
  }

  for (let i = 1; i <= testCount; i++) {
    const fileName = String(i).padStart(String(testCount).length, '0');

    if (!entries.some(e => e.name === fileName)) {
      throw new Error(`Missing input test file : ${fileName}`);
    }
    if (!entries.some(e => e.name === `${fileName}.a`)) {
      throw new Error(`Missing output test file : ${fileName}.a`);
    }
  }
};