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