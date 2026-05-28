import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieService } from '../../core/services/movie.service';
import { TheaterService } from '../../core/services/theater.service';
import { LocationService } from '../../core/services/location.service';
import { Movie } from '../../core/models/movie.model';
import { Theater } from '../../core/models/theater.model';
import { PosterCarouselComponent } from '../../shared/poster-carousel.component';
import { IconComponent } from '../../shared/icon.component';
import { toYouTubeEmbedUrl } from '../../shared/youtube-utils';
import { effect } from '@angular/core';

@Component({
  selector: 'app-movie-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PosterCarouselComponent, IconComponent],
  template: `
    <!-- Hero carousel -->
    @if (movies().length > 0) {
      <div class="mb-10">
        <app-poster-carousel [movies]="movies()" kicker="Now showing" [enableBookingCta]="true"></app-poster-carousel>
      </div>
    }

    <!-- Title + search bar -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Now Showing</h2>
        <p class="text-sm text-slate-500 mt-1">
          Pick a movie to book your seats.
          @if (filtered().length !== movies().length) {
            <span class="ml-1 text-indigo-600 font-medium">
              {{ filtered().length }} of {{ movies().length }} match your filter
            </span>
          }
        </p>
      </div>

      <div class="flex gap-2 w-full md:w-auto">
        <div class="relative grow md:w-64">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <app-icon name="search" [size]="16"></app-icon>
          </span>
          <input class="input pl-9" placeholder="Search movies…"
                 [(ngModel)]="searchTerm"
                 (ngModelChange)="onSearch($event)" />
          @if (searchTerm) {
            <button type="button" (click)="clearSearch()"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    aria-label="Clear search">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          }
        </div>
        <select class="input md:w-56" [ngModel]="selectedTheaterId()" (ngModelChange)="setTheater($event)">
          <option [ngValue]="null">All theaters</option>
          @for (t of theaters(); track t.id) {
            <option [ngValue]="t.id">{{ t.name }}{{ t.location ? ' · ' + t.location : '' }}</option>
          }
        </select>
      </div>
    </div>

    <!-- Genre filter chips -->
    @if (genres().length > 1) {
      <div class="flex flex-wrap gap-2 mb-3">
        @for (g of genres(); track g) {
          <button type="button" (click)="setGenre(g)"
                  [ngClass]="selectedGenre() === g
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'"
                  class="text-xs font-semibold px-3 py-1.5 rounded-full border transition">
            {{ g }}
          </button>
        }
      </div>
    }

    <!-- Language filter chips -->
    @if (languages().length > 0) {
      <div class="flex flex-wrap items-center gap-2 mb-7">
        <span class="text-[10px] uppercase tracking-widest text-slate-400 mr-1 inline-flex items-center gap-1">
          <app-icon name="megaphone" [size]="11"></app-icon>
          Language
        </span>
        <button type="button" (click)="setLanguage(null)"
                [ngClass]="selectedLanguage() === null
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-600'"
                class="text-xs font-semibold px-3 py-1.5 rounded-full border transition">
          All
        </button>
        @for (lang of languages(); track lang) {
          <button type="button" (click)="setLanguage(lang)"
                  [ngClass]="selectedLanguage() === lang
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-600'"
                  class="text-xs font-semibold px-3 py-1.5 rounded-full border transition">
            {{ lang }}
          </button>
        }
      </div>
    }

    @if (loading()) {
      <!-- Skeleton -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
          <div class="card overflow-hidden animate-pulse">
            <div class="aspect-[2/3] bg-slate-200"></div>
            <div class="p-4 space-y-2">
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              <div class="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
        }
      </div>
    } @else if (filtered().length === 0) {
      <div class="card p-12 text-center">
        <div class="text-5xl text-slate-300 mb-3">𓂀</div>
        <div class="text-slate-700 font-semibold">No movies match your filter</div>
        <div class="text-sm text-slate-500 mt-1">Try clearing search or pick a different genre.</div>
        <button class="btn-secondary mt-4" (click)="clearAll()">Reset filters</button>
      </div>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        @for (m of filtered(); track m.id; let i = $index) {
          <div class="group block card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">

            <a [routerLink]="['/movies', m.id, 'book']" class="block">
              <!-- Poster with overlays -->
              <div class="aspect-[2/3] bg-slate-900 overflow-hidden relative">
                @if (m.posterUrl) {
                  <img [src]="m.posterUrl" [alt]="m.title"
                       class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                       (error)="onImgError($event)" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-slate-500 text-sm">No poster</div>
                }

                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <!-- Top-left badges -->
                <div class="absolute top-2 left-2 flex flex-col gap-1">
                  @if (i === 0) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow">
                      <app-icon name="flame" [size]="11"></app-icon>
                      Trending
                    </span>
                  }
                  @if (m.genre) {
                    <span class="inline-flex items-center rounded-full bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {{ m.genre }}
                    </span>
                  }
                </div>

                <!-- Top-right runtime -->
                <span class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 text-[10px] font-semibold">
                  <app-icon name="clock" [size]="11"></app-icon>
                  {{ m.durationMins }} min
                </span>

                <!-- Hover Book CTA -->
                <div class="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-indigo-600/95 text-white text-sm font-semibold py-2 shadow-lg backdrop-blur-sm">
                    Book Tickets
                    <app-icon name="arrow-right" [size]="16"></app-icon>
                  </div>
                </div>
              </div>
            </a>

            <!-- Card footer -->
            <div class="p-4">
              <h3 class="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">{{ m.title }}</h3>
              @if (languageList(m).length > 0) {
                <div class="flex flex-wrap gap-1 mt-1.5">
                  @for (lang of languageList(m); track lang) {
                    <span class="inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-[10px] font-semibold">
                      {{ lang }}
                    </span>
                  }
                </div>
              }
              <div class="flex items-center justify-between mt-1.5">
                <span class="text-xs text-slate-500">{{ m.genre }}</span>
                <span class="inline-flex items-center gap-1 text-xs font-semibold"
                      [class.text-rose-600]="(m.reviewCount ?? 0) > 0"
                      [class.text-slate-400]="(m.reviewCount ?? 0) === 0">
                  @if ((m.reviewCount ?? 0) > 0) {
                    🍅 {{ m.averageRating?.toFixed(1) }}
                    <span class="text-[10px] text-slate-400 font-normal">({{ m.reviewCount }})</span>
                  } @else {
                    🍅 No reviews yet
                  }
                </span>
              </div>
              @if (embedUrl(m)) {
                <button type="button" (click)="openTrailer(m)"
                        class="group/btn mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-1.5 transition">
                  <app-icon name="play-circle" [size]="14" class="group-hover/btn:scale-110 transition"></app-icon>
                  Watch Trailer
                </button>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Trailer modal -->
    @if (trailerTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
           (click)="closeTrailer()">
        <div class="relative max-w-4xl w-full" (click)="$event.stopPropagation()">
          <button type="button" (click)="closeTrailer()"
                  class="absolute -top-3 -right-3 z-10 h-10 w-10 rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 hover:rotate-90 flex items-center justify-center transition"
                  aria-label="Close trailer">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
          <div class="bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div class="aspect-video">
              <iframe [src]="trailerSafeUrl()" class="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      title="Trailer"></iframe>
            </div>
          </div>
          <div class="mt-3 inline-flex items-center justify-center gap-1.5 w-full text-white/80 text-sm font-medium">
            <app-icon name="film" [size]="14"></app-icon>
            {{ trailerTarget()!.title }}
          </div>
        </div>
      </div>
    }
  `
})
export class MovieGridComponent implements OnInit {
  private movieService = inject(MovieService);
  private theaterService = inject(TheaterService);
  private locationService = inject(LocationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  selectedLocation = this.locationService.current;

  movies = signal<Movie[]>([]);
  theaters = signal<Theater[]>([]);
  loading = signal(true);
  searchTerm = '';
  searchSignal = signal('');
  selectedGenre = signal<string>('All');
  selectedTheaterId = signal<number | null>(null);
  selectedLanguage = signal<string | null>(null);

  trailerTarget = signal<Movie | null>(null);

  genres = computed<string[]>(() => {
    const set = new Set<string>(['All']);
    for (const m of this.movies()) {
      if (m.genre) set.add(m.genre);
    }
    return Array.from(set);
  });

  /** Distinct languages drawn from the currently loaded catalog, sorted alphabetically. */
  languages = computed<string[]>(() => {
    const set = new Set<string>();
    for (const m of this.movies()) {
      if (!m.languages) continue;
      for (const lang of m.languages.split(',')) {
        const t = lang.trim();
        if (t) set.add(t);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  filtered = computed<Movie[]>(() => {
    const term = this.searchSignal().toLowerCase().trim();
    const genre = this.selectedGenre();
    const lang = this.selectedLanguage();
    return this.movies().filter(m => {
      if (genre !== 'All' && m.genre !== genre) return false;
      if (term && !m.title.toLowerCase().includes(term)) return false;
      if (lang) {
        if (!m.languages) return false;
        const list = m.languages.split(',').map(s => s.trim().toLowerCase());
        if (!list.includes(lang.toLowerCase())) return false;
      }
      return true;
    });
  });

  trailerSafeUrl = computed<SafeResourceUrl | null>(() => {
    const m = this.trailerTarget();
    if (!m) return null;
    const url = toYouTubeEmbedUrl(m.trailerUrl) + '?autoplay=1';
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  /** React to navbar location changes — runs in component injection context. */
  private locationEffect = effect(() => {
    const loc = this.selectedLocation();
    if (!this.initialized) return;
    this.loadTheaters(loc);
    // If the selected theater is no longer in the location-filtered list, drop it.
    const tid = this.selectedTheaterId();
    if (tid != null && !this.theaters().some(t => t.id === tid)) {
      this.selectedTheaterId.set(null);
    }
    this.reload();
  }, { allowSignalWrites: true });

  private initialized = false;

  ngOnInit() {
    this.loadTheaters();

    const qpTheater = this.route.snapshot.queryParamMap.get('theaterId');
    if (qpTheater) {
      this.selectedTheaterId.set(Number(qpTheater));
    }
    this.initialized = true;
    this.reload();
  }

  private loadTheaters(location: string | null = this.selectedLocation()) {
    this.theaterService.getAll(location).subscribe(list => this.theaters.set(list));
  }

  reload() {
    this.loading.set(true);
    const tid = this.selectedTheaterId();
    const loc = this.selectedLocation();
    this.movieService.getAll({
      theaterId: tid ?? undefined,
      location: tid == null ? loc : null
    }).subscribe({
      next: list => { this.movies.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setLanguage(lang: string | null) {
    this.selectedLanguage.set(lang);
  }

  languageList(m: Movie): string[] {
    if (!m.languages) return [];
    return m.languages.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  onSearch(v: string) { this.searchSignal.set(v); }
  clearSearch() { this.searchTerm = ''; this.searchSignal.set(''); }
  setGenre(g: string) { this.selectedGenre.set(g); }
  setTheater(id: number | null) {
    this.selectedTheaterId.set(id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { theaterId: id ?? null },
      queryParamsHandling: 'merge'
    });
    this.reload();
  }
  clearAll() {
    this.clearSearch();
    this.selectedGenre.set('All');
    this.selectedLanguage.set(null);
    this.setTheater(null);
  }

  embedUrl(m: Movie): string | null {
    return toYouTubeEmbedUrl(m.trailerUrl);
  }

  openTrailer(m: Movie) { this.trailerTarget.set(m); }
  closeTrailer() { this.trailerTarget.set(null); }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
