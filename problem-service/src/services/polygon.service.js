const { env } = require('../config/env');
const { unzipFile } = require('./archive.service');

const path = require('path');
const fs = require('fs/promises');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const fetchPolygonProblem = async (problemUrl, workDir) => {
  const zipFilePath = path.join(workDir, 'package.zip');
  
  const result = await fetch(problemUrl, {
    method: 'POST',
    body: new URLSearchParams({
      login: env.polygonUsername,
      password: env.polygonPassword,
      type: 'linux'
    }),
  });

  if (!result.ok) {
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
};

module.exports = { fetchPolygonProblem };
