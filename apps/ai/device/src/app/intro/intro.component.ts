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
import { Component, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UxlibModule } from '@nx/uxlib';
import { getRandomAcknowledgedPhrase, getRandomSendReportPhrase } from '../phrases';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { Router, RouterModule } from '@angular/router';
import { CapturedReport } from '../capturedreport.service';
import { DeviceCode2Service, UserInfoResponse } from '@rw/auth';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { openSwitchIndustryDialog } from '../switch-industry/switch-industry.component';
import { Industries, IndustryService } from '../industry.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfigurationService } from '../configuration.service';
import { openRecognitionDialog, TalkerService } from '@rw/speech';
import { HttpClient } from '@angular/common/http';
import { SendEmailComponent } from '../send-email/send-email.component';

@Component({
  selector: 'nx-intro',
  standalone: true,
  imports: [CommonModule, UxlibModule, DialogModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent {
  readonly name$: Observable<string | null>;
  readonly userProfileImage$: Observable<SafeUrl | null>;

  readonly isLoggedIn$: Observable<boolean>;

  readonly hasProfileImage$: Observable<boolean>;

  readonly userInfo$: Observable<UserInfoResponse | null>;

  readonly hasProfile$: Observable<boolean>;

  readonly currentIndustry$ = this.industry.currentIndustry$;

  get handoverCommand() {
    return this.industry.systemMessages.handoverCommand;
  }

  constructor(
    public configService: ConfigurationService,
    private http: HttpClient,
    private deviceCode: DeviceCode2Service,
    private industry: IndustryService,
    private report: CapturedReport,
    private matDialog: MatDialog,
    private dialog: Dialog,
    private router: Router,
    domSanitizer: DomSanitizer,
    @Optional() private talker?: TalkerService
  ) {
    this.userInfo$ = deviceCode.userInfo$;

    this.isLoggedIn$ = this.createLoggedInObs();

    this.name$ = deviceCode.name$;

    this.userProfileImage$ = deviceCode.userProfile$.pipe(
      switchMap((profile) => profile?.getProfilePicture() || of(null)),
      map((blob) => {
        if (!blob) {
          return null;
        }

        return domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      })
    );

    this.hasProfile$ = combineLatest([this.userInfo$, this.userProfileImage$]).pipe(
      map(([userInfo, profileImage]) => userInfo != null && profileImage != null)
    );

    this.hasProfileImage$ = this.userProfileImage$.pipe(map((profileImage) => profileImage != null));
  }

  openSwitch() {
    openSwitchIndustryDialog(this.matDialog).then((newIndustry) => {
      if (!newIndustry) {
        return;
      }

      this.industry.switchIndustry(newIndustry as Industries);
    });
  }

  private createLoggedInObs() {
    return this.deviceCode.isLoggedIn$;
  }

  async signout() {
    this.deviceCode.signout();
    await this.router.navigate(['/login'], { skipLocationChange: true });
  }

  refreshNow() {
    // this.deviceCode.refreshNow();
    this.deviceCode
      .fetchAccessToken(['User.Read'], true)
      .then(() => {
        console.log('Refreshed token');
      })
      .catch((e) => {
        console.error('Failed to refresh token', e);
      });
  }

  async testSpeech() {
    const phrase1 = getRandomAcknowledgedPhrase();
    const phrase2 = 'Sentence 1.';
    const phrase2a = 'Sentence 2.';
    const phrase3 = getRandomSendReportPhrase();

    this.talker?.speakNext(phrase1);
    this.talker?.speakNext(phrase2, false);
    this.talker?.speakNext(phrase2a, false);
    this.talker?.speakNext(phrase3);
  }

  async clearCache() {
    await this.talker?.deleteCache();
  }

  async dictate() {
    openRecognitionDialog(this.dialog);
  }

  async gotoHandover() {
    await this.router.navigate(['/summary']);
  }

  async gotoChemicalSpill() {
    await this.router.navigate(['/spill']);
  }

  async gotoIncidentReport() {
    const summary = await openRecognitionDialog(this.dialog);

    if (!summary?.length) {
      return;
    }

    this.report.reset(summary);

    await this.router.navigateByUrl('/report');
  }

  openSendEmailDialog() {
    this.matDialog.open(SendEmailComponent, {
      minWidth: '800px',
      data: { userInfo: this.userInfo$ },
    });
  }
}
