export interface Movie {
  id: number;
  title: string;
  genre: string;
  durationMins: number;
  posterUrl: string;
  price?: number | null;
  trailerUrl?: string | null;
  /** Comma-separated language list, e.g. "Telugu,Hindi,English". */
  languages?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
}
