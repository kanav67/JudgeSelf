import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs/promises';

//todo: in future manually compile tex file for more customization
export const extractProblemStatement = async (workDir: string) => {
  //todo extract language
  const htmlFilePath = path.join(workDir, 'statements/.html/english', 'problem.html');

  const htmlContent = await fs.readFile(htmlFilePath, 'utf-8').catch((error: unknown) => {
    throw new Error(`Failed to read problem statement HTML file: ${error}`);
  });
  
  const $ = cheerio.load(htmlContent);

  const statement = $('.legend').html()?.trim() || "";
  const inputStatement = $('.input-specification').html()?.trim() || "";
  const outputStatement = $('.output-specification').html()?.trim() || "";
  const sampleTests = $('.sample-tests').html()?.trim() || "";
  const notes = $('.note').html()?.trim() || "";
  const images = $('img.tex-graphics').map((_, el) => $(el).attr('src')).get();

  const validImages = [];

  for (const imgSrc of images) {
    const imgPath = path.join(workDir, 'statements/.html/english', imgSrc);
    try {
      await fs.access(imgPath);
      validImages.push({
        name: imgSrc,
        imgSrc: imgPath,
      });
    } catch (error: unknown) {
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
  };
}