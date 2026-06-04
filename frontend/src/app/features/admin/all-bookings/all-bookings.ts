import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { MovieService } from '../../../core/services/movie.service';
import { Booking } from '../../../core/models/booking.model';
import { Movie } from '../../../core/models/movie.model';
import { PosterCarouselComponent } from '../../../shared/poster-carousel/poster-carousel';
import { bookingRef } from '../../../shared/booking-utils';

type Filter = 'all' | 'confirmed' | 'cancelled';

@Component({
  selector: 'app-all-bookings',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, PosterCarouselComponent],
  templateUrl: './all-bookings.html',
  styleUrls: ['./all-bookings.css']
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
