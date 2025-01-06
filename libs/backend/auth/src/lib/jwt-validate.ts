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
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { AzureJwksUri } from './constants';
import * as express from 'express';

const client = new JwksClient({
  jwksUri: AzureJwksUri,
});

export async function validateJwtHandler(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).send('Unauthorized: No Authorization header');
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).send('Unauthorized: No token found');
    return;
  }

  try {
    if (!(await validateGptToken(token, process.env.AZURE_CLIENT_ID))) {
      res.status(401).send('Unauthorized: Token validation failed');
      return;
    }

    const decoded = jwt.decode(token, { complete: true });
    console.log(decoded?.payload); // Check if decoded is not null before accessing payload
    next();
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(401).send('Unauthorized: Error validating token');
  }
}

export async function validateGptToken(token: string, audience: string): Promise<boolean> {
  // Extract the kid from the token
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded || typeof decoded !== 'object') {
    console.error('Token decode failed');
    return false;
  }

  if (!audience.startsWith('api://')) {
    audience = `api://${audience}`;
  }

  const kid = decoded.header.kid;

  try {
    // Get the key from the jwks endpoint
    const key = await client.getSigningKey(kid);

    const decodedToken = jwt.verify(token, key.getPublicKey(), { complete: true, audience });

    return !!decodedToken;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return false;
  }
}
