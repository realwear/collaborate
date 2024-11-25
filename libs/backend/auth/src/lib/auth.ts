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
import axios, { AxiosError } from 'axios';
import express, { RequestHandler } from 'express';
import { AzureOrgzniations, generateAzureDeviceCodeEndpoint, generateAzureTokenEndpoint } from './constants';

class AzureAuth {
  private fetchClientId(req: express.Request): string {
    return req.header('x-rw-client-id');
  }

  private fetchTenantId(req: express.Request): string {
    return req.header('x-rw-tenant-id') || AzureOrgzniations;
  }

  private fetchScope(req: express.Request): string {
    return req.header('x-rw-scope');
  }

  handleFetchCode2: RequestHandler = async (req, res) => {
    const formData = new FormData();
    formData.append('client_id', this.fetchClientId(req));
    formData.append('scope', this.fetchScope(req) + ' offline_access');

    console.debug('fetching code for scope', this.fetchScope(req));

    try {
      const result = await axios({
        method: 'post',
        url: generateAzureDeviceCodeEndpoint(this.fetchTenantId(req)),
        data: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      res.send(result.data);
    } catch (e) {
      if (e instanceof AxiosError) {
        res.status(400).send(e.response.data);
        return;
      }

      res.status(500).send(e);
    }
  };

  handeCodeToken2: RequestHandler = async (req, res) => {
    const formData = new FormData();

    formData.append('client_id', this.fetchClientId(req));
    formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
    formData.append('scope', this.fetchScope(req) + ' offline_access');
    formData.append('device_code', req.body.device_code);

    console.log('scope', this.fetchScope(req));

    await this.handleTokenInternal2(req, res, formData);
  };

  handleRefreshToken2: RequestHandler = async (req, res) => {
    const formData = new FormData();

    formData.append('client_id', this.fetchClientId(req));
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', req.body.refresh_token);
    formData.append('scope', this.fetchScope(req) + ' offline_access');

    console.log('scope', this.fetchScope(req));

    this.handleTokenInternal2(req, res, formData);
  };

  private async handleTokenInternal2(req: express.Request, res: express.Response, formData: FormData) {
    try {
      const tokenEndpoint = generateAzureTokenEndpoint(this.fetchTenantId(req));

      console.log('Calling Token Endpoint', tokenEndpoint);

      const result = await axios<TokenResponse>({
        method: 'post',
        url: tokenEndpoint,
        data: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return res.status(result.status).send(result.data);
    } catch (e) {
      if (e instanceof AxiosError) {
        res.status(400).send(e.response.data);
        return;
      }

      console.error(e);

      res.status(500).send(null);
    }
  }
}

export function azureAuth(): RequestHandler {
  const azAuth = new AzureAuth();

  const router = express.Router();

  router.post('/code2', (req, res, next) => azAuth.handleFetchCode2(req, res, next));
  router.post('/token2', (req, res, next) => azAuth.handeCodeToken2(req, res, next));
  router.post('/refresh2', (req, res, next) => azAuth.handleRefreshToken2(req, res, next));

  return router;
}

interface TokenResponse {
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  id_token: string;
}
