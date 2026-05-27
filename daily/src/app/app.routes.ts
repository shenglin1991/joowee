import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DailyComponent } from './pages/daily/daily.component';
import { PresenterComponent } from './pages/presenter/presenter.component';
import { LoginComponent } from './pages/login/login.component';
import { teamGuard } from './guards/team.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    canActivate: [teamGuard],
    component: HomeComponent,
  },
  {
    path: 'daily',
    canActivate: [teamGuard],
    component: DailyComponent,
  },
  {
    path: 'presenter',
    canActivate: [teamGuard],
    component: PresenterComponent,
  },
];
