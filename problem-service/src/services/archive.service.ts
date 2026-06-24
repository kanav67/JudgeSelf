import path from 'path';
import { createWriteStream } from 'fs';
import unzipper from 'unzipper';
import { ArchiverError, ZipArchive } from 'archiver';
import { ParsedProblemXML } from './polygon/polygon-xml.types.js';

export const unzipFile = async (zipFilePath: string, outputDirectory: string) => {
  try {
    const directory = await unzipper.Open.file(zipFilePath);
    await directory.extract({ path: outputDirectory });
  } catch (error: any) {
    throw new Error(`Failed to unzip file ${zipFilePath} to ${outputDirectory}: ${error.message}`);
  }
};

export const zipProblemFiles = async (workDir: string, passedData: ParsedProblemXML) =>
  new Promise<void>((resolve, reject) => {
    const outPath = path.join(workDir, 'problem.zip');
    
    const output = createWriteStream(outPath);
    const archive = new ZipArchive({
      zlib: { level: 1 },
    });

    output.on('close', () => {
      resolve();
    });
    archive.on('warning', (err: ArchiverError) => {
      reject(new Error('Warning while creating zip file: ' + err.message));
    });
    archive.on('error', (err: ArchiverError) => {
      reject(new Error('Error while creating zip file: ' + err.message));
    });

    archive.pipe(output);

    const checkerPath = path.join(workDir, passedData.checkerSourcePath);
    archive.file(checkerPath, { name: 'checker' });

    if (passedData.hasInteractor && passedData.interactorSourcePath) {
      const interactorPath = path.join(workDir, passedData.interactorSourcePath);
      archive.file(interactorPath, { name: 'interactor' });
    }

    const testSetPath = path.join(workDir, passedData.testSetName);
    archive.directory(testSetPath, 'tests');

    archive.append(null as any, { name: 'resources/' });

    if (passedData.resources && passedData.resources.length > 0) {
      for (const resource of passedData.resources) {
        const resourcePath = path.join(workDir, resource.path);
        archive.file(resourcePath, { name: `resources/${resource.name}` });
      }
    }

    archive.finalize();
  });