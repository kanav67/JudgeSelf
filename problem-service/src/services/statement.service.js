const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs/promises');

//todo: in future manually compile tex file for more customization
const extractProblemStatement = async (workDir) => {
  const htmlFilePath = path.join(workDir, '/statements/.html/english', '/problem.html');
  const htmlContent = await fs.readFile(htmlFilePath, 'utf-8').catch((error) => {
    throw new Error(`Failed to read problem statement HTML file: ${error?.message || error}`);
  });
  
  const $ = cheerio.load(htmlContent);

  const statement = $('.legend').html()?.trim() || "";
  const inputStatement = $('.input-specification').html()?.trim() || "";
  const outputStatement = $('.output-specification').html()?.trim() || "";
  const sampleTests = $('.sample-tests').html()?.trim() || "";
  const notes = $('.note').html()?.trim() || "";
  const images = $('img.tex-graphics').map((i, el) => $(el).attr('src')).get();

  const validImages = [];

  for (const imgSrc of images) {
    const imgPath = path.join(workDir, '/statements/.html/english', imgSrc);
    try {
      await fs.access(imgPath);
      validImages.push({
        name: imgSrc,
        imgSrc: imgPath,
      });
    } catch (error) {
      console.warn(`Image: ${imgSrc} could not be added either it doesn't exist or copy failed. Skipping it.`, error);
    }
  }

  return {
    statement,
    inputStatement,
    outputStatement,
    examples: sampleTests,
    notes,
    images: validImages
  }
}

module.exports = { extractProblemStatement };