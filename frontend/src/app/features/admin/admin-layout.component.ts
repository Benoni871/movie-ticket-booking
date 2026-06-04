import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div id="adminLayout__div__root" class="min-h-screen flex bg-slate-100">
      <aside id="adminLayout__aside__sidebar" class="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div id="adminLayout__div__brandSection" class="px-6 py-5 border-b border-slate-800">
          <div id="adminLayout__div__brand" class="flex items-center gap-2">
            <span id="adminLayout__span__brandIconWrap" class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 text-white shadow-md">
              <app-icon id="adminLayout__icon__brand" name="film" [size]="18"></app-icon>
            </span>
            <span id="adminLayout__span__brandText" class="text-lg font-bold tracking-tight">CineBook</span>
          </div>
          <div id="adminLayout__div__consoleTag" class="text-xs text-slate-400 mt-1 inline-flex items-center gap-1">
            <app-icon id="adminLayout__icon__consoleTag" name="shield-check" [size]="11"></app-icon>
            Admin Console
          </div>
        </div>

        <!-- Theater identity -->
        @if (auth.currentUser()?.theaterName) {
          <div id="adminLayout__div__theaterIdentity" class="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
            <div id="adminLayout__div__theaterLabel" class="text-[10px] uppercase tracking-widest text-indigo-300">Managing</div>
            <div id="adminLayout__div__theaterName" class="text-sm font-bold text-white mt-0.5 truncate">{{ auth.currentUser()?.theaterName }}</div>
            @if (auth.currentUser()?.theaterLocation) {
              <div id="adminLayout__div__theaterLocation" class="text-[11px] text-slate-400 mt-0.5 truncate">{{ auth.currentUser()?.theaterLocation }}</div>
            }
          </div>
        } @else {
          <div id="adminLayout__div__noTheaterBanner" class="px-4 py-3 m-3 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <div id="adminLayout__div__noTheaterTitle" class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <app-icon id="adminLayout__icon__noTheaterWarning" name="alert-triangle" [size]="13"></app-icon>
              No theater yet
            </div>
            <div id="adminLayout__div__noTheaterDesc" class="text-[11px] text-amber-200/80 mt-1">Set up your theater to start scheduling shows.</div>
            <button type="button" id="adminLayout__button__openSetup" name="adminLayout__button__openSetup" (click)="openSetup()"
                    class="group/btn mt-2 w-full inline-flex items-center justify-center gap-1 text-[11px] font-bold bg-amber-400 text-amber-900 rounded-md py-1.5 hover:bg-amber-300 transition">
              <app-icon id="adminLayout__icon__openSetup" name="plus" [size]="12" class="group-hover/btn:rotate-90 transition"></app-icon>
              Set up theater
            </button>
          </div>
        }

        <nav id="adminLayout__nav__main" class="flex-1 px-3 py-4 space-y-1">
          <a id="adminLayout__a__navMovies" routerLink="/admin/movies" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="group flex items-center gap-2.5 px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            <app-icon id="adminLayout__icon__navMovies" name="film" [size]="16" class="text-slate-400 group-hover:text-indigo-300 transition"></app-icon>
            Manage Movies
          </a>
          <a id="adminLayout__a__navShows" routerLink="/admin/shows" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="group flex items-center gap-2.5 px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            <app-icon id="adminLayout__icon__navShows" name="calendar-clock" [size]="16" class="text-slate-400 group-hover:text-indigo-300 transition"></app-icon>
            Manage Shows
          </a>
          <a id="adminLayout__a__navBookings" routerLink="/admin/bookings" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="group flex items-center gap-2.5 px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            <app-icon id="adminLayout__icon__navBookings" name="ticket" [size]="16" class="text-slate-400 group-hover:text-indigo-300 transition"></app-icon>
            All Bookings
          </a>
          <a id="adminLayout__a__navAnalytics" routerLink="/admin/analytics" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="group flex items-center gap-2.5 px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            <app-icon id="adminLayout__icon__navAnalytics" name="bar-chart-3" [size]="16" class="text-slate-400 group-hover:text-indigo-300 transition"></app-icon>
            Analytics
          </a>
        </nav>
        <div id="adminLayout__div__userSection" class="px-6 py-4 border-t border-slate-800 text-xs">
          <div id="adminLayout__div__userInfo" class="flex items-center gap-2">
            <span id="adminLayout__span__userInitials" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-bold">
              {{ initials() }}
            </span>
            <div id="adminLayout__div__userInfoText" class="leading-tight min-w-0">
              <div id="adminLayout__div__loggedInAs" class="text-slate-400">Logged in as</div>
              <div id="adminLayout__div__username" class="font-semibold text-white truncate">{{ auth.currentUser()?.username }}</div>
            </div>
          </div>
          <button id="adminLayout__button__logout" name="adminLayout__button__logout" class="group/btn mt-3 w-full inline-flex justify-center items-center gap-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 transition"
                  (click)="logout()">
            <app-icon id="adminLayout__icon__logout" name="log-out" [size]="14" class="group-hover/btn:translate-x-0.5 transition"></app-icon>
            Logout
          </button>
        </div>
      </aside>
      <main id="adminLayout__main__content" class="flex-1 px-8 py-8 overflow-auto">
        <router-outlet id="adminLayout__routerOutlet__main"></router-outlet>
      </main>
    </div>

    <!-- Setup theater modal -->
    @if (setupOpen()) {
      <div id="adminLayout__div__setupOverlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
           (click)="closeSetup()">
        <div id="adminLayout__div__setupModal" class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h3 id="adminLayout__h3__setupTitle" class="text-lg font-bold text-slate-900">Set up your theater</h3>
          <p id="adminLayout__p__setupSubtitle" class="text-sm text-slate-500 mt-1">
            This is the cinema you'll manage. Moviegoers will see this name on the showtimes you schedule.
          </p>

          <form id="adminLayout__form__setup" name="adminLayout__form__setup" (ngSubmit)="saveTheater()" #f="ngForm" class="mt-5 space-y-4">
            <div id="adminLayout__div__setupNameWrap">
              <label id="adminLayout__label__setupName" class="label">Theater name <span id="adminLayout__span__setupNameRequired" class="text-rose-500">*</span></label>
              <input class="input" id="adminLayout__input__setupName" name="tName" [(ngModel)]="setupForm.name" required placeholder="e.g. PVR Downtown" />
            </div>
            <div id="adminLayout__div__setupLocationWrap">
              <label id="adminLayout__label__setupLocation" class="label">Location</label>
              <input class="input" id="adminLayout__input__setupLocation" name="tLoc" [(ngModel)]="setupForm.location" placeholder="e.g. 12 Main St, Boston" />
            </div>

            @if (setupError()) {
              <div id="adminLayout__div__setupError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">{{ setupError() }}</div>
            }

            <div id="adminLayout__div__setupActions" class="flex justify-end gap-3 pt-2">
              <button type="button" id="adminLayout__button__setupCancel" name="adminLayout__button__setupCancel" class="btn-secondary" (click)="closeSetup()" [disabled]="setupSaving()">Cancel</button>
              <button type="submit" id="adminLayout__button__setupSubmit" name="adminLayout__button__setupSubmit" class="btn-primary" [disabled]="setupSaving() || !f.valid">
                {{ setupSaving() ? 'Saving…' : 'Create theater' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  setupOpen = signal(false);
  setupSaving = signal(false);
  setupError = signal<string | null>(null);
  setupForm = { name: '', location: '' };

  initials(): string {
    const u = this.auth.currentUser()?.username ?? '?';
    return u.slice(0, 2).toUpperCase();
  }

  openSetup() {
    this.setupOpen.set(true);
    this.setupError.set(null);
    this.setupForm = { name: '', location: '' };
  }
  closeSetup() {
    if (this.setupSaving()) return;
    this.setupOpen.set(false);
  }
  saveTheater() {
    this.setupSaving.set(true);
    this.setupError.set(null);
    this.auth.setupTheater(this.setupForm.name, this.setupForm.location).subscribe({
      next: () => {
        this.setupSaving.set(false);
        this.closeSetup();
      },
      error: e => {
        this.setupSaving.set(false);
        this.setupError.set(e?.error?.error ?? 'Failed to create theater');
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
