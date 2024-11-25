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
