import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theater } from '../models/theater.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class TheaterService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Theater[]> {
    return this.http.get<Theater[]>(`${API}/theaters`);
  }
}
