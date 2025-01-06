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
import * as path from 'path';
import { tabauth } from './tabauth';
import { onUpgradeForProvisionedDevice, connectCodeListener } from './connect-code-listener';
import { redisConnect } from './redis';
import { connectCodeController } from './connect-code.controller';
import { azureAuth, validateJwtHandler } from '@rw/backend/auth';
import { prepareEnvironmentVariables, staticFiles } from './static-files';
import fs from 'fs';
import cors from 'cors';
import { acsIdentityClient } from './acs-client';
import { rwtConfig } from './config';

// Prepare the environment variables to rewrite any client-side code that needs them
const rwtDeviceSource = path.join(__dirname, `../rwtdevice`);
const rwtDeviceSourceProcessed = path.join(__dirname, `../rwtdevice-processed`);

// Only process the files if the source exists, there's a chance on DEBUG that the source doesn't exist
if (fs.existsSync(rwtDeviceSource)) {
  prepareEnvironmentVariables(rwtDeviceSource, rwtDeviceSourceProcessed);
}

const app = express();

// Allow CORS for the static files
app.use(
  cors({
    origin: '*',
    methods: ['GET'],
  }),
  staticFiles(rwtDeviceSourceProcessed)
);

app.use('/teamsaddon', staticFiles(path.join(__dirname, `../rwtteamsaddon/browser`)));

app.use(express.json());

app.use(tabauth);
app.use('/api/provisioned', connectCodeListener);

app.use('/api/auth', azureAuth());

app.post('/api/acs/token', validateJwtHandler, async (_, res) => {
  try {
    const user = await acsIdentityClient.createUser();
    const tokenResponse = await acsIdentityClient.getToken(user, ['voip']);
    res.json({ token: tokenResponse.token, userId: user.communicationUserId });
  } catch (error) {
    console.error('Error generating token: ', error);
    res.status(500).send('Error generating token');
  }
});

app.post('/api/acs/usertoken', async (req, res) => {
  // Get the user token from the request
  const userToken = req.body.token;

  if (!userToken || typeof userToken !== 'string') {
    res.status(400).send('User token is required');
    return;
  }

  try {
    const user = await acsIdentityClient.getTokenForTeamsUser({
      teamsUserAadToken: userToken,
      clientId: rwtConfig.azure.clientId,
      userObjectId: req.body.oid,
    });

    res.json({ ...user });
  } catch (error) {
    console.error('Error generating token: ', error);
    res.status(500).send('Error generating token');
  }
});

async function startup() {
  await redisConnect();
  await connectCodeController.init();

  const port = process.env.PORT || 3333;
  const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
  });
  server.on('error', console.error);

  server.on('upgrade', async (request, socket, head) => {
    if (request.url?.startsWith('/api/provisioned/subscribe')) {
      await onUpgradeForProvisionedDevice(request, socket, head);
      return;
    }

    socket.destroy();
  });
}

startup();
