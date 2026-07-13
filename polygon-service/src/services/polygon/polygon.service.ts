import { env } from '../../config/env';
import { unzipFile } from '../archive.service';
import { generateTestCases } from './polygon-tests.service';

import path from 'path';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const fetchProblemZip = async (problemUrl: string, workDir: string, type = 'linux'): Promise<void> => {
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
    if (type === 'linux' && env.polygonAllowGenerateTests) 
      return await fetchProblemZip(problemUrl, workDir, '');

    throw new Error(`Failed to fetch problem from Polygon: ${result.statusText}`);
  }

  if(result.body === null) {
    throw new Error(`Failed to fetch problem from Polygon: Response body is null`);
  }

  const fileHandle = await fs.open(zipFilePath, 'w');

  try {
    await pipeline(
      Readable.fromWeb(result.body as any),
      (fileHandle).createWriteStream()
    );
  } finally {
    await fileHandle.close();
  }
  
  await unzipFile(zipFilePath, workDir);

  if (type !== 'linux' && env.polygonAllowGenerateTests) {
    await generateTestCases(workDir);
  }
};

export const fetchProblemXML = async (problemUrl: string) => {
  if (problemUrl.endsWith('/')) {
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
};