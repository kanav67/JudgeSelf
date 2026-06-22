const AdmZip = require('adm-zip');
const path = require('path');

//todo use async library instead of AdmZip

const unzipFile = async (zipFilePath, outputDirectory, folderName) => {
  const targetPath = folderName ? path.join(outputDirectory, folderName) : outputDirectory;
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(targetPath, true);
}

const zipDirectory = async (sourceDir, outPath) => {
  const zip = new AdmZip();
  zip.addLocalFolder(sourceDir);
  zip.writeZip(outPath);
}

module.exports = { zipDirectory, unzipFile };