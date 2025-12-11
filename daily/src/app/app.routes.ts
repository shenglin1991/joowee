import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DailyComponent } from './pages/daily/daily.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'daily',
    component: DailyComponent,
  },
];
