import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user/user-layout.component').then(m => m.UserLayoutComponent),
    children: [
      { path: 'movies', loadComponent: () => import('./features/user/movie-grid.component').then(m => m.MovieGridComponent) },
      { path: 'movies/:id/book', loadComponent: () => import('./features/user/show-select.component').then(m => m.ShowSelectComponent) },
      { path: 'theaters', loadComponent: () => import('./features/user/theaters.component').then(m => m.TheatersComponent) },
      { path: 'my-bookings', loadComponent: () => import('./features/user/my-bookings.component').then(m => m.MyBookingsComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'movies' },
      { path: 'movies', loadComponent: () => import('./features/admin/manage-movies.component').then(m => m.ManageMoviesComponent) },
      { path: 'shows', loadComponent: () => import('./features/admin/manage-shows.component').then(m => m.ManageShowsComponent) },
      { path: 'bookings', loadComponent: () => import('./features/admin/all-bookings.component').then(m => m.AllBookingsComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
