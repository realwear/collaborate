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
