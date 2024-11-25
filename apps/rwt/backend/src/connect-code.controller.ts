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
import { WebSocket } from 'ws';
import { createRedisClient, getRedisClient } from './redis';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class ConnectCodeControllerImpl {
  // Dictionary of user ids to sockets
  readonly sockets: { [kid: string]: WebSocket | undefined } = {};

  // Dictionary of kids to public keys (local cache)
  readonly publicKeys: { [kid: string]: string } = {};

  readonly _subscribeClient = createRedisClient();

  async init() {
    await this._subscribeClient.connect();

    // Subscribe to the channel
    await this._subscribeClient.subscribe('connect-code-request', (val: string) => {
      // Parse to json kid (string) and request (ConnectCodeRequest)
      const { kid, request } = JSON.parse(val);

      // Get the socket for the user
      const socket = this.sockets[kid];

      // If the socket exists
      if (!socket) {
        return;
      }

      // Send the device code to the device
      socket.send(JSON.stringify(request));
    });
  }

  /**
   * Broadcasts a new meeting url to a device with the specified connect code
   * If the code doesn't exist, return false.
   *
   * Note: A successful broadcast does NOT guarantee that the device has received the connection.
   * @param connectCode The connect code to attempt
   * @param request The request containing information about the new meeting
   * @returns True if broadcast, False if not.
   */
  async sendMeetingToDevice(connectCode: string, request: ConnectCodeRequest) {
    // Find the kid for the device code
    const kid = await this.getKidForConnectCode(connectCode);

    // If the kid does not exist
    if (!kid) {
      console.debug('Invalid connect code');
      return false;
    }

    // Check that the particular kid is online
    const exists = await getRedisClient().exists(`device:${kid}:connected`);

    if (!exists) {
      return false;
    }

    await getRedisClient().publish('connect-code-request', JSON.stringify({ kid, request }));

    return true;
  }

  /**
   * Validates a connect code and checks if the client is currently online
   */
  async validateConnectCode(connectCode: string) {
    // Find the kid for the device code
    const kid = await this.getKidForConnectCode(connectCode);

    // If the kid does not exist
    if (!kid) {
      return false;
    }

    // Check that the particular kid is online
    const exists = await getRedisClient().exists(`device:${kid}:connected`);

    return exists;
  }

  async savePublicKeyForDevice(publicKey: string) {
    // Validate the key
    if (!validatePublicKey(publicKey)) {
      return null;
    }

    // Concat the public key and a random 20 digit string
    const publicKeyWithSalt = publicKey + crypto.randomBytes(10).toString('hex');

    // SHA256 hash the public key
    const hash = crypto.createHash('sha256').update(publicKeyWithSalt).digest('hex').substring(0, 20);

    // Store the public key
    await getRedisClient().set(`device:${hash}`, publicKey);

    return hash;
  }

  // Generate a connect code for the kid
  async generateConnectCode(kid: string, codeLength: number, expiryInSeconds: number): Promise<string | null> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Generate a new connect code
      const connectCode = generateNewConnectCode(codeLength);

      // Store the connect code with expiry and only store if does not exist
      const result = await getRedisClient().set(`connect-code:${connectCode}`, kid, {
        EX: expiryInSeconds,
        NX: true,
      });

      // If it already existed, try again
      if (!result) {
        continue;
      }

      return connectCode;
    }
  }

  // Fetch the kid for the connect code
  async getKidForConnectCode(connectCode: string): Promise<string | null> {
    // Get the kid for the connect code
    return getRedisClient().get(`connect-code:${connectCode}`);
  }

  // Burn the connect code so it cannot be used again
  async burnConnectCode(connectCode: string): Promise<unknown> {
    // Delete the connect code
    return getRedisClient().del(`connect-code:${connectCode}`);
  }

  // Validate the JWT for device. The kid resolves to a public key in the database which can be used to validate
  // Return the decoded payload (or null if invalid)
  async validateJwt(rawJwt: string): Promise<jwt.Jwt | null> {
    try {
      // Decode the JWT
      const decoded = jwt.decode(rawJwt, { complete: true });

      if (!decoded) {
        return null;
      }

      // Get the key id from the JWT
      const kid = decoded.header.kid;

      let publicKey = this.publicKeys[kid];

      // Get the public key from the database
      if (!publicKey) {
        publicKey = await getRedisClient().get(`device:${kid}`);
      }

      // If the public key does not exist
      if (!publicKey) {
        return null;
      }

      // Cache the public key
      this.publicKeys[kid] = publicKey;

      // Create a key object from the public key string
      const keyObject = crypto.createPublicKey(publicKey);

      // Verify the JWT
      const verified = jwt.verify(rawJwt, keyObject, { algorithms: ['RS256'] });

      // If the JWT is not verified
      if (!verified) {
        return null;
      }

      // Return the decoded payload
      return decoded;
    } catch (e) {
      // TODO - Check to see if this is the correct error handling
      if (e instanceof jwt.TokenExpiredError) {
        console.debug('Token expired');
        throw e;
      }
      console.error(e);
      return null;
    }
  }

  async saveSocketForUser(kid: string, webSocket: WebSocket) {
    // Append the userid to the dictionary
    this.sockets[kid] = webSocket;

    // Save a flag that the user is connected
    await getRedisClient().set(`device:${kid}:connected`, 'true');
  }

  async getSocketForUser(kid: string) {
    // Get the socket for the user
    return this.sockets[kid];
  }

  async removeSocketForUser(kid: string) {
    // Remove the socket for the user
    delete this.sockets[kid];

    // Remove the connected flag
    await getRedisClient().del(`device:${kid}:connected`);
  }
}

export const connectCodeController = new ConnectCodeControllerImpl();

// Try and encrypt some data with the public key to validate it
function validatePublicKey(publicKey: string): boolean {
  try {
    // Create a public key object from the provided public key string
    const keyObject = crypto.createPublicKey(publicKey);

    // Attempt to encrypt a small piece of data using the public key
    const data = Buffer.from('test message');
    const encryptedData = crypto.publicEncrypt(keyObject, data);

    // If encryption succeeds, the public key is valid
    return !!encryptedData;
  } catch (err) {
    console.error('Invalid public key:', err.message);
    return false;
  }
}

export function generateNewConnectCode(length: number) {
  // Create an array of all chars from A-Z (excluding O, I, L) and 2-9
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  // Generate a random 6 character string
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Represents the required information for a connection request */
export interface ConnectCodeRequest {
  // The name of the user who initiated the call
  callerName: string;

  // The email of the user who initiated the call
  callerEmail: string;

  // The meeting code for the call (usually the Join URL)
  meetingUrl: string;

  // The meeting subject
  meetingSubject: string;
}

/**
 * A device will register and receive a rolling device code
 * - Web Socket will be generated
 * A device will request a new device code
 * - Via a web socket
 * A user will enter a device code
 * - Code will be validated
 * - Meeting Link will be generated
 * - Signal will be sent via the Web Socket contianing the meeting link and the name of the user who generated the meeting
 */
