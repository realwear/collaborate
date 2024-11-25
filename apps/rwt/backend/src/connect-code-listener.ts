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
import express from 'express';
import { IncomingMessage } from 'http';
import internal from 'stream';
import { WebSocketServer } from 'ws';
import { connectCodeController } from './connect-code.controller';
import bodyParser from 'body-parser';
import { rwtConfig } from './config';
import { acsIdentityClient } from './acs-client';
import { Jwt, TokenExpiredError } from 'jsonwebtoken';

export const connectCodeListener = express.Router();

const wsServer = new WebSocketServer({
  noServer: true,
});

/** Registers a new Session */
connectCodeListener.post('/register', bodyParser.text(), async (req, res) => {
  const publicKey = req.body;

  if (!publicKey) {
    res.status(400).send({ error: 'Public key is required' });
    return;
  }

  // Save the public key to the database
  const kid = await connectCodeController.savePublicKeyForDevice(publicKey);

  if (!kid) {
    return res.status(400).send({ error: 'Invalid public key' });
  }

  res.send({ kid });
});

connectCodeListener.post('/test', async (req, res) => {
  const connectCode = req.body.code;

  const result = await connectCodeController.sendMeetingToDevice(connectCode, {
    callerEmail: 'test@example.com',
    callerName: 'Test User',
    meetingUrl: 'htts://www.google.com',
    meetingSubject: 'Test Meeting',
  });

  if (!result) {
    res.status(404).send({ error: 'Connect code not found' });
    return;
  }

  res.status(204).send();
});

connectCodeListener.post('/acstoken', async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).send('Unauthorized');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!(await connectCodeController.validateJwt(token))) {
      res.status(401).send('Unauthorized');
      return;
    }
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(400).send('Token expired');
      return;
    }

    res.status(500).send('Internal server error');
  }

  try {
    const user = await acsIdentityClient.createUser();
    const tokenResponse = await acsIdentityClient.getToken(user, ['voip']);
    res.json({ token: tokenResponse.token, userId: user.communicationUserId });
  } catch (error) {
    console.error('Error generating token: ', error);
    res.status(500).send('Error generating token');
  }
});

export async function onUpgradeForProvisionedDevice(request: IncomingMessage, socket: internal.Duplex, head: Buffer) {
  // const token = request.headers['sec-websocket-protocol'];
  // let decoded: Jwt | null;
  // let tokenExpiredError = false;

  // try {
  //   // Validate the JWT
  //   decoded = await connectCodeController.validateJwt(token);
  // } catch (error) {
  //   if (error instanceof TokenExpiredError) {
  //     tokenExpiredError = true;
  //   }

  //   decoded = null;
  // }

  // if (!decoded) {
  //   socket.write(`HTTP/1.1 ${tokenExpiredError ? 400 : 401} Unauthorized\r\n\r\n`);
  //   socket.destroy();
  //   return;
  // }

  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, request);
  });
}

// Handle WebSocket connections
wsServer.on('connection', async (ws) => {
  let decoded: Jwt | null;
  try {
    decoded = await connectCodeController.validateJwt(ws.protocol);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      ws.send('HTTP/1.1 400 Bad Request\r\n\r\n');
      ws.close(3000);
      return;
    }

    decoded = null;
  }

  const kid = decoded?.header?.kid;

  if (!kid) {
    ws.send('HTTP/1.1 401 Unauthorized\r\n\r\n');
    ws.close();
    return;
  }

  await connectCodeController.saveSocketForUser(kid, ws);

  console.log('Client connected', kid);

  ws.on('message', async (message) => {
    if (message.toString('utf-8') === 'ping') {
      // Send pong
      ws.send('pong');
      return;
    }

    // If received "generate", then create a new connect code and return
    if (message.toString('utf-8') === 'generate') {
      // 1 minute expiry default, but try and read from the config
      const expiresInSeconds = tryParseInt(rwtConfig.connectCode.timeout, 60);

      // Date of expiry UTC
      const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);

      console.log('Generating connect code', { kid, expiryDate, expiresInSeconds });

      const connectCode = await connectCodeController.generateConnectCode(kid, 5, expiresInSeconds);

      ws.send(JSON.stringify({ connectCode, expiryDate }));
    }
  });

  ws.on('close', async () => {
    await connectCodeController.removeSocketForUser(kid);

    console.log('Client disconnected', kid);
  });

  // Sending the ready message to the client so it can request the first code
  ws.send('ready');
});

function tryParseInt(value: unknown, defaultValue: number) {
  try {
    // If value is a string
    if (typeof value === 'string') {
      return parseInt(value);
    }

    // If value is a number
    if (typeof value === 'number') {
      return value;
    }

    return defaultValue;
  } catch {
    return defaultValue;
  }
}
