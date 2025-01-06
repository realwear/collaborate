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
import { indexHtmlFallback, prepareEnvironmentVariables, staticFiles } from './static-files';
import path from 'path';
import { handlePdf, pdfInit, pdfShutdown } from './pdf';
import { ModelName, callAzureGpt } from './gpt';
import { AxiosError } from 'axios';
import cors from 'cors';
import { azureAuth, validateGptToken, validateJwtHandler } from '@rw/backend/auth';
import { sendGridRouter } from './sendgrid';
import fs from 'fs';
import { aiConfig } from './aiconfig';

const projectRoot = path.join(__dirname, `../device`);
const projectRootProcessed = path.join(__dirname, `../device-processed`);

if (fs.existsSync(projectRoot)) {
  prepareEnvironmentVariables(projectRoot, projectRootProcessed);
}

const app = express();

// CORS HACK
app.use(cors());

app.use(staticFiles(projectRootProcessed));

app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', azureAuth());

app.use('/api/sendgrid', validateJwtHandler, sendGridRouter);

const callGptWithModel = async (model: ModelName, req: express.Request, res: express.Response) => {
  try {
    // Extract the jwt and validate against the correct scope
    const jwt = req.headers.authorization?.split(' ')[1];
    if (!jwt?.length) {
      res.status(401).json({ error: 'Authorization header missing' });
      return;
    }

    if (!(await validateGptToken(jwt, aiConfig.azure.clientId))) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    if (req.body.stream) {
      let resolveFn: (val: unknown) => void;

      const p = new Promise((resolve) => {
        resolveFn = resolve;
      });

      await callAzureGpt(
        model,
        req.body,
        (chunk) => {
          res.write(chunk);
        },
        () => {
          resolveFn(undefined);
        }
      );

      await p;

      res.end();

      return;
    }

    const response = await callAzureGpt(model, req.body);
    res.json(response.data);
  } catch (error) {
    // If error is AxiosError
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      res.status(axiosError.response?.status || 500).json(axiosError.response?.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

app.post('/api/gpt/4o', async (req, res) => {
  await callGptWithModel('4o', req, res);
});

app.post('/api/gpt/35', async (req, res) => {
  await callGptWithModel('35', req, res);
});

app.post('/api/pdf', handlePdf());

app.use(indexHtmlFallback(projectRoot));

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  pdfInit();

  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  pdfShutdown();
  process.exit();
});

process.on('SIGINT', () => {
  console.log('SIGINT');
  pdfShutdown();
  process.exit();
});
