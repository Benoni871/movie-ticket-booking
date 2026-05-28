import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theater } from '../models/theater.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class TheaterService {
  constructor(private http: HttpClient) {}

  getAll(location?: string | null): Observable<Theater[]> {
    let params = new HttpParams();
    if (location && location.trim()) params = params.set('location', location.trim());
    return this.http.get<Theater[]>(`${API}/theaters`, { params });
  }

  getLocations(): Observable<string[]> {
    return this.http.get<string[]>(`${API}/theaters/locations`);
  }
}
