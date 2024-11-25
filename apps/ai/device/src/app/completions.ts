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
// const gpt35 = 'gpt-3.5-turbo';
const gpt35 = 'gpt-4o';

export function openaiSummary(summaryText: string) {
  const systemMessage = `You are an AI system designed to assist users in creating accurate reports from their descriptions of industrial incidents. Your task is to:

  1. Listen to the user's description of the incident carefully.
  2. Generate a detailed description based solely on the information provided by the user. Do not add, infer, or embellish any details not explicitly mentioned. For instance, if the user says "a crack appeared in the pavement," do not assume or add information about the size, length, or cause of the crack unless it is provided.
  3. In cases where the user's description is vague or lacks specific details, you may ask clarifying questions to the user to obtain the necessary information. Avoid making assumptions or filling in gaps with fabricated details.
  4. Ensure that your responses are in passive voice and provide an accurate and straightforward account of the incident as described by the user.

  The response should contain the description only and nothing else.
  
  Remember, your primary role is to reflect the user's description as accurately as possible, without adding any information that has not been provided by the user.

  You must not end the response with a question. If things are vague, state that they are unknown. The application will follow up for refinement if necessary.
  `;

  return {
    model: gpt35,
    messages: [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: summaryText,
      },
    ],
    stream: true,
  };
}

export function openaiExtractSummary(description: string) {
  const systemMessage = `Summarise the supplied description of a fault the user has just reported. The summary should be a single sentence that captures the essence of the description. The response should contain the summary and nothing else.

  Try to limit this to 7 words or less.
  `;

  return {
    model: gpt35,
    messages: [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: description,
      },
    ],
    stream: true,
  };
}

/** Ask OpenAI to refine the description based on a user statement */
export function openaiRefineReport(description: string, newDescription: string) {
  const systemMessage = `You are an AI system designed to assist users in refining a report of an industrial incident. The user has already provided a description, and categories for the report and now wishes to refine the description further with specific suggestions. Your task is to:

  1. Understand the user's suggestions for refining the description. These suggestions may involve adding text to the beginning or end, or altering the description altogether.
  2. Integrate these suggestions into the existing description to create a revised, coherent description. Ensure that the final description is a standalone paragraph that combines both the original and new information.
  3. Maintain a passive tone in the revised description. For example, convert "I suggest adding a note about the broken railing" to "A note about the broken railing is suggested to be added."
  4. In case of any contradictions between the original description and the user's suggestions, seek to resolve them while prioritizing clarity and accuracy.
  5. Ensure that the revised description is complete in itself, clear, and understandable without requiring external context. It should not be a sentence fragment and should include all necessary information, even if some of it is repeated from the original description.
  
  Your response should present a revised, comprehensive, and standalone description of the incident, incorporating the user's refinements while adhering to the guidelines of passive voice and completeness.

  The response should contain the description only and nothing else.

  You must not end the response with a question. If things are vague, state that they are unknown. The application will follow up for refinement if necessary.
  `;

  const messages = [
    {
      role: 'system',
      content: systemMessage,
    },
    ...generateCurrentStatusUserMessages(description),
    {
      role: 'user',
      content: `The suggestions by the user to be incorporated into the description: "${newDescription}"`,
    },
  ];

  console.log(messages);

  return {
    model: gpt35,
    messages,
    stream: true,
  };
}

export function openaiAnswerQuestion(description: string, question: string, answer: string) {
  const systemMessage = `You are an AI system designed to assist users in refining a report of an industrial incident. The user has already provided a description for the report. Your current task is to further refine the description with additional information obtained from the user's answer to a discovery question. Follow these guidelines:

  1. Integrate the user's response to the discovery question into the existing description. Ensure that the new information is woven seamlessly into the current narrative without disrupting the flow or context.
  2. Maintain the continuity and completeness of the report. The revised description should be thorough, incorporating all relevant elements from the existing description as well as the new information provided.
  3. Use a passive voice in the revised description. Convert active statements from the user into passive constructions. For example, if the user says, "I noticed the crack widening over time," the description should be updated to "The crack was observed to be widening over time."
  4. In case of any redundant information, refine the description to avoid repetition while ensuring all critical details are included.
  5. The resulting description must be a standalone, coherent paragraph. It should encapsulate both the initial and new information, providing a complete picture of the incident.
  
  For example, if the user answers that the crack in the pavement is approximately 2 feet long, update the description to incorporate this detail, such as 'A crack, approximately 2 feet in length, was observed in the pavement.'
  
  Your goal is to generate an updated, comprehensive description that accurately reflects the original report and the new information provided by the user.

  The response should contain the updated description only and nothing else. Make sure not to lose any information that was previously captured.

  You must not end the response with a question. If things are vague, state that they are unknown. The application will follow up for refinement if necessary.
  `;

  const messages = [
    {
      role: 'system',
      content: systemMessage,
    },
    ...generateCurrentStatusUserMessages(description),
    {
      // The question asked was
      role: 'user',
      content: `The question was: "${question}"`,
    },
    {
      // The answer was
      role: 'user',
      content: `The answer was: "${answer}"`,
    },
  ];

  console.log(messages);

  return {
    model: gpt35,
    messages,
    stream: true,
  };
}

export function openaiExtractIntent(phrase: string, intents: string[]) {
  const systemMesasge = `You are a system for analysing intent for an incoming phrase. This is for an assistant. The number of intents is limited. A user will speak a phrase and you need to identify which intent the user wishes to speak.

  If you cannot identify the intent, specify "INVALID".`;

  const intentMessage = 'The supported intents are: ' + intents.map((intent) => `"${intent}"`).join(', ');

  const messages = [
    {
      role: 'system',
      content: systemMesasge,
    },
    {
      role: 'system',
      content: intentMessage,
    },
    {
      role: 'user',
      content: phrase,
    },
  ];

  return {
    model: gpt35,
    messages,
    tool_choice: { type: 'function', function: { name: 'extract_intent' } },
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_intent',
          description: 'Extract the intent from the phrase',
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                description: 'The identified intent',
              },
            },
            required: ['intent'],
          },
        },
      },
    ],
  };
}

export function openaiExtractWikipediaSearch(description: string) {
  const systemMessage = `You are a system for extracting a search term from a user's request to look up information on Wikipedia. The user will request a search term and you will extract the topic from the request.
  
  The system will then lookup a wikipedia page based on the topic.

  You need to remove any sentences from this and just extract a topic.

  For example: "I want to know about the electric furnace" should return "electric furnace" as the topic.

  For example: "Tell me about the electric furnace" should return "electric furnace" as the topic.

  Do not include the words "Tell me about" in the topic. This is to be a simple search string result.
  `;

  const messages = [
    {
      role: 'system',
      content: systemMessage,
    },
    {
      role: 'user',
      content: description,
    },
  ];

  return {
    model: gpt35,
    messages,
    tool_choice: { type: 'function', function: { name: 'extract_search' } },
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_search',
          description: 'Extract the search topic',
          parameters: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'The search topic',
              },
            },
            required: ['topic'],
          },
        },
      },
    ],
  };
}

export function openaiExtractSendMessage(description: string) {
  const systemMesasge = `You are an AI voice assistant for extracting information for a new Microsoft Teams message.
  The user will request the message and you will extra the names of the participants and the message body.
  The message should be readable and not include the recipient name in the message.

  For example:
  "Send a message to Chris, I'm going to be running a few minutes late."
  The participant is "Chris" and the mesage body will be "I'm going to be running a few minutes late."

  Ensure that the message is formatted appropriately and reads as if it was typed out. It should not include the recipient name in the message.

  Make sure the first letter is capitalized in the message body.
`;

  const messages = [
    {
      role: 'system',
      content: systemMesasge,
    },
    {
      role: 'user',
      content: description,
    },
  ];

  return {
    model: gpt35,
    messages,
    tool_choice: { type: 'function', function: { name: 'extract_message' } },
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_message',
          description: 'Extract the message body and recipient',
          parameters: {
            type: 'object',
            properties: {
              participants: {
                type: 'array',
                description: 'Array of participants in the meeting',
                items: {
                  type: 'string',
                },
              },
              body: {
                type: 'string',
                description: 'The message body',
              },
            },
            required: ['participants', 'body'],
          },
        },
      },
    ],
  };
}

export function openaiExtractMeetingSummary(description: string) {
  const systemMesasge = `You are a system for extracting the names of meeting participants for an upcoming meeting.
  The user will request the meeting and you will extra the names of the participants and a possible meeting subject.

  For example:
  
  "I'd like to create a meeting at 3pm tomorrow for myself, Kieren and Sally to discuss the weather"
  
  You will identify the participants as "Kieren" and "Sally". You will ignore "myself" as that is assuming.
  Additionally, the subject will be "Discuss the Weather". You will also extract information about the date to be passed into another parser.

  Ensure that any subject is capitalized correctly.
  
  Try and ensure that the date is readable and has little uncertainty.`;

  const messages = [
    {
      role: 'system',
      content: systemMesasge,
    },
    {
      role: 'user',
      content: description,
    },
  ];

  return {
    model: gpt35,
    messages,
    tool_choice: { type: 'function', function: { name: 'extract_meeting_summary' } },
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_meeting_summary',
          description: 'Extract the meeting summary from the description',
          parameters: {
            type: 'object',
            properties: {
              participants: {
                type: 'array',
                description: 'Array of participants in the meeting',
                items: {
                  type: 'string',
                },
              },
              subject: {
                type: 'string',
                description: 'The subject of the meeting',
              },
              date: {
                type: 'string',
                description: 'The date of the meeting',
              },
            },
            required: ['participants', 'subject', 'date'],
          },
        },
      },
    ],
  };
}

/** Ask OpenAI to generate 3 probing questions to ask the user. These will help refine the description of the problem some more */
export function openaiGenerateQuestions(description: string) {
  const systemMessage = `You are a system for helping a user create a report from an issue that they have found. At this point the user has defined the description for the report.
        The user wishes to refine the report more and to do this they should answer a series of questions that can help to refine the description.
        Your job is to generate 3 questions that can help to refine the description.`;

  const messages = [
    {
      role: 'system',
      content: systemMessage,
    },
    ...generateCurrentStatusUserMessages(description),
  ];

  console.log(messages);

  return {
    model: gpt35,
    messages,
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_questions',
          description: 'Generate probing questions to ask the user',
          parameters: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                description: 'Array of questions to ask the user.',
                items: {
                  type: 'string',
                },
              },
            },
            required: ['questions'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'generate_questions' } },
  };
}

function generateCurrentStatusUserMessages(description: string) {
  return [
    {
      role: 'user',
      content: `The report description currently is: "${description}"`,
    },
  ];
}
