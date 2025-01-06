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

export const AzureBaseEndpoint = 'https://login.microsoftonline.com';
export const AzureOrgzniations = 'organizations';

export const AzureOrganizationsEndpoint = `${AzureBaseEndpoint}/organizations`;
export const AzureJwksUri = `${AzureOrganizationsEndpoint}/discovery/v2.0/keys`;
export const AzureTokenEndpoint = `${AzureOrganizationsEndpoint}/oauth2/v2.0/token`;
export const AzureDeviceCodeEndpoint = `${AzureOrganizationsEndpoint}/oauth2/v2.0/devicecode`;

export const generateAzureDeviceCodeEndpoint = (tenantId: string) => `${AzureBaseEndpoint}/${tenantId}/oauth2/v2.0/devicecode`;
export const generateAzureTokenEndpoint = (tenantId: string) => `${AzureBaseEndpoint}/${tenantId}/oauth2/v2.0/token`;
export const generateAzureJwksUri = (tenantId: string) => `${AzureBaseEndpoint}/${tenantId}/discovery/v2.0/keys`;
