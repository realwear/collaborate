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
import { BehaviorSubject } from "rxjs";
import { CodeFetcher, ConnectCodeRequest, IncomingCode } from "./code-fetcher";
import { EventEmitter } from "@angular/core";

export class CodeFetcherMock implements Partial<CodeFetcher> {
  currentCode$ = new BehaviorSubject<IncomingCode | null>(null);
  refreshingSoon$ = new BehaviorSubject<boolean>(false);
  codeExpired$ = new BehaviorSubject<boolean>(false);
  incomingCallRequest$ = new EventEmitter<ConnectCodeRequest>();
  dispose = jest.fn();
  start = jest.fn();
  stop = jest.fn();
  createRefreshingSoonObs = jest.fn();
  createFullObs = jest.fn();

  fetchAcsToken = jest.fn();
  generateNewCode = jest.fn();
}