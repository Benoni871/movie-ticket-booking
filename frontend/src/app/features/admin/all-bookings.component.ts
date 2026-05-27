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
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">All Bookings</h2>
        <p class="text-sm text-slate-500 mt-1">Every reservation made across the platform.</p>
      </div>
    </div>

    @if (topMovies().length > 0) {
      <div class="mb-8">
        <app-poster-carousel [movies]="topMovies()" kicker="Most booked" [enableBookingCta]="false" size="sm"></app-poster-carousel>
      </div>
    }

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-5">
        <div class="text-xs uppercase tracking-widest text-slate-400">Total Bookings</div>
        <div class="text-3xl font-bold text-slate-900 mt-2">{{ bookings().length }}</div>
        <div class="text-xs text-slate-500 mt-1">all time</div>
      </div>
      <div class="card p-5">
        <div class="text-xs uppercase tracking-widest text-slate-400">Tickets Sold</div>
        <div class="text-3xl font-bold text-slate-900 mt-2">{{ ticketsSold() }}</div>
        <div class="text-xs text-slate-500 mt-1">confirmed seats</div>
      </div>
      <div class="card p-5">
        <div class="text-xs uppercase tracking-widest text-slate-400">Revenue</div>
        <div class="text-3xl font-bold text-emerald-600 mt-2">{{ revenue() | currency:'INR' }}</div>
        <div class="text-xs text-slate-500 mt-1">net (after refunds)</div>
      </div>
      <div class="card p-5">
        <div class="text-xs uppercase tracking-widest text-slate-400">Refunded</div>
        <div class="text-3xl font-bold text-rose-600 mt-2">{{ refunded() | currency:'INR' }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ cancelledCount() }} cancellations</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-1 border-b border-slate-200 mb-4">
      @for (f of filters; track f.key) {
        <button type="button" (click)="setFilter(f.key)"
                [ngClass]="filter() === f.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="px-4 py-2 text-sm font-semibold border-b-2 transition">
          {{ f.label }}
          <span class="ml-1 text-xs rounded-full px-1.5 py-0.5"
                [ngClass]="filter() === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">
            {{ countFor(f.key) }}
          </span>
        </button>
      }
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 sticky top-0">
            <tr class="text-left text-xs font-semibold text-slate-600 uppercase">
              <th class="px-6 py-3">Ref</th>
              <th class="px-6 py-3">User</th>
              <th class="px-6 py-3">Movie / Show</th>
              <th class="px-6 py-3 text-center">Seats</th>
              <th class="px-6 py-3">Seat Numbers</th>
              <th class="px-6 py-3 text-right">Total</th>
              <th class="px-6 py-3 text-right">Refund</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Booked At</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (b of filtered(); track b.id) {
              <tr class="even:bg-slate-50/50 hover:bg-indigo-50/40 transition"
                  [class.opacity-70]="b.status === 'CANCELLED'">
                <td class="px-6 py-3 font-mono text-xs text-slate-700">{{ ref(b.id) }}</td>
                <td class="px-6 py-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {{ initials(b.user.username) }}
                    </span>
                    <span class="font-medium text-slate-900">{{ b.user.username }}</span>
                  </div>
                </td>
                <td class="px-6 py-3">
                  <div class="text-slate-900 font-medium">{{ b.show.movie.title }}</div>
                  <div class="text-xs text-slate-500">{{ b.show.showTime | date:'MMM d, y · h:mm a' }}</div>
                  @if (b.show.theater) {
                    <div class="text-[11px] text-slate-400 mt-0.5">🏛 {{ b.show.theater.name }}</div>
                  }
                </td>
                <td class="px-6 py-3 text-center font-semibold">{{ b.seatsBooked }}</td>
                <td class="px-6 py-3 text-slate-500 font-mono text-xs">{{ b.seats || '—' }}</td>
                <td class="px-6 py-3 text-right font-semibold">{{ b.totalAmount | currency:'INR' }}</td>
                <td class="px-6 py-3 text-right">
                  @if (b.refundAmount != null) {
                    <span class="font-semibold text-emerald-700">{{ b.refundAmount | currency:'INR' }}</span>
                  } @else {
                    <span class="text-slate-400">—</span>
                  }
                </td>
                <td class="px-6 py-3">
                  @if (b.status === 'CANCELLED') {
                    <span class="inline-flex items-center rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
                  } @else {
                    <span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
                  }
                </td>
                <td class="px-6 py-3 text-slate-500 text-xs">{{ b.bookingDate | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-6 py-10 text-center text-slate-400">No bookings to show.</td></tr>
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
