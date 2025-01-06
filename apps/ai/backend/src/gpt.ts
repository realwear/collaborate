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
