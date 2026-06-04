import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieService } from '../../../core/services/movie.service';
import { TheaterService } from '../../../core/services/theater.service';
import { LocationService } from '../../../core/services/location.service';
import { Movie } from '../../../core/models/movie.model';
import { Theater } from '../../../core/models/theater.model';
import { PosterCarouselComponent } from '../../../shared/poster-carousel/poster-carousel';
import { IconComponent } from '../../../shared/icon/icon';
import { toYouTubeEmbedUrl } from '../../../shared/youtube-utils';
import { effect, untracked } from '@angular/core';

@Component({
  selector: 'app-movie-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PosterCarouselComponent, IconComponent],
  templateUrl: './movie-grid.html',
  styleUrls: ['./movie-grid.css']
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

  /**
   * React to navbar location changes ONLY. The reads of `selectedTheaterId` and
   * `theaters` happen inside the loadTheaters callback (and via untracked() below)
   * so this effect does NOT re-fire when the user picks a theater or when a
   * theaters HTTP response lands — that previous behavior caused a race that
   * wiped the theater filter against a stale (empty) theaters list.
   */
  private locationEffect = effect(() => {
    const loc = this.selectedLocation();
    if (!untracked(() => this.initialized)) return;
    this.loadTheaters(loc, /* reloadAfter */ true);
  }, { allowSignalWrites: true });

  private initialized = false;

  ngOnInit() {
    const qpTheater = this.route.snapshot.queryParamMap.get('theaterId');
    if (qpTheater) {
      this.selectedTheaterId.set(Number(qpTheater));
    }
    this.initialized = true;
    this.loadTheaters();
    this.reload();
  }

  private loadTheaters(
    location: string | null = this.selectedLocation(),
    reloadAfter = false
  ) {
    this.theaterService.getAll(location).subscribe(list => {
      this.theaters.set(list);
      if (reloadAfter) {
        // Now that we have the fresh list, drop the picked theater if it's
        // not available in the new location and re-fetch movies.
        const tid = this.selectedTheaterId();
        if (tid != null && !list.some(t => t.id === tid)) {
          this.selectedTheaterId.set(null);
        }
        this.reload();
      }
    });
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
