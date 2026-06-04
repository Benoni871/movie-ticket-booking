import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user/user-layout/user-layout').then(m => m.UserLayoutComponent),
    children: [
      { path: 'movies', loadComponent: () => import('./features/user/movie-grid/movie-grid').then(m => m.MovieGridComponent) },
      { path: 'movies/:id/book', loadComponent: () => import('./features/user/show-select/show-select').then(m => m.ShowSelectComponent) },
      { path: 'theaters', loadComponent: () => import('./features/user/theaters/theaters').then(m => m.TheatersComponent) },
      { path: 'offers', loadComponent: () => import('./features/user/offers/offers').then(m => m.OffersComponent) },
      { path: 'my-bookings', loadComponent: () => import('./features/user/my-bookings/my-bookings').then(m => m.MyBookingsComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'movies' },
      { path: 'movies', loadComponent: () => import('./features/admin/manage-movies/manage-movies').then(m => m.ManageMoviesComponent) },
      { path: 'shows', loadComponent: () => import('./features/admin/manage-shows/manage-shows').then(m => m.ManageShowsComponent) },
      { path: 'bookings', loadComponent: () => import('./features/admin/all-bookings/all-bookings').then(m => m.AllBookingsComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics').then(m => m.AnalyticsComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
