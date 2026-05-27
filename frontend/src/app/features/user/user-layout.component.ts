import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { Booking } from '../../core/models/booking.model';

const REMINDER_WINDOW_MIN = 30;
const POLL_MS = 30_000;             // check every 30s for time drift
const REFRESH_MS = 5 * 60_000;      // re-fetch bookings every 5 min
const DISMISS_KEY = 'cinebook.dismissedReminders';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <header class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-8">
            <a routerLink="/movies" class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-sm">C</span>
              <span class="text-lg font-bold text-slate-900 tracking-tight">CineBook</span>
            </a>
            <nav class="hidden sm:flex gap-1 text-sm font-medium">
              <a routerLink="/movies" routerLinkActive="text-indigo-600 bg-indigo-50"
                 class="text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md transition">Movies</a>
              <a routerLink="/theaters" routerLinkActive="text-indigo-600 bg-indigo-50"
                 class="text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md transition">Theaters</a>
              <a routerLink="/my-bookings" routerLinkActive="text-indigo-600 bg-indigo-50"
                 class="text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md transition">My Bookings</a>
            </nav>
          </div>
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-2 text-sm">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {{ initials() }}
              </span>
              <div class="leading-tight">
                <div class="text-slate-900 font-semibold text-xs">{{ auth.currentUser()?.username }}</div>
                <div class="text-[10px] text-slate-500 uppercase tracking-wider">{{ auth.currentUser()?.role }}</div>
              </div>
            </div>
            <button class="btn-secondary" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <!-- 30-minute reminder banner -->
      @if (reminderBooking()) {
        <div class="sticky top-16 z-20 bg-gradient-to-r from-amber-400 to-amber-300 border-b border-amber-500 shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-900/10 text-amber-900 text-lg shrink-0 animate-pulse">⏰</span>
              <div class="text-sm text-amber-900 min-w-0">
                <div class="font-bold truncate">
                  "{{ reminderBooking()!.show.movie.title }}" starts in {{ reminderMinutes() }} minute(s)
                </div>
                <div class="text-xs text-amber-900/80 truncate">
                  Seats {{ reminderBooking()!.seats || '—' }} · {{ reminderBooking()!.show.showTime | date:'EEE, MMM d · h:mm a' }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a routerLink="/my-bookings" class="text-xs font-bold text-amber-900 hover:underline whitespace-nowrap">
                View ticket →
              </a>
              <button type="button" (click)="dismissReminder()"
                      class="h-8 w-8 rounded-full hover:bg-amber-900/10 text-amber-900 flex items-center justify-center transition"
                      aria-label="Dismiss">×</button>
            </div>
          </div>
        </div>
      }

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grow">
        <router-outlet></router-outlet>
      </main>

      <footer class="border-t border-slate-200 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">C</span>
            <span class="font-semibold text-slate-700">CineBook</span>
            <span>· © {{ year }}</span>
          </div>
          <div class="flex gap-4">
            <a class="hover:text-indigo-600 transition cursor-pointer">Help</a>
            <a class="hover:text-indigo-600 transition cursor-pointer">Privacy</a>
            <a class="hover:text-indigo-600 transition cursor-pointer">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private bookingService = inject(BookingService);

  year = new Date().getFullYear();
  private bookings = signal<Booking[]>([]);
  private now = signal<number>(Date.now());
  private dismissed = signal<Set<number>>(this.loadDismissed());

  private tickHandle: any = null;
  private refreshHandle: any = null;

  // Pick the soonest upcoming booking that's inside the reminder window
  // and hasn't been dismissed.
  reminderBooking = computed<Booking | null>(() => {
    const n = this.now();
    const dismissed = this.dismissed();
    const windowMs = REMINDER_WINDOW_MIN * 60_000;
    const candidates = this.bookings()
      .filter(b => b.status === 'CONFIRMED')
      .filter(b => !dismissed.has(b.id))
      .map(b => ({ b, ms: new Date(b.show.showTime).getTime() - n }))
      .filter(x => x.ms > 0 && x.ms <= windowMs)
      .sort((a, b) => a.ms - b.ms);
    return candidates.length > 0 ? candidates[0]!.b : null;
  });

  reminderMinutes = computed(() => {
    const b = this.reminderBooking();
    if (!b) return 0;
    const ms = new Date(b.show.showTime).getTime() - this.now();
    return Math.max(1, Math.ceil(ms / 60_000));
  });

  ngOnInit() {
    this.fetchBookings();
    this.tickHandle = setInterval(() => this.now.set(Date.now()), POLL_MS);
    this.refreshHandle = setInterval(() => this.fetchBookings(), REFRESH_MS);
  }

  ngOnDestroy() {
    if (this.tickHandle) clearInterval(this.tickHandle);
    if (this.refreshHandle) clearInterval(this.refreshHandle);
  }

  private fetchBookings() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.bookingService.getByUser(uid).subscribe({
      next: list => this.bookings.set(list),
      error: () => {}
    });
  }

  dismissReminder() {
    const b = this.reminderBooking();
    if (!b) return;
    const next = new Set(this.dismissed());
    next.add(b.id);
    this.dismissed.set(next);
    this.saveDismissed(next);
  }

  initials(): string {
    const u = this.auth.currentUser()?.username ?? '?';
    return u.slice(0, 2).toUpperCase();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private loadDismissed(): Set<number> {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      return raw ? new Set<number>(JSON.parse(raw)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  }

  private saveDismissed(s: Set<number>) {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(s)));
  }
}
