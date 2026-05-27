import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService } from '../../core/services/review.service';
import { Booking } from '../../core/models/booking.model';
import { bookingRef, estimateRefund, timeUntil, RefundEstimate } from '../../shared/booking-utils';

type Tab = 'upcoming' | 'past' | 'cancelled';

const SOON_WINDOW_MIN = 30;

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">My Bookings</h2>
        <p class="text-sm text-slate-500 mt-1">Your past and upcoming reservations.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-slate-200 mb-6">
      @for (t of tabs; track t.key) {
        <button type="button" (click)="setTab(t.key)"
                [ngClass]="tab() === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="px-4 py-2 text-sm font-semibold border-b-2 transition">
          {{ t.label }}
          <span class="ml-1 text-xs rounded-full px-1.5 py-0.5"
                [ngClass]="tab() === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">
            {{ countFor(t.key) }}
          </span>
        </button>
      }
    </div>

    @if (loading()) {
      <div class="space-y-3">
        @for (_ of [1,2,3]; track $index) {
          <div class="card p-6 animate-pulse">
            <div class="h-5 bg-slate-200 rounded w-1/3 mb-3"></div>
            <div class="h-3 bg-slate-100 rounded w-2/3 mb-2"></div>
            <div class="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        }
      </div>
    } @else if (visible().length === 0) {
      <div class="card p-12 text-center">
        <div class="text-5xl text-slate-300 mb-3">🎟</div>
        <div class="text-slate-700 font-semibold">{{ emptyTitle() }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ emptySubtitle() }}</div>
        @if (tab() === 'upcoming') {
          <a routerLink="/movies" class="btn-primary mt-4 inline-flex">Browse movies</a>
        }
      </div>
    } @else {
      <div class="space-y-5">
        @for (b of visible(); track b.id) {
          <div class="relative">
            <div class="card flex flex-col lg:flex-row overflow-hidden"
                 [class.opacity-70]="b.status === 'CANCELLED'"
                 [class.ring-2]="isStartingSoon(b)"
                 [class.ring-amber-400]="isStartingSoon(b)">

              <div class="flex p-5 gap-5 grow">
                @if (b.show.movie.posterUrl) {
                  <img [src]="b.show.movie.posterUrl" alt=""
                       class="hidden sm:block w-24 h-36 rounded-md object-cover ring-1 ring-slate-200 shrink-0" />
                }
                <div class="grow min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <h3 class="font-bold text-slate-900 text-lg leading-tight">{{ b.show.movie.title }}</h3>
                      <p class="text-xs text-slate-500 mt-0.5">{{ b.show.movie.genre }} · {{ b.show.movie.durationMins }} min</p>
                    </div>
                    <div class="flex flex-col items-end gap-1 shrink-0">
                      <span [ngClass]="statusClasses(b.status)"
                            class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                        {{ b.status }}
                      </span>
                      @if (isStartingSoon(b)) {
                        <span class="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                          ⏰ Starting soon
                        </span>
                      }
                    </div>
                  </div>

                  <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <dt class="text-slate-500">Show</dt>
                    <dd class="text-slate-900 font-medium">{{ b.show.showTime | date:'EEE, MMM d · h:mm a' }}</dd>
                    @if (b.show.theater) {
                      <dt class="text-slate-500">Theater</dt>
                      <dd class="text-slate-900 font-medium">
                        🏛 {{ b.show.theater.name }}
                        @if (b.show.theater.location) {
                          <span class="text-xs text-slate-500 ml-1">{{ b.show.theater.location }}</span>
                        }
                      </dd>
                    }
                    <dt class="text-slate-500">Seats</dt>
                    <dd class="text-slate-900 font-medium">
                      {{ b.seatsBooked }}
                      @if (b.seats) {
                        <span class="font-mono text-xs text-slate-500 ml-1">({{ b.seats }})</span>
                      }
                    </dd>
                    <dt class="text-slate-500">Total paid</dt>
                    <dd class="text-slate-900 font-semibold">{{ b.totalAmount | currency:'INR' }}</dd>
                    @if (b.status === 'CANCELLED' && b.refundAmount != null) {
                      <dt class="text-slate-500">Refunded</dt>
                      <dd class="text-emerald-700 font-semibold">{{ b.refundAmount | currency:'INR' }}</dd>
                    }
                  </dl>

                  @if (b.status === 'CONFIRMED' && !isShowPast(b)) {
                    <div class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      ⏱ {{ untilLabel(b) }}
                    </div>
                  }
                </div>
              </div>

              <div class="relative hidden lg:block w-px bg-slate-200">
                <span class="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-slate-50 ring-1 ring-slate-200"></span>
                <span class="absolute -left-2 -bottom-2 h-4 w-4 rounded-full bg-slate-50 ring-1 ring-slate-200"></span>
                <div class="absolute inset-y-3 left-0 border-l border-dashed border-slate-300"></div>
              </div>

              <div class="bg-slate-50 lg:bg-white p-5 lg:w-64 flex flex-col justify-between gap-4">
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Reference</div>
                  <div class="font-mono text-sm font-bold text-slate-900 mt-1">{{ ref(b.id) }}</div>
                  <div class="text-[10px] text-slate-500 mt-2">Booked {{ b.bookingDate | date:'MMM d, y · h:mm a' }}</div>
                  @if (b.status === 'CANCELLED' && b.cancelledAt) {
                    <div class="text-[10px] text-rose-600 mt-1">Cancelled {{ b.cancelledAt | date:'MMM d · h:mm a' }}</div>
                  }
                </div>

                <div class="flex flex-col gap-2">
                  @if (b.status === 'CONFIRMED') {
                    <button type="button"
                            class="inline-flex items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 transition"
                            (click)="openTicket(b)">
                      🎫 Show Ticket
                    </button>
                  }
                  @if (canCancel(b)) {
                    <button type="button" class="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md py-2 transition"
                            (click)="openCancel(b)">
                      Cancel booking
                    </button>
                  } @else if (b.status === 'CONFIRMED' && !isShowPast(b)) {
                    <span class="text-[10px] text-slate-400 text-center">Cancellation closed (under 2h)</span>
                  }

                  @if (isShowOver(b) && b.status === 'CONFIRMED') {
                    @if (myRating(b.id); as r) {
                      <div class="text-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md py-2">
                        ✓ Rated {{ r }} ★
                      </div>
                    } @else if (canReview(b.id)) {
                      <button type="button"
                              class="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 transition"
                              (click)="openReview(b)">
                        ★ Rate this movie
                      </button>
                    }
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Cancel confirmation modal -->
    @if (cancelTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
           (click)="closeCancel()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-slate-900">Cancel this booking?</h3>
          <p class="text-sm text-slate-500 mt-1">
            {{ cancelTarget()!.show.movie.title }} — {{ cancelTarget()!.show.showTime | date:'EEE, MMM d · h:mm a' }}
          </p>

          @if (cancelEstimate()) {
            <div class="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Amount paid</span>
                <span class="font-semibold text-slate-900">{{ cancelTarget()!.totalAmount | currency:'INR' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Cancellation fee ({{ (cancelEstimate()!.feeRate * 100) | number:'1.0-0' }}%)</span>
                <span class="font-semibold text-rose-600">−{{ cancelEstimate()!.fee | currency:'INR' }}</span>
              </div>
              <div class="border-t border-slate-200 pt-2 flex justify-between text-sm">
                <span class="font-semibold text-slate-900">Refund you'll receive</span>
                <span class="font-bold text-emerald-700">{{ cancelEstimate()!.refund | currency:'INR' }}</span>
              </div>
              <p class="text-xs text-slate-500 pt-1">{{ cancelEstimate()!.reason }}</p>
            </div>
          }

          @if (cancelError()) {
            <div class="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">
              {{ cancelError() }}
            </div>
          }

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="closeCancel()" [disabled]="cancelling()">Keep booking</button>
            <button type="button"
                    class="inline-flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                    [disabled]="cancelling() || !cancelEstimate()!.allowed"
                    (click)="confirmCancel()">
              {{ cancelling() ? 'Cancelling…' : 'Yes, cancel & refund' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Review (star picker) modal -->
    @if (reviewTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
           (click)="closeReview()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 text-xl font-bold shrink-0">★</span>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Rate "{{ reviewTarget()!.show.movie.title }}"</h3>
              <p class="text-sm text-slate-500 mt-0.5">
                {{ reviewTarget()!.show.showTime | date:'EEE, MMM d · h:mm a' }} · How was it?
              </p>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-center gap-2"
               (mouseleave)="leaveStars()">
            @for (n of [1,2,3,4,5]; track n) {
              <button type="button" (click)="setStar(n)" (mouseenter)="hoverStar(n)"
                      class="text-4xl transition transform hover:scale-110"
                      [class.text-amber-400]="n <= (reviewHover() || reviewRating())"
                      [class.text-slate-300]="n > (reviewHover() || reviewRating())"
                      [attr.aria-label]="'Rate ' + n + ' star'">
                ★
              </button>
            }
          </div>
          <div class="mt-2 text-center text-xs text-slate-500">
            @if (reviewRating() > 0) {
              You picked {{ reviewRating() }} / 5
            } @else {
              Tap a star to rate
            }
          </div>

          @if (reviewError()) {
            <div class="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">
              {{ reviewError() }}
            </div>
          }

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="closeReview()" [disabled]="reviewSaving()">Cancel</button>
            <button type="button" class="btn-primary"
                    [disabled]="reviewSaving() || reviewRating() < 1"
                    (click)="submitReview()">
              {{ reviewSaving() ? 'Submitting…' : 'Submit rating' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Ticket modal: production-style cinema ticket with QR -->
    @if (ticketTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
           (click)="closeTicket()">
        <div class="relative max-w-2xl w-full" (click)="$event.stopPropagation()">

          <!-- Close button -->
          <button type="button" (click)="closeTicket()"
                  class="absolute -top-3 -right-3 z-10 h-10 w-10 rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 flex items-center justify-center text-xl transition"
                  aria-label="Close ticket">×</button>

          <!-- Ticket body -->
          <div class="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

            <!-- Main section -->
            <div class="grow relative">
              <!-- Header bar -->
              <div class="bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-700 px-6 py-4 flex items-center justify-between text-white">
                <div class="flex items-center gap-2">
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 backdrop-blur font-bold">C</span>
                  <span class="font-bold tracking-tight">CINEBOOK</span>
                </div>
                <span class="text-[10px] font-bold uppercase tracking-[0.3em] bg-amber-400 text-amber-900 px-2 py-0.5 rounded">Admit one</span>
              </div>

              <!-- Body -->
              <div class="px-6 py-6 flex gap-5">
                @if (ticketTarget()!.show.movie.posterUrl) {
                  <img [src]="ticketTarget()!.show.movie.posterUrl" alt=""
                       class="hidden sm:block w-20 h-28 rounded-md object-cover ring-1 ring-slate-200 shadow-sm shrink-0" />
                }
                <div class="grow min-w-0">
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Now showing</div>
                  <h3 class="text-2xl font-bold text-slate-900 leading-tight">{{ ticketTarget()!.show.movie.title }}</h3>
                  <div class="text-xs text-slate-500 mt-1">{{ ticketTarget()!.show.movie.genre }} · {{ ticketTarget()!.show.movie.durationMins }} min</div>
                </div>
              </div>

              <!-- Show details grid -->
              <div class="px-6 pb-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm border-t border-dashed border-slate-200 pt-5">
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Date</div>
                  <div class="font-semibold text-slate-900 mt-0.5">{{ ticketTarget()!.show.showTime | date:'EEE, MMM d, y' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Time</div>
                  <div class="font-semibold text-slate-900 mt-0.5">{{ ticketTarget()!.show.showTime | date:'h:mm a' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Theater</div>
                  <div class="font-semibold text-slate-900 mt-0.5">
                    {{ ticketTarget()!.show.theater?.name || 'CineBook Cinemas' }}
                  </div>
                  @if (ticketTarget()!.show.theater?.location) {
                    <div class="text-[11px] text-slate-500 mt-0.5">{{ ticketTarget()!.show.theater?.location }}</div>
                  }
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Total paid</div>
                  <div class="font-semibold text-slate-900 mt-0.5">{{ ticketTarget()!.totalAmount | currency:'INR' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-400">Screen</div>
                  <div class="font-semibold text-slate-900 mt-0.5">Auditorium {{ auditorium(ticketTarget()!.show.id) }}</div>
                </div>
              </div>

              <!-- Seats -->
              <div class="px-6 pb-6 border-t border-dashed border-slate-200 pt-5">
                <div class="text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                  {{ ticketTarget()!.seatsBooked }} {{ ticketTarget()!.seatsBooked === 1 ? 'seat' : 'seats' }}
                </div>
                <div class="flex flex-wrap gap-2">
                  @for (s of ticketSeats(); track s) {
                    <span class="inline-flex items-center justify-center min-w-[3rem] rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-sm font-bold font-mono">
                      {{ s }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Perforated tear line -->
            <div class="relative hidden md:block w-px">
              <span class="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-slate-900/80 shadow-inner"></span>
              <span class="absolute -left-3 -bottom-3 h-6 w-6 rounded-full bg-slate-900/80 shadow-inner"></span>
              <div class="absolute inset-y-6 left-0 border-l-2 border-dashed border-slate-300"></div>
            </div>
            <!-- Mobile tear line -->
            <div class="relative md:hidden h-px">
              <span class="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-slate-900/80"></span>
              <span class="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-slate-900/80"></span>
              <div class="absolute inset-x-6 top-0 border-t-2 border-dashed border-slate-300"></div>
            </div>

            <!-- Stub with QR -->
            <div class="md:w-64 bg-slate-50 px-6 py-6 flex flex-col items-center justify-center gap-3 text-center">
              <div class="text-[10px] uppercase tracking-widest text-slate-400">Scan at entry</div>
              <div class="bg-white p-3 rounded-lg ring-1 ring-slate-200 shadow-sm">
                <img [src]="qrUrl()" [alt]="'QR code for ' + ref(ticketTarget()!.id)"
                     class="block w-40 h-40" loading="lazy" />
              </div>
              <div>
                <div class="text-[10px] uppercase tracking-widest text-slate-400">Booking Ref</div>
                <div class="font-mono text-base font-bold text-slate-900">{{ ref(ticketTarget()!.id) }}</div>
              </div>
              <div class="text-[10px] text-slate-500 pt-2 border-t border-slate-200 w-full">
                Present this ticket at the entrance. Doors open 15 minutes before showtime.
              </div>
            </div>
          </div>

          <!-- Action row -->
          <div class="mt-4 flex items-center justify-end gap-3">
            <button type="button" (click)="printTicket()"
                    class="inline-flex items-center gap-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow transition">
              🖨 Print
            </button>
            <button type="button" (click)="closeTicket()"
                    class="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-semibold shadow transition">
              Done
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @media print {
      body * { visibility: hidden; }
      .fixed.inset-0 { position: static !important; background: transparent !important; backdrop-filter: none !important; }
      .fixed.inset-0, .fixed.inset-0 * { visibility: visible; }
      .fixed.inset-0 button[aria-label="Close ticket"],
      .fixed.inset-0 .mt-4 { display: none !important; }
    }
  `]
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private reviewService = inject(ReviewService);

  bookings = signal<Booking[]>([]);
  loading = signal(true);
  tab = signal<Tab>('upcoming');
  now = signal<number>(Date.now());

  cancelTarget = signal<Booking | null>(null);
  cancelEstimate = signal<RefundEstimate | null>(null);
  cancelling = signal(false);
  cancelError = signal<string | null>(null);

  ticketTarget = signal<Booking | null>(null);

  reviewTarget = signal<Booking | null>(null);
  reviewRating = signal<number>(0);
  reviewHover = signal<number>(0);
  reviewSaving = signal(false);
  reviewError = signal<string | null>(null);

  /** Map of bookingId → rating once submitted (or already in DB). */
  private myRatings = signal<Map<number, number>>(new Map());
  /** Map of bookingId → server's canReview decision. Defaults to true when unknown. */
  private canReviewMap = signal<Map<number, boolean>>(new Map());

  private tick: any = null;

  tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming',  label: 'Upcoming' },
    { key: 'past',      label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  visible = computed(() => {
    const t = this.tab();
    const now = this.now();
    return this.bookings().filter(b => {
      if (t === 'cancelled') return b.status === 'CANCELLED';
      const past = new Date(b.show.showTime).getTime() <= now;
      if (t === 'past') return b.status === 'CONFIRMED' && past;
      return b.status === 'CONFIRMED' && !past;
    });
  });

  ticketSeats = computed<string[]>(() => {
    const t = this.ticketTarget();
    if (!t || !t.seats) return [];
    return t.seats.split(',').map(s => s.trim()).filter(Boolean);
  });

  qrUrl = computed<string>(() => {
    const t = this.ticketTarget();
    if (!t) return '';
    const payload = [
      'CINEBOOK',
      'REF:' + bookingRef(t.id),
      'MOVIE:' + t.show.movie.title,
      'TIME:' + t.show.showTime,
      'SEATS:' + (t.seats ?? ''),
      'USER:' + t.user.username
    ].join('|');
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(payload)}`;
  });

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.bookingService.getByUser(userId).subscribe({
      next: list => {
        this.bookings.set(list);
        this.loading.set(false);
        this.hydrateReviewState(list);
      },
      error: () => this.loading.set(false)
    });
    this.tick = setInterval(() => this.now.set(Date.now()), 30_000);
  }

  private hydrateReviewState(list: Booking[]) {
    const eligible = list.filter(b => b.status === 'CONFIRMED' && this.isShowOver(b));
    for (const b of eligible) {
      this.reviewService.canReview(b.id).subscribe({
        next: res => {
          const canMap = new Map(this.canReviewMap());
          canMap.set(b.id, res.canReview);
          this.canReviewMap.set(canMap);
          if (res.existingRating != null) {
            const ratings = new Map(this.myRatings());
            ratings.set(b.id, res.existingRating);
            this.myRatings.set(ratings);
          }
        },
        error: () => {}
      });
    }
  }

  isShowOver(b: Booking): boolean {
    const start = new Date(b.show.showTime).getTime();
    const duration = (b.show.movie.durationMins ?? 0) * 60_000;
    return this.now() >= start + duration;
  }

  myRating(bookingId: number): number | null {
    return this.myRatings().get(bookingId) ?? null;
  }

  canReview(bookingId: number): boolean {
    const v = this.canReviewMap().get(bookingId);
    return v === true;
  }

  openReview(b: Booking) {
    this.reviewTarget.set(b);
    this.reviewRating.set(0);
    this.reviewHover.set(0);
    this.reviewError.set(null);
  }

  closeReview() {
    if (this.reviewSaving()) return;
    this.reviewTarget.set(null);
    this.reviewError.set(null);
  }

  setStar(n: number) { this.reviewRating.set(n); }
  hoverStar(n: number) { this.reviewHover.set(n); }
  leaveStars() { this.reviewHover.set(0); }

  submitReview() {
    const b = this.reviewTarget();
    const rating = this.reviewRating();
    if (!b || rating < 1) return;
    this.reviewSaving.set(true);
    this.reviewError.set(null);
    this.reviewService.create({ bookingId: b.id, rating }).subscribe({
      next: review => {
        this.reviewSaving.set(false);
        const ratings = new Map(this.myRatings());
        ratings.set(b.id, review.rating);
        this.myRatings.set(ratings);
        const canMap = new Map(this.canReviewMap());
        canMap.set(b.id, false);
        this.canReviewMap.set(canMap);
        this.reviewTarget.set(null);
      },
      error: err => {
        this.reviewSaving.set(false);
        this.reviewError.set(err?.error?.error ?? err?.message ?? 'Failed to submit review');
      }
    });
  }

  ngOnDestroy() {
    if (this.tick) clearInterval(this.tick);
  }

  setTab(t: Tab) { this.tab.set(t); }

  countFor(t: Tab): number {
    const now = this.now();
    return this.bookings().filter(b => {
      if (t === 'cancelled') return b.status === 'CANCELLED';
      const past = new Date(b.show.showTime).getTime() <= now;
      if (t === 'past') return b.status === 'CONFIRMED' && past;
      return b.status === 'CONFIRMED' && !past;
    }).length;
  }

  emptyTitle(): string {
    return this.tab() === 'upcoming' ? 'No upcoming bookings'
         : this.tab() === 'past'     ? 'No past bookings'
         : 'No cancelled bookings';
  }
  emptySubtitle(): string {
    return this.tab() === 'upcoming' ? 'Browse movies to grab your seats.'
         : this.tab() === 'past'     ? "Once you've attended a show, it'll show up here."
         : 'Cancelled bookings will be listed here for your records.';
  }

  ref(id: number): string { return bookingRef(id); }
  untilLabel(b: Booking): string { return timeUntil(b.show.showTime); }
  isShowPast(b: Booking): boolean { return new Date(b.show.showTime).getTime() <= this.now(); }

  isStartingSoon(b: Booking): boolean {
    if (b.status !== 'CONFIRMED') return false;
    const ms = new Date(b.show.showTime).getTime() - this.now();
    return ms > 0 && ms <= SOON_WINDOW_MIN * 60_000;
  }

  statusClasses(s: string): string {
    if (s === 'CANCELLED') return 'bg-rose-100 text-rose-700';
    return 'bg-emerald-100 text-emerald-700';
  }

  canCancel(b: Booking): boolean {
    if (b.status !== 'CONFIRMED') return false;
    return estimateRefund(b.show.showTime, Number(b.totalAmount)).allowed;
  }

  openCancel(b: Booking) {
    const est = estimateRefund(b.show.showTime, Number(b.totalAmount));
    this.cancelTarget.set(b);
    this.cancelEstimate.set(est);
    this.cancelError.set(null);
  }
  closeCancel() {
    if (this.cancelling()) return;
    this.cancelTarget.set(null);
    this.cancelEstimate.set(null);
    this.cancelError.set(null);
  }
  confirmCancel() {
    const b = this.cancelTarget();
    if (!b) return;
    this.cancelling.set(true);
    this.cancelError.set(null);
    this.bookingService.cancel(b.id).subscribe({
      next: updated => {
        this.cancelling.set(false);
        this.bookings.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.closeCancel();
        this.setTab('cancelled');
      },
      error: err => {
        this.cancelling.set(false);
        this.cancelError.set(err?.error?.error ?? 'Cancellation failed');
      }
    });
  }

  openTicket(b: Booking) { this.ticketTarget.set(b); }
  closeTicket() { this.ticketTarget.set(null); }

  printTicket() { window.print(); }

  /** Deterministic auditorium number derived from show id, for ticket flair. */
  auditorium(showId: number): number {
    return ((showId - 1) % 6) + 1;
  }
}
