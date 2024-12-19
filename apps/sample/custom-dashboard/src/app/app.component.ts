import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { detectColorScheme } from '@nx/uxlib';
import { teamsDarkTheme, teamsLightTheme } from '@fluentui/tokens';
import { setTheme } from '@fluentui/web-components';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'sample-custom-dashboard';

  constructor() {
    // const isDark = document.defaultView ? detectColorScheme(document.defaultView) === 'dark' : false;
    const isDark = false;

    const theme = isDark ? teamsDarkTheme : teamsLightTheme;

    setTheme(theme);

    // Set some CSS properties
    if (!isDark) {
      document.documentElement.style.setProperty('--microsoftLogoFont', '#737373');
    } else {
      document.documentElement.style.setProperty('--microsoftLogoFont', 'white');
    }
  }
}
