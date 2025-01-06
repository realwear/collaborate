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
import * as https from 'https';
import express, { Request, Response } from 'express';
import { aiConfig } from './aiconfig';

export const sendGridRouter = express.Router();

sendGridRouter.post('/send-email', async (req: Request, res: Response) => {
  console.log('send email');

  try {
    const sendgridApiKey = aiConfig.sendgridKey;
    if (!sendgridApiKey) {
      return res.status(500).json({ error: 'SendGrid API key is missing' });
    }

    const sendgridUrl = 'https://api.sendgrid.com/v3/mail/send';

    const sendgridData = {
      personalizations: [
        {
          to: [
            {
              email: 'sales@realwear.com',
            },
          ],
          subject: 'RealWear AI Lead',
        },
      ],
      from: {
        email: 'noreply@realwear.com',
      },
      content: [
        {
          type: 'text/plain',
          value: `${req.body.userInfo.name} is using the AI demo and wants to learn more about RealWear AI.
          THIS IS AN IMPORTANT LEAD, do it now!
          Email: ${req.body.userInfo.email}
          `,
        },
      ],
    };

    const sendgridResponse = await new Promise((resolve, reject) => {
      const httpsRequest = https.request(
        sendgridUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sendgridApiKey}`,
          },
        },
        (httpsResponse) => {
          let data = '';
          httpsResponse.on('data', (chunk) => {
            data += chunk;
          });
          httpsResponse.on('end', () => {
            if (httpsResponse.statusCode >= 200 && httpsResponse.statusCode < 300) {
              resolve({ statusCode: httpsResponse.statusCode, data });
            } else {
              reject(new Error(`Unexpected status code: ${httpsResponse.statusCode}, Response: ${data}`));
            }
          });
        }
      );

      httpsRequest.write(JSON.stringify(sendgridData));
      httpsRequest.end();

      httpsRequest.on('error', reject);
    });

    res.json({ status: 'success', sendgridResponse });
  } catch (error) {
    console.error('Error sending email:', error); // Log the error for debugging purposes
    res.status(500).json({ error: 'An error occurred while sending the email', details: error.message });
  }
});
