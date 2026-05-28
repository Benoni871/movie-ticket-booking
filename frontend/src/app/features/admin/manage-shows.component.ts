import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { ShowService } from '../../core/services/show.service';
import { BookingService } from '../../core/services/booking.service';
import { Movie } from '../../core/models/movie.model';
import { Show } from '../../core/models/show.model';
import { PosterCarouselComponent } from '../../shared/poster-carousel.component';
import { IconComponent } from '../../shared/icon.component';

interface DeleteShowImpact {
  show: Show;
  activeBookings: number;
  cancelledBookings: number;
}

@Component({
  selector: 'app-manage-shows',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe, PosterCarouselComponent, IconComponent],
  template: `
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Manage Shows</h2>
        <p class="text-sm text-slate-500 mt-1">Schedule one or more showtimes per day, and review what's coming up.</p>
      </div>
      <div class="text-sm text-slate-500">
        <span class="font-semibold text-slate-900">{{ shows().length }}</span> shows scheduled
      </div>
    </div>

    @if (movies().length > 0) {
      <div class="mb-8">
        <app-poster-carousel [movies]="movies()" kicker="Scheduling for" [enableBookingCta]="false" size="sm"></app-poster-carousel>
      </div>
    }

    <div class="card p-6 mb-10">
      <div class="flex items-center gap-3 mb-6">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <app-icon name="calendar-clock" [size]="18"></app-icon>
        </span>
        <div>
          <h3 class="font-semibold text-slate-900">Schedule Shows</h3>
          <p class="text-xs text-slate-500">Pick a movie and a date, then add one or more start times. All slots share the same price and seats.</p>
        </div>
      </div>

      <!-- Movie picker -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="label mb-0">Movie <span class="text-rose-500">*</span></label>
          @if (form.movieId) {
            <button type="button" class="text-xs text-slate-500 hover:text-slate-700" (click)="selectMovie(null)">Clear</button>
          }
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
          @for (m of movies(); track m.id) {
            <button type="button" (click)="selectMovie(m.id)"
                    [ngClass]="form.movieId === m.id
                      ? 'ring-2 ring-indigo-500 shadow-md'
                      : 'ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-sm'"
                    class="snap-start shrink-0 w-32 rounded-xl overflow-hidden bg-white text-left transition relative">
              <div class="aspect-[2/3] bg-slate-100 overflow-hidden">
                @if (m.posterUrl) {
                  <img [src]="m.posterUrl" alt="" class="w-full h-full object-cover" (error)="onImgError($event)" />
                }
              </div>
              @if (form.movieId === m.id) {
                <div class="absolute top-2 right-2 h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md">✓</div>
              }
              <div class="p-2">
                <div class="text-xs font-semibold text-slate-900 line-clamp-1">{{ m.title }}</div>
                <div class="text-[10px] text-slate-500">{{ m.genre }}</div>
              </div>
            </button>
          }
        </div>
        @if (movies().length === 0) {
          <div class="text-xs text-slate-500 italic">No movies yet — add one from Manage Movies.</div>
        }
      </div>

      <form (ngSubmit)="schedule()" #f="ngForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="label">Date <span class="text-rose-500">*</span></label>
          <input class="input" name="date" type="date" [min]="minDate"
                 [(ngModel)]="form.date" required />
          <p class="text-xs text-slate-400 mt-1">All time slots below will be scheduled on this date.</p>
        </div>
        <div class="md:row-span-2">
          <label class="label">Time slots <span class="text-rose-500">*</span></label>
          <div class="space-y-2">
            @for (slot of form.times; track $index) {
              <div class="flex items-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {{ $index + 1 }}
                </span>
                <input class="input" type="time" [(ngModel)]="form.times[$index]" [name]="'time' + $index" required />
                <button type="button" (click)="removeTime($index)"
                        [disabled]="form.times.length === 1"
                        class="h-9 w-9 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title="Remove time slot">
                  <app-icon name="x" [size]="16"></app-icon>
                </button>
              </div>
            }
          </div>
          <button type="button" (click)="addTime()"
                  class="group/btn mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">
            <app-icon name="plus" [size]="12" class="group-hover/btn:rotate-90 transition"></app-icon>
            Add another time slot
          </button>
        </div>
        <div>
          <label class="label">Ticket Price (₹) <span class="text-rose-500">*</span></label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-sm">₹</span>
            <input class="input pl-7" name="ticketPrice" type="number" step="0.01" min="0"
                   [(ngModel)]="form.ticketPrice" required placeholder="250.00" />
          </div>
        </div>
        <div>
          <label class="label">Total Seats <span class="text-rose-500">*</span></label>
          <input class="input" name="totalSeats" type="number" min="1"
                 [(ngModel)]="form.totalSeats" required placeholder="60" />
          <p class="text-xs text-slate-400 mt-1">Seat grid uses 10 cols; multiples of 10 look cleanest.</p>
        </div>
        <div class="md:col-span-2">
          <label class="label">Show language <span class="text-rose-500">*</span></label>
          @if (!form.movieId) {
            <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 inline-flex items-center gap-1.5">
              <app-icon name="info" [size]="13"></app-icon>
              Pick a movie above and its available languages will appear here.
            </div>
          } @else if (selectedMovieLanguages().length === 0) {
            <div class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
              <app-icon name="alert-triangle" [size]="14" class="shrink-0 mt-0.5"></app-icon>
              <div>
                This movie has no languages declared yet, so shows can't be scheduled for it.
                <a routerLink="/admin/movies" class="font-semibold underline hover:no-underline">Open Manage Movies</a>
                and add at least one language first.
              </div>
            </div>
          } @else {
            <div class="flex flex-wrap gap-2">
              @for (lang of selectedMovieLanguages(); track lang) {
                <button type="button"
                        (click)="form.language = lang"
                        [ngClass]="form.language === lang
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'"
                        class="text-xs font-semibold rounded-full border px-3 py-1 transition">
                  {{ lang }}
                </button>
              }
            </div>
            <p class="text-xs text-slate-400 mt-1">Pick the exact language this show will be played in.</p>
          }
        </div>

        <div class="md:col-span-2 pt-3 border-t border-slate-100">
          <div class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-500 mb-3">
            <app-icon name="ticket-percent" [size]="14"></app-icon>
            Offer (optional)
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Coupon code</label>
              <input class="input uppercase" name="couponCode" maxlength="30"
                     [(ngModel)]="form.couponCode" placeholder="e.g. WEEKEND20" />
              <p class="text-xs text-slate-400 mt-1">Users see this in Offers and apply it at checkout.</p>
            </div>
            <div>
              <label class="label">Discount %</label>
              <input class="input" name="discountPercent" type="number" min="1" max="100"
                     [(ngModel)]="form.discountPercent" placeholder="20" />
              <p class="text-xs text-slate-400 mt-1">Applied off the ticket subtotal before 4% tax.</p>
            </div>
          </div>
        </div>

        <div class="md:col-span-2 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div class="text-xs text-slate-500">
            @if (form.times.length > 0 && form.date) {
              Will create <span class="font-semibold text-slate-900">{{ form.times.length }} show(s)</span>
              on {{ form.date }}
            }
          </div>
          <div class="flex items-center gap-3">
            @if (msg()) {
              <span class="text-sm text-emerald-600 inline-flex items-center gap-1.5">
                <app-icon name="check-circle-2" [size]="14"></app-icon>
                {{ msg() }}
              </span>
            }
            @if (err()) {
              <span class="text-sm text-rose-600 inline-flex items-center gap-1.5">
                <app-icon name="alert-circle" [size]="14"></app-icon>
                {{ err() }}
              </span>
            }
            <button type="button" class="btn-secondary" (click)="reset()" [disabled]="saving()">Reset</button>
            <button type="submit" class="btn-primary inline-flex items-center gap-1.5"
                    [disabled]="saving() || !f.valid || !form.movieId || !canScheduleLanguage()">
              <app-icon name="calendar-clock" [size]="14"></app-icon>
              {{ saving() ? 'Scheduling…' : ('Schedule ' + form.times.length + ' show' + (form.times.length === 1 ? '' : 's')) }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Existing shows -->
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 class="font-semibold text-slate-900">Upcoming Shows</h3>
        <span class="text-xs text-slate-500">{{ shows().length }} total</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr class="text-left text-xs font-semibold text-slate-600 uppercase">
              <th class="px-6 py-3">ID</th>
              <th class="px-6 py-3">Movie</th>
              <th class="px-6 py-3">Show Time</th>
              <th class="px-6 py-3 text-right">Price</th>
              <th class="px-6 py-3 text-center">Seats (avail / total)</th>
              <th class="px-6 py-3">Offer</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (s of shows(); track s.id) {
              <tr class="even:bg-slate-50/50 hover:bg-indigo-50/40 transition">
                <td class="px-6 py-3 text-slate-500">#{{ s.id }}</td>
                <td class="px-6 py-3 font-medium text-slate-900">{{ s.movie.title }}</td>
                <td class="px-6 py-3 text-slate-600">{{ s.showTime | date:'medium' }}</td>
                <td class="px-6 py-3 text-right">{{ s.ticketPrice | currency:'INR' }}</td>
                <td class="px-6 py-3 text-center text-slate-600">
                  <span class="font-semibold text-slate-900">{{ s.availableSeats }}</span> / {{ s.totalSeats }}
                </td>
                <td class="px-6 py-3">
                  @if (s.couponCode) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[11px] font-bold font-mono">
                      <app-icon name="ticket-percent" [size]="12"></app-icon>
                      {{ s.couponCode }} · {{ s.discountPercent }}%
                    </span>
                  } @else {
                    <span class="text-slate-300 text-xs">—</span>
                  }
                </td>
                <td class="px-6 py-3">
                  @if (isPast(s)) {
                    <span class="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-xs font-medium">Closed</span>
                  } @else if (s.availableSeats === 0) {
                    <span class="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-xs font-medium">Sold out</span>
                  } @else if (s.availableSeats < s.totalSeats * 0.2) {
                    <span class="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-medium">Filling fast</span>
                  } @else {
                    <span class="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">Open</span>
                  }
                </td>
                <td class="px-6 py-3 text-right">
                  <button type="button"
                          class="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5 transition"
                          (click)="openDeleteShow(s)">
                    <app-icon name="trash-2" [size]="13"></app-icon>
                    Delete
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-6 py-10 text-center text-slate-400">No shows scheduled yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete-show modal -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
           (click)="closeDeleteShow()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
              <app-icon name="alert-triangle" [size]="20"></app-icon>
            </span>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Delete this show?</h3>
              <p class="text-sm text-slate-500 mt-1">
                {{ deleteTarget()!.show.movie.title }} — {{ deleteTarget()!.show.showTime | date:'EEE, MMM d · h:mm a' }}
              </p>
            </div>
          </div>

          <div class="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-600">Active bookings</span>
              <span [ngClass]="deleteTarget()!.activeBookings > 0 ? 'text-rose-600' : 'text-slate-900'"
                    class="font-semibold">{{ deleteTarget()!.activeBookings }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Cancelled bookings</span>
              <span class="font-semibold text-slate-900">{{ deleteTarget()!.cancelledBookings }}</span>
            </div>
          </div>

          @if (deleteTarget()!.activeBookings > 0) {
            <div class="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3 flex items-start gap-2">
              <app-icon name="alert-triangle" [size]="16" class="shrink-0 mt-0.5"></app-icon>
              <span>Can't delete — {{ deleteTarget()!.activeBookings }} confirmed booking(s) exist for this show.</span>
            </div>
          }

          @if (deleteError()) {
            <div class="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">
              {{ deleteError() }}
            </div>
          }

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="closeDeleteShow()" [disabled]="deleting()">Cancel</button>
            <button type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                    [disabled]="deleting() || deleteTarget()!.activeBookings > 0"
                    (click)="confirmDeleteShow()">
              <app-icon name="trash-2" [size]="14"></app-icon>
              {{ deleting() ? 'Deleting…' : 'Yes, delete show' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ManageShowsComponent implements OnInit {
  private movieService = inject(MovieService);
  private showService = inject(ShowService);
  private bookingService = inject(BookingService);

  movies = signal<Movie[]>([]);
  shows = signal<Show[]>([]);
  saving = signal(false);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  deleteTarget = signal<DeleteShowImpact | null>(null);
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  minDate = this.toDateInput(new Date());

  form: {
    movieId: number | null;
    date: string;
    times: string[];
    ticketPrice: number;
    totalSeats: number;
    couponCode: string;
    discountPercent: number | null;
    language: string;
  } = {
    movieId: null,
    date: '',
    times: [''],
    ticketPrice: 0,
    totalSeats: 0,
    couponCode: '',
    discountPercent: null,
    language: ''
  };

  /**
   * Languages declared on the currently selected movie, parsed from its CSV.
   * Kept as a plain method (not a `computed`) because `form.movieId` is a
   * direct field mutation, not a signal — a computed would never re-run.
   * Angular's change detection calls this on every cycle, which is cheap
   * since the list is tiny.
   */
  selectedMovieLanguages(): string[] {
    const mid = this.form.movieId;
    if (mid == null) return [];
    const m = this.movies().find(x => x.id === mid);
    if (!m?.languages) return [];
    return m.languages.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  /** Picking a different movie must reset the picked language so a stale value can't carry over. */
  selectMovie(id: number | null) {
    this.form.movieId = id;
    this.form.language = '';
  }

  /**
   * Submit is only valid when:
   *   - a movie is chosen,
   *   - the movie has at least one declared language, and
   *   - the picked language is one of those.
   * No free-text fallback is allowed.
   */
  canScheduleLanguage(): boolean {
    if (this.form.movieId == null) return false;
    const langs = this.selectedMovieLanguages();
    if (langs.length === 0) return false;
    const picked = this.form.language?.trim();
    if (!picked) return false;
    return langs.some(l => l.toLowerCase() === picked.toLowerCase());
  }

  ngOnInit() {
    this.movieService.getAll().subscribe(list => this.movies.set(list));
    this.loadShows();
  }

  loadShows() {
    this.showService.getAll().subscribe(list => this.shows.set(list));
  }

  addTime() { this.form.times = [...this.form.times, '']; }
  removeTime(i: number) {
    if (this.form.times.length === 1) return;
    this.form.times = this.form.times.filter((_, idx) => idx !== i);
  }

  schedule() {
    if (this.form.movieId === null || !this.form.date) return;
    if (!this.canScheduleLanguage()) {
      this.err.set('Pick one of the movie\'s declared languages for this show.');
      return;
    }
    const cleanTimes = this.form.times.filter(t => t && t.length > 0);
    if (cleanTimes.length === 0) return;

    const now = Date.now();
    const showTimes = cleanTimes.map(t => `${this.form.date}T${t.length === 5 ? t + ':00' : t}`);
    for (const iso of showTimes) {
      if (new Date(iso).getTime() <= now) {
        this.err.set('All time slots must be in the future.');
        return;
      }
    }

    this.saving.set(true);
    this.msg.set(null);
    this.err.set(null);
    this.showService.bulkCreate({
      movieId: this.form.movieId,
      showTimes,
      ticketPrice: this.form.ticketPrice,
      totalSeats: this.form.totalSeats,
      couponCode: this.form.couponCode?.trim() ? this.form.couponCode.trim().toUpperCase() : null,
      discountPercent: this.form.discountPercent && this.form.couponCode?.trim() ? this.form.discountPercent : null,
      language: this.form.language?.trim() ? this.form.language.trim() : null
    }).subscribe({
      next: created => {
        this.saving.set(false);
        this.msg.set(`Scheduled ${created.length} show(s).`);
        this.reset();
        this.loadShows();
        setTimeout(() => this.msg.set(null), 2500);
      },
      error: e => {
        this.saving.set(false);
        this.err.set(e?.error?.error ?? 'Failed to schedule');
      }
    });
  }

  reset() {
    this.form = { movieId: null, date: '', times: [''], ticketPrice: 0, totalSeats: 0, couponCode: '', discountPercent: null, language: '' };
  }

  openDeleteShow(s: Show) {
    // Best-effort impact counts using current bookings list (admin already loaded it via bookings page when needed).
    // We do a fresh fetch to be accurate.
    this.bookingService.getAll().subscribe({
      next: list => {
        const showBookings = list.filter(b => b.show?.id === s.id);
        this.deleteTarget.set({
          show: s,
          activeBookings: showBookings.filter(b => b.status === 'CONFIRMED').length,
          cancelledBookings: showBookings.filter(b => b.status === 'CANCELLED').length
        });
        this.deleteError.set(null);
      },
      error: () => {
        this.deleteTarget.set({ show: s, activeBookings: 0, cancelledBookings: 0 });
        this.deleteError.set(null);
      }
    });
  }

  closeDeleteShow() {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
    this.deleteError.set(null);
  }

  confirmDeleteShow() {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.showService.delete(t.show.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteShow();
        this.msg.set('Show deleted.');
        this.loadShows();
        setTimeout(() => this.msg.set(null), 2500);
      },
      error: err => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.error ?? 'Deletion failed');
      }
    });
  }

  isPast(s: Show): boolean {
    return new Date(s.showTime).getTime() <= Date.now();
  }

  private toDateInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
