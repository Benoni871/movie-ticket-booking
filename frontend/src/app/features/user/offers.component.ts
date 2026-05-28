import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShowService } from '../../core/services/show.service';
import { Show } from '../../core/models/show.model';
import { IconComponent } from '../../shared/icon.component';

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
  template: `
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm">
            <app-icon name="ticket-percent" [size]="18"></app-icon>
          </span>
          Offers & Coupons
        </h2>
        <p class="text-sm text-slate-500 mt-1">Active discount codes — apply at the booking page to save.</p>
      </div>
      <div class="text-sm text-slate-500">
        <span class="font-semibold text-slate-900">{{ shows().length }}</span> active offers
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
    } @else if (groups().length === 0) {
      <div class="card p-12 text-center">
        <div class="text-slate-300 mb-3 flex justify-center">
          <app-icon name="ticket-percent" [size]="56"></app-icon>
        </div>
        <div class="text-slate-700 font-semibold">No active offers</div>
        <div class="text-sm text-slate-500 mt-1">Check back soon — theater owners run promos here.</div>
      </div>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (g of groups(); track g.movieId) {
          <div class="card overflow-hidden">
            <div class="flex gap-4 p-5">
              @if (g.posterUrl) {
                <img [src]="g.posterUrl" alt="" class="h-32 w-20 rounded-md object-cover ring-1 ring-slate-200 shrink-0" />
              } @else {
                <div class="h-32 w-20 rounded-md bg-slate-200 shrink-0"></div>
              }
              <div class="min-w-0 grow">
                <h3 class="text-lg font-bold text-slate-900 truncate">{{ g.title }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">{{ g.shows.length }} show(s) with offers</p>
                <a [routerLink]="['/movies', g.movieId, 'book']"
                   class="group/lnk inline-flex items-center gap-1 mt-3 text-xs font-bold text-indigo-600 hover:underline">
                  Book this movie
                  <app-icon name="arrow-right" [size]="13" class="group-hover/lnk:translate-x-0.5 transition"></app-icon>
                </a>
              </div>
            </div>

            <div class="border-t border-dashed border-slate-200 px-5 py-4 space-y-3 bg-slate-50">
              @for (s of g.shows; track s.id) {
                <div class="flex items-center justify-between gap-3 rounded-lg bg-white border border-rose-200 p-3 shadow-sm">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <app-icon name="percent" [size]="10"></app-icon>
                        Save {{ s.discountPercent }}%
                      </span>
                      <span class="font-mono text-sm font-bold text-rose-700">{{ s.couponCode }}</span>
                    </div>
                    <div class="text-xs text-slate-600 mt-1 truncate inline-flex items-center gap-1.5">
                      <app-icon name="calendar" [size]="12" class="text-slate-400"></app-icon>
                      {{ s.showTime | date:'EEE, MMM d · h:mm a' }}
                      @if (s.theater) {
                        <span class="inline-flex items-center gap-1 ml-1">
                          <app-icon name="building-2" [size]="12" class="text-slate-400"></app-icon>
                          {{ s.theater.name }}
                        </span>
                      }
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      {{ s.ticketPrice | currency:'INR' }} per seat
                    </div>
                  </div>
                  <button type="button" (click)="copy(s.couponCode!)"
                          class="group/btn shrink-0 inline-flex items-center gap-1.5 rounded-md border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-1.5 transition">
                    @if (copied() === s.couponCode) {
                      <app-icon name="check" [size]="13"></app-icon>
                      Copied
                    } @else {
                      <app-icon name="copy" [size]="13" class="group-hover/btn:scale-110 transition"></app-icon>
                      Copy code
                    }
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `
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
