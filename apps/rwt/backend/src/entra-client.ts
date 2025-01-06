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