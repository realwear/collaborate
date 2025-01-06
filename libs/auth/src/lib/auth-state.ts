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
/**
 * Different state of authentication:
 * - null: Not logged in
 * - 'logged_in': Logged in and has an active access token
 * - 'expired': Logged in but the access token has expired
 * - 'invalid': An error has occurred. The user must logout and in again
 */
export type AuthState = null | 'logged_in' | 'expired' | 'invalid';