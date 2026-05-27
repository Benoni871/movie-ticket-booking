export interface Movie {
  id: number;
  title: string;
  genre: string;
  durationMins: number;
  posterUrl: string;
  price?: number | null;
  trailerUrl?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
}
