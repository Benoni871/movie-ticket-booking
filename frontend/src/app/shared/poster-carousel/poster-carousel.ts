import { Component, Input, OnInit, OnDestroy, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-poster-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poster-carousel.html',
  styleUrls: ['./poster-carousel.css']
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
