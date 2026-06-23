const path = require('path');
const { createWriteStream } = require('fs');
const unzipper = require('unzipper');
const { ZipArchive } = require('archiver');

const unzipFile = async (zipFilePath, outputDirectory, folderName) => {
  try {
    const directory = await unzipper.Open.file(zipFilePath);
    await directory.extract({ path: outputDirectory });
  } catch (error) {
    throw new Error(`Failed to unzip file ${zipFilePath} to ${outputDirectory}: ${error.message}`);
  }
}

const zipProblemFiles = async (workDir, passedData) =>
  new Promise((resolve, reject) => {
    const outPath = path.join(workDir, 'problem.zip');
    
    const output = createWriteStream(outPath);
    const archive = new ZipArchive({
      zlib: { level: 1 } //set minimum compression for fastest decompression
    });

    output.on('close', () => {
      resolve();
    });
    archive.on('warning', (err) => {
      reject('Warning while creating zip file: ' + err.message);
    });
    archive.on('error', (err) => {
      reject('Error while creating zip file: ' + err.message);
    });

    archive.pipe(output);

    const checkerPath = path.join(workDir, passedData.checkerSourcePath);
    archive.file(checkerPath, { name: 'checker' });

    if (passedData.hasInteractor) {
      const interactorPath = path.join(workDir, passedData.interactorSourcePath);
      archive.file(interactorPath, { name: 'interactor' });
    }

    const testSetPath = path.join(workDir, passedData.testSetName);
    archive.directory(testSetPath, { name: 'tests' });

    archive.append(null, { name: 'resources/' });//empty directory
    if (passedData.resources.length > 0) {
      for (const resource of passedData.resources) {
        const resourcePath = path.join(workDir, resource.path);
        archive.file(resourcePath, { name: `resources/${resource.name}` });
      }
    }

    archive.finalize();
  });

module.exports = { zipProblemFiles, unzipFile };