const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  // Create a browser instance
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Create a new page
  const page = await browser.newPage();

  // Set HTML content
  const htmlContent = `
    <html>
    <head><title>Test PDF</title></head>
    <body>
      <h1>PDF Generation Test</h1>
      <p>This is a simple PDF to test the generation process.</p>
    </body>
    </html>
  `;

  // Set content to the page
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Define a temporary file path for the PDF output
  const tempPdfPath = `test-output-${Date.now()}.pdf`;

  // Generate PDF from the page content
  await page.pdf({
    path: tempPdfPath,
    format: 'A4'
  });

  // Close the browser
  await browser.close();

  // Check if the PDF file was created and log the results
  try {
    const stats = fs.statSync(tempPdfPath);
    if (stats.isFile() && stats.size > 0) {
      console.log(`PDF successfully created at ${tempPdfPath}, size: ${stats.size} bytes`);
    } else {
      console.error('PDF generation failed, file was not created correctly.');
    }
  } catch (error) {
    console.error('Error accessing PDF file:', error.message);
  }
})();
