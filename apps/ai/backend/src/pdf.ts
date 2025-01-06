/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { RequestHandler } from 'express';
import { Browser, launch as launchBrowser } from 'puppeteer';

let browser: Browser | null = null;

export async function pdfInit() {
  console.log('Initializing browser', browser);

  if (!browser) {
    browser = await launchBrowser({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

export function pdfShutdown() {
  console.log('Closing browser');
  return browser.close().then(
    () => {
      browser = null;
      console.log('Browse Closed');
    },
    (error) => {
      console.error('Error closing browser', error);
    }
  );
}

export function handlePdf(): RequestHandler {
  return async (req, res) => {
    try {
      const buffer = await renderPdf(req.body.htmlContent, req.body.headerTemplate, req.body.footerTemplate);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      res.send(buffer);
    } catch (error) {
      res.status(500).send(error.message);
    }
  };
}

export async function renderPdf(htmlContent: string, headerTemplate?: string, footerTemplate?: string): Promise<Buffer> {
  if (!browser) {
    throw new Error('Browser not initialized');
  }

  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const displayHeaderFooter = !!headerTemplate || !!footerTemplate;

  const buffer = await page.pdf({
    headerTemplate,
    footerTemplate,
    displayHeaderFooter,
    omitBackground: true,
    printBackground: true,
    format: 'A4',
    margin: {
      top: '140px',
      bottom: '50px',
    },
  });

  await page.close();

  return buffer;
}
