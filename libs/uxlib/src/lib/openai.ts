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