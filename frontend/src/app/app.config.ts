import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

Chart.register(...registerables);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
