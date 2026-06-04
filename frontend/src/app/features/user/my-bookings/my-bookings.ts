import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { Booking } from '../../../core/models/booking.model';
import { bookingRef, estimateRefund, timeUntil, RefundEstimate } from '../../../shared/booking-utils';
import { IconComponent } from '../../../shared/icon/icon';

type Tab = 'upcoming' | 'past' | 'cancelled';

const SOON_WINDOW_MIN = 30;

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe, IconComponent],
  templateUrl: './my-bookings.html',
  styleUrls: ['./my-bookings.css']
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
