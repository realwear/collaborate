import { Route } from '@angular/router';
import { IntroComponent } from './intro/intro.component';
import { loginAuthGuard } from '@rw/auth';
import { LoginComponent } from './login/login.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: IntroComponent,
    canActivate: [loginAuthGuard('/login')],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
