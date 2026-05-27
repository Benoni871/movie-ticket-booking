import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingRequest } from '../models/booking.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {}

  create(req: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${API}/bookings`, req);
  }

  getByUser(userId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API}/bookings/user/${userId}`);
  }

  getAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API}/bookings`);
  }

  cancel(id: number): Observable<Booking> {
    return this.http.post<Booking>(`${API}/bookings/${id}/cancel`, {});
  }
}
