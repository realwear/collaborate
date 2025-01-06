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
const sendReportPhrases = [
  'Do you want to tweak the report or is it ready to go?',
  'Would you like to refine the report or send it as is?',
  'Should we polish the report further or send it off now?',
  'Would you prefer to adjust the report, or shall we dispatch it as is?',
  'Any more refinements needed, or is the report set for sending?',
  'Is the report to your liking, or would you like to make some changes before sending?',
  'Would you like to make any final edits, or is the report good to send?',
  'Are there any last touches needed, or shall we proceed with sending the report?',
  'Do you wish to review and revise the report further, or is it ready for dispatch?',
];

export function getRandomSendReportPhrase() {
  return sendReportPhrases[Math.floor(Math.random() * sendReportPhrases.length)];
}

const acknowledgedPhrases = ['Sure thing', 'Right away', 'On it', "Let's go"];

export function getRandomAcknowledgedPhrase() {
  return acknowledgedPhrases[Math.floor(Math.random() * acknowledgedPhrases.length)];
}

const noReportDetectedPhrases = [
  `I didn't quite get that. To report a fault or set up a meeting, please start by saying  <break strength="x-weak" /> Hey RealWear <break strength="x-weak" />.`,
  `Oops, nothing was detected. Remember to start with  <break strength="x-weak" /> Hey RealWear <break strength="x-weak" /> for fault reporting or meeting arrangements.`,
  `Apologies, I missed what you said. Say  <break strength="x-weak" /> Hey RealWear <break strength="x-weak" /> to initiate a fault report or schedule a meeting.`,
  `Sorry, I didn't catch your request. Please begin with  <break strength="x-weak" /> Hey RealWear <break strength="x-weak" /> to describe your fault or create a meeting.`,
  `Hmm, I didn't hear anything. For fault reports or meeting setups, kindly say  <break strength="x-weak" /> Hey RealWear <break strength="x-weak" /> to start.`,
];

export function getRandomNoReportDetectedPhrase() {
  return noReportDetectedPhrases[Math.floor(Math.random() * noReportDetectedPhrases.length)];
}

const welcomePhrases = [
  `Welcome to RealWear, say <break strength="x-weak" />Report Fault <break strength="x-weak" /> to begin.`,
  `Hello from RealWear, to start, say <break strength="x-weak" />Report Fault <break strength="x-weak" />.`,
];

export function getRandomWelcomePhrase() {
  return welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)];
}

const answerQuestionHintPhrases = [
  'Would you like to answer or skip the question?',
  'Answer this question or move on?',
  'Would you like to proceed or skip?',
  'Respond to this or skip ahead?',
  'Shall we answer this or go to the next?',
  'Care to answer this or skip it?',
  'Shall we answer this or skip?',
  'Do you want to answer this or skip?',
  'Engage with this question or skip?',
  'Would you prefer answering or skipping?',
  'Choose to answer or bypass?',
];

export function getRandomAnswerQuestionHintPhrase() {
  return answerQuestionHintPhrases[Math.floor(Math.random() * answerQuestionHintPhrases.length)];
}

const startAnswerQuestionPhrases = [
  'Help me refine the report by answering this question.',
  "Let's sharpen the report. Please answer the following.",
  'To refine our report, could you answer this question?',
  'Help fine-tune the report by responding to this.',
  'Assist in honing the report with your answer.',
  'Aid in perfecting the report by answering this.',
];

export function getRandomStartAnswerQuestionPhrase() {
  return startAnswerQuestionPhrases[Math.floor(Math.random() * startAnswerQuestionPhrases.length)];
}

const movingOnPhrases = [
  'Alright, moving on.',
  'Got it, next question?',
  'Understood, what about this?',
  "Okay, let's try another.",
  'Skipping. How about this?',
];

export function getRandomMovingOnPhrase() {
  return movingOnPhrases[Math.floor(Math.random() * movingOnPhrases.length)];
}

const genericRefineReportPhrases = [
  `Say <break strength="x-weak" /> More Information <break strength="x-weak" /> to add details or <break strength="x-weak" /> All Done <break strength="x-weak" /> to review and send.`,
  `To enhance your report, say <break strength="x-weak" /> More Information <break strength="x-weak" /> or <break strength="x-weak" /> All Done <break strength="x-weak" /> to finalize.`,
  `Feel free to add more by saying <break strength="x-weak" /> More Information <break strength="x-weak" /> or <break strength="x-weak" /> All Done <break strength="x-weak" /> to proceed.`,
  `For further details, say <break strength="x-weak" /> More Information <break strength="x-weak" /> or choose <break strength="x-weak" /> All Done <break strength="x-weak" /> to submit.`,
  `Want to elaborate? Say <break strength="x-weak" /> More Information <break strength="x-weak" /> or  <break strength="x-weak" />All Done <break strength="x-weak" /> to send as is.`,
];

export function getRandomGenericRefineReportPhrase() {
  return genericRefineReportPhrases[Math.floor(Math.random() * genericRefineReportPhrases.length)];
}

const reportSentPhrases = [
  'Great, your report has been sent. You can refine further, or start again',
  "Awesome, we've dispatched your report. Feel free to refine more or begin anew.",
  'Your report is on its way. Continue refining or opt to start over.',
  'Successfully sent your report. You can further refine or restart the process.',
  'Report sent! Keep refining or choose to restart from scratch.',
  "We've forwarded your report. Further adjustments can be made, or you can start fresh.",
];

export function getRandomReportSentPhrase() {
  return reportSentPhrases[Math.floor(Math.random() * reportSentPhrases.length)];
}
