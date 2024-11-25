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
import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import fs from 'fs';
import { rwtConfig } from "./config";

export const entraClient = new ConfidentialClientApplication({
  auth: {
    clientId: rwtConfig.azure.clientId,
    clientSecret: rwtConfig.azure.clientSecret,
    authority: 'https://login.microsoftonline.com/organizations'
  },
  system: {
    loggerOptions: { // if debug, then verbose
      logLevel: process.env.DEBUG ? LogLevel.Verbose : LogLevel.Warning,
      loggerCallback: (_, message) => {
        console.log(message);
      }
    }
  },
  cache: {
    cachePlugin: {
      beforeCacheAccess: async (cacheContext) => {
        cacheContext.tokenCache.deserialize(await fs.promises.readFile('.msal-cache.json', 'utf-8'));
      },
      afterCacheAccess: async (cacheContext) => {
        if (!cacheContext.cacheHasChanged) {
          return;
        }

        await fs.promises.writeFile('.msal-cache.json', cacheContext.tokenCache.serialize());
      }
    }
  }
});