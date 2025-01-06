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
import { AuthError } from '@azure/msal-node';
import { entraClient } from './entra-client';
import axios from 'axios';
import { connectCodeController } from './connect-code.controller';
import jwt from 'jsonwebtoken';
import { rwtConfig } from './config';

export const tabauth = express.Router();

tabauth.get('/tabauth/test', (req, res) => {
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost ? forwardedHost : req.headers.host;

  res.send({
    url: `https://${host}/tabauth`,
  });
});

tabauth.get('/tabauth', async (req, res) => {
  const tid = req.query.tid || null;
  const upn = req.query.upn || null;

  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost ? forwardedHost : req.headers.host;

  const url = await entraClient.getAuthCodeUrl({
    scopes: ['User.Read', 'OnlineMeetings.ReadWrite'],
    // Add /callback to the current incoming url
    redirectUri: `https://${host}/tabauth/callback`,
    prompt: 'consent',
    loginHint: typeof upn === 'string' ? upn : undefined,
    azureCloudOptions: {
      tenant: typeof tid === 'string' ? tid : undefined,
      azureCloudInstance: 'https://login.microsoftonline.com',
    },
  });

  res.redirect(url);
});

tabauth.get('/tabauth/callback', (_, res) => {
  // TODO - Handle failures

  res.sendFile(path.join(__dirname, '/assets/tabauthcallback.html'));
});

/**
 * Checks if the user is able to create a meeting
 */
tabauth.post('/api/createmeeting/check', async (req, res) => {
  try {
    await entraClient.acquireTokenOnBehalfOf({
      scopes: ['https://graph.microsoft.com/OnlineMeetings.ReadWrite'],
      oboAssertion: req.body.token,
    });

    res.status(204).send();
  } catch (e) {
    if (e instanceof AuthError) {
      res.status(400).send(e);
      return;
    }

    res.status(500).send(e);
  }
});

if (!rwtConfig.production) {
  tabauth.post('/api/createmeeting/test', async (req, res) => {
    console.debug('Test request', req.body);
    await connectCodeController.sendMeetingToDevice(req.body.connectCode, {
      callerEmail: req.body.email,
      callerName: req.body.name,
      meetingUrl: req.body.joinUrl,
      meetingSubject: req.body.subject || 'Test meeting',
    });

    // Burn the code so it can't be used again
    await connectCodeController.burnConnectCode(req.body.connectCode);

    res.status(204).send();
  });
}

/**
 * Creates the meeting
 */
tabauth.post('/api/createmeeting', async (req, res) => {
  try {
    // Check if the connect code exists
    if (!(await connectCodeController.validateConnectCode(req.body.connectCode))) {
      res.status(404).send({ error: 'Invalid connect code' });
      return;
    }

    const response = await entraClient.acquireTokenOnBehalfOf({
      scopes: [
        'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
        'https://graph.microsoft.com/User.Read',
      ],
      oboAssertion: req.body.token,
    });

    const meetingSubject = req.body.subject || 'Teams for RealWear meeting';

    const re = await axios.post(
      'https://graph.microsoft.com/v1.0/me/onlineMeetings',
      {
        lobbyBypassSettings: {
          scope: 'everyone',
        },
        subject: meetingSubject,
      },
      {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      }
    );

    // Extract the user email address and name from the token
    const decoded = jwt.decode(req.body.token);

    if (!decoded || typeof decoded === 'string') {
      res.status(400).send({ error: 'Invalid token' });
      return;
    }

    // Send the meeting to the device
    await connectCodeController.sendMeetingToDevice(req.body.connectCode, {
      callerEmail: decoded['upn'],
      callerName: decoded['name'],
      meetingUrl: re.data.joinUrl,
      meetingSubject,
    });

    res.send({
      joinUrl: re.data.joinUrl,
      id: re.data.id,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      res.status(401).send(e);
      return;
    }

    res.status(500).send(e);
  }
});
