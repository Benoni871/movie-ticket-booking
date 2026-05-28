import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class MovieService {
  constructor(private http: HttpClient) {}

  getAll(opts?: { theaterId?: number; location?: string | null; language?: string | null }): Observable<Movie[]> {
    let params = new HttpParams();
    if (opts?.theaterId != null) params = params.set('theaterId', opts.theaterId);
    if (opts?.location && opts.location.trim()) params = params.set('location', opts.location.trim());
    if (opts?.language && opts.language.trim()) params = params.set('language', opts.language.trim());
    return this.http.get<Movie[]>(`${API}/movies`, { params });
  }

  create(movie: Omit<Movie, 'id'>): Observable<Movie> {
    return this.http.post<Movie>(`${API}/movies`, movie);
  }

  update(id: number, movie: Partial<Movie>): Observable<Movie> {
    return this.http.put<Movie>(`${API}/movies/${id}`, movie);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/movies/${id}`);
  }
}
