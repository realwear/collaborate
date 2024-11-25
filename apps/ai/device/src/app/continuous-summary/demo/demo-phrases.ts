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
const demo1 = [
  "Hey, welcome aboard for the night. Let's quickly run through the important stuff so you're all prepped.",
  "First off, Mr. Wallace in room 102 is having a tough time with his arthritis pain tonight. We've given him his medication, but it might take a bit to kick in. Just keep an eye on him, maybe check in once in a while to see if he needs anything else for the pain.",
  "In 105, we have Mrs. Patel. She's been quite disoriented today, likely a UTI. We've started her on antibiotics, but she's still a bit confused. It's important to ensure she stays in bed, so she doesn't fall.",
  "Then there's Mr. Chen in 108. He's diabetic and had some hypoglycemia earlier. We've managed to stabilize his sugar levels, but it's critical to monitor him closely throughout the night.",
  "Room 111 has our new admission, Mrs. Fisher. She's post-op from a hip replacement. Keep an eye on her pain management and make sure she's comfortable. Also, watch for any signs of infection around the surgery site.",
  'The rest of the patients are doing okay, just the usual care and monitoring through the night. All the notes are updated in the system for your reference.',
  "Feel free to reach out if you have any questions or run into anything unexpected. I'm just a call away.",
  'Alright, I think that covers everything. Have a good shift, and take care of our folks.',
];

const demo2 = [
  "Hey there, welcome to the night shift. Let's go through the main updates so you're all set. Overall, the ward's been calm, but we've got a few cases that need extra attention tonight.",
  "Starting with Mrs. Henderson in room 204, she's been pretty restless due to her dementia worsening lately. We've adjusted her meds this evening, hoping it'll help her sleep through the night. Just keep a close eye, make sure she doesn't wander off.",
  "In 207, Mr. Singh had a bit of a scare this afternoon with some breathing troubles. Turns out it was a minor COPD flare-up. We've got him on a nebulizer treatment plan for the next few days. He's stabilized now, but monitor his oxygen levels closely, just in case.",
  "Room 210, that's where you'll find the Anderson twins.",
  'Both came down with a stomach bug.',
  "They're a bit dehydrated, so we're keeping them on IV fluids overnight. They're quite the pair, always looking out for each other, so they might be more at ease with frequent check-ins.",
  "Lastly, we've got Mrs. O'Reilly in 215. She had a fall last night, no fractures, thankfully, but she's bruised and a bit shaken. We've got her pain managed, but let's make sure she's comfortable and try to encourage her to get some rest.",
  "The rest of our patients are stable, just the usual rounds and meds to manage. Everything's detailed in the charts, but don't hesitate to ask if anything pops up or if you need a hand with anything.",
  "Alright, that's the gist of it.",
];

const demo3 = [
  "So let's get you up to speed. The ward has been quite steady. Nothing too chaotic. First, we've got Mr. Thompson in bed three. He came in with chest pains early in the morning. It turned out to be a mild heart attack.",
  "We stabilized him, but keep an eye on his vitals. He's still a bit anxious about the whole ordeal.",
  "In Bed 6, we've got Mrs. Garcia. She had a fall, suspected fractured hip. The X-ray confirms it, and she's scheduled for surgery tomorrow morning. We've put her on pain management, but she's still pretty uncomfortable, so maybe check in on her and see how she's doing.",
  "And there's something else you need to keep a tab on. We've had a few flu cases. They seem to be a bit severe, beds 9 and 10, Jenkins and a little guy, Tim Evans, they're both on antivirals and fluids. But with the way the flu has been going around, just make sure to follow up with the isolation protocols.",
  'The rest of the patients are stable, mostly observation and routine checks. The charts are all updated, so you should have all the specifics.',
];

const demo4 = [
  "Good evening, ready for the night shift? Let's go through the key updates so you're all set.",
  "We have Mrs. Abrams in room 201, she's been quite agitated this evening, possibly due to her Alzheimer's. We've administered her usual evening medication, but please keep a close watch for any further signs of distress.",
  "Mr. Johnson in room 205 is recovering from a minor stroke. His speech is still a bit slurred, and he's showing some weakness on his right side. Encourage him with his exercises, but don't push him too hard.",
  "In room 209, there's Mrs. Lee. She's been dealing with chronic heart failure and has been a bit more short of breath than usual today. We've adjusted her diuretics, so please monitor her fluid intake and output closely.",
  "Then there's Mr. Ramirez in room 212. He had a fall two days ago and is still quite sore. He's been a bit reluctant to get out of bed since then, but it's important to keep him mobile to avoid any further complications. Maybe give him a bit of encouragement.",
  "Lastly, room 214 is currently occupied by Mrs. Gupta, who's here for observation due to dehydration. She's on IV fluids, and we're hoping to see some improvement by morning. Just make sure she's comfortable and reassess her hydration status periodically.",
  "That's pretty much the rundown for our critical cases tonight. As always, check the charts for any updates or specific instructions.",
  "Don't hesitate to reach out if anything comes up, or if you need a second opinion on anything. I'll be around until midnight.",
  'Alright, that should be everything. Have a great shift and take good care of our residents.',
];

const demo5 = [
  "Hey there, ready to take over? Let's go through tonight's need-to-knows.",
  "First up, we have Ms. Thompson in room 303. She's had a bit of a rough day with her COPD acting up. We've increased her oxygen and she's currently stable, but keep a close eye on her breathing and oxygen saturation.",
  "Next, in room 307, is Mr. Davies. He's been quite lethargic today, possibly a side effect of his new medication. Make sure he's drinking enough water and encourage him to eat something, even if it's just a little.",
  "Room 310 has Mrs. Kumar, who's recovering from a urinary tract infection. She's on antibiotics and seems to be improving, but it's important to monitor her for any signs of confusion or discomfort.",
  "In room 312, we've got Mr. Sanchez. He had a fall earlier in the week and is still a bit shaken. His mobility is limited, so he'll need help with getting to and from the bathroom. Let's make sure we're assisting him to prevent another fall.",
  "Lastly, we have Mrs. Elliot in room 315. She's been experiencing some anxiety lately, especially at night. We've got a mild sedative prescribed for her, but let's try to use non-pharmacological methods to calm her down before resorting to medication.",
  "The rest of our patients are stable. Just the usual rounds, meds, and checks throughout the night. Everything's detailed in their charts, but if you have any questions, don't hesitate to ask.",
  "That's about it. Thanks for being here tonight. Let's keep things running smoothly and reach out if you need anything. Have a good shift!",
];

export function getRandomHealthwareDictation() {
  const phrases = [demo1, demo2, demo3, demo4, demo5];
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}

export const demoSummary = `**Patient Update:**

  - **Mr. Thompson**
    - **Bed:** 3
    - **Condition:** Admitted with chest pains, mild heart attack.
    - **Notes:** Stabilized, continue monitoring vitals. Patient is anxious.
  
  - **Mrs. Garcia** 
    - **Bed:** 6
    - **Condition:** Suspected fractured hip, confirmed by X-ray. Scheduled for surgery tomorrow morning.
    - **Notes:** Requires pain management, check in on her discomfort.
  
  - **Others**
    - **Jenkins (Bed 9) and Tim Evans (Bed 10)**
      - **Condition:** Flu cases, on antivirals and fluids.
      - **Action:** Follow isolation protocols for flu cases.
  
  *Note:* Rest of the patients are stable. Regular observation and checks to be continued.`;

export const automotiveDemo1 = [
  "We're handling the handover for a 2019 Toyota Camry, VIN number ABC1234XYZ.",
  "First off, the client, Mrs. Jane Doe, brought the vehicle in for a routine service and inspection. Let's go through the checklist and note the condition and any services performed.",
  'Oil Change: Completed. We used synthetic oil, as recommended for this model. The next oil change is due in 5,000 miles or six months, whichever comes first.',
  "Tire Inspection: All tires were inspected. The front tires showed uneven wear, so we performed a rotation. The tire pressure was adjusted to the manufacturer's recommended levels.",
  "Brake System: The brake pads have about 40% wear remaining. No service needed at this time, but it's something to keep an eye on for the next visit.",
  'Battery Check: The battery is in good condition, holding charge well. No replacement needed.',
  'Fluid Levels: All fluid levels were checked and topped off. This includes brake fluid, transmission fluid, coolant, and windshield washer fluid.',
  'Lights and Signals: All checked. The rear left signal bulb was replaced.',
  "We also performed a general safety inspection, which didn't reveal any issues. The vehicle is in great shape, but I've recommended a tire alignment during the next visit to prevent further uneven wear.",
  "The total cost of today's service came to $300. Mrs. Doe has been informed and agreed to the charges. The vehicle is now ready for pickup. We've advised Mrs. Doe to schedule the next service appointment in six months or if any issues arise before then.",
  "Lastly, let's note any additional comments: Mrs. Doe mentioned a squeaking noise when turning sharply to the left. We checked the power steering system and found no issues. The noise might have been related to the tire condition before rotation. We'll monitor this during the next service.",
  "Alright, that wraps up the vehicle handover report for the 2019 Toyota Camry. Please make sure this is filed under Mrs. Jane Doe's customer profile and a copy is sent to her email. Thanks!",
];
