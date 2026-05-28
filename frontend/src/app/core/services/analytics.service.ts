import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:8181/api';

export interface AnalyticsOverview {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  seatsSold: number;
  totalShows: number;
  upcomingShows: number;
  cancellationRate: number;
}

export interface DailyPoint {
  date: string;
  bookings: number;
  confirmed: number;
  revenue: number;
}

export interface RevenueByMovie {
  title: string;
  revenue: number;
  seats: number;
}

export interface ShowFillRate {
  showId: number;
  movie: string;
  showTime: string;
  totalSeats: number;
  bookedSeats: number;
  fillPercent: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  overview(): Observable<AnalyticsOverview> {
    return this.http.get<AnalyticsOverview>(`${API}/analytics/overview`);
  }

  bookingsOverTime(days = 30): Observable<DailyPoint[]> {
    const params = new HttpParams().set('days', days);
    return this.http.get<DailyPoint[]>(`${API}/analytics/bookings-over-time`, { params });
  }

  revenueByMovie(): Observable<RevenueByMovie[]> {
    return this.http.get<RevenueByMovie[]>(`${API}/analytics/revenue-by-movie`);
  }

  showFillRate(): Observable<ShowFillRate[]> {
    return this.http.get<ShowFillRate[]>(`${API}/analytics/show-fillrate`);
  }
}
