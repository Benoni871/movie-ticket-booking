import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ShowService } from '../../core/services/show.service';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { Show } from '../../core/models/show.model';
import { Movie } from '../../core/models/movie.model';
import { timeUntil } from '../../shared/booking-utils';
import { toYouTubeEmbedUrl } from '../../shared/youtube-utils';

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
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <a routerLink="/movies" class="text-sm text-indigo-600 hover:underline">← Back to movies</a>

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
          </div>
        </div>

        @if (trailerSafeUrl()) {
          <div class="mb-6">
            <div class="text-xs uppercase tracking-widest text-slate-400 mb-2">Trailer</div>
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
          <label class="label">Filter by date</label>
          <input type="date" class="input"
                 [(ngModel)]="dateFilter"
                 (ngModelChange)="onDateChange($event)" />
        </div>
        @if (dateFilter) {
          <button type="button" class="btn-secondary" (click)="clearDate()">Clear</button>
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
              <div class="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <span>🏛</span>
                <span class="font-medium truncate">{{ s.theater.name }}</span>
                @if (s.theater.location) {
                  <span class="text-slate-400">· {{ s.theater.location }}</span>
                }
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

          <div class="card p-5 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="text-sm">
              @if (selectedSeats().size === 0) {
                <span class="text-slate-500">Pick at least one seat to continue.</span>
              } @else {
                <div>
                  <span class="text-slate-500">Selected seats:</span>
                  <span class="font-semibold text-slate-900 ml-1">{{ selectedSeatsList() }}</span>
                </div>
                <div class="text-slate-500 mt-0.5">
                  {{ selectedSeats().size }} × {{ selected()!.ticketPrice | currency:'INR' }}
                  =
                  <span class="font-semibold text-slate-900">{{ total() | currency:'INR' }}</span>
                </div>
              }
            </div>
            <button class="btn-primary" (click)="confirm()"
                    [disabled]="booking() || selectedSeats().size === 0">
              {{ booking() ? 'Booking…' : 'Confirm Booking' }}
            </button>
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

  total = computed(() => (this.selected()?.ticketPrice ?? 0) * this.selectedSeats().size);

  selectedSeatsList = computed(() => Array.from(this.selectedSeats()).sort().join(', '));

  ngOnInit() {
    this.movieId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadShows();
  }

  private loadShows() {
    this.loading.set(true);
    const opts = this.dateFilter ? { date: this.dateFilter } : undefined;
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
    this.error.set(null);
    this.showService.getBookedSeats(s.id).subscribe({
      next: list => this.bookedSeats.set(new Set(list)),
      error: () => this.bookedSeats.set(new Set())
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
      seats: Array.from(this.selectedSeats()).sort()
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
