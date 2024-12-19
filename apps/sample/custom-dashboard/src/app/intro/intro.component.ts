import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FluentButtonCustomComponent } from '../fluent-button-wrapper.component';
import { DeviceCode2Service } from '@rw/auth';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { openRecognitionDialog } from '@rw/speech';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule, FluentButtonCustomComponent, DialogModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent {
  constructor(private deviceCodeService: DeviceCode2Service, private httpClient: HttpClient, private router: Router, private dialog: Dialog) {}

  hello() {
    this.fetchUserToken().then(console.log);
  }

  async signout() {
    this.deviceCodeService.signout();
    await this.router.navigate(['/login'], { skipLocationChange: true });
  }

  startHelp() {
    openRecognitionDialog(this.dialog).then(console.log);
  }

  private async fetchUserToken() {
    try {
      const userGraphToken = await this.deviceCodeService.fetchAccessTokenForAcs();

      // Get the id token and find the oid
      const idToken = this.deviceCodeService.getIdToken();

      if (!idToken) {
        return null;
      }

      // Find the oid field in the payload
      const decoded = JSON.parse(atob(idToken.split('.')[1]));

      if (!decoded?.oid?.length) {
        return null;
      }

      const response = await firstValueFrom(
        this.httpClient.post<{ token: string; expiresOn: string }>('/api/acs/usertoken', {
          token: userGraphToken,
          oid: decoded.oid,
        })
      );

      return response;
    } catch {
      return null;
    }
  }
}
