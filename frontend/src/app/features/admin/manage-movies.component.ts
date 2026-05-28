import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../core/services/movie.service';
import { ShowService } from '../../core/services/show.service';
import { BookingService } from '../../core/services/booking.service';
import { Movie } from '../../core/models/movie.model';
import { Show } from '../../core/models/show.model';
import { Booking } from '../../core/models/booking.model';
import { PosterCarouselComponent } from '../../shared/poster-carousel.component';
import { IconComponent } from '../../shared/icon.component';
import { toYouTubeEmbedUrl } from '../../shared/youtube-utils';

interface DeleteImpact {
  movie: Movie;
  totalShows: number;
  upcomingShows: number;
  activeBookings: number;
  cancelledBookings: number;
}

@Component({
  selector: 'app-manage-movies',
  standalone: true,
  imports: [CommonModule, FormsModule, PosterCarouselComponent, IconComponent],
  template: `
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Manage Movies</h2>
        <p class="text-sm text-slate-500 mt-1">Add new titles and review the catalog.</p>
      </div>
      <div class="text-sm text-slate-500">
        <span class="font-semibold text-slate-900">{{ movies().length }}</span> movies
      </div>
    </div>

    @if (movies().length > 0) {
      <div class="mb-8">
        <app-poster-carousel [movies]="movies()" kicker="In the catalog" [enableBookingCta]="false" size="sm"></app-poster-carousel>
      </div>
    }

    <!-- Add Movie -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      <div class="lg:col-span-2 card p-6">
        <div class="flex items-center gap-3 mb-5">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <app-icon name="plus" [size]="18"></app-icon>
          </span>
          <div>
            <h3 class="font-semibold text-slate-900">Add a Movie</h3>
            <p class="text-xs text-slate-500">Once added, it will appear in the user catalog instantly.</p>
          </div>
        </div>

        <form (ngSubmit)="add()" #f="ngForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Title <span class="text-rose-500">*</span></label>
            <input class="input" name="title" [(ngModel)]="form.title" required placeholder="e.g. Tenet" />
          </div>
          <div>
            <label class="label">Genre</label>
            <input class="input" name="genre" [(ngModel)]="form.genre" placeholder="e.g. Sci-Fi" />
          </div>
          <div>
            <label class="label">Duration (mins)</label>
            <input class="input" name="durationMins" type="number" min="1" [(ngModel)]="form.durationMins" placeholder="148" />
          </div>
          <div>
            <label class="label">Default Ticket Price (₹)</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-sm">₹</span>
              <input class="input pl-7" name="price" type="number" step="0.01" min="0"
                     [(ngModel)]="form.price" placeholder="250.00" />
            </div>
            <p class="text-xs text-slate-400 mt-1">Suggested price; can be overridden per show.</p>
          </div>
          <div>
            <label class="label">Poster URL</label>
            <input class="input" name="posterUrl" [(ngModel)]="form.posterUrl" placeholder="https://image.tmdb.org/…" />
            <p class="text-xs text-slate-400 mt-1">Portrait image (2:3) looks best.</p>
          </div>
          <div class="md:col-span-2">
            <label class="label">YouTube Trailer URL</label>
            <input class="input" name="trailerUrl" [(ngModel)]="form.trailerUrl"
                   placeholder="https://www.youtube.com/watch?v=…" />
            <p class="text-xs text-slate-400 mt-1">
              Paste any YouTube URL (watch, youtu.be, shorts, or embed).
              @if (form.trailerUrl && !embedPreview(form.trailerUrl)) {
                <span class="text-rose-500">· URL doesn't look like a valid YouTube link</span>
              }
            </p>
          </div>
          <div class="md:col-span-2">
            <label class="label">Available languages</label>
            <div class="flex flex-wrap gap-2 mb-2">
              @for (lang of suggestedLanguages; track lang) {
                <button type="button"
                        (click)="toggleAddLanguage(lang)"
                        [ngClass]="hasLanguage(form.languages, lang)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'"
                        class="text-xs font-semibold rounded-full border px-3 py-1 transition">
                  {{ lang }}
                </button>
              }
            </div>
            <input class="input" name="languages" [(ngModel)]="form.languages"
                   placeholder="Comma-separated, e.g. Telugu, Hindi, English" />
            <p class="text-xs text-slate-400 mt-1">Tap a chip above or type your own list — separated by commas.</p>
          </div>

          <div class="md:col-span-2 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
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
            <button type="submit" class="btn-primary group inline-flex items-center gap-1.5" [disabled]="saving() || !f.valid">
              <app-icon name="plus" [size]="14" class="group-hover:rotate-90 transition"></app-icon>
              {{ saving() ? 'Adding…' : 'Add Movie' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Live preview -->
      <div class="card p-5">
        <div class="text-xs uppercase tracking-widest text-slate-400 mb-3">Live preview</div>
        <div class="aspect-[2/3] bg-slate-100 rounded-lg overflow-hidden ring-1 ring-slate-200">
          @if (form.posterUrl) {
            <img [src]="form.posterUrl" alt="preview" class="w-full h-full object-cover" (error)="onImgError($event)" />
          } @else {
            <div class="w-full h-full flex items-center justify-center text-slate-300 text-sm">No poster yet</div>
          }
        </div>
        <div class="mt-3">
          <div class="font-semibold text-slate-900 line-clamp-1">{{ form.title || 'Untitled movie' }}</div>
          <div class="text-xs text-slate-500 mt-0.5">
            {{ form.genre || '—' }} · {{ form.durationMins || 0 }} min
          </div>
          @if (form.price) {
            <div class="text-sm font-semibold text-indigo-600 mt-1">{{ form.price | currency:'INR' }}</div>
          }
          @if (embedPreview(form.trailerUrl)) {
            <div class="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
              <app-icon name="play-circle" [size]="11"></app-icon>
              Trailer attached
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Movies table -->
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 class="font-semibold text-slate-900">Existing Movies</h3>
        <span class="text-xs text-slate-500">{{ movies().length }} total</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr class="text-left text-xs font-semibold text-slate-600 uppercase">
              <th class="px-6 py-3">ID</th>
              <th class="px-6 py-3">Poster</th>
              <th class="px-6 py-3">Title</th>
              <th class="px-6 py-3">Genre</th>
              <th class="px-6 py-3">Duration</th>
              <th class="px-6 py-3 text-right">Price</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (m of movies(); track m.id) {
              <tr class="even:bg-slate-50/50 hover:bg-indigo-50/40 transition">
                <td class="px-6 py-3 text-slate-500">{{ m.id }}</td>
                <td class="px-6 py-3">
                  @if (m.posterUrl) {
                    <img [src]="m.posterUrl" class="h-14 w-10 object-cover rounded ring-1 ring-slate-200" alt="" />
                  }
                </td>
                <td class="px-6 py-3 font-medium text-slate-900">{{ m.title }}</td>
                <td class="px-6 py-3">
                  @if (m.genre) {
                    <span class="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                      {{ m.genre }}
                    </span>
                  }
                </td>
                <td class="px-6 py-3 text-slate-600">{{ m.durationMins }} min</td>
                <td class="px-6 py-3 text-right font-semibold">
                  @if (m.price != null) {
                    <span class="text-slate-900">{{ m.price | currency:'INR' }}</span>
                  } @else {
                    <span class="text-slate-400">—</span>
                  }
                </td>
                <td class="px-6 py-3 text-right whitespace-nowrap">
                  <button type="button"
                          class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-md px-3 py-1.5 transition mr-2"
                          (click)="openEdit(m)">
                    <app-icon name="edit" [size]="13"></app-icon>
                    Edit
                  </button>
                  <button type="button"
                          class="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5 transition"
                          (click)="openDelete(m)">
                    <app-icon name="trash-2" [size]="13"></app-icon>
                    Delete
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">No movies yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit movie modal -->
    @if (editTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
           (click)="closeEdit()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
              <app-icon name="edit" [size]="18"></app-icon>
            </span>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Edit movie</h3>
              <p class="text-sm text-slate-500 mt-0.5">Update the title, genre, runtime, or replace the poster.</p>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <form #ef="ngForm" class="md:col-span-2 space-y-4">
              <div>
                <label class="label">Title <span class="text-rose-500">*</span></label>
                <input class="input" name="eTitle" [(ngModel)]="editForm.title" required />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Genre</label>
                  <input class="input" name="eGenre" [(ngModel)]="editForm.genre" />
                </div>
                <div>
                  <label class="label">Duration (mins)</label>
                  <input class="input" name="eDur" type="number" min="1" [(ngModel)]="editForm.durationMins" />
                </div>
              </div>
              <div>
                <label class="label">Default Ticket Price (₹)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-sm">₹</span>
                  <input class="input pl-7" name="ePrice" type="number" step="0.01" min="0"
                         [(ngModel)]="editForm.price" placeholder="250.00" />
                </div>
                <p class="text-xs text-slate-400 mt-1">Suggested price; admins can override per show.</p>
              </div>
              <div>
                <label class="label">Poster URL</label>
                <input class="input" name="ePoster" [(ngModel)]="editForm.posterUrl"
                       placeholder="https://image.tmdb.org/…" />
                <p class="text-xs text-slate-400 mt-1">Paste a new image URL to replace the poster.</p>
              </div>
              <div>
                <label class="label">YouTube Trailer URL</label>
                <input class="input" name="eTrailer" [(ngModel)]="editForm.trailerUrl"
                       placeholder="https://www.youtube.com/watch?v=…" />
                <p class="text-xs text-slate-400 mt-1">
                  Watch, youtu.be, shorts, or embed link.
                  @if (editForm.trailerUrl && !embedPreview(editForm.trailerUrl)) {
                    <span class="text-rose-500">· URL doesn't look like a valid YouTube link</span>
                  }
                </p>
              </div>
              <div>
                <label class="label">Available languages</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  @for (lang of suggestedLanguages; track lang) {
                    <button type="button"
                            (click)="toggleEditLanguage(lang)"
                            [ngClass]="hasLanguage(editForm.languages, lang)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'"
                            class="text-xs font-semibold rounded-full border px-3 py-1 transition">
                      {{ lang }}
                    </button>
                  }
                </div>
                <input class="input" name="eLanguages" [(ngModel)]="editForm.languages"
                       placeholder="Comma-separated, e.g. Telugu, Hindi, English" />
              </div>
            </form>

            <div>
              <div class="text-xs uppercase tracking-widest text-slate-400 mb-2">Preview</div>
              <div class="aspect-[2/3] bg-slate-100 rounded-lg overflow-hidden ring-1 ring-slate-200">
                @if (editForm.posterUrl) {
                  <img [src]="editForm.posterUrl" alt="" class="w-full h-full object-cover" (error)="onImgError($event)" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-slate-300 text-xs">No poster</div>
                }
              </div>
              <div class="mt-2 text-xs">
                <div class="font-semibold text-slate-900 line-clamp-1">{{ editForm.title || 'Untitled' }}</div>
                <div class="text-slate-500">{{ editForm.genre || '—' }} · {{ editForm.durationMins || 0 }} min</div>
                @if (editForm.price) {
                  <div class="text-sm font-semibold text-indigo-600 mt-1">{{ editForm.price | currency:'INR' }}</div>
                }
              </div>
            </div>
          </div>

          @if (editError()) {
            <div class="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">
              {{ editError() }}
            </div>
          }

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="closeEdit()" [disabled]="editing()">Cancel</button>
            <button type="button" class="btn-primary inline-flex items-center gap-1.5"
                    [disabled]="editing() || !editForm.title || !editForm.title.trim()"
                    (click)="confirmEdit()">
              <app-icon name="save" [size]="14"></app-icon>
              {{ editing() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation modal -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
           (click)="closeDelete()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
              <app-icon name="alert-triangle" [size]="20"></app-icon>
            </span>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Delete "{{ deleteTarget()!.movie.title }}"?</h3>
              <p class="text-sm text-slate-500 mt-1">
                This action cannot be undone. Removing a movie also removes its scheduled shows.
              </p>
            </div>
          </div>

          <div class="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-600">Scheduled shows</span>
              <span class="font-semibold text-slate-900">{{ deleteTarget()!.totalShows }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Upcoming shows</span>
              <span class="font-semibold text-slate-900">{{ deleteTarget()!.upcomingShows }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Active bookings</span>
              <span [ngClass]="deleteTarget()!.activeBookings > 0 ? 'text-rose-600' : 'text-slate-900'"
                    class="font-semibold">{{ deleteTarget()!.activeBookings }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Cancelled bookings (kept for history)</span>
              <span class="font-semibold text-slate-900">{{ deleteTarget()!.cancelledBookings }}</span>
            </div>
          </div>

          @if (deleteTarget()!.activeBookings > 0) {
            <div class="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3 flex items-start gap-2">
              <app-icon name="alert-triangle" [size]="16" class="shrink-0 mt-0.5"></app-icon>
              <span>
                Can't delete this movie — it has {{ deleteTarget()!.activeBookings }} confirmed booking(s).
                Users would lose their tickets. Wait until shows pass, or cancel those bookings first.
              </span>
            </div>
          } @else {
            <p class="mt-4 text-xs text-slate-500">
              Deleting will also remove the {{ deleteTarget()!.totalShows }} scheduled show(s) and
              {{ deleteTarget()!.cancelledBookings }} cancelled booking record(s).
            </p>
          }

          @if (deleteError()) {
            <div class="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2">
              {{ deleteError() }}
            </div>
          }

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="closeDelete()" [disabled]="deleting()">Cancel</button>
            <button type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                    [disabled]="deleting() || deleteTarget()!.activeBookings > 0"
                    (click)="confirmDelete()">
              <app-icon name="trash-2" [size]="14"></app-icon>
              {{ deleting() ? 'Deleting…' : 'Yes, delete movie' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ManageMoviesComponent implements OnInit {
  private movieService = inject(MovieService);
  private showService = inject(ShowService);
  private bookingService = inject(BookingService);

  movies = signal<Movie[]>([]);
  shows = signal<Show[]>([]);
  bookings = signal<Booking[]>([]);

  saving = signal(false);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  deleteTarget = signal<DeleteImpact | null>(null);
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  editTarget = signal<Movie | null>(null);
  editing = signal(false);
  editError = signal<string | null>(null);
  editForm: Omit<Movie, 'id'> = { title: '', genre: '', durationMins: 0, posterUrl: '', price: null, trailerUrl: '', languages: '' };

  form: Omit<Movie, 'id'> = { title: '', genre: '', durationMins: 0, posterUrl: '', price: null, trailerUrl: '', languages: '' };

  readonly suggestedLanguages = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam'];

  embedPreview(url: string | null | undefined): string | null {
    return toYouTubeEmbedUrl(url);
  }

  hasLanguage(csv: string | null | undefined, lang: string): boolean {
    return this.parseLanguages(csv).some(l => l.toLowerCase() === lang.toLowerCase());
  }

  toggleAddLanguage(lang: string) {
    this.form.languages = this.toggleLanguage(this.form.languages, lang);
  }

  toggleEditLanguage(lang: string) {
    this.editForm.languages = this.toggleLanguage(this.editForm.languages, lang);
  }

  private toggleLanguage(csv: string | null | undefined, lang: string): string {
    const list = this.parseLanguages(csv);
    const idx = list.findIndex(l => l.toLowerCase() === lang.toLowerCase());
    if (idx >= 0) list.splice(idx, 1);
    else list.push(lang);
    return list.join(', ');
  }

  private parseLanguages(csv: string | null | undefined): string[] {
    if (!csv) return [];
    return csv.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.movieService.getAll().subscribe(list => this.movies.set(list));
    this.showService.getAll().subscribe(list => this.shows.set(list));
    this.bookingService.getAll().subscribe(list => this.bookings.set(list));
  }

  add() {
    this.saving.set(true);
    this.msg.set(null);
    this.err.set(null);
    this.movieService.create(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.msg.set('Movie added.');
        this.reset();
        this.loadAll();
        setTimeout(() => this.msg.set(null), 2500);
      },
      error: e => {
        this.saving.set(false);
        const msg = e?.error?.error
                 ?? e?.error?.message
                 ?? e?.message
                 ?? `HTTP ${e?.status ?? '???'} — failed to add movie`;
        this.err.set(msg);
        console.error('Add movie failed:', e);
      }
    });
  }

  reset() {
    this.form = { title: '', genre: '', durationMins: 0, posterUrl: '', price: null, trailerUrl: '', languages: '' };
  }

  openEdit(m: Movie) {
    this.editTarget.set(m);
    this.editForm = {
      title: m.title ?? '',
      genre: m.genre ?? '',
      durationMins: m.durationMins ?? 0,
      posterUrl: m.posterUrl ?? '',
      price: m.price ?? null,
      trailerUrl: m.trailerUrl ?? '',
      languages: m.languages ?? ''
    };
    this.editError.set(null);
  }

  closeEdit() {
    if (this.editing()) return;
    this.editTarget.set(null);
    this.editError.set(null);
  }

  confirmEdit() {
    const t = this.editTarget();
    if (!t) return;
    this.editing.set(true);
    this.editError.set(null);
    this.movieService.update(t.id, this.editForm).subscribe({
      next: () => {
        this.editing.set(false);
        this.closeEdit();
        this.msg.set('Movie updated.');
        this.loadAll();
        setTimeout(() => this.msg.set(null), 2500);
      },
      error: e => {
        this.editing.set(false);
        this.editError.set(e?.error?.error ?? e?.message ?? 'Update failed');
      }
    });
  }

  openDelete(m: Movie) {
    const movieShows = this.shows().filter(s => s.movie.id === m.id);
    const now = Date.now();
    const upcoming = movieShows.filter(s => new Date(s.showTime).getTime() > now).length;
    const movieBookings = this.bookings().filter(b => b.show?.movie?.id === m.id);
    const active = movieBookings.filter(b => b.status === 'CONFIRMED').length;
    const cancelled = movieBookings.filter(b => b.status === 'CANCELLED').length;

    this.deleteTarget.set({
      movie: m,
      totalShows: movieShows.length,
      upcomingShows: upcoming,
      activeBookings: active,
      cancelledBookings: cancelled
    });
    this.deleteError.set(null);
  }

  closeDelete() {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
    this.deleteError.set(null);
  }

  confirmDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.movieService.delete(t.movie.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDelete();
        this.msg.set('Movie deleted.');
        this.loadAll();
        setTimeout(() => this.msg.set(null), 2500);
      },
      error: err => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.error ?? 'Deletion failed');
      }
    });
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
