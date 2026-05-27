import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-slate-100">
      <aside class="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div class="px-6 py-5 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">C</span>
            <span class="text-lg font-bold tracking-tight">CineBook</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">Admin Console</div>
        </div>

        <!-- Theater identity -->
        @if (auth.currentUser()?.theaterName) {
          <div class="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
            <div class="text-[10px] uppercase tracking-widest text-indigo-300">Managing</div>
            <div class="text-sm font-bold text-white mt-0.5 truncate">{{ auth.currentUser()?.theaterName }}</div>
            @if (auth.currentUser()?.theaterLocation) {
              <div class="text-[11px] text-slate-400 mt-0.5 truncate">{{ auth.currentUser()?.theaterLocation }}</div>
            }
          </div>
        } @else {
          <div class="px-4 py-3 m-3 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <div class="text-xs font-semibold text-amber-300">No theater yet</div>
            <div class="text-[11px] text-amber-200/80 mt-1">Set up your theater to start scheduling shows.</div>
            <button type="button" (click)="openSetup()"
                    class="mt-2 w-full text-[11px] font-bold bg-amber-400 text-amber-900 rounded-md py-1.5 hover:bg-amber-300 transition">
              Set up theater
            </button>
          </div>
        }

        <nav class="flex-1 px-3 py-4 space-y-1">
          <a routerLink="/admin/movies" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="block px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            Manage Movies
          </a>
          <a routerLink="/admin/shows" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="block px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            Manage Shows
          </a>
          <a routerLink="/admin/bookings" routerLinkActive="bg-slate-800 text-white border-l-4 border-indigo-500"
             class="block px-4 py-2 text-sm rounded-r hover:bg-slate-800 transition">
            All Bookings
          </a>
        </nav>
        <div class="px-6 py-4 border-t border-slate-800 text-xs">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-bold">
              {{ initials() }}
            </span>
            <div class="leading-tight min-w-0">
              <div class="text-slate-400">Logged in as</div>
              <div class="font-semibold text-white truncate">{{ auth.currentUser()?.username }}</div>
            </div>
          </div>
          <button class="mt-3 w-full inline-flex justify-center items-center rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2"
                  (click)="logout()">Logout</button>
        </div>
      </aside>
      <main class="flex-1 px-8 py-8 overflow-auto">
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Setup theater modal -->
    @if (setupOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
           (click)="closeSetup()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-slate-900">Set up your theater</h3>
          <p class="text-sm text-slate-500 mt-1">
            This is the cinema you'll manage. Moviegoers will see this name on the showtimes you schedule.
          </p>

          <form (ngSubmit)="saveTheater()" #f="ngForm" class="mt-5 space-y-4">
            <div>
              <label class="label">Theater name <span class="text-rose-500">*</span></label>
              <input class="input" name="tName" [(ngModel)]="setupForm.name" required placeholder="e.g. PVR Downtown" />
            </div>
            <div>
              <label class="label">Location</label>
              <input class="input" name="tLoc" [(ngModel)]="setupForm.location" placeholder="e.g. 12 Main St, Boston" />
            </div>

            @if (setupError()) {
              <div class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">{{ setupError() }}</div>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" (click)="closeSetup()" [disabled]="setupSaving()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="setupSaving() || !f.valid">
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
