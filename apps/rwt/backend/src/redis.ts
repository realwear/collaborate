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
import { createClient } from "redis";
import { rwtConfig } from "./config";

const redisClient = createRedisClient();

export function createRedisClient() {
  return createClient({
    url: rwtConfig.redisConnectionString
  });
}

export function getRedisClient() {
  return redisClient;
}

export async function redisConnect() {
  await redisClient.connect();
}