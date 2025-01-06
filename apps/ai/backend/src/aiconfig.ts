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
export const aiConfig = {
  azure: {
    clientId: stripQuotes(process.env.AZURE_CLIENT_ID),
    tenantId: stripQuotes(process.env.AZURE_TENANT_ID) || 'organizations',
  },
  speech: {
    key: stripQuotes(process.env.AZURE_SPEECH_KEY),
    region: stripQuotes(process.env.AZURE_SPEECH_REGION),
  },
  openai: {
    key: stripQuotes(process.env.AZURE_OPENAI_KEY),
    endpoint: stripQuotes(process.env.AZURE_OPENAI_ENDPOINT),
  },
  sendgridKey: stripQuotes(process.env.SENDGRID_API_KEY),
};

function stripQuotes(value: string | null | undefined): string | null | undefined {
  if (!value) {
    return value;
  }

  // Remove quotes from the beginning and/or the end of the string if they exists
  if (value.startsWith('"')) {
    value = value.slice(1);
  }

  if (value.endsWith('"')) {
    value = value.slice(0, -1);
  }

  return value;
}
