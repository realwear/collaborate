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
// import { DateTimeRecognizer } from '@microsoft/recognizers-text-date-time';

// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const DateRecognizers = require('@microsoft/recognizers-text-date-time/dist/recognizers-text-date-time.umd.js');

// export function recognizeDate(input: string): string | null {
//   const r: DateTimeRecognizer = new DateRecognizers.DateTimeRecognizer();

//   const result = r.getDateTimeModel().parse(input);

//   if (!result?.length) {
//     return null;
//   }

//   return result[0].resolution['values'][0].value;
// }