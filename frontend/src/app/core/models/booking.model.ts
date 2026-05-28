import { Show } from './show.model';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface BookingUser {
  id: number;
  username: string;
  role: string;
}

export interface Booking {
  id: number;
  user: BookingUser;
  show: Show;
  seatsBooked: number;
  seats: string;
  subtotal?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  couponApplied?: string | null;
  totalAmount: number;
  bookingDate: string;
  status: BookingStatus;
  cancelledAt?: string | null;
  refundAmount?: number | null;
}

export interface BookingRequest {
  userId: number;
  showId: number;
  seats: string[];
  couponCode?: string | null;
}
