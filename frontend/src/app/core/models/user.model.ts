export type Role = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  theaterId?: number | null;
  theaterName?: string | null;
  theaterLocation?: string | null;
}
