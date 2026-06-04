import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShowService } from '../../../core/services/show.service';
import { Show } from '../../../core/models/show.model';
import { IconComponent } from '../../../shared/icon/icon';

interface MovieGroup {
  movieId: number;
  title: string;
  posterUrl: string | null;
  shows: Show[];
}

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe, IconComponent],
  templateUrl: './offers.html',
  styleUrls: ['./offers.css']
})
export class OffersComponent implements OnInit {
  private showService = inject(ShowService);

  shows = signal<Show[]>([]);
  loading = signal(true);
  copied = signal<string | null>(null);

  groups = computed<MovieGroup[]>(() => {
    const map = new Map<number, MovieGroup>();
    for (const s of this.shows()) {
      if (!s.couponCode) continue;
      const id = s.movie.id;
      if (!map.has(id)) {
        map.set(id, { movieId: id, title: s.movie.title, posterUrl: s.movie.posterUrl ?? null, shows: [] });
      }
      map.get(id)!.shows.push(s);
    }
    return Array.from(map.values());
  });

  ngOnInit() {
    this.showService.getOffers().subscribe({
      next: list => { this.shows.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  copy(code: string) {
    navigator.clipboard?.writeText(code);
    this.copied.set(code);
    setTimeout(() => { if (this.copied() === code) this.copied.set(null); }, 2000);
  }
}
