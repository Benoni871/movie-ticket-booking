import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ShowService } from '../../../core/services/show.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { InterestService } from '../../../core/services/interest.service';
import { LocationService } from '../../../core/services/location.service';
import { Show } from '../../../core/models/show.model';
import { Movie } from '../../../core/models/movie.model';
import { timeUntil } from '../../../shared/booking-utils';
import { toYouTubeEmbedUrl } from '../../../shared/youtube-utils';
import { IconComponent } from '../../../shared/icon/icon';

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
  templateUrl: './show-select.html',
  styleUrls: ['./show-select.css']
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
