import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:8181/api';

export interface InterestStatus {
  interested: boolean;
  count: number;
}

export interface InterestDashboardEntry {
  movieId: number;
  title: string;
  posterUrl: string | null;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class InterestService {
  constructor(private http: HttpClient) {}

  register(movieId: number): Observable<InterestStatus> {
    return this.http.post<InterestStatus>(`${API}/interests/${movieId}`, {});
  }

  status(movieId: number): Observable<InterestStatus> {
    return this.http.get<InterestStatus>(`${API}/interests/movie/${movieId}`);
  }

  dashboard(): Observable<InterestDashboardEntry[]> {
    return this.http.get<InterestDashboardEntry[]>(`${API}/interests/dashboard`);
  }
}
