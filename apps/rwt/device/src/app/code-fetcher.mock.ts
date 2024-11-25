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