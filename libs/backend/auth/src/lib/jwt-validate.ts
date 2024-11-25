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
