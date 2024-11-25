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
import { CommunicationIdentityClient } from '@azure/communication-identity';

const app = express();

const identityClient = new CommunicationIdentityClient(process.env.ACS_CONNECTION_STRING);

app.post('/api/acs/token', async (_, res) => {
  try {
    const user = await identityClient.createUser();
    const tokenResponse = await identityClient.getToken(user, ['voip']);
    res.json({ token: tokenResponse.token, userId: user.communicationUserId });
  } catch (error) {
    console.error('Error generating token: ', error);
    res.status(500).send('Error generating token');
  }
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
