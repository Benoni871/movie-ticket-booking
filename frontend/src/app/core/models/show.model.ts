import { Movie } from './movie.model';
import { Theater } from './theater.model';

export interface Show {
  id: number;
  movie: Movie;
  theater?: Theater | null;
  showTime: string;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
}

export interface ShowRequest {
  movieId: number;
  showTime: string;
  ticketPrice: number;
  totalSeats: number;
}

export interface BulkShowRequest {
  movieId: number;
  showTimes: string[];
  ticketPrice: number;
  totalSeats: number;
}
