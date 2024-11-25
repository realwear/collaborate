// This script generates a PowerPoint presentation from screenshots
// captured during a Cypress test run. The script uses the `pptxgenjs`
//
// Looks in "dist/cypress/**/screenshots/*/validation/*.png"
// ie: all screenshots in the validation folder of each project folder
//
// Delete the dist/cypress folder before running the tests
//
// Tests can be run with `--env [lang]` (ie: en) to just extract a single language

const pptxgen = require('pptxgenjs');
const { glob } = require('glob');
const path = require('path');
const fs = require('fs').promises; // Use the promises API for async file handling

// Function to get image dimensions
const getImageDimensions = async (filePath) => {
  const sizeOf = require('image-size');
  const dimensions = sizeOf(filePath);
  return dimensions;
};

// Function to convert image to base64 with correct header
const imageToBase64 = async (filePath) => {
  const imageBuffer = await fs.readFile(filePath);
  const imageBase64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase().slice(1); // Get file extension
  const mimeType = `image/${ext}`; // Construct MIME type
  return `data:${mimeType};base64,${imageBase64}`; // Add base64 header
};

// Function to extract language code from filename
const extractLanguageCode = (filename) => {
  const match = filename.match(/-\s*([a-z]{2})\s*-/i);
  return match ? match[1].toLowerCase() : 'unknown';
};

// Main function to create PPTX
const createPptxFromScreenshots = async () => {
  try {
    // Create a new PowerPoint presentation
    let pptx = new pptxgen();

    // Define the pattern to match all screenshots in the specified directories
    const pattern = 'dist/cypress/**/screenshots/*/validation/*.png';

    // Use glob to find all matching screenshot files
    const files = await glob(pattern);

    if (files.length === 0) {
      console.log('No screenshots found matching the pattern.');
      return;
    }

    // Group files by language code
    const filesByLanguage = files.reduce((acc, file) => {
      const langCode = extractLanguageCode(path.basename(file));
      if (!acc[langCode]) acc[langCode] = [];
      acc[langCode].push(file);
      return acc;
    }, {});

    // Standard slide size in inches
    const SLIDE_WIDTH = 10;
    const SLIDE_HEIGHT = 5.625;

    for (const lang in filesByLanguage) {
      const langFiles = filesByLanguage[lang];

      const titleSlide = pptx.addSlide();
      titleSlide.addText(`Language: ${lang.toUpperCase()}`, {
        x: 0.5,
        y: '50%',
        fontSize: 36,
        bold: true,
        align: 'center',
        valign: 'middle',
      });

      // Iterate over each file and add it as a slide
      for (const file of langFiles) {
        const slide = pptx.addSlide();
        const { width, height } = await getImageDimensions(file);
        const imgData = await imageToBase64(file);

        // Calculate scaling factor to maintain aspect ratio
        const widthRatio = SLIDE_WIDTH / width;
        const heightRatio = SLIDE_HEIGHT / height;
        const scale = Math.min(widthRatio, heightRatio);

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Center the image on the slide
        const xPos = (SLIDE_WIDTH - scaledWidth) / 2;
        const yPos = (SLIDE_HEIGHT - scaledHeight) / 2;

        // Add the image to the slide
        slide.addImage({
          data: imgData,
          x: xPos,
          y: yPos,
          w: scaledWidth,
          h: scaledHeight,
        });
      }
    }

    // Save the PPTX file
    const fileName = 'screenshots_presentation.pptx';
    await pptx.writeFile({ fileName });
    console.log(`Presentation saved as ${fileName}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Run the function
createPptxFromScreenshots();
