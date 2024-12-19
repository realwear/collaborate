import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggedOutBaseComponent } from '@rw/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent extends LoggedOutBaseComponent {
  override signin(): void {
    const graphScopes = ['User.Read', 'openid', 'profile', 'Chat.ReadWrite', 'Files.ReadWrite', 'Calendars.Read'];

    this.deviceCodeService.start(...graphScopes);
  }
}
