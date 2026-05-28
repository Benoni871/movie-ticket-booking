import { Component, OnInit, effect, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TheaterService } from '../../core/services/theater.service';
import { ShowService } from '../../core/services/show.service';
import { LocationService } from '../../core/services/location.service';
import { Theater } from '../../core/models/theater.model';
import { Show } from '../../core/models/show.model';
import { IconComponent } from '../../shared/icon.component';

interface TheaterRow {
  theater: Theater;
  movies: { id: number; title: string; posterUrl: string | null; nextShow: string | null }[];
  totalShows: number;
}

@Component({
  selector: 'app-theaters',
  standalone: true,
  imports: [CommonModule, DatePipe, IconComponent],
  template: `
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            <app-icon name="building-2" [size]="18"></app-icon>
          </span>
          Browse by Theater
        </h2>
        <p class="text-sm text-slate-500 mt-1">Pick a theater to see which movies are playing there.</p>
      </div>
      <div class="text-sm text-slate-500">
        <span class="font-semibold text-slate-900">{{ theaters().length }}</span> theaters
      </div>
    </div>

    @if (loading()) {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (_ of [1,2,3,4]; track $index) {
          <div class="card p-6 animate-pulse">
            <div class="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div class="h-3 bg-slate-100 rounded w-2/3 mb-2"></div>
            <div class="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
        }
      </div>
    } @else if (rows().length === 0) {
      <div class="card p-12 text-center">
        <div class="text-slate-300 mb-3 flex justify-center">
          <app-icon name="building-2" [size]="56"></app-icon>
        </div>
        <div class="text-slate-700 font-semibold">No theaters listed yet</div>
        <div class="text-sm text-slate-500 mt-1">Check back soon, theater owners are signing up.</div>
      </div>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (r of rows(); track r.theater.id) {
          <div class="card p-6 hover:shadow-md transition">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="inline-flex items-center gap-1.5 text-lg font-bold text-slate-900 truncate">
                  <app-icon name="building-2" [size]="18" class="text-indigo-500"></app-icon>
                  {{ r.theater.name }}
                </h3>
                @if (r.theater.location) {
                  <p class="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                    <app-icon name="map-pin" [size]="12"></app-icon>
                    {{ r.theater.location }}
                  </p>
                }
              </div>
              <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                <app-icon name="calendar-clock" [size]="12"></app-icon>
                {{ r.totalShows }} upcoming
              </span>
            </div>

            @if (r.movies.length > 0) {
              <div class="mt-4">
                <div class="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Now showing</div>
                <ul class="space-y-2">
                  @for (m of r.movies.slice(0, 4); track m.id) {
                    <li class="flex items-center gap-3 text-sm">
                      @if (m.posterUrl) {
                        <img [src]="m.posterUrl" alt="" class="h-10 w-7 rounded object-cover ring-1 ring-slate-200 shrink-0" />
                      } @else {
                        <div class="h-10 w-7 rounded bg-slate-200 shrink-0"></div>
                      }
                      <div class="min-w-0 grow">
                        <div class="font-medium text-slate-900 truncate">{{ m.title }}</div>
                        @if (m.nextShow) {
                          <div class="text-xs text-slate-500">Next: {{ m.nextShow | date:'EEE, MMM d · h:mm a' }}</div>
                        }
                      </div>
                    </li>
                  }
                  @if (r.movies.length > 4) {
                    <li class="text-xs text-slate-500">+ {{ r.movies.length - 4 }} more…</li>
                  }
                </ul>
              </div>
            } @else {
              <div class="mt-4 text-xs text-slate-400">No upcoming shows.</div>
            }

            <div class="mt-5 flex justify-end">
              <button type="button" (click)="visit(r.theater)" class="btn-primary group inline-flex items-center gap-1.5">
                View movies
                <app-icon name="arrow-right" [size]="15" class="group-hover:translate-x-0.5 transition"></app-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class TheatersComponent implements OnInit {
  private theaterService = inject(TheaterService);
  private showService = inject(ShowService);
  private locationService = inject(LocationService);
  private router = inject(Router);

  theaters = signal<Theater[]>([]);
  showsByTheater = signal<Map<number, Show[]>>(new Map());
  loading = signal(true);

  selectedLocation = this.locationService.current;

  /** Re-fetch theaters when the navbar location selector changes. */
  private locationEffect = effect(() => {
    const loc = this.selectedLocation();
    if (!this.initialized) return;
    this.fetchTheaters(loc);
  }, { allowSignalWrites: true });

  private initialized = false;

  rows = computed<TheaterRow[]>(() => {
    const now = Date.now();
    return this.theaters().map(t => {
      const upcoming = (this.showsByTheater().get(t.id) ?? [])
        .filter(s => new Date(s.showTime).getTime() > now)
        .sort((a, b) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());

      const movieMap = new Map<number, { id: number; title: string; posterUrl: string | null; nextShow: string | null }>();
      for (const s of upcoming) {
        const id = s.movie.id;
        if (!movieMap.has(id)) {
          movieMap.set(id, { id, title: s.movie.title, posterUrl: s.movie.posterUrl ?? null, nextShow: s.showTime });
        }
      }
      return {
        theater: t,
        movies: Array.from(movieMap.values()),
        totalShows: upcoming.length
      };
    });
  });

  ngOnInit() {
    this.initialized = true;
    this.fetchTheaters(this.selectedLocation());
  }

  private fetchTheaters(location: string | null) {
    this.loading.set(true);
    this.showsByTheater.set(new Map());
    this.theaterService.getAll(location).subscribe({
      next: list => {
        this.theaters.set(list);
        if (list.length === 0) {
          this.loading.set(false);
          return;
        }
        // Fetch shows for each theater. For small N this is fine; for larger we'd add a batched endpoint.
        let remaining = list.length;
        for (const t of list) {
          this.showService.search({ theaterId: t.id }).subscribe({
            next: shows => {
              const map = new Map(this.showsByTheater());
              map.set(t.id, shows);
              this.showsByTheater.set(map);
              if (--remaining === 0) this.loading.set(false);
            },
            error: () => {
              if (--remaining === 0) this.loading.set(false);
            }
          });
        }
      },
      error: () => this.loading.set(false)
    });
  }

  visit(t: Theater) {
    this.router.navigate(['/movies'], { queryParams: { theaterId: t.id } });
  }
}
