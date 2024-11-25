/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
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
