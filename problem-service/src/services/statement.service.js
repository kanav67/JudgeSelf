const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs/promises');

//todo: in future manually compile tex file for more customization
const extractProblemStatement = async (workDir) => {
  const htmlFilePath = path.join(workDir, '/statements/.html/english', '/problem.html');
  const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');

  const $ = cheerio.load(htmlContent);

  const statement = $('.legend').html()?.trim() || "";
  const inputStatement = $('.input-specification').html()?.trim() || "";
  const outputSpec = $('.output-specification').html()?.trim() || "";
  const sampleTests = $('.sample-tests').html()?.trim() || "";
  const notes = $('.note').html()?.trim() || "";
  const images = $('img.tex-graphics').map((i, el) => $(el).attr('src')).get();

  const validImages = [];

  const imagesPath = path.join(workDir, 'images');
  await fs.mkdir(imagesPath, { recursive: true });
  for (const imgSrc of images) {
    const imgPath = path.join(workDir, '/statements/.html/english', imgSrc);
    try {
      const destPath = path.join(imagesPath, imgSrc);
      await fs.copyFile(imgPath, destPath);
      validImages.push(imgSrc);
    } catch (error) {
      console.warn(`Image: ${imgPath} could not be added either it doesn't exist or copy failed. Skipping it.`, error);
    }
  }

  return {
    statement,
    inputStatement,
    outputSpec,
    examples: sampleTests,
    notes,
    images: validImages
  }
}

module.exports = { extractProblemStatement };