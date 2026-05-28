import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ShowService } from '../../core/services/show.service';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { InterestService } from '../../core/services/interest.service';
import { LocationService } from '../../core/services/location.service';
import { Show } from '../../core/models/show.model';
import { Movie } from '../../core/models/movie.model';
import { timeUntil } from '../../shared/booking-utils';
import { toYouTubeEmbedUrl } from '../../shared/youtube-utils';
import { IconComponent } from '../../shared/icon.component';

const TAX_RATE = 0.04;

const COLS_PER_ROW = 10;
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface Seat {
  id: string;
  row: string;
  col: number;
  booked: boolean;
}

@Component({
  selector: 'app-show-select',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe, IconComponent],
  template: `
    <a routerLink="/movies" class="group inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
      <app-icon name="arrow-left" [size]="14" class="group-hover:-translate-x-0.5 transition"></app-icon>
      Back to movies
    </a>

    @if (loading()) {
      <div class="text-slate-500 mt-6">Loading…</div>
    } @else {
      @if (movieHeader(); as m) {
        <div class="mt-4 mb-6 flex items-end gap-4">
          @if (m.posterUrl) {
            <img [src]="m.posterUrl" alt="" class="hidden sm:block h-24 w-16 rounded-md object-cover ring-1 ring-slate-200" />
          }
          <div>
            <h2 class="text-2xl font-bold text-slate-900">{{ m.title }}</h2>
            <p class="text-sm text-slate-500">{{ m.genre }} · {{ m.durationMins }} min</p>
            @if (movieLanguageList().length > 0) {
              <div class="flex flex-wrap gap-1 mt-2">
                @for (lang of movieLanguageList(); track lang) {
                  <span class="inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[11px] font-semibold">
                    {{ lang }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        @if (trailerSafeUrl()) {
          <div class="mb-6">
            <div class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-400 mb-2">
              <app-icon name="play-circle" [size]="14"></app-icon>
              Trailer
            </div>
            <div class="aspect-video w-full max-w-2xl rounded-xl overflow-hidden bg-black ring-1 ring-slate-200 shadow-sm">
              <iframe [src]="trailerSafeUrl()" class="w-full h-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      title="Trailer preview"></iframe>
            </div>
          </div>
        }
      }

      <!-- Date filter -->
      <div class="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label class="label inline-flex items-center gap-1.5">
            <app-icon name="calendar" [size]="13"></app-icon>
            Filter by date
          </label>
          <input type="date" class="input"
                 [(ngModel)]="dateFilter"
                 (ngModelChange)="onDateChange($event)" />
        </div>
        @if (dateFilter) {
          <button type="button" class="btn-secondary inline-flex items-center gap-1" (click)="clearDate()">
            <app-icon name="x" [size]="14"></app-icon>
            Clear
          </button>
        }
        <div class="text-xs text-slate-500 ml-auto">
          {{ shows().length }} show(s)
          @if (dateFilter) { on {{ dateFilter }} }
        </div>
      </div>

      @if (shows().length === 0) {
        <div class="card p-12 text-center mt-2">
          <div class="text-5xl text-slate-300 mb-3">𓎟</div>
          <div class="text-slate-700 font-semibold">
            @if (dateFilter) { No shows on this date }
            @else { No upcoming shows scheduled }
          </div>
          <div class="text-sm text-slate-500 mt-1">
            @if (dateFilter) { Try a different date or clear the filter. }
            @else { All shows for this movie have already started or aren't scheduled yet. }
          </div>

          @if (!dateFilter) {
            <div class="mt-6 inline-flex flex-col items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-5">
              <div class="text-sm font-semibold text-indigo-900">
                Want to see this on the big screen?
              </div>
              <div class="text-xs text-indigo-700/80">
                Let theater owners know there's demand.
              </div>
              @if (interested()) {
                <div class="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-bold">
                  <app-icon name="check-circle-2" [size]="14"></app-icon>
                  Interest registered · {{ interestCount() }} {{ interestCount() === 1 ? 'person' : 'people' }} interested
                </div>
              } @else {
                <button type="button" (click)="showInterest()"
                        [disabled]="interestSubmitting()"
                        class="group/btn mt-1 inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-bold shadow-sm transition disabled:opacity-50">
                  <app-icon name="heart" [size]="16" class="group-hover/btn:scale-110 transition"></app-icon>
                  {{ interestSubmitting() ? 'Saving…' : "I'm interested" }}
                </button>
                @if (interestCount() > 0) {
                  <div class="inline-flex items-center gap-1 text-[11px] text-indigo-600">
                    <app-icon name="users" [size]="12"></app-icon>
                    {{ interestCount() }} other {{ interestCount() === 1 ? 'person' : 'people' }} already interested
                  </div>
                }
              }
            </div>
          }
        </div>
      } @else {

      <h3 class="text-sm font-semibold text-slate-700 mb-3">Choose a showtime</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        @for (s of shows(); track s.id) {
          <button type="button"
                  (click)="select(s)"
                  [class.ring-2]="selected()?.id === s.id"
                  [class.ring-indigo-500]="selected()?.id === s.id"
                  class="card p-4 text-left hover:shadow-md transition disabled:opacity-50"
                  [disabled]="s.availableSeats === 0">
            <div class="flex items-start justify-between gap-2">
              <div class="font-semibold text-slate-900">{{ s.showTime | date:'EEE, MMM d · h:mm a' }}</div>
              <span class="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-indigo-50 text-indigo-700 whitespace-nowrap">
                {{ untilLabel(s) }}
              </span>
            </div>
            @if (s.theater) {
              <div class="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <app-icon name="building-2" [size]="12" class="text-slate-400"></app-icon>
                <span class="font-medium truncate">{{ s.theater.name }}</span>
                @if (s.theater.location) {
                  <span class="text-slate-400">· {{ s.theater.location }}</span>
                }
              </div>
            }
            @if (s.language) {
              <div class="mt-1">
                <span class="inline-flex items-center rounded-md bg-amber-50 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {{ s.language }}
                </span>
              </div>
            }
            <div class="text-sm text-slate-500 mt-1">{{ s.ticketPrice | currency:'INR' }}</div>
            <div class="text-xs mt-2"
                 [class.text-emerald-600]="s.availableSeats > 10"
                 [class.text-amber-600]="s.availableSeats > 0 && s.availableSeats <= 10"
                 [class.text-rose-600]="s.availableSeats === 0">
              {{ s.availableSeats === 0 ? 'Sold out' : s.availableSeats + ' seats left' }}
            </div>
          </button>
        }
      </div>

      @if (selected()) {
        <div class="mt-8">
          <h3 class="text-sm font-semibold text-slate-700 mb-2">Select your seats</h3>

          <div class="card p-6">
            <div class="mx-auto w-3/4 max-w-md mb-1">
              <div class="h-2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded"></div>
              <div class="text-center text-xs text-slate-400 mt-1 uppercase tracking-widest">Screen</div>
            </div>

            <div class="mt-6 inline-block mx-auto w-full">
              @for (row of rows(); track row) {
                <div class="flex items-center justify-center gap-2 mb-2">
                  <span class="w-6 text-xs font-semibold text-slate-500">{{ row }}</span>
                  @for (seat of seatsByRow().get(row) ?? []; track seat.id) {
                    @if (seat.col === 6) {
                      <span class="w-4"></span>
                    }
                    <button type="button"
                            (click)="toggleSeat(seat)"
                            [disabled]="seat.booked"
                            [title]="seat.id"
                            [class.bg-slate-200]="!seat.booked && !isSelected(seat.id)"
                            [class.text-slate-700]="!seat.booked && !isSelected(seat.id)"
                            [class.hover:bg-slate-300]="!seat.booked && !isSelected(seat.id)"
                            [class.bg-indigo-600]="isSelected(seat.id)"
                            [class.text-white]="isSelected(seat.id)"
                            [class.bg-slate-400]="seat.booked"
                            [class.cursor-not-allowed]="seat.booked"
                            [class.opacity-50]="seat.booked"
                            class="w-8 h-8 rounded text-[10px] font-semibold transition">
                      {{ seat.col }}
                    </button>
                  }
                  <span class="w-6 text-xs font-semibold text-slate-500 text-right">{{ row }}</span>
                </div>
              }
            </div>

            <div class="flex items-center justify-center gap-6 mt-6 text-xs text-slate-600">
              <div class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-slate-200"></span> Available</div>
              <div class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-indigo-600"></span> Selected</div>
              <div class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-slate-400 opacity-50"></span> Booked</div>
            </div>
          </div>

          <div class="card p-5 mt-4">
            @if (selectedSeats().size === 0) {
              <div class="text-sm text-slate-500">Pick at least one seat to continue.</div>
            } @else {
              <div class="text-sm mb-3">
                <span class="text-slate-500">Selected seats:</span>
                <span class="font-semibold text-slate-900 ml-1">{{ selectedSeatsList() }}</span>
              </div>

              @if (selected()?.couponCode && !couponApplied()) {
                <div class="mb-3 flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <div class="inline-flex items-center gap-1.5 text-sm">
                    <app-icon name="ticket-percent" [size]="16" class="text-rose-600"></app-icon>
                    <span class="font-mono font-bold text-rose-700">{{ selected()!.couponCode }}</span>
                    <span class="text-rose-700">— save {{ selected()!.discountPercent }}% on this show</span>
                  </div>
                  <button type="button" class="inline-flex items-center rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 transition shadow-sm hover:shadow"
                          (click)="applyCoupon()">
                    Apply
                  </button>
                </div>
              }
              @if (couponApplied()) {
                <div class="mb-3 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div class="inline-flex items-center gap-1.5 text-sm text-emerald-800">
                    <app-icon name="check-circle-2" [size]="16" class="text-emerald-600"></app-icon>
                    Coupon <span class="font-mono font-bold">{{ selected()!.couponCode }}</span> applied — {{ selected()!.discountPercent }}% off
                  </div>
                  <button type="button" class="text-xs text-emerald-700 hover:underline" (click)="removeCoupon()">Remove</button>
                </div>
              }

              <dl class="text-sm space-y-1 border-t border-slate-100 pt-3">
                <div class="flex justify-between">
                  <dt class="text-slate-500">Subtotal ({{ selectedSeats().size }} × {{ selected()!.ticketPrice | currency:'INR' }})</dt>
                  <dd class="text-slate-900 font-medium">{{ subtotal() | currency:'INR' }}</dd>
                </div>
                @if (couponApplied()) {
                  <div class="flex justify-between text-rose-600">
                    <dt>Discount ({{ selected()!.discountPercent }}%)</dt>
                    <dd class="font-medium">−{{ discount() | currency:'INR' }}</dd>
                  </div>
                }
                <div class="flex justify-between">
                  <dt class="text-slate-500">Tax (4%)</dt>
                  <dd class="text-slate-900 font-medium">{{ tax() | currency:'INR' }}</dd>
                </div>
                <div class="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                  <dt class="font-bold text-slate-900">Total</dt>
                  <dd class="font-bold text-slate-900 text-base">{{ total() | currency:'INR' }}</dd>
                </div>
              </dl>
            }

            <div class="mt-4 flex justify-end">
              <button class="btn-primary" (click)="confirm()"
                      [disabled]="booking() || selectedSeats().size === 0">
                {{ booking() ? 'Booking…' : 'Confirm Booking' }}
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3">
              {{ error() }}
            </div>
          }
        </div>
      }
      }
    }
  `
})
export class ShowSelectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private showService = inject(ShowService);
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private interestService = inject(InterestService);
  private locationService = inject(LocationService);
  private sanitizer = inject(DomSanitizer);

  private movieId!: number;

  shows = signal<Show[]>([]);
  movieHeader = signal<Movie | null>(null);
  loading = signal(true);
  selected = signal<Show | null>(null);
  bookedSeats = signal<Set<string>>(new Set());
  selectedSeats = signal<Set<string>>(new Set());
  booking = signal(false);
  error = signal<string | null>(null);
  dateFilter = '';
  couponApplied = signal(false);

  interestCount = signal<number>(0);
  interested = signal(false);
  interestSubmitting = signal(false);

  trailerSafeUrl = computed<SafeResourceUrl | null>(() => {
    const m = this.movieHeader();
    if (!m) return null;
    const embed = toYouTubeEmbedUrl(m.trailerUrl);
    if (!embed) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  });

  rows = computed(() => {
    const show = this.selected();
    if (!show) return [];
    const rowCount = Math.ceil(show.totalSeats / COLS_PER_ROW);
    return Array.from({ length: rowCount }, (_, i) => ROW_LABELS[i]);
  });

  seatsByRow = computed(() => {
    const show = this.selected();
    const map = new Map<string, Seat[]>();
    if (!show) return map;
    const booked = this.bookedSeats();
    let assigned = 0;
    for (const row of this.rows()) {
      const seats: Seat[] = [];
      for (let c = 1; c <= COLS_PER_ROW; c++) {
        if (assigned >= show.totalSeats) break;
        const id = `${row}${c}`;
        seats.push({ id, row, col: c, booked: booked.has(id) });
        assigned++;
      }
      map.set(row, seats);
    }
    return map;
  });

  subtotal = computed(() => (this.selected()?.ticketPrice ?? 0) * this.selectedSeats().size);

  discount = computed(() => {
    if (!this.couponApplied()) return 0;
    const pct = this.selected()?.discountPercent ?? 0;
    return +(this.subtotal() * pct / 100).toFixed(2);
  });

  tax = computed(() => +((this.subtotal() - this.discount()) * TAX_RATE).toFixed(2));

  total = computed(() => +(this.subtotal() - this.discount() + this.tax()).toFixed(2));

  selectedSeatsList = computed(() => Array.from(this.selectedSeats()).sort().join(', '));

  movieLanguageList = computed<string[]>(() => {
    const csv = this.movieHeader()?.languages;
    if (!csv) return [];
    return csv.split(',').map(s => s.trim()).filter(s => s.length > 0);
  });

  ngOnInit() {
    this.movieId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadShows();
    this.fetchInterest();
  }

  private loadShows() {
    this.loading.set(true);
    const opts: { date?: string; location?: string | null } = {};
    if (this.dateFilter) opts.date = this.dateFilter;
    const loc = this.locationService.current();
    if (loc) opts.location = loc;
    this.showService.getByMovie(this.movieId, opts).subscribe({
      next: list => {
        // Capture the movie info from the first available show so the header
        // (and trailer) keep rendering even after a date filter empties the list.
        if (list.length > 0 && !this.movieHeader()) {
          this.movieHeader.set(list[0].movie);
        }
        const now = Date.now();
        const future = list.filter(s => new Date(s.showTime).getTime() > now);
        this.shows.set(future);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onDateChange(_: string) { this.loadShows(); }
  clearDate() { this.dateFilter = ''; this.loadShows(); }

  untilLabel(s: Show): string {
    return timeUntil(s.showTime);
  }

  select(s: Show) {
    this.selected.set(s);
    this.selectedSeats.set(new Set());
    this.couponApplied.set(false);
    this.error.set(null);
    this.showService.getBookedSeats(s.id).subscribe({
      next: list => this.bookedSeats.set(new Set(list)),
      error: () => this.bookedSeats.set(new Set())
    });
  }

  applyCoupon() {
    if (this.selected()?.couponCode) this.couponApplied.set(true);
  }
  removeCoupon() { this.couponApplied.set(false); }

  showInterest() {
    if (this.interested() || this.interestSubmitting()) return;
    this.interestSubmitting.set(true);
    this.interestService.register(this.movieId).subscribe({
      next: res => {
        this.interestSubmitting.set(false);
        this.interested.set(res.interested);
        this.interestCount.set(res.count);
      },
      error: () => this.interestSubmitting.set(false)
    });
  }

  private fetchInterest() {
    this.interestService.status(this.movieId).subscribe({
      next: res => {
        this.interested.set(res.interested);
        this.interestCount.set(res.count);
      },
      error: () => {}
    });
  }

  toggleSeat(seat: Seat) {
    if (seat.booked) return;
    this.selectedSeats.update(set => {
      const next = new Set(set);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  }

  isSelected(id: string): boolean {
    return this.selectedSeats().has(id);
  }

  confirm() {
    const user = this.auth.currentUser();
    const show = this.selected();
    if (!user || !show || this.selectedSeats().size === 0) return;

    this.booking.set(true);
    this.error.set(null);
    this.bookingService.create({
      userId: user.id,
      showId: show.id,
      seats: Array.from(this.selectedSeats()).sort(),
      couponCode: this.couponApplied() ? show.couponCode ?? null : null
    }).subscribe({
      next: () => {
        this.booking.set(false);
        this.router.navigate(['/my-bookings']);
      },
      error: err => {
        this.booking.set(false);
        this.error.set(err?.error?.error ?? 'Booking failed');
      }
    });
  }
}
