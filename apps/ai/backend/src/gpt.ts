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
import { AzureCliCredential, DefaultAzureCredential, TokenCredential } from '@azure/identity';
import axios from 'axios';
import { aiConfig } from './aiconfig';

export type ModelName = '35' | '4o';

let azureCredential: TokenCredential;

if (process.env.AZ_USE_CLI === 'true') {
  azureCredential = new AzureCliCredential();
} else {
  azureCredential = new DefaultAzureCredential();
}

export async function callAzureGpt(model: ModelName, request: GptRequest, streamCallback?: (chunk: string) => void, endCallback?: () => void) {
  const shouldStream = streamCallback !== undefined && endCallback !== undefined;

  let authHeaders: Record<string, string>;

  // If the API Key exists in AZURE_OPENAI_KEY, use that, otherwise, try and authenticate using the Azure SDK
  if (aiConfig.openai.key) {
    authHeaders = {
      'api-key': aiConfig.openai.key,
    };
  } else {
    const accessToken = await azureCredential.getToken('https://cognitiveservices.azure.com/.default');

    authHeaders = {
      Authorization: `Bearer ${accessToken.token}`,
    };
  }

  const response = await axios.post(
    `${aiConfig.openai.endpoint}/openai/deployments/${model}/chat/completions?api-version=2024-02-01`,
    {
      ...request,
      stream: shouldStream,
    },
    {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      responseType: shouldStream ? 'stream' : 'json',
    }
  );

  if (shouldStream) {
    response.data.on('data', streamCallback);
    response.data.on('end', endCallback);
  }

  return response;
}

export interface GptRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GptRequest {
  messages: GptRequestMessage[];
  tool_choice: unknown;
  tools: unknown;
}
