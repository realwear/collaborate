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
import { Observable, OperatorFunction, map } from "rxjs";

export function mapToOpenAIFunction<T>(): OperatorFunction<OpenAIResponse, T | undefined> {
  return (source: Observable<OpenAIResponse>) => {
    return source.pipe(
      map((response) => {
        const choice = response.choices[0];

        if (!choice.message.tool_calls) return;

        const toolCall = choice.message.tool_calls[0];

        if (!toolCall) return;

        // console.log(toolCall.function?.arguments);

        const p = JSON.parse(toolCall.function?.arguments ?? 'null');

        if (!p) return undefined;

        return (p as T) || undefined;
      })
    );
  };
}

export interface OpenAIResponse {
    usage: {
      completion_tokens: number,
      prompt_tokens: number,
      total_tokens: number
    },
    choices: {
      index: number;
      message: {
        role: string;
        content: string | null;
        tool_calls: {
          id: string;
          type: string;
          function: {
            name: string;
            arguments: string;
          } | null;
        }[];
      };
    }[];
  }