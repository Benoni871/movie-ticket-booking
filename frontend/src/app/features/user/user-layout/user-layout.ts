import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';
import { IconComponent } from '../../../shared/icon/icon';
import { LocationService } from '../../../core/services/location.service';
import { TheaterService } from '../../../core/services/theater.service';

const REMINDER_WINDOW_MIN = 30;
const POLL_MS = 30_000;             // check every 30s for time drift
const REFRESH_MS = 5 * 60_000;      // re-fetch bookings every 5 min
const DISMISS_KEY = 'cinebook.dismissedReminders';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './user-layout.html',
  styleUrls: ['./user-layout.css']
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
