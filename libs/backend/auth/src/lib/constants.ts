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

export const AzureBaseEndpoint = 'https://login.microsoftonline.com';
export const AzureOrgzniations = 'organizations';

export const AzureOrganizationsEndpoint = `${AzureBaseEndpoint}/organizations`;
export const AzureJwksUri = `${AzureOrganizationsEndpoint}/discovery/v2.0/keys`;
export const AzureTokenEndpoint = `${AzureOrganizationsEndpoint}/oauth2/v2.0/token`;
export const AzureDeviceCodeEndpoint = `${AzureOrganizationsEndpoint}/oauth2/v2.0/devicecode`;

export const generateAzureDeviceCodeEndpoint = (tenantId: string) => `${AzureBaseEndpoint}/${tenantId}/oauth2/v2.0/devicecode`;
export const generateAzureTokenEndpoint = (tenantId: string) => `${AzureBaseEndpoint}/${tenantId}/oauth2/v2.0/token`;
export const generateAzureJwksUri = (tenantId: string) => `${AzureBaseEndpoint}/${tenantId}/discovery/v2.0/keys`;
