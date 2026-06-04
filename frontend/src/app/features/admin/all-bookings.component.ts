import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { BookingService } from '../../core/services/booking.service';
import { MovieService } from '../../core/services/movie.service';
import { Booking } from '../../core/models/booking.model';
import { Movie } from '../../core/models/movie.model';
import { PosterCarouselComponent } from '../../shared/poster-carousel.component';
import { bookingRef } from '../../shared/booking-utils';

type Filter = 'all' | 'confirmed' | 'cancelled';

@Component({
  selector: 'app-all-bookings',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, PosterCarouselComponent],
  template: `
    <div id="allBookings__div__header" class="flex items-end justify-between mb-6">
      <div id="allBookings__div__headerText">
        <h2 id="allBookings__h2__title" class="text-2xl font-bold text-slate-900">All Bookings</h2>
        <p id="allBookings__p__subtitle" class="text-sm text-slate-500 mt-1">Every reservation made across the platform.</p>
      </div>
    </div>

    @if (topMovies().length > 0) {
      <div id="allBookings__div__carouselWrap" class="mb-8">
        <app-poster-carousel id="allBookings__posterCarousel__topMovies" [movies]="topMovies()" kicker="Most booked" [enableBookingCta]="false" size="sm"></app-poster-carousel>
      </div>
    }

    <!-- Stats -->
    <div id="allBookings__div__stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div id="allBookings__div__statTotal" class="card p-5">
        <div id="allBookings__div__statTotalLabel" class="text-xs uppercase tracking-widest text-slate-400">Total Bookings</div>
        <div id="allBookings__div__statTotalValue" class="text-3xl font-bold text-slate-900 mt-2">{{ bookings().length }}</div>
        <div id="allBookings__div__statTotalHint" class="text-xs text-slate-500 mt-1">all time</div>
      </div>
      <div id="allBookings__div__statTickets" class="card p-5">
        <div id="allBookings__div__statTicketsLabel" class="text-xs uppercase tracking-widest text-slate-400">Tickets Sold</div>
        <div id="allBookings__div__statTicketsValue" class="text-3xl font-bold text-slate-900 mt-2">{{ ticketsSold() }}</div>
        <div id="allBookings__div__statTicketsHint" class="text-xs text-slate-500 mt-1">confirmed seats</div>
      </div>
      <div id="allBookings__div__statRevenue" class="card p-5">
        <div id="allBookings__div__statRevenueLabel" class="text-xs uppercase tracking-widest text-slate-400">Revenue</div>
        <div id="allBookings__div__statRevenueValue" class="text-3xl font-bold text-emerald-600 mt-2">{{ revenue() | currency:'INR' }}</div>
        <div id="allBookings__div__statRevenueHint" class="text-xs text-slate-500 mt-1">net (after refunds)</div>
      </div>
      <div id="allBookings__div__statRefunded" class="card p-5">
        <div id="allBookings__div__statRefundedLabel" class="text-xs uppercase tracking-widest text-slate-400">Refunded</div>
        <div id="allBookings__div__statRefundedValue" class="text-3xl font-bold text-rose-600 mt-2">{{ refunded() | currency:'INR' }}</div>
        <div id="allBookings__div__statRefundedHint" class="text-xs text-slate-500 mt-1">{{ cancelledCount() }} cancellations</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div id="allBookings__div__filterTabs" class="flex gap-1 border-b border-slate-200 mb-4">
      @for (f of filters; track f.key) {
        <button type="button" [id]="'allBookings__button__filter_' + f.key" [name]="'allBookings__button__filter_' + f.key" (click)="setFilter(f.key)"
                [ngClass]="filter() === f.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="px-4 py-2 text-sm font-semibold border-b-2 transition">
          {{ f.label }}
          <span [id]="'allBookings__span__filterCount_' + f.key" class="ml-1 text-xs rounded-full px-1.5 py-0.5"
                [ngClass]="filter() === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">
            {{ countFor(f.key) }}
          </span>
        </button>
      }
    </div>

    <!-- Table -->
    <div id="allBookings__div__tableCard" class="card overflow-hidden">
      <div id="allBookings__div__tableScroll" class="overflow-x-auto">
        <table id="allBookings__table__bookings" class="min-w-full divide-y divide-slate-200 text-sm">
          <thead id="allBookings__thead__main" class="bg-slate-50 sticky top-0">
            <tr id="allBookings__tr__headRow" class="text-left text-xs font-semibold text-slate-600 uppercase">
              <th id="allBookings__th__ref" class="px-6 py-3">Ref</th>
              <th id="allBookings__th__user" class="px-6 py-3">User</th>
              <th id="allBookings__th__movieShow" class="px-6 py-3">Movie / Show</th>
              <th id="allBookings__th__seats" class="px-6 py-3 text-center">Seats</th>
              <th id="allBookings__th__seatNumbers" class="px-6 py-3">Seat Numbers</th>
              <th id="allBookings__th__total" class="px-6 py-3 text-right">Total</th>
              <th id="allBookings__th__refund" class="px-6 py-3 text-right">Refund</th>
              <th id="allBookings__th__status" class="px-6 py-3">Status</th>
              <th id="allBookings__th__bookedAt" class="px-6 py-3">Booked At</th>
            </tr>
          </thead>
          <tbody id="allBookings__tbody__main" class="divide-y divide-slate-100">
            @for (b of filtered(); track b.id) {
              <tr [id]="'allBookings__tr__booking_' + b.id" class="even:bg-slate-50/50 hover:bg-indigo-50/40 transition"
                  [class.opacity-70]="b.status === 'CANCELLED'">
                <td [id]="'allBookings__td__ref_' + b.id" class="px-6 py-3 font-mono text-xs text-slate-700">{{ ref(b.id) }}</td>
                <td [id]="'allBookings__td__user_' + b.id" class="px-6 py-3">
                  <div [id]="'allBookings__div__userBlock_' + b.id" class="flex items-center gap-2">
                    <span [id]="'allBookings__span__userInitials_' + b.id" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {{ initials(b.user.username) }}
                    </span>
                    <span [id]="'allBookings__span__username_' + b.id" class="font-medium text-slate-900">{{ b.user.username }}</span>
                  </div>
                </td>
                <td [id]="'allBookings__td__movieShow_' + b.id" class="px-6 py-3">
                  <div [id]="'allBookings__div__movieTitle_' + b.id" class="text-slate-900 font-medium">{{ b.show.movie.title }}</div>
                  <div [id]="'allBookings__div__showTime_' + b.id" class="text-xs text-slate-500">{{ b.show.showTime | date:'MMM d, y · h:mm a' }}</div>
                  @if (b.show.theater) {
                    <div [id]="'allBookings__div__theater_' + b.id" class="text-[11px] text-slate-400 mt-0.5">🏛 {{ b.show.theater.name }}</div>
                  }
                </td>
                <td [id]="'allBookings__td__seats_' + b.id" class="px-6 py-3 text-center font-semibold">{{ b.seatsBooked }}</td>
                <td [id]="'allBookings__td__seatNumbers_' + b.id" class="px-6 py-3 text-slate-500 font-mono text-xs">{{ b.seats || '—' }}</td>
                <td [id]="'allBookings__td__total_' + b.id" class="px-6 py-3 text-right font-semibold">{{ b.totalAmount | currency:'INR' }}</td>
                <td [id]="'allBookings__td__refund_' + b.id" class="px-6 py-3 text-right">
                  @if (b.refundAmount != null) {
                    <span [id]="'allBookings__span__refundValue_' + b.id" class="font-semibold text-emerald-700">{{ b.refundAmount | currency:'INR' }}</span>
                  } @else {
                    <span [id]="'allBookings__span__refundEmpty_' + b.id" class="text-slate-400">—</span>
                  }
                </td>
                <td [id]="'allBookings__td__status_' + b.id" class="px-6 py-3">
                  @if (b.status === 'CANCELLED') {
                    <span [id]="'allBookings__span__statusCancelled_' + b.id" class="inline-flex items-center rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
                  } @else {
                    <span [id]="'allBookings__span__statusConfirmed_' + b.id" class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
                  }
                </td>
                <td [id]="'allBookings__td__bookedAt_' + b.id" class="px-6 py-3 text-slate-500 text-xs">{{ b.bookingDate | date:'short' }}</td>
              </tr>
            } @empty {
              <tr id="allBookings__tr__empty"><td id="allBookings__td__empty" colspan="9" class="px-6 py-10 text-center text-slate-400">No bookings to show.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AllBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private movieService = inject(MovieService);

  bookings = signal<Booking[]>([]);
  allMovies = signal<Movie[]>([]);
  filter = signal<Filter>('all');

  filters: { key: Filter; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  filtered = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.bookings();
    if (f === 'confirmed') return this.bookings().filter(b => b.status === 'CONFIRMED');
    return this.bookings().filter(b => b.status === 'CANCELLED');
  });

  ticketsSold = computed(() =>
    this.bookings()
      .filter(b => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + (b.seatsBooked ?? 0), 0)
  );

  revenue = computed(() => {
    let total = 0;
    for (const b of this.bookings()) {
      if (b.status === 'CANCELLED') {
        // Keep only the cancellation fee (total - refund) as net revenue
        total += Number(b.totalAmount ?? 0) - Number(b.refundAmount ?? 0);
      } else {
        total += Number(b.totalAmount ?? 0);
      }
    }
    return total;
  });

  refunded = computed(() =>
    this.bookings()
      .filter(b => b.status === 'CANCELLED')
      .reduce((sum, b) => sum + Number(b.refundAmount ?? 0), 0)
  );

  cancelledCount = computed(() => this.bookings().filter(b => b.status === 'CANCELLED').length);

  topMovies = computed<Movie[]>(() => {
    const counts = new Map<number, number>();
    for (const b of this.bookings()) {
      if (b.status === 'CANCELLED') continue;
      const id = b.show?.movie?.id;
      if (id != null) counts.set(id, (counts.get(id) ?? 0) + (b.seatsBooked ?? 0));
    }
    const ranked = this.allMovies()
      .map(m => ({ m, c: counts.get(m.id) ?? 0 }))
      .filter(x => x.c > 0)
      .sort((a, b) => b.c - a.c)
      .map(x => x.m);
    return ranked.length > 0 ? ranked : this.allMovies().slice(0, 5);
  });

  ngOnInit() {
    this.bookingService.getAll().subscribe(list => this.bookings.set(list));
    this.movieService.getAll().subscribe(list => this.allMovies.set(list));
  }

  setFilter(f: Filter) { this.filter.set(f); }

  countFor(f: Filter): number {
    if (f === 'all') return this.bookings().length;
    if (f === 'confirmed') return this.bookings().filter(b => b.status === 'CONFIRMED').length;
    return this.bookings().filter(b => b.status === 'CANCELLED').length;
  }

  ref(id: number): string { return bookingRef(id); }

  initials(u: string): string {
    if (!u) return '?';
    return u.slice(0, 2).toUpperCase();
  }
}
