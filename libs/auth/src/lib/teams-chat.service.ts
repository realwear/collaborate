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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { imageToBase64, resizeImageBlob } from '@nx/uxlib';
import { DeviceCode2Service } from './device-code2.service';

@Injectable()
export class TeamsChatService {
  readonly isLoggedIn$: Observable<boolean>;

  constructor(private deviceCodeService: DeviceCode2Service, private httpClient: HttpClient) {
    this.isLoggedIn$ = deviceCodeService.isLoggedIn$;
  }

  async sendSelfMessage(message: string, image?: Blob | null, attachment?: { url: string; id: string; name: string } | null) {
    // const accessToken = await firstValueFrom(this.deviceCodeService.accessToken$);
    const accessToken = await this.deviceCodeService.fetchAccessToken(['Chat.ReadWrite']);

    if (!accessToken) return;

    const messageBody = {
      body: {
        contentType: 'html',
        content: message,
      },
      hostedContents: [] as unknown[],
      attachments: [] as unknown[],
    };

    const o = this.httpClient.post('https://graph.microsoft.com/v1.0/me/chats/48:notes/messages', messageBody, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    if (image) {
      const resizedImage = await resizeImageBlob(image, 1920, 1080);

      const base64 = await imageToBase64(resizedImage);

      messageBody.hostedContents.push({
        '@microsoft.graph.temporaryId': '1',
        contentBytes: base64,
        contentType: 'image/jpeg',
      });

      messageBody.body.content += `<div><img src="../hostedContents/1/$value"></div>`;
    }

    if (attachment) {
      messageBody.attachments.push({
        id: attachment.id,
        contentType: 'reference',
        contentUrl: attachment.url,
        name: attachment.name,
      });

      messageBody.body.content += `<div><attachment id="${attachment.id}"></attachment></div>`;
    }

    await firstValueFrom(o);
  }

  async uploadFile(blob: Blob, name: string, contentType: string, share: boolean): Promise<UploadFileResponse> {
    const accessToken = await this.deviceCodeService.fetchAccessToken(['Files.ReadWrite']);

    const uploadedResult = await firstValueFrom(
      this.httpClient.put<UploadFileResponse>(`https://graph.microsoft.com/v1.0/me/drive/special/approot:%2F${name}:/content`, blob, {
        headers: {
          'Content-Type': contentType,
          Authorization: `Bearer ${accessToken}`,
        },
      })
    );

    if (share) {
      // Share the link
      await firstValueFrom(
        this.httpClient.post(`https://graph.microsoft.com/v1.0/me/drive/items/${uploadedResult.id}/createLink`, null, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );
    }

    return uploadedResult;
  }

  async createMeeting(subject: string, start: Date, end: Date, participants: { name: string; email: string }[]) {
    // Get the current timzone (ie: 'UTC')
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const request = {
      subject: subject,
      start: {
        dateTime: start.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: timeZone,
      },
      attendees: [
        ...participants.map((p) => ({
          emailAddress: {
            address: p.email,
            name: p.name,
          },
          type: 'required',
        })),
      ],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    };

    const accessToken = await this.deviceCodeService.fetchAccessToken(['Calendars.ReadWrite']);

    if (!accessToken) return;

    const o = this.httpClient.post('https://graph.microsoft.com/v1.0/me/events', request, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    await firstValueFrom(o);
  }
}

export interface FoundPeopleResponse {
  value: {
    id: string;
    displayName: string;
    userPrincipalName: string;
    scoredEmailAddresses: { address: string; relevanceScore: number }[];
  }[];
}

export interface UploadFileResponse {
  eTag: string;
  webUrl: string;
  id: string;
}
