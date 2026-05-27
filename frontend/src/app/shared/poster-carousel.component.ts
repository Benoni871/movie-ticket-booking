import { Component, Input, OnInit, OnDestroy, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Movie } from '../core/models/movie.model';

@Component({
  selector: 'app-poster-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (movies.length > 0) {
      <div class="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900"
           [class.h-56]="size === 'sm'"
           [class.h-72]="size === 'md'"
           [class.sm:h-80]="size === 'md'"
           [class.md:h-96]="size === 'md'">
        @for (m of movies; track m.id; let i = $index) {
          <div class="absolute inset-0 transition-opacity duration-700"
               [class.opacity-100]="i === currentIndex()"
               [class.opacity-0]="i !== currentIndex()"
               [class.pointer-events-none]="i !== currentIndex()">
            <img [src]="m.posterUrl" [alt]="m.title"
                 class="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-40" />
            <div class="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>

            <div class="relative h-full flex items-center px-6 sm:px-10 gap-6 sm:gap-10">
              <img [src]="m.posterUrl" [alt]="m.title"
                   class="hidden sm:block w-auto rounded-lg shadow-2xl ring-1 ring-white/10"
                   [class.h-40]="size === 'sm'"
                   [class.h-56]="size === 'md'"
                   [class.md:h-72]="size === 'md'" />
              <div class="text-white max-w-xl">
                <div class="text-xs uppercase tracking-widest text-indigo-300 mb-2">{{ kicker }}</div>
                <h2 class="font-bold leading-tight"
                    [class.text-xl]="size === 'sm'"
                    [class.text-2xl]="size === 'md'"
                    [class.sm:text-3xl]="size === 'md'"
                    [class.md:text-4xl]="size === 'md'">{{ m.title }}</h2>
                <p class="text-sm sm:text-base text-slate-200 mt-2">
                  {{ m.genre }} · {{ m.durationMins }} min
                </p>
                @if (enableBookingCta) {
                  <a [routerLink]="['/movies', m.id, 'book']"
                     class="inline-flex items-center mt-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition">
                    Book Tickets →
                  </a>
                }
              </div>
            </div>
          </div>
        }

        @if (movies.length > 1) {
          <button type="button" (click)="prev()"
                  class="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
                  aria-label="Previous">‹</button>
          <button type="button" (click)="next()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
                  aria-label="Next">›</button>

          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            @for (m of movies; track m.id; let i = $index) {
              <button type="button" (click)="goTo(i)"
                      [ngClass]="i === currentIndex() ? 'bg-white' : 'bg-white/40'"
                      class="h-2 w-2 rounded-full transition"></button>
            }
          </div>
        }
      </div>
    }
  `
})
export class PosterCarouselComponent implements OnInit, OnDestroy, OnChanges {
  @Input() movies: Movie[] = [];
  @Input() kicker: string = 'Now showing';
  @Input() enableBookingCta: boolean = true;
  @Input() size: 'sm' | 'md' = 'md';
  @Input() intervalMs: number = 4500;

  currentIndex = signal(0);
  private timer: any = null;

  ngOnInit() { this.start(); }
  ngOnChanges() {
    if (this.currentIndex() >= this.movies.length) this.currentIndex.set(0);
    this.restart();
  }
  ngOnDestroy() { this.stop(); }

  private start() {
    if (this.movies.length > 1) {
      this.timer = setInterval(() => this.next(), this.intervalMs);
    }
  }
  private stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  private restart() { this.stop(); this.start(); }

  next() {
    const n = this.movies.length;
    if (n === 0) return;
    this.currentIndex.update(i => (i + 1) % n);
  }
  prev() {
    const n = this.movies.length;
    if (n === 0) return;
    this.currentIndex.update(i => (i - 1 + n) % n);
  }
  goTo(i: number) { this.currentIndex.set(i); }
}
