import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Show, ShowRequest, BulkShowRequest } from '../models/show.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class ShowService {
  constructor(private http: HttpClient) {}

  getByMovie(movieId: number, opts?: { date?: string; theaterId?: number; location?: string | null }): Observable<Show[]> {
    let params = new HttpParams().set('movieId', movieId);
    if (opts?.date) params = params.set('date', opts.date);
    if (opts?.theaterId != null) params = params.set('theaterId', opts.theaterId);
    if (opts?.location && opts.location.trim()) params = params.set('location', opts.location.trim());
    return this.http.get<Show[]>(`${API}/shows`, { params });
  }

  search(opts: { movieId?: number; date?: string; theaterId?: number; location?: string | null }): Observable<Show[]> {
    let params = new HttpParams();
    if (opts.movieId != null) params = params.set('movieId', opts.movieId);
    if (opts.date) params = params.set('date', opts.date);
    if (opts.theaterId != null) params = params.set('theaterId', opts.theaterId);
    if (opts.location && opts.location.trim()) params = params.set('location', opts.location.trim());
    return this.http.get<Show[]>(`${API}/shows`, { params });
  }

  create(req: ShowRequest): Observable<Show> {
    return this.http.post<Show>(`${API}/shows`, req);
  }

  bulkCreate(req: BulkShowRequest): Observable<Show[]> {
    return this.http.post<Show[]>(`${API}/shows/bulk`, req);
  }

  getAll(): Observable<Show[]> {
    return this.http.get<Show[]>(`${API}/shows/all`);
  }

  getOffers(): Observable<Show[]> {
    return this.http.get<Show[]>(`${API}/shows/offers`);
  }

  getBookedSeats(showId: number): Observable<string[]> {
    return this.http.get<string[]>(`${API}/shows/${showId}/booked-seats`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/shows/${id}`);
  }
}
