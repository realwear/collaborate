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
