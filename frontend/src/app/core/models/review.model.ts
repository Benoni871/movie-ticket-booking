export interface Review {
  id: number;
  userId: number;
  movieId: number;
  showId: number;
  bookingId: number;
  rating: number;
  createdAt: string;
}

export interface ReviewRequest {
  bookingId: number;
  rating: number;
}
