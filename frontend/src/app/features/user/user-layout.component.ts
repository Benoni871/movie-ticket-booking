import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { Booking } from '../../core/models/booking.model';
import { IconComponent } from '../../shared/icon.component';
import { LocationService } from '../../core/services/location.service';
import { TheaterService } from '../../core/services/theater.service';

const REMINDER_WINDOW_MIN = 30;
const POLL_MS = 30_000;             // check every 30s for time drift
const REFRESH_MS = 5 * 60_000;      // re-fetch bookings every 5 min
const DISMISS_KEY = 'cinebook.dismissedReminders';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div id="userLayout__div__root" class="min-h-screen bg-slate-50 flex flex-col">
      <header id="userLayout__header__main" class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div id="userLayout__div__headerInner" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div id="userLayout__div__headerLeft" class="flex items-center gap-8">
            <a id="userLayout__a__brand" routerLink="/movies" class="flex items-center gap-2 group">
              <span id="userLayout__span__brandIconWrap" class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition">
                <app-icon id="userLayout__icon__brand" name="film" [size]="18"></app-icon>
              </span>
              <span id="userLayout__span__brandText" class="text-lg font-bold text-slate-900 tracking-tight">CineBook</span>
            </a>
            <nav id="userLayout__nav__main" class="hidden sm:flex gap-1 text-sm font-medium">
              <a id="userLayout__a__navMovies" routerLink="/movies" routerLinkActive="text-indigo-600 bg-indigo-50"
                 class="group inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md transition">
                <app-icon id="userLayout__icon__navMovies" name="film" [size]="15" class="text-slate-400 group-hover:text-indigo-500 transition"></app-icon>
                Movies
              </a>
              <a id="userLayout__a__navTheaters" routerLink="/theaters" routerLinkActive="text-indigo-600 bg-indigo-50"
                 class="group inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md transition">
                <app-icon id="userLayout__icon__navTheaters" name="building-2" [size]="15" class="text-slate-400 group-hover:text-indigo-500 transition"></app-icon>
                Theaters
              </a>
              <a id="userLayout__a__navOffers" routerLink="/offers" routerLinkActive="text-rose-600 bg-rose-50"
                 class="group inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-md transition">
                <app-icon id="userLayout__icon__navOffers" name="ticket-percent" [size]="15" class="text-slate-400 group-hover:text-rose-500 group-hover:rotate-12 transition"></app-icon>
                Offers
              </a>
              <a id="userLayout__a__navMyBookings" routerLink="/my-bookings" routerLinkActive="text-indigo-600 bg-indigo-50"
                 class="group inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md transition">
                <app-icon id="userLayout__icon__navMyBookings" name="ticket" [size]="15" class="text-slate-400 group-hover:text-indigo-500 transition"></app-icon>
                My Bookings
              </a>
            </nav>
          </div>
          <div id="userLayout__div__headerRight" class="flex items-center gap-3">
            <!-- Location selector -->
            <div id="userLayout__div__locationSelector" class="relative">
              <button type="button" id="userLayout__button__locationToggle" name="userLayout__button__locationToggle"
                      (click)="toggleLocationMenu()"
                      class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                      [attr.aria-expanded]="locationMenuOpen()"
                      aria-haspopup="listbox"
                      aria-label="Choose location">
                <app-icon id="userLayout__icon__locationToggle" name="map-pin" [size]="14" class="text-indigo-500"></app-icon>
                <span id="userLayout__span__locationToggleLabel" class="max-w-[110px] truncate">{{ selectedLocation() ?? 'All locations' }}</span>
                <app-icon id="userLayout__icon__locationToggleChevron" name="chevron-down" [size]="12" class="text-slate-400 transition" [class.rotate-180]="locationMenuOpen()"></app-icon>
              </button>
              @if (locationMenuOpen()) {
                <div id="userLayout__div__locationMenu" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-slate-200 overflow-hidden z-40"
                     role="listbox">
                  <button type="button" id="userLayout__button__locationAll" name="userLayout__button__locationAll"
                          (click)="pickLocation(null)"
                          class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 transition"
                          [class.bg-indigo-50]="selectedLocation() === null"
                          [class.text-indigo-700]="selectedLocation() === null">
                    <app-icon id="userLayout__icon__locationAll" name="sparkles" [size]="14" class="text-indigo-500"></app-icon>
                    <span id="userLayout__span__locationAllLabel" class="font-semibold">All locations</span>
                  </button>
                  @if (locations().length > 0) {
                    <div id="userLayout__div__locationList" class="border-t border-slate-100 max-h-72 overflow-y-auto">
                      @for (loc of locations(); track loc) {
                        <button type="button" [id]="'userLayout__button__location_' + loc" [name]="'userLayout__button__location_' + loc"
                                (click)="pickLocation(loc)"
                                class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 transition"
                                [class.bg-indigo-50]="selectedLocation() === loc"
                                [class.text-indigo-700]="selectedLocation() === loc">
                          <app-icon [id]="'userLayout__icon__location_' + loc" name="map-pin" [size]="14" class="text-slate-400"></app-icon>
                          <span [id]="'userLayout__span__locationLabel_' + loc" class="truncate">{{ loc }}</span>
                        </button>
                      }
                    </div>
                  } @else {
                    <div id="userLayout__div__locationNone" class="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">No theaters have set a location yet.</div>
                  }
                </div>
              }
            </div>

            <div id="userLayout__div__userInfo" class="hidden sm:flex items-center gap-2 text-sm">
              <span id="userLayout__span__userInitials" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {{ initials() }}
              </span>
              <div id="userLayout__div__userInfoText" class="leading-tight">
                <div id="userLayout__div__username" class="text-slate-900 font-semibold text-xs">{{ auth.currentUser()?.username }}</div>
                <div id="userLayout__div__userRole" class="text-[10px] text-slate-500 uppercase tracking-wider">{{ auth.currentUser()?.role }}</div>
              </div>
            </div>
            <button id="userLayout__button__logout" name="userLayout__button__logout" class="btn-secondary inline-flex items-center gap-1.5 group" (click)="logout()">
              <app-icon id="userLayout__icon__logout" name="log-out" [size]="14" class="text-slate-500 group-hover:text-slate-700 group-hover:translate-x-0.5 transition"></app-icon>
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- 30-minute reminder banner -->
      @if (reminderBooking()) {
        <div id="userLayout__div__reminderBanner" class="sticky top-16 z-20 bg-gradient-to-r from-amber-400 to-amber-300 border-b border-amber-500 shadow-sm">
          <div id="userLayout__div__reminderInner" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div id="userLayout__div__reminderLeft" class="flex items-center gap-3 min-w-0">
              <span id="userLayout__span__reminderIconWrap" class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-900/15 text-amber-900 shrink-0 animate-pulse">
                <app-icon id="userLayout__icon__reminder" name="alarm-clock" [size]="18"></app-icon>
              </span>
              <div id="userLayout__div__reminderText" class="text-sm text-amber-900 min-w-0">
                <div id="userLayout__div__reminderTitle" class="font-bold truncate">
                  "{{ reminderBooking()!.show.movie.title }}" starts in {{ reminderMinutes() }} minute(s)
                </div>
                <div id="userLayout__div__reminderMeta" class="text-xs text-amber-900/80 truncate">
                  Seats {{ reminderBooking()!.seats || '—' }} · {{ reminderBooking()!.show.showTime | date:'EEE, MMM d · h:mm a' }}
                </div>
              </div>
            </div>
            <div id="userLayout__div__reminderRight" class="flex items-center gap-2 shrink-0">
              <a id="userLayout__a__reminderView" routerLink="/my-bookings" class="group inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline whitespace-nowrap">
                View ticket
                <app-icon id="userLayout__icon__reminderView" name="arrow-right" [size]="14" class="group-hover:translate-x-0.5 transition"></app-icon>
              </a>
              <button type="button" id="userLayout__button__reminderDismiss" name="userLayout__button__reminderDismiss" (click)="dismissReminder()"
                      class="h-8 w-8 rounded-full hover:bg-amber-900/15 text-amber-900 flex items-center justify-center transition"
                      aria-label="Dismiss">
                <app-icon id="userLayout__icon__reminderDismiss" name="x" [size]="16"></app-icon>
              </button>
            </div>
          </div>
        </div>
      }

      <main id="userLayout__main__content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grow">
        <router-outlet id="userLayout__routerOutlet__main"></router-outlet>
      </main>

      <footer id="userLayout__footer__main" class="border-t border-slate-200 bg-white">
        <div id="userLayout__div__footerInner" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <div id="userLayout__div__footerBrand" class="flex items-center gap-2">
            <span id="userLayout__span__footerBrandIcon" class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">C</span>
            <span id="userLayout__span__footerBrandText" class="font-semibold text-slate-700">CineBook</span>
            <span id="userLayout__span__footerYear">· © {{ year }}</span>
          </div>
          <div id="userLayout__div__footerLinks" class="flex gap-4">
            <a id="userLayout__a__footerHelp" class="hover:text-indigo-600 transition cursor-pointer">Help</a>
            <a id="userLayout__a__footerPrivacy" class="hover:text-indigo-600 transition cursor-pointer">Privacy</a>
            <a id="userLayout__a__footerTerms" class="hover:text-indigo-600 transition cursor-pointer">Terms</a>
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
  private locationService = inject(LocationService);
  private theaterService = inject(TheaterService);

  year = new Date().getFullYear();
  private bookings = signal<Booking[]>([]);
  private now = signal<number>(Date.now());
  private dismissed = signal<Set<number>>(this.loadDismissed());

  selectedLocation = this.locationService.current;
  locations = signal<string[]>([]);
  locationMenuOpen = signal(false);

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
    this.fetchLocations();
    this.tickHandle = setInterval(() => this.now.set(Date.now()), POLL_MS);
    this.refreshHandle = setInterval(() => this.fetchBookings(), REFRESH_MS);
  }

  private fetchLocations() {
    this.theaterService.getLocations().subscribe({
      next: list => this.locations.set(list ?? []),
      error: () => this.locations.set([])
    });
  }

  toggleLocationMenu() {
    this.locationMenuOpen.update(v => !v);
  }

  pickLocation(loc: string | null) {
    this.locationService.set(loc);
    this.locationMenuOpen.set(false);
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
