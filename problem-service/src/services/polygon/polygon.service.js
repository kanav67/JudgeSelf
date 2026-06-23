const { env } = require('../../config/env');
const { unzipFile } = require('../archive.service');
const { generateTestCases } = require('./polygon-tests.service');

const path = require('path');
const fs = require('fs/promises');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const fetchProblemZip = async (problemUrl, workDir, type = 'linux') => {
  const zipFilePath = path.join(workDir, 'package.zip');
  
  const result = await fetch(problemUrl, {
    method: 'POST',
    body: new URLSearchParams({
      login: env.polygonUsername,
      password: env.polygonPassword,
      type: type
    }),
  });

  if (!result.ok) {
    //by default we try to get linux package which has tests already generated.
    //in case it is not available we try to manually generate tests.
    if(type == 'linux' && env.polygonAllowGenerateTests) 
      return await fetchProblemZip(problemUrl, workDir, '');

    throw new Error(`Failed to fetch problem from Polygon: ${result.statusText}`);
  }

  const fileHandle = await fs.open(zipFilePath, 'w');

  try {
    await pipeline(
      Readable.fromWeb(result.body),
      fileHandle.createWriteStream()
    );
  } finally {
    await fileHandle.close();
  }
  
  await unzipFile(zipFilePath, workDir);

  if(type != 'linux' && env.polygonAllowGenerateTests) {
    await generateTestCases(workDir);
  }
};

const fetchProblemXML = async (problemUrl) => {
  if(problemUrl.endsWith('/')) {
    problemUrl = problemUrl.slice(0, -1);
  }

  const result = await fetch(`${problemUrl}/problem.xml`, {
    method: 'POST',
    body: new URLSearchParams({
      login: env.polygonUsername,
      password: env.polygonPassword,
    }),
  });

  if (!result.ok) {
    throw new Error(`Failed to fetch problem XML from Polygon: ${result.statusText}`);
  }

  const xmlContent = await result.text();
  return xmlContent;
}

module.exports = { fetchProblemZip, fetchProblemXML };