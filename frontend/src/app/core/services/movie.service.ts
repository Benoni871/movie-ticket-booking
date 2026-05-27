import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class MovieService {
  constructor(private http: HttpClient) {}

  getAll(opts?: { theaterId?: number }): Observable<Movie[]> {
    let params = new HttpParams();
    if (opts?.theaterId != null) params = params.set('theaterId', opts.theaterId);
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
