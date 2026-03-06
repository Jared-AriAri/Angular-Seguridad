import { Routes } from '@angular/router';

import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

import { AppShellComponent } from './layout/app-shell';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout';

import { HomePage } from './home/home.page';
import { GroupPage } from './pages/group/group.page';
import { UserPage } from './pages/user/user.page';

export const routes: Routes = [

  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },

  {
    path: 'app',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomePage },
      { path: 'group', component: GroupPage },
      { path: 'user', component: UserPage }
    ]
  },

  { path: '**', redirectTo: '' }

];