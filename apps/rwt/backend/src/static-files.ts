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
import express from 'express';
import path from 'path';
import fs from 'fs';
import { rwtConfig } from './config';
import { gzipSync } from 'zlib';

function cacheHash(req: express.Request, res: express.Response, next: express.NextFunction) {
  // If the file contains a hash before the extension, cache for a year, ie: main.1234567890123456.js
  if (req.url.match(/.*\.[0-9a-f]{16}\..*/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  next();
}

export function prepareEnvironmentVariables(source: string, destination: string) {

  // Copy the source directory to the destination
  fs.mkdirSync(destination, { recursive: true});
  fs.cpSync(source, destination, { recursive: true, force: true });

  // Find the main.*.js file in the destination
  const files = fs.readdirSync(destination);

  const mainJs = files.find((file) => file.startsWith('main.') && file.endsWith('.js'));

  if (!mainJs) {
    throw new Error('Cannot find main.*.js file');
  }

  const mainJsPath = path.join(destination, mainJs);
  let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

  // Replace the REPLACE_AZURE_CLIENT_ID with config.azure.clientId
  mainJsContent = mainJsContent.replace('REPLACE_AZURE_CLIENT_ID', rwtConfig.azure.clientId);

  // Replace the REPLACE_AZURE_TENANT_ID with rwtConfig.azure.tenant
  mainJsContent = mainJsContent.replace('REPLACE_AZURE_TENANT_ID', rwtConfig.azure.tenantId);

  fs.writeFileSync(mainJsPath, mainJsContent);

  // Gzip the main.*.js file
  const mainJsGz = mainJsPath + '.gz';
  const gzip = gzipSync(mainJsContent);
  fs.writeFileSync(mainJsGz, gzip);
}

function handleGzip(projectRoot: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // If accept-encoding doesn't contain gzip, don't compress
    if (!req.headers['accept-encoding']?.includes('gzip')) {
      next();
      return;
    }

    // For index.html, compress and return if root path
    if (req.url == '/') {
      req.url = '/index.html';
    }

    let contentType: string;

    switch (path.extname(req.url)) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      default:
        next();
        return;
    }

    const newUrl = req.url + '.gz';

    if (!fs.existsSync(path.join(projectRoot, newUrl))) {
      console.warn('Cannot gzip asset', newUrl);

      next();
      return;
    }

    req.url = newUrl;

    res.set('Content-Encoding', 'gzip');
    res.set('Content-Type', contentType);
    next();
  };
}

export function staticFiles(projectRoot: string) {
  const router = express.Router();

  router.get('/', handleGzip(projectRoot));
  router.get('*.js', cacheHash, handleGzip(projectRoot));
  router.get('*.css', cacheHash, handleGzip(projectRoot));
  router.get('*.png', cacheHash);
  router.get('*.svg', handleGzip(projectRoot));
  router.use(express.static(projectRoot));

  return router;
}

export function indexHtmlFallback(projectRoot: string) {
  const router = express.Router();

  // For every route, log it
  router.use((req, res, next) => {
    // If the route is /api, /assets, continue
    if (req.url.startsWith('/api') || req.url.startsWith('/assets')) {
      next();
      return;
    }

    // If the route is a file (ie: has a dot in the last part), continue
    if (req.url.match(/.*\..*/)) {
      next();
      return;
    }

    // Now serve index.html
    console.log(`Was serving: ${req.url}, now serving index.html`);

    res.sendFile('index.html', { root: projectRoot });
  });

  return router;
}
