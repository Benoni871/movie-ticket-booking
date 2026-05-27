import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewRequest } from '../models/review.model';

const API = 'http://localhost:8181/api';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  create(req: ReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${API}/reviews`, req);
  }

  canReview(bookingId: number): Observable<{ canReview: boolean; existingRating: number | null }> {
    return this.http.get<{ canReview: boolean; existingRating: number | null }>(`${API}/reviews/can-review/${bookingId}`);
  }

  byMovie(movieId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${API}/reviews/movie/${movieId}`);
  }
}
