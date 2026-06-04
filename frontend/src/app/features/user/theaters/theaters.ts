import { Component, OnInit, effect, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TheaterService } from '../../../core/services/theater.service';
import { ShowService } from '../../../core/services/show.service';
import { LocationService } from '../../../core/services/location.service';
import { Theater } from '../../../core/models/theater.model';
import { Show } from '../../../core/models/show.model';
import { IconComponent } from '../../../shared/icon/icon';

interface TheaterRow {
  theater: Theater;
  movies: { id: number; title: string; posterUrl: string | null; nextShow: string | null }[];
  totalShows: number;
}

@Component({
  selector: 'app-theaters',
  standalone: true,
  imports: [CommonModule, DatePipe, IconComponent],
  templateUrl: './theaters.html',
  styleUrls: ['./theaters.css']
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
        // Batch every per-theater show fetch with forkJoin so the grid only
        // re-renders once (after all responses land) instead of N times as
        // each response trickled in — that was the source of the flicker.
        const reqs = list.map(t =>
          this.showService.search({ theaterId: t.id }).pipe(
            map(shows => [t.id, shows] as [number, Show[]]),
            catchError(() => of([t.id, [] as Show[]] as [number, Show[]]))
          )
        );
        forkJoin(reqs).subscribe(results => {
          this.showsByTheater.set(new Map<number, Show[]>(results));
          this.loading.set(false);
        });
      },
      error: () => this.loading.set(false)
    });
  }

  visit(t: Theater) {
    this.router.navigate(['/movies'], { queryParams: { theaterId: t.id } });
  }
}
