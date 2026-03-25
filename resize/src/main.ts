import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ResizeComponent } from './app/components/resize/resize.component';

bootstrapApplication(ResizeComponent, appConfig)
  .catch((err) => console.error(err));
