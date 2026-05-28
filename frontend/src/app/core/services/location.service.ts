import { Injectable, signal } from '@angular/core';

const LS_KEY = 'cinebook.location';

/**
 * Tracks the user's chosen location (city/area) used to filter theaters/movies/shows.
 * `null` means "All locations".
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly _current = signal<string | null>(this.read());

  /** Reactive accessor — components can react to changes via `current()` in templates / effects. */
  readonly current = this._current.asReadonly();

  set(location: string | null): void {
    const next = location && location.trim() ? location.trim() : null;
    this._current.set(next);
    if (next) localStorage.setItem(LS_KEY, next);
    else localStorage.removeItem(LS_KEY);
  }

  clear(): void {
    this.set(null);
  }

  private read(): string | null {
    try {
      const v = localStorage.getItem(LS_KEY);
      return v && v.trim() ? v : null;
    } catch {
      return null;
    }
  }
}
